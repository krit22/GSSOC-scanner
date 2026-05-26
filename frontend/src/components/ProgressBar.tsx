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
    <div className="space-y-2" aria-live="polite" aria-busy="true">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--color-text-secondary)]">
        <span>
          Scanning{" "}
          <span className="font-mono text-[var(--color-text)]">
            {currentRepo ?? "…"}
          </span>
        </span>
        <span className="tabular-nums">
          {reposDone}/{reposTotal} repos · {issuesFound} issues
        </span>
      </div>
      <div
        className="h-1 overflow-hidden rounded-full bg-[var(--color-elevated)]"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Scan progress ${pct}%`}
      >
        <div
          className="h-full rounded-full bg-[var(--color-accent)] transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
