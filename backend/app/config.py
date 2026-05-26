"""Application settings from environment."""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

_REPO_ROOT = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=_REPO_ROOT / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    github_oauth_client_id: str = ""
    github_oauth_client_secret: str = ""
    session_secret: str = "dev-insecure-change-me"
    database_url: str = ""
    scanner_github_token: str = ""
    cache_ttl_seconds: int = 1800
    projects_json_path: str = str(_REPO_ROOT / "projects.json")
    scan_concurrency: int = 3
    max_issues_per_repo: int = 500
    # No progress for this long → treat scan as dead (orphan/crash/hang)
    scan_stale_seconds: int = 180
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    frontend_url: str = "http://localhost:5173"

    @property
    def is_production(self) -> bool:
        """HTTPS frontend or running on Render → cross-site session cookies."""
        import os

        if os.getenv("RENDER") == "true":
            return True
        return self.frontend_url.startswith("https://")

    @property
    def projects_path(self) -> Path:
        p = Path(self.projects_json_path)
        return p if p.is_absolute() else _REPO_ROOT / p

    @property
    def oauth_configured(self) -> bool:
        return bool(self.github_oauth_client_id and self.github_oauth_client_secret)

    @property
    def database_configured(self) -> bool:
        return bool(self.database_url)


@lru_cache
def get_settings() -> Settings:
    return Settings()
