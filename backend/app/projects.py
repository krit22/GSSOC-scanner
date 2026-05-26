"""Load GSSoC project catalog from projects.json."""

from __future__ import annotations

import json
from functools import lru_cache

from scout_core.models import ProjectRecord, RepoConfig

from app.config import get_settings


@lru_cache
def load_projects() -> list[ProjectRecord]:
    path = get_settings().projects_path
    with path.open(encoding="utf-8") as f:
        data = json.load(f)
    raw_list = data.get("projects") if isinstance(data, dict) else data
    if not isinstance(raw_list, list):
        raise ValueError(f"Expected projects array in {path}")
    return [ProjectRecord.from_json(item) for item in raw_list]


def projects_to_repo_configs() -> list[RepoConfig]:
    repos: list[RepoConfig] = []
    seen: set[str] = set()
    for p in load_projects():
        key = p.owner_repo.lower()
        if key in seen:
            continue
        seen.add(key)
        repos.append(RepoConfig(owner=p.owner, name=p.repo))
    return repos
