import { Analytics } from "@vercel/analytics/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  fetchFeed,
  fetchMe,
  fetchScanStatus,
  loginUrl,
  logout,
  triggerScan,
} from "./api";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { IssuesTable } from "./components/IssuesTable";
import { ProgressBar } from "./components/ProgressBar";
import { ScanControls } from "./components/ScanControls";
import { StaleScanPrompt } from "./components/StaleScanPrompt";
import type { Feed, Issue, ScanResponse } from "./types";

const POLL_MS = 2000;

function readAuthToast(): string | null {
  const params = new URLSearchParams(window.location.search);
  const err = params.get("auth_error");
  if (err === "session_lost") {
    return (
      params.get("hint") ??
      "Sign-in session was lost. Open the app at http://localhost:5173 (not 127.0.0.1) and try again."
    );
  }
  if (err === "token_exchange_failed") {
    return "GitHub sign-in failed. Please try again.";
  }
  if (params.get("auth_success") === "1") {
    return "Signed in with GitHub.";
  }
  return null;
}

export default function App() {
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<string | null>(() => readAuthToast());
  const [displayIssues, setDisplayIssues] = useState<Issue[]>([]);
  const [displayScannedAt, setDisplayScannedAt] = useState<string | null>(null);
  const [displayFresh, setDisplayFresh] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [stalePromptDismissed, setStalePromptDismissed] = useState(false);

  useEffect(() => {
    const authToast = readAuthToast();
    if (!window.location.search.includes("auth_")) return;
    window.history.replaceState({}, "", window.location.pathname);
    if (authToast) setToast(authToast);
    void queryClient.invalidateQueries({ queryKey: ["me"] });
  }, [queryClient]);

  const userQuery = useQuery({
    queryKey: ["me"],
    queryFn: fetchMe,
  });

  const feedQuery = useQuery({
    queryKey: ["feed"],
    queryFn: fetchFeed,
    refetchInterval: isPolling ? POLL_MS : false,
  });

  const statusQuery = useQuery({
    queryKey: ["scanStatus"],
    queryFn: fetchScanStatus,
    enabled: isPolling,
    refetchInterval: isPolling ? POLL_MS : false,
  });

  const applyFeed = (feed: Feed) => {
    if (feed.status === "scanning") return;
    setDisplayIssues(feed.issues);
    setDisplayScannedAt(feed.scanned_at);
    setDisplayFresh(feed.is_fresh);
  };

  useEffect(() => {
    if (feedQuery.data) applyFeed(feedQuery.data);
  }, [feedQuery.data]);

  useEffect(() => {
    if (feedQuery.data?.status === "scanning") setIsPolling(true);
  }, [feedQuery.data?.status]);

  useEffect(() => {
    const status = statusQuery.data?.status;
    if (status === "ready") {
      setIsPolling(false);
      setToast(null);
      void queryClient.invalidateQueries({ queryKey: ["feed"] });
    }
    if (status === "error") {
      setIsPolling(false);
      setToast(statusQuery.data?.error ?? "Scan failed");
    }
  }, [statusQuery.data, queryClient]);

  const scanMutation = useMutation({
    mutationFn: () => triggerScan(false),
    onSuccess: (data: ScanResponse) => {
      if (data.status === "ready" && data.cached) {
        setDisplayIssues(data.issues ?? []);
        setDisplayScannedAt(data.scanned_at ?? null);
        setDisplayFresh(true);
        setToast("Showing results from the last scan (still fresh).");
        void queryClient.invalidateQueries({ queryKey: ["feed"] });
        return;
      }
      if (data.status === "scanning") {
        setToast(null);
        setIsPolling(true);
        void queryClient.invalidateQueries({ queryKey: ["scanStatus"] });
      }
    },
    onError: (e: Error) => {
      setToast(e.message);
      setIsPolling(false);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["me"] }),
  });

  const scanning =
    isPolling ||
    feedQuery.data?.status === "scanning" ||
    statusQuery.data?.status === "scanning" ||
    scanMutation.isPending;

  const progress = statusQuery.data;

  const showStalePrompt =
    !stalePromptDismissed &&
    !scanning &&
    displayScannedAt != null &&
    !displayFresh &&
    feedQuery.isSuccess &&
    feedQuery.data?.status === "ready";

  const handleStalePromptScan = () => {
    setStalePromptDismissed(true);
    scanMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Header
        user={userQuery.data}
        onLogin={() => {
          window.location.href = loginUrl();
        }}
        onLogout={() => logoutMutation.mutate()}
        loggingOut={logoutMutation.isPending}
      />

      <Hero issues={displayIssues} hasScanned={displayScannedAt != null} />

      <main className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
        <ScanControls
          scannedAt={displayScannedAt}
          isFresh={displayFresh}
          issueCount={displayIssues.length}
          scanning={scanning}
          scanLoading={scanMutation.isPending}
          onScan={() => scanMutation.mutate()}
          toast={toast}
        />

        {scanning && progress && progress.status === "scanning" && (
          <ProgressBar
            reposDone={progress.repos_done}
            reposTotal={progress.repos_total}
            currentRepo={progress.current_repo}
            issuesFound={progress.issues_found}
          />
        )}

        {feedQuery.isError && (
          <div
            className="card-static border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-300"
            role="alert"
          >
            Could not load feed. Is the API running on port 8000?
          </div>
        )}

        <IssuesTable issues={displayIssues} />
      </main>

      <footer className="mx-auto max-w-7xl px-4 pb-10 pt-2 text-center text-xs text-[var(--color-muted)] sm:px-6 lg:px-8">
        Results are shared across users for ~30 minutes after each scan.
      </footer>

      {displayScannedAt && (
        <StaleScanPrompt
          scannedAt={displayScannedAt}
          open={showStalePrompt}
          scanning={scanning}
          onScan={handleStalePromptScan}
          onDismiss={() => setStalePromptDismissed(true)}
        />
      )}

      <Analytics />
    </div>
  );
}
