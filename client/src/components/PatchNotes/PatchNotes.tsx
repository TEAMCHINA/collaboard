import { useCommits } from "../../hooks/useCommits";

const SEE_ALL_URL = "https://github.com/teamchina/collaboard/commits/main";

export function PatchNotes() {
  const { commits, loading } = useCommits();

  if (loading && commits.length === 0) return null;

  return (
    <div style={{ width: 340, textAlign: "left" }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: "#111827", marginBottom: 10 }}>
        What's new
      </div>

      {commits.slice(0, 5).map((c) => (
        <div key={c.sha} style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <a
              href={c.url}
              target="_blank"
              rel="noreferrer"
              style={{
                fontFamily: "monospace",
                fontSize: 11,
                color: "#6b7280",
                textDecoration: "none",
                flexShrink: 0,
              }}
            >
              {c.sha.slice(0, 7)}
            </a>
            <span style={{ fontSize: 13, color: "#111827" }}>{c.message}</span>
          </div>
          <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2, paddingLeft: 52 }}>
            {c.date}
          </div>
        </div>
      ))}

      <div style={{ borderTop: "1px solid #e5e7eb", marginTop: 4, paddingTop: 8 }}>
        <a
          href={SEE_ALL_URL}
          target="_blank"
          rel="noreferrer"
          style={{ fontSize: 12, color: "#2563eb", textDecoration: "none" }}
        >
          See all on GitHub →
        </a>
      </div>
    </div>
  );
}
