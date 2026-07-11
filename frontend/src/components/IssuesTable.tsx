import { useState, useRef, useEffect } from "react";
import type { Issue } from "../types";
import { formatDate, formatUpdatedLabel, parseRepoFullName } from "../utils";
import { RepoIssuesModal } from "./RepoIssuesModal";

type Props = {
  issues: Issue[];
};

type SortOption = "newest" | "oldest" | "count";

const MAX_VISIBLE_LABELS = 3;
const MAX_PREVIEW_ISSUES = 3;

function uniqueLabels(issues: Issue[]): string[] {
  const seen = new Set<string>();
  const labels: string[] = [];
  for (const issue of issues) {
    for (const label of issue.labels) {
      const key = label.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        labels.push(label);
      }
    }
  }
  return labels;
}

function newestIssue(issues: Issue[]): Issue {
  return [...issues].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )[0];
}

function RepoCard({ repo, repoIssues }: { repo: string; repoIssues: Issue[] }) {
  const [modalOpen, setModalOpen] = useState(false);
  const { owner, name } = parseRepoFullName(repo);
  const labels = uniqueLabels(repoIssues);
  const visibleLabels = labels.slice(0, MAX_VISIBLE_LABELS);
  const overflowCount = labels.length - visibleLabels.length;
  const latest = newestIssue(repoIssues);
  const hiddenCount = repoIssues.length - MAX_PREVIEW_ISSUES;
  const summary =
    repoIssues.length === 1
      ? repoIssues[0].title
      : `${repoIssues.length} unassigned issues — latest: ${repoIssues[0].title}`;

  return (
    <>
    <article className="card flex flex-col overflow-hidden">
      <div className="flex items-start justify-between gap-3 p-5 pb-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-semibold text-[var(--color-text)]">{name}</h3>
          {owner && (
            <p className="mt-0.5 truncate text-sm text-[var(--color-muted)]">{owner}</p>
          )}
        </div>
        <span className="badge-count shrink-0">
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" />
          </svg>
          {repoIssues.length} issue{repoIssues.length === 1 ? "" : "s"}
        </span>
      </div>

      <p className="line-clamp-2 px-5 text-sm leading-relaxed text-[var(--color-text-secondary)]">
        {summary}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 px-5 text-sm text-[var(--color-text-secondary)]">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[var(--color-accent)]" aria-hidden />
          Issues
        </span>
        <span className="inline-flex items-center gap-1.5">
          <svg className="h-4 w-4 text-[var(--color-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
          {repoIssues.length}
        </span>
        <span className="badge-open">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-open)]" aria-hidden />
          {repoIssues.length} unassigned
        </span>
      </div>

      {visibleLabels.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5 px-5">
          {visibleLabels.map((label) => (
            <span key={label} className="chip">
              {label}
            </span>
          ))}
          {overflowCount > 0 && <span className="chip">+{overflowCount}</span>}
        </div>
      )}

      <ul className="mt-4 flex-1 divide-y divide-[var(--color-border-subtle)] border-t border-[var(--color-border-subtle)]">
        {repoIssues.slice(0, MAX_PREVIEW_ISSUES).map((issue) => (
          <li key={`${issue.repo}-${issue.number}`}>
            <a
              href={issue.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start justify-between gap-3 px-5 py-3 transition hover:bg-[var(--color-elevated)]/50"
            >
              <span className="min-w-0 flex-1 text-sm font-medium text-[var(--color-text)] hover:text-[var(--color-accent)]">
                <span className="text-[var(--color-muted)]">#{issue.number}</span> {issue.title}
              </span>
              <time
                dateTime={issue.created_at}
                className="shrink-0 text-xs text-[var(--color-muted)]"
              >
                {formatDate(issue.created_at)}
              </time>
            </a>
          </li>
        ))}
        {hiddenCount > 0 && (
          <li className="px-5 py-3">
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="w-full rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-elevated)]/40 px-3 py-2.5 text-center text-sm font-medium text-[var(--color-accent)] transition hover:border-[var(--color-accent)]/50 hover:bg-[var(--color-accent-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-card)]"
            >
              +{hiddenCount} more issue{hiddenCount === 1 ? "" : "s"} — click to view
            </button>
          </li>
        )}
      </ul>

      <footer className="mt-auto flex items-center justify-between gap-3 border-t border-[var(--color-border-subtle)] px-5 py-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-[var(--color-text)]">@{latest.author}</p>
          <p className="text-xs text-[var(--color-muted)]">{formatUpdatedLabel(latest.created_at)}</p>
        </div>
        <a
          href={`https://github.com/${repo}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-ghost shrink-0 text-sm"
        >
          View Project
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </a>
      </footer>
    </article>

    <RepoIssuesModal
      repo={repo}
      issues={repoIssues}
      open={modalOpen}
      onClose={() => setModalOpen(false)}
    />
    </>
  );
}

export function IssuesTable({ issues }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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

  const groupAndSortIssues = (issuesList: Issue[]) => {
    const baseGrouped = new Map<string, Issue[]>();
    for (const issue of issuesList) {
      const list = baseGrouped.get(issue.repo) ?? [];
      list.push(issue);
      baseGrouped.set(issue.repo, list);
    }

    for (const [, repoIssues] of baseGrouped.entries()) {
      repoIssues.sort((a, b) => {
        const timeA = new Date(a.created_at).getTime();
        const timeB = new Date(b.created_at).getTime();
        return sortBy === "oldest" ? timeA - timeB : timeB - timeA;
      });
    }

    const groupedEntries = [...baseGrouped.entries()];
    if (sortBy === "count") {
      groupedEntries.sort(([, aList], [, bList]) => {
        if (bList.length !== aList.length) return bList.length - aList.length;
        const timeA = new Date(aList[0].created_at).getTime();
        const timeB = new Date(bList[0].created_at).getTime();
        return timeB - timeA;
      });
    } else {
      groupedEntries.sort(([, aList], [, bList]) => {
        const timeA = new Date(aList[0].created_at).getTime();
        const timeB = new Date(bList[0].created_at).getTime();
        return sortBy === "oldest" ? timeA - timeB : timeB - timeA;
      });
    }

    return new Map(groupedEntries);
  };

  const grouped = groupAndSortIssues(filteredIssues);
  const repoCount = grouped.size;

  if (issues.length === 0) {
    return (
      <section className="card-static p-12 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-elevated)]">
          <svg className="h-7 w-7 text-[var(--color-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
        <h3 className="mt-4 text-lg font-semibold text-[var(--color-text)]">No issues yet</h3>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          Run a scan to discover unassigned issues across GSSoC repositories.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <div
        className="flex flex-col gap-3 border-b border-[var(--color-border-subtle)] pb-4 sm:flex-row sm:items-center"
        role="search"
      >
        <p className="shrink-0 text-sm text-[var(--color-muted)]" id="repo-list-heading">
          <span className="font-medium text-[var(--color-text)]">{repoCount}</span>{" "}
          {repoCount === 1 ? "repo" : "repos"}
          <span className="mx-1.5 text-[var(--color-border)]" aria-hidden>
            ·
          </span>
          <span className="font-medium text-[var(--color-text)]">{filteredIssues.length}</span>{" "}
          {filteredIssues.length === 1 ? "issue" : "issues"}
        </p>

        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          <div className="relative min-w-0 flex-1 sm:max-w-md">
            <label htmlFor="repo-search" className="sr-only">
              Search repositories, issues, or tags
            </label>
            <input
              ref={inputRef}
              id="repo-search"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search… (/ to focus)"
              aria-describedby="repo-list-heading"
              className="input-dark input-compact w-full pr-8"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
                className="absolute inset-y-0 right-0 flex items-center px-2.5 text-[var(--color-muted)] transition hover:text-[var(--color-text)]"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          <div className="relative shrink-0 sm:w-36">
            <label htmlFor="sort-repos" className="sr-only">
              Sort repositories
            </label>
            <select
              id="sort-repos"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="input-dark input-compact w-full cursor-pointer appearance-none pr-7"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="count">Most issues</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2" aria-hidden>
              <svg className="h-3.5 w-3.5 text-[var(--color-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {filteredIssues.length === 0 ? (
        <section className="card-static p-12 text-center">
          <h3 className="text-lg font-semibold text-[var(--color-text)]">No matching results</h3>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            Nothing matched &ldquo;{searchQuery}&rdquo;. Try a different term or clear the filter.
          </p>
          <button type="button" onClick={() => setSearchQuery("")} className="btn-ghost mt-4">
            Clear search
          </button>
        </section>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from(grouped.entries()).map(([repo, repoIssues]) => (
            <RepoCard key={repo} repo={repo} repoIssues={repoIssues} />
          ))}
        </div>
      )}
    </section>
  );
}
