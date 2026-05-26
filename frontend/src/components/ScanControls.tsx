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
  const isErrorToast =
    toast != null && (toast.includes("failed") || toast.includes("interrupted"));

  const statusLabel = scanning
    ? "Scanning repositories"
    : scannedAt
      ? `Updated ${formatRelativeTime(scannedAt)}${issueCount > 0 ? ` · ${issueCount} issues` : ""}${!isFresh ? " · stale" : ""}`
      : "No scan yet";

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p
          className="min-w-0 text-sm text-[var(--color-text-secondary)]"
          aria-live="polite"
        >
          {scanning && (
            <span
              className="mr-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-accent)] align-middle"
              aria-hidden
            />
          )}
          {!scanning && scannedAt && (
            <span
              className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full align-middle ${
                isFresh ? "bg-[var(--color-fresh)]" : "bg-[var(--color-stale)]"
              }`}
              aria-hidden
            />
          )}
          <span className="text-[var(--color-text)]">{statusLabel}</span>
        </p>

        <button
          type="button"
          onClick={onScan}
          disabled={scanning || scanLoading}
          className="btn-primary btn-primary-sm shrink-0"
          aria-busy={scanning || scanLoading}
        >
          {scanning || scanLoading ? "Scanning…" : "Scan"}
        </button>
      </div>

      {toast && (
        <p
          className={`text-xs leading-relaxed ${
            isErrorToast ? "text-red-400" : "text-[var(--color-fresh)]"
          }`}
          role="status"
        >
          {toast}
        </p>
      )}
    </div>
  );
}
