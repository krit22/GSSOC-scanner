export function formatRelativeTime(iso: string | null): string {
  if (!iso) return "Never";
  const then = new Date(iso).getTime();
  const sec = Math.floor((Date.now() - then) / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 48) return `${hr} hr ago`;
  const d = Math.floor(hr / 24);
  return `${d} day${d === 1 ? "" : "s"} ago`;
}

export function groupIssuesByRepo<T extends { repo: string }>(
  issues: T[],
): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const issue of issues) {
    const list = map.get(issue.repo) ?? [];
    list.push(issue);
    map.set(issue.repo, list);
  }
  return new Map([...map.entries()].sort(([a], [b]) => a.localeCompare(b)));
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function parseRepoFullName(repo: string): { owner: string; name: string } {
  const slash = repo.indexOf("/");
  if (slash === -1) return { owner: "", name: repo };
  return { owner: repo.slice(0, slash), name: repo.slice(slash + 1) };
}

export function formatUpdatedLabel(iso: string): string {
  const then = new Date(iso).getTime();
  const sec = Math.floor((Date.now() - then) / 1000);
  if (sec < 86400) return "updated today";
  const d = Math.floor(sec / 86400);
  if (d === 1) return "updated yesterday";
  return `updated ${d}d ago`;
}
