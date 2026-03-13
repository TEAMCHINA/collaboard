import { useEffect } from "react";
import { create } from "zustand";

export interface Commit {
  sha: string;
  message: string;
  date: string;
  url: string;
}

interface CommitStore {
  commits: Commit[];
  loading: boolean;
  hasNew: boolean;
  setCommits: (commits: Commit[]) => void;
  setLoading: (v: boolean) => void;
  setHasNew: (v: boolean) => void;
}

const CACHE_KEY = "collaboard_commits";
const SEEN_KEY = "collaboard_seen_sha";
const CACHE_TTL = 3_600_000; // 1 hour
const API_URL = "https://api.github.com/repos/teamchina/collaboard/commits?per_page=5";

const TAG_MAP: Record<string, string> = {
  feat: "New feature",
  feature: "New feature",
  fix: "Bug fix",
  bugfix: "Bug fix",
  hotfix: "Bug fix",
  docs: "Documentation",
  doc: "Documentation",
  style: "Style",
  refactor: "Refactor",
  perf: "Performance improvement",
  test: "Tests",
  tests: "Tests",
  chore: "Chore",
  ci: "CI",
  build: "Build",
  revert: "Revert",
  wip: "Work in progress",
};

function parseMessage(raw: string): string {
  const first = raw.split("\n")[0].trim();
  const match = first.match(/^(\w+)(?:\(([^)]+)\))?[!]?:\s*(.+)$/);
  if (!match) return first;
  const [, tag, scope, description] = match;
  const label = TAG_MAP[tag.toLowerCase()];
  if (!label) return first;
  return scope ? `${label} (${scope}): ${description}` : `${label}: ${description}`;
}

function relativeDate(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days <= 30) return `${days} days ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

interface CacheEntry {
  commits: Commit[];
  fetchedAt: number;
  latestSha: string;
}

function loadCache(): CacheEntry | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveCache(entry: CacheEntry): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {}
}

function loadSeenSha(): string {
  return localStorage.getItem(SEEN_KEY) ?? "";
}

const useCommitStore = create<CommitStore>((set) => ({
  commits: [],
  loading: false,
  hasNew: false,
  setCommits: (commits) => set({ commits }),
  setLoading: (v) => set({ loading: v }),
  setHasNew: (v) => set({ hasNew: v }),
}));

// Module-level flag — prevents double-fetch when multiple components call useCommits()
let fetchInitiated = false;

async function fetchAndUpdate(): Promise<void> {
  const store = useCommitStore.getState();
  const cache = loadCache();
  try {
    const res = await fetch(API_URL);
    if (!res.ok) return;
    const data = await res.json();
    const latestSha: string = data[0]?.sha ?? "";

    if (cache && latestSha === cache.latestSha) {
      // No new commits — just bump the TTL
      saveCache({ ...cache, fetchedAt: Date.now() });
      return;
    }

    const commits: Commit[] = data.map((item: any) => ({
      sha: item.sha as string,
      message: parseMessage(item.commit.message as string),
      date: relativeDate(item.commit.author.date as string),
      url: item.html_url as string,
    }));

    saveCache({ commits, fetchedAt: Date.now(), latestSha });
    store.setCommits(commits);
    store.setHasNew(latestSha !== loadSeenSha());
  } catch {
    // silent fail — keep whatever is in the store already
  }
}

export function useCommits() {
  const commits = useCommitStore((s) => s.commits);
  const loading = useCommitStore((s) => s.loading);
  const hasNew = useCommitStore((s) => s.hasNew);

  useEffect(() => {
    if (fetchInitiated) return;
    fetchInitiated = true;

    const store = useCommitStore.getState();
    const cache = loadCache();

    if (cache) {
      store.setCommits(cache.commits);
      store.setHasNew(cache.latestSha !== loadSeenSha());
    } else {
      store.setLoading(true);
    }

    const shouldFetch = !cache || Date.now() - cache.fetchedAt > CACHE_TTL;
    if (shouldFetch) {
      fetchAndUpdate().finally(() => store.setLoading(false));
    }

    const interval = setInterval(fetchAndUpdate, CACHE_TTL);
    return () => clearInterval(interval);
  }, []);

  const markSeen = () => {
    const sha = useCommitStore.getState().commits[0]?.sha;
    if (sha) {
      try { localStorage.setItem(SEEN_KEY, sha); } catch {}
      useCommitStore.getState().setHasNew(false);
    }
  };

  return { commits, loading, hasNew, markSeen };
}
