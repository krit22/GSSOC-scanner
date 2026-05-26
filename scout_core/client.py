"""GitHub GraphQL client for issue scouting."""

from __future__ import annotations

import json
import time
import urllib.error
import urllib.request
from typing import Any

GRAPHQL_URL = "https://api.github.com/graphql"

ISSUES_QUERY = """
query($owner: String!, $name: String!, $cursor: String, $pageSize: Int!) {
  repository(owner: $owner, name: $name) {
    issues(
      states: OPEN
      first: $pageSize
      after: $cursor
      orderBy: { field: CREATED_AT, direction: DESC }
    ) {
      pageInfo { hasNextPage endCursor }
      nodes {
        number
        title
        body
        url
        createdAt
        updatedAt
        author { login }
        assignees(first: 10) { nodes { login } }
        labels(first: 20) { nodes { name } }
        comments { totalCount }
      }
    }
  }
}
"""

COMMENTS_QUERY = """
query($owner: String!, $name: String!, $number: Int!) {
  repository(owner: $owner, name: $name) {
    issue(number: $number) {
      comments(first: 100) {
        nodes {
          author { login }
          body
          createdAt
        }
      }
    }
  }
}
"""


class GitHubAPIError(Exception):
    def __init__(self, code: int, message: str) -> None:
        self.code = code
        self.message = message
        super().__init__(f"GitHub API HTTP {code}: {message}")


class GitHubClient:
    def __init__(self, token: str | None) -> None:
        self.token = token

    def _request(self, query: str, variables: dict[str, Any]) -> dict[str, Any]:
        payload = json.dumps({"query": query, "variables": variables}).encode()
        headers = {
            "Accept": "application/vnd.github+json",
            "Content-Type": "application/json",
            "User-Agent": "gssoc-issue-radar",
        }
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"

        req = urllib.request.Request(GRAPHQL_URL, data=payload, headers=headers, method="POST")
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                body = json.loads(resp.read().decode())
        except urllib.error.HTTPError as e:
            err_body = e.read().decode() if e.fp else ""
            raise GitHubAPIError(e.code, err_body) from e

        if body.get("errors"):
            raise GitHubAPIError(400, json.dumps(body["errors"]))

        return body["data"]

    def fetch_open_issues(
        self, owner: str, name: str, page_size: int, max_issues: int
    ) -> list[dict[str, Any]]:
        issues: list[dict[str, Any]] = []
        cursor: str | None = None

        while len(issues) < max_issues:
            data = self._request(
                ISSUES_QUERY,
                {
                    "owner": owner,
                    "name": name,
                    "cursor": cursor,
                    "pageSize": min(page_size, max_issues - len(issues)),
                },
            )
            repo = data.get("repository")
            if not repo:
                raise GitHubAPIError(404, f"Repository not found: {owner}/{name}")

            batch = repo["issues"]["nodes"]
            issues.extend(batch)
            page = repo["issues"]["pageInfo"]
            if not page["hasNextPage"] or not batch:
                break
            cursor = page["endCursor"]
            time.sleep(0.2)

        return issues[:max_issues]

    def fetch_issue_comments(self, owner: str, name: str, number: int) -> list[dict[str, Any]]:
        data = self._request(
            COMMENTS_QUERY,
            {"owner": owner, "name": name, "number": number},
        )
        issue = data.get("repository", {}).get("issue")
        if not issue:
            return []
        return issue["comments"]["nodes"]
