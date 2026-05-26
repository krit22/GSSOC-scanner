"""Orchestrates strict scans across the GSSoC catalog."""

from __future__ import annotations

import threading
import uuid
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Callable

from scout_core.client import GitHubAPIError, GitHubClient
from scout_core.models import RepoConfig, ScoutConfig, ScannedIssue
from scout_core.patterns import CLAIM_PATTERNS
from scout_core.scanner import scan_repo

from app.config import get_settings
from app.db.cache import (
    begin_scan,
    get_active_scan,
    mark_scan_error,
    reconcile_stale_scan,
    save_scan_snapshot,
    update_scan_progress,
)
from app.db.session import get_session_factory
from app.projects import projects_to_repo_configs

_scan_lock = threading.Lock()
_worker_scan_id: uuid.UUID | None = None

ProgressCallback = Callable[[int, int, str | None, int], None]


def is_scan_running_locally(scan_id: uuid.UUID) -> bool:
    return _worker_scan_id == scan_id


def _scout_config(repos: list[RepoConfig]) -> ScoutConfig:
    settings = get_settings()
    return ScoutConfig(
        repos=repos,
        mode="strict",
        max_issues_per_repo=settings.max_issues_per_repo,
        require_labels=[],
        exclude_labels=[],
        detect_body_claims=True,
    )


def _scan_one_repo(
    client: GitHubClient,
    repo_cfg: RepoConfig,
    cfg: ScoutConfig,
) -> tuple[str, list[ScannedIssue]]:
    result = scan_repo(client, repo_cfg, cfg, CLAIM_PATTERNS)
    full_name = f"{repo_cfg.owner}/{repo_cfg.name}"
    available = [i for i in result.issues if i.status == "available"]
    return full_name, available


def run_strict_scan(
    token: str,
    scan_id: uuid.UUID | None = None,
    on_progress: ProgressCallback | None = None,
    triggered_by: str | None = None,
) -> uuid.UUID:
    """Run a full-catalog strict scan. Caller must hold global lock."""
    global _worker_scan_id
    settings = get_settings()
    repos = projects_to_repo_configs()
    cfg = _scout_config(repos)
    client = GitHubClient(token)
    scan_id = scan_id or uuid.uuid4()
    session_factory = get_session_factory()

    with session_factory() as session:
        begin_scan(session, scan_id, len(repos), triggered_by)

    _worker_scan_id = scan_id

    collected: list[tuple[str, ScannedIssue]] = []
    repos_done = 0
    issues_found = 0
    concurrency = max(1, settings.scan_concurrency)

    def report(current_repo: str | None = None) -> None:
        if on_progress:
            on_progress(repos_done, len(repos), current_repo, issues_found)
        with session_factory() as session:
            update_scan_progress(
                session,
                scan_id,
                repos_done=repos_done,
                repos_total=len(repos),
                current_repo=current_repo,
                issues_found=issues_found,
            )

    try:
        report(None)

        with ThreadPoolExecutor(max_workers=concurrency) as pool:
            futures = {
                pool.submit(_scan_one_repo, client, repo_cfg, cfg): repo_cfg for repo_cfg in repos
            }
            for future in as_completed(futures):
                repo_cfg = futures[future]
                full_name = f"{repo_cfg.owner}/{repo_cfg.name}"
                try:
                    repo_name, available = future.result()
                    for issue in available:
                        collected.append((repo_name, issue))
                    issues_found = len(collected)
                except GitHubAPIError as e:
                    with session_factory() as session:
                        mark_scan_error(session, scan_id, e.message)
                    raise
                except Exception as e:
                    with session_factory() as session:
                        mark_scan_error(session, scan_id, str(e))
                    raise
                repos_done += 1
                report(full_name)

        with session_factory() as session:
            save_scan_snapshot(session, scan_id, collected)
    finally:
        if _worker_scan_id == scan_id:
            _worker_scan_id = None

    return scan_id


def try_start_background_scan(
    token: str,
    triggered_by: str | None = None,
) -> tuple[bool, uuid.UUID | None, str]:
    """
    Attempt to start a scan. Returns (started, scan_id, reason).
    reason: started | already_scanning
    """
    session_factory = get_session_factory()
    with session_factory() as session:
        reconcile_stale_scan(session)
        active = get_active_scan(session)
        if active:
            return False, active.id, "already_scanning"

    with _scan_lock:
        with session_factory() as session:
            reconcile_stale_scan(session)
            active = get_active_scan(session)
            if active:
                return False, active.id, "already_scanning"
        if _worker_scan_id is not None:
            return False, _worker_scan_id, "already_scanning"

    scan_id = uuid.uuid4()

    def worker() -> None:
        try:
            run_strict_scan(token, scan_id=scan_id, triggered_by=triggered_by)
        except Exception:
            pass

    threading.Thread(target=worker, daemon=True).start()
    return True, scan_id, "started"
