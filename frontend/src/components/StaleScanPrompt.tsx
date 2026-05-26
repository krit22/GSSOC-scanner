import { useEffect, useId, useRef } from "react";
import { formatRelativeTime } from "../utils";

type Props = {
  scannedAt: string;
  open: boolean;
  scanning: boolean;
  onScan: () => void;
  onDismiss: () => void;
};

export function StaleScanPrompt({
  scannedAt,
  open,
  scanning,
  onScan,
  onDismiss,
}: Props) {
  const titleId = useId();
  const descId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !scanning) onDismiss();
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onDismiss, scanning]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        aria-label="Dismiss"
        disabled={scanning}
        onClick={() => {
          if (!scanning) onDismiss();
        }}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="card-static relative w-full max-w-md p-5 shadow-2xl sm:p-6"
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onDismiss}
          disabled={scanning}
          className="absolute top-4 right-4 rounded-md p-1 text-[var(--color-muted)] transition hover:bg-[var(--color-elevated)] hover:text-[var(--color-text)] disabled:opacity-50"
          aria-label="Close"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 id={titleId} className="pr-8 text-lg font-semibold text-[var(--color-text)]">
          Time for a fresh scan?
        </h2>

        <p id={descId} className="mt-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">
          The last scan was{" "}
          <strong className="font-medium text-[var(--color-stale)]">
            {formatRelativeTime(scannedAt)}
          </strong>
          . That&apos;s over 30 minutes ago, so these results may be outdated. Run a new scan to
          see the latest unassigned issues.
        </p>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onDismiss}
            disabled={scanning}
            className="btn-ghost w-full sm:w-auto"
          >
            Not now
          </button>
          <button
            type="button"
            onClick={onScan}
            disabled={scanning}
            className="btn-primary btn-primary-sm w-full sm:w-auto"
            aria-busy={scanning}
          >
            {scanning ? "Scanning…" : "Scan now"}
          </button>
        </div>
      </div>
    </div>
  );
}
