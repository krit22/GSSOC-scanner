import type { User } from "../types";

type Props = {
  user: User | null | undefined;
  onLogin: () => void;
  onLogout: () => void;
  loggingOut: boolean;
};

export function Header({ user, onLogin, onLogout, loggingOut }: Props) {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface)]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-accent-muted)] text-[var(--color-accent)]"
            aria-hidden
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <div>
            <p className="text-lg font-bold tracking-tight text-[var(--color-text)] sm:text-xl">
              GSSoC Issue Finder
            </p>
            <p className="hidden text-xs text-[var(--color-muted)] sm:block">
              Unassigned issues
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {user ? (
            <>
              {user.avatar_url && (
                <img
                  src={user.avatar_url}
                  alt=""
                  className="h-9 w-9 rounded-full ring-2 ring-[var(--color-border)]"
                />
              )}
              <span className="hidden text-sm text-[var(--color-text-secondary)] sm:inline">
                @{user.login}
              </span>
              <button
                type="button"
                onClick={onLogout}
                disabled={loggingOut}
                className="btn-ghost py-2 text-sm disabled:opacity-50"
              >
                Sign out
              </button>
            </>
          ) : (
            <button type="button" onClick={onLogin} className="btn-primary py-2">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.27.825-.585 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.585A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              Sign in with GitHub
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
