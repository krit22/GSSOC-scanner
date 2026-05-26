"""Database engine and session factory."""

from __future__ import annotations

from functools import lru_cache

from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, sessionmaker

from app.config import get_settings
from app.db.models import Base, CacheMeta


@lru_cache
def get_engine():
    settings = get_settings()
    if not settings.database_url:
        raise RuntimeError("DATABASE_URL is not set")
    return create_engine(settings.database_url, pool_pre_ping=True)


@lru_cache
def get_session_factory():
    return sessionmaker(bind=get_engine(), autoflush=False, autocommit=False)


def _run_migrations(engine) -> None:
    """Add columns to existing Neon/Postgres tables (create_all does not alter)."""
    statements = [
        "ALTER TABLE cache_meta ADD COLUMN IF NOT EXISTS progress_updated_at TIMESTAMPTZ",
        "ALTER TABLE scan_runs ADD COLUMN IF NOT EXISTS progress_updated_at TIMESTAMPTZ",
    ]
    with engine.begin() as conn:
        for stmt in statements:
            conn.execute(text(stmt))


def init_db() -> None:
    engine = get_engine()
    Base.metadata.create_all(engine)
    _run_migrations(engine)
    with Session(engine) as session:
        meta = session.get(CacheMeta, 1)
        if meta is None:
            session.add(CacheMeta(id=1, status="idle"))
            session.commit()
        from app.db.cache import recover_orphaned_scans

        recover_orphaned_scans(session)
