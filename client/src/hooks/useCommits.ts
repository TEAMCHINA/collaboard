import { useEffect } from "react";
import { create } from "zustand";
import { TAG_MAP } from "shared";
import { socket } from "../socket/socket-client";

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

const SEEN_KEY = "collaboard_seen_sha";

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

async function fetchFromServer(): Promise<void> {
  const res = await fetch("/api/commits");
  const raw = await res.json();
  const commits: Commit[] = (raw as any[]).map((item) => ({
    sha: item.sha,
    message: parseMessage(item.message),
    date: relativeDate(item.date),
    url: item.url,
  }));
  useCommitStore.getState().setCommits(commits);
}

export function useCommits() {
  const commits = useCommitStore((s) => s.commits);
  const loading = useCommitStore((s) => s.loading);
  const hasNew = useCommitStore((s) => s.hasNew);

  useEffect(() => {
    if (fetchInitiated) return;
    fetchInitiated = true;

    const store = useCommitStore.getState();
    store.setLoading(true);
    fetchFromServer()
      .then(() => {
        const sha = useCommitStore.getState().commits[0]?.sha;
        store.setHasNew(!!sha && sha !== loadSeenSha());
      })
      .finally(() => store.setLoading(false));

    const handler = () => {
      fetchFromServer().then(() => useCommitStore.getState().setHasNew(true));
    };
    socket.on("commits:updated", handler);
    return () => {
      socket.off("commits:updated", handler);
    };
  }, []);

  const markSeen = () => {
    const sha = useCommitStore.getState().commits[0]?.sha;
    if (sha) {
      try {
        localStorage.setItem(SEEN_KEY, sha);
      } catch {}
      useCommitStore.getState().setHasNew(false);
    }
  };

  return { commits, loading, hasNew, markSeen };
}
