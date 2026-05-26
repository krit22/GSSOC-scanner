type Props = {
  reposDone: number;
  reposTotal: number;
  currentRepo: string | null;
  issuesFound: number;
};

export function ProgressBar({
  reposDone,
  reposTotal,
  currentRepo,
  issuesFound,
}: Props) {
  const pct = reposTotal > 0 ? Math.round((reposDone / reposTotal) * 100) : 0;

  return (
    <section
      className="rounded-xl border border-orange-900/40 bg-orange-950/20 p-4 sm:p-5"
      aria-live="polite"
    >
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-medium text-orange-200">Scan in progress</p>
        <p className="font-mono text-sm text-orange-300/90">
          Repo {reposDone} / {reposTotal}
        </p>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[var(--color-surface)]">
        <div
          className="h-full rounded-full bg-[var(--color-accent)] transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-2 truncate text-sm text-[var(--color-muted)]">
        {currentRepo ? `Scanning ${currentRepo}` : "Starting…"}
      </p>
      <p className="mt-1 text-sm text-slate-400">
        {issuesFound} available issue{issuesFound === 1 ? "" : "s"} found so far
      </p>
      <p className="mt-2 text-xs text-slate-500">
        Results are shared globally; this scan uses your GitHub API quota.
      </p>
    </section>
  );
}
