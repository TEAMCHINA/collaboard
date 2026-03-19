import type { TypedServer } from "./socket/index.js";
import { shouldIncludeCommit } from "shared";

const POLL_INTERVAL = 5 * 60 * 1000;
const GITHUB_URL =
  "https://api.github.com/repos/teamchina/collaboard/commits?per_page=20";

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

async function fetchCommits(io: TypedServer): Promise<void> {
  try {
    const res = await fetch(GITHUB_URL);
    if (!res.ok) return;
    const data = await res.json();

    const filtered = (data as any[])
      .filter((item) => shouldIncludeCommit(item.commit.message));

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
