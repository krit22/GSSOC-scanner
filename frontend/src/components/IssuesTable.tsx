import type { Issue } from "../types";
import { formatDate, groupIssuesByRepo } from "../utils";

type Props = {
  issues: Issue[];
};

export function IssuesTable({ issues }: Props) {
  const grouped = groupIssuesByRepo(issues);

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
    </section>
  );
}
