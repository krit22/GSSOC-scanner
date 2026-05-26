import { formatRelativeTime } from "../utils";

type Props = {
  scannedAt: string | null;
  isFresh: boolean;
  issueCount: number;
  scanning: boolean;
  scanLoading: boolean;
  onScan: () => void;
  toast?: string | null;
};

export function ScanControls({
  scannedAt,
  isFresh,
  issueCount,
  scanning,
  scanLoading,
  onScan,
  toast,
}: Props) {
  return (
    <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-400">Last updated</p>
          <p className="mt-1 text-lg text-white">
            {scannedAt ? formatRelativeTime(scannedAt) : "No scan yet"}
            {scannedAt && (
              <span
                className={`ml-2 text-sm font-medium ${
                  isFresh ? "text-[var(--color-fresh)]" : "text-[var(--color-stale)]"
                }`}
              >
                {isFresh ? "(fresh)" : "(stale — click Scan)"}
              </span>
            )}
          </p>
          {issueCount > 0 && (
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              {issueCount} available issue{issueCount === 1 ? "" : "s"} in cache
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onScan}
          disabled={scanning || scanLoading}
          className="inline-flex items-center justify-center rounded-lg bg-[var(--color-accent)] px-6 py-2.5 font-semibold text-white shadow-lg shadow-orange-900/25 transition hover:bg-[var(--color-accent-dim)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {scanning || scanLoading ? "Scanning…" : "Scan"}
        </button>
      </div>
      {toast && (
        <p
          className={`mt-3 rounded-lg border px-3 py-2 text-sm ${
            toast.includes("failed") || toast.includes("interrupted")
              ? "border-red-800/50 bg-red-950/40 text-red-300"
              : "border-emerald-800/50 bg-emerald-950/40 text-emerald-300"
          }`}
        >
          {toast}
        </p>
      )}
    </section>
  );
}
