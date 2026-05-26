import type { Issue } from "../types";

type Props = {
  issues: Issue[];
  hasScanned: boolean;
};

function formatStat(value: number): string {
  return value.toLocaleString();
}

function countUniqueRepos(issues: Issue[]): number {
  return new Set(issues.map((i) => i.repo)).size;
}

function countGoodFirstIssues(issues: Issue[]): number {
  return issues.filter((issue) =>
    issue.labels.some((label) => /good[- ]?first|beginner|starter|easy/i.test(label)),
  ).length;
}

export function Hero({ issues, hasScanned }: Props) {
  const repoCount = countUniqueRepos(issues);
  const issueCount = issues.length;
  const goodFirstCount = countGoodFirstIssues(issues);

  const stats = [
    {
      value: hasScanned ? formatStat(repoCount) : "—",
      label: "Repositories",
      accent: "teal" as const,
    },
    {
      value: hasScanned ? formatStat(issueCount) : "—",
      label: "Unassigned issues",
      accent: "white" as const,
    },
    {
      value: hasScanned ? formatStat(goodFirstCount) : "—",
      label: "Good first issues",
      accent: "green" as const,
    },
  ];

  return (
    <section className="hero-section relative overflow-hidden border-b border-[var(--color-border-subtle)]">
      <div className="hero-grid pointer-events-none absolute inset-0" aria-hidden />

      <div className="relative mx-auto max-w-4xl px-4 py-12 text-center sm:px-6 sm:py-16 lg:py-20">
        <div className="hero-badge mx-auto inline-flex items-center gap-2 rounded-full border border-[var(--color-hero-teal)]/40 bg-[var(--color-hero-teal)]/10 px-4 py-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-hero-teal)]" aria-hidden />
          <span className="text-xs font-semibold tracking-widest text-[var(--color-hero-teal)] uppercase">
            GSSoC 2026 · Unassigned issues
          </span>
        </div>

        <h1 className="mt-8 text-4xl font-bold tracking-tight text-[var(--color-text)] sm:text-5xl lg:text-6xl">
          Find your next
          <br />
          <span className="text-[var(--color-hero-teal)]">unassigned issue quickly</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-[var(--color-text-secondary)] sm:text-lg">
          Stop scrolling through hundreds of repos on GitHub.{" "}
          <strong className="font-medium text-[var(--color-text)]">
            One scan surfaces unassigned issues
          </strong>{" "}
          — grouped by project so you can pick one and start contributing in minutes.
        </p>

        <div className="hero-stats mx-auto mt-10 grid max-w-2xl grid-cols-3 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-card)]/80 backdrop-blur-sm">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className={`px-3 py-5 sm:px-6 sm:py-6 ${
                index > 0 ? "border-l border-[var(--color-border-subtle)]" : ""
              }`}
            >
              <p
                className={`text-2xl font-bold tabular-nums sm:text-3xl ${
                  stat.accent === "teal"
                    ? "text-[var(--color-hero-teal)]"
                    : stat.accent === "green"
                      ? "text-[var(--color-open)]"
                      : "text-[var(--color-text)]"
                }`}
              >
                {stat.value}
              </p>
              <p className="mt-1 text-[10px] font-semibold tracking-wider text-[var(--color-muted)] uppercase sm:text-xs">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {!hasScanned && (
          <p className="mt-4 text-sm text-[var(--color-muted)]">
            Sign in and run a scan below to populate these numbers.
          </p>
        )}
      </div>
    </section>
  );
}
