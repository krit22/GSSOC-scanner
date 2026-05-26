"""POST /api/scan — cache-aware scan trigger."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query, Request

from app.config import get_settings
from app.db.cache import force_abandon_scan, get_active_scan, load_feed_snapshot, reconcile_stale_scan
from app.db.session import get_session_factory
from app.scan_service import try_start_background_scan

router = APIRouter(tags=["scan"])


def _resolve_token(request: Request) -> tuple[str | None, str | None]:
    """Return (token, login). Session OAuth token takes precedence over env PAT."""
    session = request.session
    token = session.get("github_access_token")
    login = session.get("github_login")
    if token:
        return token, login
    settings = get_settings()
    if settings.scanner_github_token:
        return settings.scanner_github_token, "scanner-token"
    return None, None


@router.post("/api/scan")
def post_scan(request: Request, force: bool = Query(False, description="Abandon stuck scan and start fresh")) -> dict:
    token, login = _resolve_token(request)
    if not token:
        raise HTTPException(
            401,
            "Sign in with GitHub or set SCANNER_GITHUB_TOKEN for development",
        )

    try:
        session_factory = get_session_factory()
    except RuntimeError:
        raise HTTPException(503, "Database not configured") from None

    with session_factory() as session:
        if force:
            force_abandon_scan(session, "Scan cancelled (force=true)")
        reconcile_stale_scan(session)
        active = get_active_scan(session)
        if active:
            return {
                "status": "scanning",
                "scan_id": str(active.id),
                "cached": False,
                "progress": {
                    "repos_done": active.repos_done,
                    "repos_total": active.repos_total,
                    "current_repo": active.current_repo,
                    "issues_found": active.issues_found,
                },
            }

        feed = load_feed_snapshot(session)

        if feed.get("is_fresh") and feed.get("status") == "ready":
            return {
                "status": "ready",
                "cached": True,
                "scanned_at": feed.get("scanned_at"),
                "repos": feed["repos"],
                "issues": feed["issues"],
            }

    started, scan_id, reason = try_start_background_scan(token, triggered_by=login)
    if not started and reason == "already_scanning":
        with session_factory() as session:
            active = get_active_scan(session)
            return {
                "status": "scanning",
                "scan_id": str(active.id) if active else None,
                "cached": False,
                "message": "Scan already in progress",
            }

    return {
        "status": "scanning",
        "scan_id": str(scan_id) if scan_id else None,
        "cached": False,
        "message": "Scan started",
    }
