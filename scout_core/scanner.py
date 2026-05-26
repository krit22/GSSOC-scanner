"""Repository scanning logic."""

from __future__ import annotations

import re
import time
from typing import Any

from scout_core.client import GitHubClient
from scout_core.models import IssueHit, RepoConfig, ScanResult, ScannedIssue, ScoutConfig
from scout_core.patterns import CLAIM_PATTERNS, has_claim_comment, has_claim_text


def label_names(issue: dict[str, Any]) -> list[str]:
    return [n["name"] for n in issue["labels"]["nodes"]]


def passes_label_filters(
    labels: list[str],
    require: list[str],
    exclude: list[str],
    repo_cfg: RepoConfig,
) -> bool:
    require_all = list(require) + list(repo_cfg.labels)
    exclude_all = list(exclude) + list(repo_cfg.exclude_labels)
    if require_all and not all(r in labels for r in require_all):
        return False
    if exclude_all and any(e in labels for e in exclude_all):
        return False
    return True


def classify_issue(
    issue: dict[str, Any],
    client: GitHubClient,
    repo_cfg: RepoConfig,
    cfg: ScoutConfig,
    claim_re: re.Pattern | None,
) -> ScannedIssue | None:
    assignees = [a["login"] for a in issue["assignees"]["nodes"]]
    if assignees:
        return None

    labels = label_names(issue)
    if not passes_label_filters(labels, cfg.require_labels, cfg.exclude_labels, repo_cfg):
        return None

    number = issue["number"]
    body = issue.get("body") or ""
    comment_count = issue["comments"]["totalCount"]
    author = issue["author"]["login"] if issue.get("author") else ""
    body_has_claim = cfg.detect_body_claims and has_claim_text(body, claim_re)

    if cfg.mode == "strict":
        if comment_count > 0:
            return None
        status = "body_claim" if body_has_claim else "available"
        return ScannedIssue(
            number=number,
            title=issue["title"],
            url=issue["url"],
            labels=labels,
            comment_count=comment_count,
            author=author,
            created_at=issue["createdAt"],
            status=status,
            body_has_claim=body_has_claim,
            body=body[:2000],
            reason="unassigned, zero comments" if status == "available" else "self-request in issue body",
        )

    # available mode
    if comment_count == 0:
        status: str = "body_claim" if body_has_claim else "available"
        return ScannedIssue(
            number=number,
            title=issue["title"],
            url=issue["url"],
            labels=labels,
            comment_count=0,
            author=author,
            created_at=issue["createdAt"],
            status=status,  # type: ignore[arg-type]
            body_has_claim=body_has_claim,
            body=body[:2000],
            reason="unassigned, zero comments" if status == "available" else "self-request in issue body",
        )

    comments = client.fetch_issue_comments(repo_cfg.owner, repo_cfg.name, number)
    bodies = [c["body"] or "" for c in comments]
    if has_claim_comment(bodies, claim_re):
        claim_authors = [
            c["author"]["login"]
            for c in comments
            if c.get("author") and has_claim_comment([c.get("body") or ""], claim_re)
        ]
        return ScannedIssue(
            number=number,
            title=issue["title"],
            url=issue["url"],
            labels=labels,
            comment_count=comment_count,
            author=author,
            created_at=issue["createdAt"],
            status="claimed",
            claim_authors=claim_authors,
            body_has_claim=body_has_claim,
            body=body[:2000],
            reason="claim comment detected",
        )

    status = "body_claim" if body_has_claim else "available"
    return ScannedIssue(
        number=number,
        title=issue["title"],
        url=issue["url"],
        labels=labels,
        comment_count=comment_count,
        author=author,
        created_at=issue["createdAt"],
        status=status,  # type: ignore[arg-type]
        body_has_claim=body_has_claim,
        body=body[:2000],
        reason="unassigned, no claim comments",
    )


def scan_repo(
    client: GitHubClient,
    repo_cfg: RepoConfig,
    cfg: ScoutConfig,
    claim_re: re.Pattern | None = None,
) -> ScanResult:
    try:
        raw_issues = client.fetch_open_issues(
            repo_cfg.owner, repo_cfg.name, cfg.page_size, cfg.max_issues_per_repo
        )
    except Exception as e:
        return ScanResult(
            owner=repo_cfg.owner,
            repo=repo_cfg.name,
            issues=[],
            error=str(e),
        )

    issues: list[ScannedIssue] = []
    for issue in raw_issues:
        scanned = classify_issue(issue, client, repo_cfg, cfg, claim_re)
        if scanned and scanned.status in ("available", "body_claim"):
            issues.append(scanned)
            if issue["comments"]["totalCount"] > 0:
                time.sleep(0.15)

    return ScanResult(owner=repo_cfg.owner, repo=repo_cfg.name, issues=issues)


def scan_repo_hits(
    client: GitHubClient,
    repo_cfg: RepoConfig,
    cfg: ScoutConfig,
    claim_re: re.Pattern | None = None,
) -> list[IssueHit]:
    """Backward-compatible API returning only claimable hits for CLI."""
    result = scan_repo(client, repo_cfg, cfg, claim_re)
    full_name = f"{repo_cfg.owner}/{repo_cfg.name}"
    hits: list[IssueHit] = []
    for i in result.issues:
        if i.status not in ("available", "body_claim"):
            continue
        if cfg.mode == "available" and i.status == "body_claim":
            continue
        hits.append(
            IssueHit(
                repo=full_name,
                number=i.number,
                title=i.title,
                url=i.url,
                labels=i.labels,
                comments=i.comment_count,
                author=i.author,
                created_at=i.created_at,
                reason=i.reason,
                claim_authors=i.claim_authors,
                body_has_claim=i.body_has_claim,
                status=i.status,
                body=i.body,
            )
        )
    return hits
