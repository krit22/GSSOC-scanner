"""CLI: run one strict scan (Phase 1 test). Usage: python -m app.scan_once"""

from __future__ import annotations

import sys
from pathlib import Path

_REPO_ROOT = Path(__file__).resolve().parents[2]
if str(_REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT))

from app.config import get_settings
from app.db.session import init_db
from app.scan_service import run_strict_scan


def main() -> None:
    settings = get_settings()
    token = settings.scanner_github_token
    if not token:
        print("Set SCANNER_GITHUB_TOKEN in .env", file=sys.stderr)
        sys.exit(1)
    if not settings.database_configured:
        print("Set DATABASE_URL in .env", file=sys.stderr)
        sys.exit(1)

    init_db()
    print("Starting strict scan…")

    def on_progress(done: int, total: int, current: str | None, found: int) -> None:
        cur = current or "—"
        print(f"  [{done}/{total}] {cur} — {found} available issues so far")

    scan_id = run_strict_scan(token, on_progress=on_progress, triggered_by="cli")
    print(f"Done. scan_id={scan_id}")


if __name__ == "__main__":
    main()
