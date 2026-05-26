"""Data models for issue scouting and radar."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Literal

IssueStatus = Literal["available", "body_claim", "claimed", "assigned"]


@dataclass
class RepoConfig:
    owner: str
    name: str
    labels: list[str] = field(default_factory=list)
    exclude_labels: list[str] = field(default_factory=list)
    mentor_login: str | None = None


@dataclass
class ScoutConfig:
    repos: list[RepoConfig]
    mode: str = "available"
    max_issues_per_repo: int = 500
    page_size: int = 100
    require_labels: list[str] = field(default_factory=list)
    exclude_labels: list[str] = field(default_factory=list)
    claim_patterns: str | None = None
    detect_body_claims: bool = True


@dataclass
class IssueHit:
    repo: str
    number: int
    title: str
    url: str
    labels: list[str]
    comments: int
    author: str
    created_at: str
    reason: str
    claim_authors: list[str] = field(default_factory=list)
    body_has_claim: bool = False
    status: IssueStatus = "available"
    body: str = ""


@dataclass
class ScannedIssue:
    number: int
    title: str
    url: str
    labels: list[str]
    comment_count: int
    author: str
    created_at: str
    status: IssueStatus
    claim_authors: list[str] = field(default_factory=list)
    body_has_claim: bool = False
    body: str = ""
    reason: str = ""


@dataclass
class ScanResult:
    owner: str
    repo: str
    issues: list[ScannedIssue]
    error: str | None = None

    @property
    def owner_repo(self) -> str:
        return f"{self.owner}/{self.repo}"

    @property
    def available_count(self) -> int:
        return sum(1 for i in self.issues if i.status == "available")

    @property
    def body_claim_count(self) -> int:
        return sum(1 for i in self.issues if i.status == "body_claim")


@dataclass
class ProjectRecord:
    name: str
    owner_repo: str
    owner: str
    repo: str
    repo_url: str
    language: str
    tech_stack: list[str]
    tags: list[str]
    has_beginner_issues: bool
    good_first_count: int
    difficulty: str
    stars: int
    open_issues_snapshot: int
    admin_github: str = ""
    description: str = ""

    @classmethod
    def from_json(cls, raw: dict[str, Any]) -> ProjectRecord:
        owner_repo = raw["owner_repo"].strip()
        parts = owner_repo.split("/", 1)
        owner = parts[0]
        repo = parts[1] if len(parts) > 1 else parts[0]
        gh = raw.get("gh") or {}
        tech_stack = list(raw.get("tech_stack") or [])
        difficulty = str(raw.get("difficulty") or "")
        has_beginner = bool(raw.get("has_beginner_issues"))
        tags = list(tech_stack)
        if difficulty:
            tags.append(difficulty)
        if has_beginner:
            tags.append("beginner-friendly")
        language = gh.get("language") or (tech_stack[0] if tech_stack else "")
        admin = raw.get("admin_github") or ""
        return cls(
            name=str(raw.get("name") or owner_repo),
            owner_repo=owner_repo,
            owner=owner,
            repo=repo,
            repo_url=str(raw.get("repo_url") or f"https://github.com/{owner}/{repo}"),
            language=str(language),
            tech_stack=tech_stack,
            tags=tags,
            has_beginner_issues=has_beginner,
            good_first_count=int(raw.get("good_first_count") or 0),
            difficulty=difficulty,
            stars=int(gh.get("stars") or 0),
            open_issues_snapshot=int(gh.get("open_issues") or 0),
            admin_github=str(admin),
            description=str(raw.get("description") or "")[:500],
        )
