"""Feed and scan status routes."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.db.cache import load_feed_snapshot, status_payload
from app.db.session import get_session_factory

router = APIRouter(tags=["feed"])


@router.get("/api/feed")
def get_feed() -> dict:
    try:
        session_factory = get_session_factory()
    except RuntimeError:
        raise HTTPException(503, "Database not configured") from None
    with session_factory() as session:
        return load_feed_snapshot(session)


@router.get("/api/scan/status")
def get_scan_status() -> dict:
    try:
        session_factory = get_session_factory()
    except RuntimeError:
        raise HTTPException(503, "Database not configured") from None
    with session_factory() as session:
        return status_payload(session)
