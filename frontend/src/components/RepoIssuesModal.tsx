import { useEffect, useId, useRef } from "react";
import type { Issue } from "../types";
import { formatDate } from "../utils";

type Props = {
  repo: string;
  issues: Issue[];
  open: boolean;
  onClose: () => void;
};

export function RepoIssuesModal({ repo, issues, open, onClose }: Props) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        aria-label="Close dialog"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="card-static relative flex max-h-[min(85vh,40rem)] w-full max-w-lg flex-col shadow-2xl"
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-[var(--color-border-subtle)] px-5 py-4 sm:px-6">
          <div className="min-w-0 pr-2">
            <h2 id={titleId} className="text-lg font-semibold text-[var(--color-text)] sm:text-xl">
              All unassigned issues
            </h2>
            <p className="mt-1 truncate font-mono text-sm text-[var(--color-accent)]">{repo}</p>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              {issues.length} unassigned issue{issues.length === 1 ? "" : "s"}
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="btn-ghost shrink-0 p-2"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <ul className="min-h-0 flex-1 divide-y divide-[var(--color-border-subtle)] overflow-y-auto overscroll-contain">
          {issues.map((issue) => (
            <li key={`${issue.repo}-${issue.number}`}>
              <a
                href={issue.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col gap-2 px-5 py-4 transition hover:bg-[var(--color-elevated)]/50 sm:flex-row sm:items-start sm:justify-between sm:gap-4 sm:px-6"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[var(--color-text)]">
                    <span className="text-[var(--color-muted)]">#{issue.number}</span> {issue.title}
                  </p>
                  <p className="mt-1 text-xs text-[var(--color-muted)]">@{issue.author}</p>
                  {issue.labels.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {issue.labels.map((label) => (
                        <span key={label} className="chip">
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
              </a>
            </li>
          ))}
        </ul>

        <footer className="shrink-0 border-t border-[var(--color-border-subtle)] px-5 py-3 sm:px-6">
          <a
            href={`https://github.com/${repo}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost w-full text-sm sm:w-auto"
          >
            Open repository on GitHub
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </footer>
      </div>
    </div>
  );
}
