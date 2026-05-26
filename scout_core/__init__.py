"""Core scouting library for GSSoC Issue Radar."""

from scout_core.client import GitHubAPIError, GitHubClient
from scout_core.models import IssueHit, ProjectRecord, ScanResult, ScannedIssue, ScoutConfig, RepoConfig
from scout_core.patterns import CLAIM_PATTERNS, has_claim_comment, has_claim_text
from scout_core.scanner import scan_repo, scan_repo_hits

__all__ = [
    "CLAIM_PATTERNS",
    "GitHubAPIError",
    "GitHubClient",
    "IssueHit",
    "ProjectRecord",
    "RepoConfig",
    "ScanResult",
    "ScannedIssue",
    "ScoutConfig",
    "has_claim_comment",
    "has_claim_text",
    "scan_repo",
    "scan_repo_hits",
]
