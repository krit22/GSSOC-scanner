"""Global cache helpers."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.db.models import CacheMeta, IssueRow, ScanRun, utcnow
from scout_core.models import ScannedIssue


def _ensure_meta(session: Session) -> CacheMeta:
    meta = session.get(CacheMeta, 1)
    if meta is None:
        meta = CacheMeta(id=1, status="idle")
        session.add(meta)
        session.flush()
    return meta


def _aware(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


def _progress_is_stale(progress_updated_at: datetime | None) -> bool:
    if progress_updated_at is None:
        return True
    elapsed = (datetime.now(timezone.utc) - _aware(progress_updated_at)).total_seconds()
    return elapsed > get_settings().scan_stale_seconds


def is_cache_fresh(scanned_at: datetime | None) -> bool:
    if scanned_at is None:
        return False
    ttl = get_settings().cache_ttl_seconds
    now = datetime.now(timezone.utc)
    if scanned_at.tzinfo is None:
        scanned_at = scanned_at.replace(tzinfo=timezone.utc)
    return (now - scanned_at).total_seconds() < ttl


def recover_orphaned_scans(session: Session) -> bool:
    """On startup: clear DB 'scanning' when no in-process worker exists."""
    meta = _ensure_meta(session)
    if meta.status != "scanning" or meta.active_scan_id is None:
        return False

    from app.scan_service import is_scan_running_locally

    if is_scan_running_locally(meta.active_scan_id):
        return False

    mark_scan_error(
        session,
        meta.active_scan_id,
        "Scan interrupted (server restarted). Click Scan to run again.",
    )
    return True


def reconcile_stale_scan(session: Session) -> bool:
    """
    Abandon a stuck scan (crashed worker or no progress).
    Returns True if the scan was abandoned.
    """
    meta = _ensure_meta(session)
    if meta.status != "scanning" or meta.active_scan_id is None:
        return False

    from app.scan_service import is_scan_running_locally

    scan_id = meta.active_scan_id
    if is_scan_running_locally(scan_id):
        if not _progress_is_stale(meta.progress_updated_at):
            return False
        mark_scan_error(
            session,
            scan_id,
            "Scan timed out (no progress). Click Scan to run again.",
        )
        return True

    mark_scan_error(
        session,
        scan_id,
        "Scan interrupted (no active worker). Click Scan to run again.",
    )
    return True


def force_abandon_scan(session: Session, reason: str = "Scan cancelled") -> bool:
    meta = _ensure_meta(session)
    if meta.status != "scanning" or meta.active_scan_id is None:
        return False
    mark_scan_error(session, meta.active_scan_id, reason)
    return True


def get_active_scan(session: Session) -> ScanRun | None:
    reconcile_stale_scan(session)
    meta = _ensure_meta(session)
    if meta.status != "scanning" or meta.active_scan_id is None:
        return None
    return session.get(ScanRun, meta.active_scan_id)


def clear_issues(session: Session) -> None:
    session.execute(delete(IssueRow))


def begin_scan(session: Session, scan_id: uuid.UUID, repos_total: int, triggered_by: str | None) -> None:
    clear_issues(session)
    now = utcnow()
    meta = _ensure_meta(session)
    meta.status = "scanning"
    meta.active_scan_id = scan_id
    meta.scanned_at = None
    meta.repos_done = 0
    meta.repos_total = repos_total
    meta.current_repo = None
    meta.issues_found = 0
    meta.error = None
    meta.progress_updated_at = now

    run = ScanRun(
        id=scan_id,
        status="scanning",
        repos_total=repos_total,
        triggered_by=triggered_by,
        progress_updated_at=now,
    )
    session.add(run)
    session.commit()


def update_scan_progress(
    session: Session,
    scan_id: uuid.UUID,
    *,
    repos_done: int,
    repos_total: int,
    current_repo: str | None,
    issues_found: int,
) -> None:
    now = utcnow()
    run = session.get(ScanRun, scan_id)
    meta = _ensure_meta(session)
    if run:
        run.repos_done = repos_done
        run.repos_total = repos_total
        run.current_repo = current_repo
        run.issues_found = issues_found
        run.progress_updated_at = now
    meta.repos_done = repos_done
    meta.repos_total = repos_total
    meta.current_repo = current_repo
    meta.issues_found = issues_found
    meta.progress_updated_at = now
    session.commit()


def save_scan_snapshot(
    session: Session,
    scan_id: uuid.UUID,
    issues: list[tuple[str, ScannedIssue]],
) -> None:
    rows = [
        IssueRow(
            scan_run_id=scan_id,
            repo=repo,
            number=issue.number,
            title=issue.title,
            url=issue.url,
            labels=issue.labels,
            author=issue.author,
            created_at=issue.created_at,
        )
        for repo, issue in issues
    ]
    session.add_all(rows)
    finished = utcnow()
    run = session.get(ScanRun, scan_id)
    meta = _ensure_meta(session)
    if run:
        run.status = "ready"
        run.finished_at = finished
        run.issues_found = len(rows)
        run.progress_updated_at = finished
    meta.status = "ready"
    meta.scanned_at = finished
    meta.active_scan_id = scan_id
    meta.issues_found = len(rows)
    meta.error = None
    meta.progress_updated_at = finished
    session.commit()


def mark_scan_error(session: Session, scan_id: uuid.UUID, message: str) -> None:
    finished = utcnow()
    run = session.get(ScanRun, scan_id)
    meta = _ensure_meta(session)
    if run:
        run.status = "error"
        run.finished_at = finished
        run.error = message
        run.progress_updated_at = finished
    meta.status = "error"
    meta.error = message
    meta.active_scan_id = None
    meta.progress_updated_at = finished
    session.commit()


def load_feed_snapshot(session: Session) -> dict[str, Any]:
    reconcile_stale_scan(session)
    meta = _ensure_meta(session)
    scanned_at = meta.scanned_at
    fresh = is_cache_fresh(scanned_at)

    if meta.active_scan_id and meta.status == "ready":
        scan_id = meta.active_scan_id
    elif meta.active_scan_id and meta.status == "scanning":
        scan_id = meta.active_scan_id
    else:
        latest = session.execute(
            select(ScanRun).where(ScanRun.status == "ready").order_by(ScanRun.finished_at.desc()).limit(1)
        ).scalar_one_or_none()
        scan_id = latest.id if latest else None

    issues: list[IssueRow] = []
    if scan_id and meta.status != "scanning":
        issues = list(
            session.execute(
                select(IssueRow).where(IssueRow.scan_run_id == scan_id).order_by(IssueRow.repo, IssueRow.number)
            ).scalars()
        )

    repo_counts: dict[str, int] = {}
    issue_payloads = []
    for row in issues:
        repo_counts[row.repo] = repo_counts.get(row.repo, 0) + 1
        issue_payloads.append(
            {
                "repo": row.repo,
                "number": row.number,
                "title": row.title,
                "url": row.url,
                "labels": row.labels or [],
                "author": row.author,
                "created_at": row.created_at,
            }
        )

    repos = [{"repo": r, "issue_count": c} for r, c in sorted(repo_counts.items())]

    return {
        "scanned_at": scanned_at.isoformat() if scanned_at else None,
        "is_fresh": fresh,
        "status": meta.status,
        "repos": repos,
        "issues": issue_payloads,
        "issues_found": len(issue_payloads),
    }


def status_payload(session: Session) -> dict[str, Any]:
    reconcile_stale_scan(session)
    meta = _ensure_meta(session)
    scanned_at = meta.scanned_at
    return {
        "status": meta.status,
        "scan_id": str(meta.active_scan_id) if meta.active_scan_id else None,
        "repos_done": meta.repos_done,
        "repos_total": meta.repos_total,
        "current_repo": meta.current_repo,
        "issues_found": meta.issues_found,
        "scanned_at": scanned_at.isoformat() if scanned_at else None,
        "error": meta.error,
    }
