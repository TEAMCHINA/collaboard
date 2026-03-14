export const TAG_MAP: Record<string, string> = {
  feat: "New feature",
  feature: "New feature",
  fix: "Bug fix",
  bugfix: "Bug fix",
  hotfix: "Bug fix",
  style: "Style",
  refactor: "Refactor",
  perf: "Performance improvement",
  wip: "Work in progress",
};

export function hasKnownTag(message: string): boolean {
  const match = message
    .split("\n")[0]
    .trim()
    .match(/^(\w+)(?:\([^)]+\))?[!]?:/);
  return !!match && match[1].toLowerCase() in TAG_MAP;
}

/** Include if the commit has a known tag, or has no conventional-commit tag at all. */
export function shouldIncludeCommit(message: string): boolean {
  const match = message
    .split("\n")[0]
    .trim()
    .match(/^(\w+)(?:\([^)]+\))?[!]?:/);
  if (!match) return true;
  return match[1].toLowerCase() in TAG_MAP;
}
