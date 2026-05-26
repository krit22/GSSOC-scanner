"""FastAPI application entrypoint."""

from __future__ import annotations

import sys
from pathlib import Path

# Repo root on path so `scout_core` and `app` resolve when run from backend/
_REPO_ROOT = Path(__file__).resolve().parents[2]
if str(_REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT))

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware

from app.config import get_settings
from app.projects import load_projects


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    if settings.database_configured:
        from app.db.session import init_db

        init_db()
    yield


app = FastAPI(title="GSSoC Issue Finder", version="0.1.0", lifespan=lifespan)

settings = get_settings()
_session_same_site: str = "none" if settings.is_production else "lax"
app.add_middleware(
    SessionMiddleware,
    secret_key=settings.session_secret,
    same_site=_session_same_site,
    https_only=settings.is_production,
)
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=".*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health() -> dict:
    settings = get_settings()
    try:
        project_count = len(load_projects())
    except Exception as e:
        project_count = 0
        catalog_error = str(e)
    else:
        catalog_error = None
    return {
        "status": "ok",
        "project_count": project_count,
        "database_configured": settings.database_configured,
        "oauth_configured": settings.oauth_configured,
        "scanner_token_configured": bool(settings.scanner_github_token),
        "catalog_error": catalog_error,
    }


def _register_routers() -> None:
    from app.routes.auth import router as auth_router
    from app.routes.feed import router as feed_router
    from app.routes.scan import router as scan_router

    app.include_router(auth_router)
    app.include_router(feed_router)
    app.include_router(scan_router)


_register_routers()
