import type { TypedServer } from "./socket/index.js";
import { shouldIncludeCommit } from "shared";

const POLL_INTERVAL = 5 * 60 * 1000;
const GITHUB_BASE = "https://api.github.com/repos/teamchina/collaboard";
const GITHUB_URL = `${GITHUB_BASE}/commits?per_page=50`;

interface RawCommit {
  sha: string;
  message: string;
  date: string;
  url: string;
}

let cache: RawCommit[] = [];
let latestSha = "";
let booted = false;

export function getCommits(): RawCommit[] {
  return cache;
}

export function startCommitPoller(io: TypedServer): void {
  fetchCommits(io);
  setInterval(() => fetchCommits(io), POLL_INTERVAL);
}

async function resolveTagSha(tag: string): Promise<string | null> {
  const res = await fetch(`${GITHUB_BASE}/git/ref/tags/${tag}`);
  if (!res.ok) return null;
  const data = await res.json();
  // Lightweight tag → commit SHA directly; annotated tag → tag object SHA, need one more hop
  if (data.object.type === "commit") return data.object.sha;
  const tagRes = await fetch(`${GITHUB_BASE}/git/tags/${data.object.sha}`);
  if (!tagRes.ok) return null;
  const tagData = await tagRes.json();
  return tagData.object.sha ?? null;
}

async function fetchCommits(io: TypedServer): Promise<void> {
  try {
    const res = await fetch(GITHUB_URL);
    if (!res.ok) return;
    const data = await res.json();

    const appVersion = process.env.APP_VERSION ?? "dev";
    let commits: any[] = data as any[];

    if (appVersion !== "dev") {
      const tagSha = await resolveTagSha(appVersion);
      const cutoff = tagSha ? commits.findIndex((item) => item.sha === tagSha) : -1;
      if (cutoff === -1) {
        cache = [];
        latestSha = "";
        booted = true;
        return;
      }
      commits = commits.slice(cutoff);
    }

    const filtered = commits.filter((item) => shouldIncludeCommit(item.commit.message));

    const newSha: string = filtered[0]?.sha ?? "";
    if (newSha === latestSha) {
      booted = true;
      return;
    }

    cache = filtered.map((item) => ({
      sha: item.sha,
      message: item.commit.message.split("\n")[0].trim(),
      date: item.commit.author.date,
      url: item.html_url,
    }));
    latestSha = newSha;
    if (booted) io.emit("commits:updated");
    booted = true;
  } catch {
    /* silent fail */
  }
}
