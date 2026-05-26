import type { User } from "../types";

type Props = {
  user: User | null | undefined;
  onLogin: () => void;
  onLogout: () => void;
  loggingOut: boolean;
};

export function Header({ user, onLogin, onLogout, loggingOut }: Props) {
  return (
    <header className="border-b border-[var(--color-border)] bg-[var(--color-panel)]/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
            GSSoC Issue Finder
          </h1>
          <p className="mt-0.5 text-sm text-[var(--color-muted)]">
            Open, unassigned issues with zero comments
          </p>
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
              <span className="hidden text-sm text-slate-300 sm:inline">
                @{user.login}
              </span>
              <button
                type="button"
                onClick={onLogout}
                disabled={loggingOut}
                className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white disabled:opacity-50"
              >
                Sign out
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onLogin}
              className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-orange-900/30 transition hover:bg-[var(--color-accent-dim)]"
            >
              Sign in with GitHub
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
