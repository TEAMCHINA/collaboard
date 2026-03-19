import { useCommits } from "../../hooks/useCommits";
import { theme } from "../../styles/theme";

const SEE_ALL_URL = "https://github.com/teamchina/collaboard/commits/main";

export function PatchNotes() {
  const { commits, loading } = useCommits();

  if (loading && commits.length === 0) return null;

  return (
    <div style={{ width: 340, textAlign: "left" }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: theme.textPrimary, marginBottom: 10 }}>
        What's new
      </div>

      {commits.slice(0, 7).map((c) => (
        <div key={c.sha} style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <a
              href={c.url}
              target="_blank"
              rel="noreferrer"
              style={{
                fontFamily: "monospace",
                fontSize: 11,
                color: theme.textMuted,
                textDecoration: "none",
                flexShrink: 0,
              }}
            >
              {c.sha.slice(0, 7)}
            </a>
            <span style={{ fontSize: 13, color: theme.textPrimary }}>{c.message}</span>
          </div>
          <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 2, paddingLeft: 52 }}>
            {c.date}
          </div>
        </div>
      ))}

      <div style={{ borderTop: `1px solid ${theme.borderSubtle}`, marginTop: 4, paddingTop: 8 }}>
        <a
          href={SEE_ALL_URL}
          target="_blank"
          rel="noreferrer"
          style={{ fontSize: 12, color: theme.accentBlue, textDecoration: "none" }}
        >
          See all on GitHub →
        </a>
      </div>
    </div>
  );
}
