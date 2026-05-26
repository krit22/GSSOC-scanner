export type User = {
  login: string;
  avatar_url: string | null;
};

export type Issue = {
  repo: string;
  number: number;
  title: string;
  url: string;
  labels: string[];
  author: string;
  created_at: string;
};

export type RepoSummary = {
  repo: string;
  issue_count: number;
};

export type Feed = {
  scanned_at: string | null;
  is_fresh: boolean;
  status: string;
  repos: RepoSummary[];
  issues: Issue[];
  issues_found: number;
};

export type ScanStatus = {
  status: "idle" | "scanning" | "ready" | "error" | string;
  scan_id: string | null;
  repos_done: number;
  repos_total: number;
  current_repo: string | null;
  issues_found: number;
  scanned_at: string | null;
  error: string | null;
};

export type ScanResponse = {
  status: string;
  cached?: boolean;
  scanned_at?: string | null;
  repos?: RepoSummary[];
  issues?: Issue[];
  scan_id?: string | null;
  message?: string;
  progress?: {
    repos_done: number;
    repos_total: number;
    current_repo: string | null;
    issues_found: number;
  };
};
