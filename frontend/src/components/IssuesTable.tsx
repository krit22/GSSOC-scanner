import { useState, useRef, useEffect } from "react";
import type { Issue } from "../types";
import { formatDate } from "../utils";

type Props = {
  issues: Issue[];
};

type SortOption = "newest" | "oldest" | "count";

export function IssuesTable({ issues }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut '/' to focus search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement !== inputRef.current) {
        // Prevent default slash behavior (e.g. browser search or fast find)
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Filter issues based on search query
  const filteredIssues = issues.filter((issue) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;

    return (
      issue.repo.toLowerCase().includes(query) ||
      issue.title.toLowerCase().includes(query) ||
      issue.number.toString().includes(query) ||
      issue.labels.some((label) => label.toLowerCase().includes(query))
    );
  });

  // Custom grouping & sorting logic based on the approved plan (excluding alphabetical)
  const groupAndSortIssues = (issuesList: Issue[]) => {
    const baseGrouped = new Map<string, Issue[]>();
    for (const issue of issuesList) {
      const list = baseGrouped.get(issue.repo) ?? [];
      list.push(issue);
      baseGrouped.set(issue.repo, list);
    }

    // Sort issues inside each repository by date
    for (const [, repoIssues] of baseGrouped.entries()) {
      repoIssues.sort((a, b) => {
        const timeA = new Date(a.created_at).getTime();
        const timeB = new Date(b.created_at).getTime();
        return sortBy === "oldest" ? timeA - timeB : timeB - timeA;
      });
    }

    // Sort repository groups
    const groupedEntries = [...baseGrouped.entries()];
    if (sortBy === "count") {
      // Sort repositories by number of issues (descending), with newest issue as tiebreaker
      groupedEntries.sort(([, aList], [, bList]) => {
        if (bList.length !== aList.length) {
          return bList.length - aList.length;
        }
        const timeA = new Date(aList[0].created_at).getTime();
        const timeB = new Date(bList[0].created_at).getTime();
        return timeB - timeA;
      });
    } else {
      // newest or oldest: sort repos by the date of their leading issue (which is already sorted)
      groupedEntries.sort(([, aList], [, bList]) => {
        const timeA = new Date(aList[0].created_at).getTime();
        const timeB = new Date(bList[0].created_at).getTime();
        return sortBy === "oldest" ? timeA - timeB : timeB - timeA;
      });
    }

    return new Map(groupedEntries);
  };

  const grouped = groupAndSortIssues(filteredIssues);

  // Base state: no issues at all in the system
  if (issues.length === 0) {
    return (
      <section className="rounded-xl border border-dashed border-[var(--color-border)] p-10 text-center text-[var(--color-muted)]">
        <p>No untouched issues in the last scan.</p>
        <p className="mt-1 text-sm">Try Scan again later or check back after others refresh the cache.</p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      {/* Controls Container */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search Bar Container */}
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <svg
              className="h-5 w-5 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search repositories, issues, or tags... (Press '/' to focus)"
            className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] py-3 pl-10 pr-10 text-sm text-slate-100 placeholder-slate-400 shadow-md transition focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-white"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Sort Dropdown */}
        <div className="relative w-full shrink-0 sm:w-56">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <svg
              className="h-4 w-4 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h4m0 0l3-3m-3 3l3 3M21 17h-4m0 0l-3 3m3-3l-3-3" />
            </svg>
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="w-full cursor-pointer appearance-none rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] py-3 pl-9 pr-10 text-sm font-medium text-slate-200 shadow-md transition focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] focus:outline-none"
          >
            <option value="newest" style={{ backgroundColor: "#1a2332", color: "#e2e8f0" }}>Newest First</option>
            <option value="oldest" style={{ backgroundColor: "#1a2332", color: "#e2e8f0" }}>Oldest First</option>
            <option value="count" style={{ backgroundColor: "#1a2332", color: "#e2e8f0" }}>Most Issues</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <svg
              className="h-4 w-4 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Filtered empty state */}
      {filteredIssues.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-panel)]/30 p-10 text-center text-[var(--color-muted)]">
          <svg
            className="mx-auto h-12 w-12 text-slate-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-slate-200">No matching issues found</h3>
          <p className="mt-1 text-sm text-slate-400">
            No repositories, issues, or labels matched "{searchQuery}".
          </p>
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="mt-4 inline-flex items-center rounded-lg bg-[var(--color-border)] px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            Clear search filter
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {Array.from(grouped.entries()).map(([repo, repoIssues]) => (
            <div
              key={repo}
              className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)]"
            >
              <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)]/60 px-4 py-3">
                <a
                  href={`https://github.com/${repo}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-sm font-medium text-orange-400 hover:text-orange-300"
                >
                  {repo}
                </a>
                <span className="rounded-full bg-[var(--color-surface)] px-2.5 py-0.5 text-xs text-slate-400">
                  {repoIssues.length} issue{repoIssues.length === 1 ? "" : "s"}
                </span>
              </div>
              <ul className="divide-y divide-[var(--color-border)]">
                {repoIssues.map((issue) => (
                  <li key={`${issue.repo}-${issue.number}`} className="px-4 py-3 hover:bg-white/[0.02]">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <a
                          href={issue.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-slate-100 hover:text-orange-300"
                        >
                          #{issue.number} {issue.title}
                        </a>
                        {issue.labels.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {issue.labels.map((label) => (
                              <span
                                key={label}
                                className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-0.5 text-xs text-slate-400"
                              >
                                {label}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <time
                        dateTime={issue.created_at}
                        className="shrink-0 text-xs text-[var(--color-muted)]"
                      >
                        {formatDate(issue.created_at)}
                      </time>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
