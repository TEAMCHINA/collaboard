import { useEffect, useRef, useState } from "react";
import { theme } from "../../styles/theme";
import type { BoardElement, StrokeElement, TextElement, ImageElement, RectElement } from "shared";
import { useReplayStore } from "../../store/replay-store";
import { useBoardStore } from "../../store/board-store";
import { useViewportStore } from "../../store/viewport-store";

interface OwnerTagData {
  key: number;
  owner: string;
  x: number;
  y: number;
}

// ─── Layout constants ───────────────────────────────────────────────────────
// All values in px. PLAY_BTN_SCREEN_LEFT is the screen-x of the play button
// (and of the inactive FAB), derived from the pill's left edge + rewind button.
const PILL_LEFT        = 20;
const PILL_HEIGHT      = 48;
const CONTROLS_BOTTOM  = 24;
const REWIND_ML        = 8;   // margin-left on rewind button inside pill
const REWIND_SIZE      = 36;  // rewind button diameter
const PLAY_ML          = 6;   // gap between rewind and play button
const PLAY_BTN_SIZE    = 48;  // play button diameter (= pill height → fills cap)
const PILL_RADIUS      = PILL_HEIGHT / 2;

// Absolute screen-left of the play button (and FAB):
const PLAY_SCREEN_LEFT = PILL_LEFT + REWIND_ML + REWIND_SIZE + PLAY_ML; // 70px
// ────────────────────────────────────────────────────────────────────────────

function elementCenter(el: BoardElement): { x: number; y: number } | null {
  if (el.type === "stroke") {
    const pts = (el as StrokeElement).points;
    if (!pts.length) return null;
    return {
      x: pts.reduce((s, p) => s + p.x, 0) / pts.length,
      y: pts.reduce((s, p) => s + p.y, 0) / pts.length,
    };
  }
  if (el.type === "text") return { x: (el as TextElement).x, y: (el as TextElement).y };
  if (el.type === "image") {
    const img = el as ImageElement;
    return { x: img.x + img.width / 2, y: img.y + img.height / 2 };
  }
  if (el.type === "rect") {
    const r = el as RectElement;
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  }
  return null;
}

function OwnerTag({ owner, x, y }: { owner: string; x: number; y: number }) {
  const [fading, setFading] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setFading(true), 500);
    return () => clearTimeout(t);
  }, []);
  return (
    <div
      style={{
        position: "fixed",
        left: x,
        top: y,
        transform: "translate(-50%, calc(-100% - 6px))",
        background: "rgba(31,41,55,0.88)",
        color: "#fff",
        fontSize: 11,
        fontWeight: 600,
        padding: "3px 8px",
        borderRadius: 4,
        pointerEvents: "none",
        zIndex: 950,
        whiteSpace: "nowrap",
        opacity: fading ? 0 : 1,
        transition: fading ? "opacity 1s ease" : "none",
      }}
    >
      {owner}
    </div>
  );
}

let tagKeyCounter = 0;

export function ReplaySlider() {
  const active   = useReplayStore((s) => s.active);
  const playing  = useReplayStore((s) => s.playing);
  const index    = useReplayStore((s) => s.index);
  const elements = useReplayStore((s) => s.elements);

  const [tags, setTags] = useState<OwnerTagData[]>([]);
  const prevIndexRef = useRef(0);

  const handleEnter = () => {
    const sorted = useBoardStore.getState().getElementsSorted()
      .slice()
      .sort((a, b) => a.createdAt - b.createdAt);
    useReplayStore.getState().enter(sorted);
  };

  const handleExit = () => useReplayStore.getState().exit();

  const handlePlayPause = () => {
    const { index: cur, elements: els, setIndex, setPlaying } = useReplayStore.getState();
    if (cur >= els.length) { setIndex(0); setPlaying(true); }
    else setPlaying(!playing);
  };

  // Auto-play: advance index every 750ms
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      const { index: cur, elements: els, setIndex, setPlaying } = useReplayStore.getState();
      if (cur >= els.length) { setPlaying(false); return; }
      setIndex(cur + 1);
    }, 750);
    return () => clearInterval(id);
  }, [playing]);

  // Show owner tag whenever index advances
  useEffect(() => {
    if (index > prevIndexRef.current && index > 0) {
      const el = elements[index - 1];
      if (el) {
        const center = elementCenter(el);
        if (center) {
          const { panX, panY, scale } = useViewportStore.getState();
          const rect = document.getElementById("canvas-container")?.getBoundingClientRect();
          if (rect) {
            const key = ++tagKeyCounter;
            setTags((prev) => [
              ...prev,
              {
                key,
                owner: el.owner,
                x: rect.left + center.x * scale + panX,
                y: rect.top  + center.y * scale + panY,
              },
            ]);
            setTimeout(() => setTags((prev) => prev.filter((t) => t.key !== key)), 1600);
          }
        }
      }
    }
    prevIndexRef.current = index;
  }, [index, elements]);

  // ── Inactive: single round FAB at the exact position the play button occupies ──
  if (!active) {
    return (
      <button
        onClick={handleEnter}
        title="Replay board history"
        style={{
          position: "fixed",
          left: PLAY_SCREEN_LEFT,
          bottom: CONTROLS_BOTTOM,
          width: PLAY_BTN_SIZE,
          height: PLAY_BTN_SIZE,
          borderRadius: "50%",
          background: theme.overlayBg,
          border: "none",
          color: "#e5e7eb",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 900,
          boxShadow: "0 2px 10px rgba(0,0,0,0.35)",
          padding: 0,
          flexShrink: 0,
        }}
      >
        {/* Material "replay" icon — circular counterclockwise arrow */}
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
        </svg>
      </button>
    );
  }

  const atStart       = index === 0;
  const pillBottom    = CONTROLS_BOTTOM + PILL_HEIGHT + 12;

  return (
    <>
      {tags.map((t) => (
        <OwnerTag key={t.key} owner={t.owner} x={t.x} y={t.y} />
      ))}

      {/* ── "Replaying..." pill — different colour, centered above controls ── */}
      <div
        style={{
          position: "fixed",
          bottom: pillBottom,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 901,
        }}
      >
        <div
          style={{
            background: theme.replayActiveBg,
            color: "#fff",
            padding: "5px 20px",
            borderRadius: 20,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            userSelect: "none",
            whiteSpace: "nowrap",
          }}
        >
          Replay Mode
          <button
            onClick={handleExit}
            style={{
              background: "none",
              border: "none",
              color: "#93c5fd",
              cursor: "pointer",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              padding: "0 0 0 10px",
              textDecoration: "underline",
              textUnderlineOffset: 2,
            }}
          >
            (Stop)
          </button>
        </div>
      </div>

      {/* ── Controls pill — anchored lower-left, spans most of the screen ── */}
      <div
        style={{
          position: "fixed",
          left: PILL_LEFT,
          right: 24,
          bottom: CONTROLS_BOTTOM,
          height: PILL_HEIGHT,
          borderRadius: PILL_RADIUS,
          background: theme.overlayBg,
          display: "flex",
          alignItems: "center",
          boxShadow: "0 4px 14px rgba(0,0,0,0.35)",
          zIndex: 900,
        }}
      >
        {/* ⏮ Rewind — inside pill, left of play */}
        <button
          onClick={() => {
            useReplayStore.getState().setPlaying(false);
            useReplayStore.getState().setIndex(0);
          }}
          title="Rewind to start"
          disabled={atStart}
          style={{
            marginLeft: REWIND_ML,
            width: REWIND_SIZE,
            height: REWIND_SIZE,
            borderRadius: "50%",
            background: "transparent",
            border: "none",
            color: atStart ? "#4b5563" : theme.textMuted,
            cursor: atStart ? "default" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            padding: 0,
          }}
        >
          <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
            <rect x="1" y="2" width="2.5" height="12" rx="1" />
            <path d="M13 2L5.5 8 13 14V2z" />
          </svg>
        </button>

        {/* ▶/⏸ Play — fills pill height, acts as its left cap visually */}
        <button
          onClick={handlePlayPause}
          title={playing ? "Pause" : "Play"}
          style={{
            marginLeft: PLAY_ML,
            width: PLAY_BTN_SIZE,
            height: PLAY_BTN_SIZE,
            borderRadius: "50%",
            background: theme.overlayControlBg,
            border: "none",
            color: "#e5e7eb",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            padding: 0,
          }}
        >
          {playing ? (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <rect x="3" y="2" width="3.5" height="12" rx="1" />
              <rect x="9.5" y="2" width="3.5" height="12" rx="1" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M4 2l10 6-10 6V2z" />
            </svg>
          )}
        </button>

        {/* Slider — body of the pill, extending from the play button */}
        <input
          type="range"
          min={0}
          max={elements.length}
          value={index}
          onChange={(e) => {
            useReplayStore.getState().setPlaying(false);
            useReplayStore.getState().setIndex(Number(e.target.value));
          }}
          style={{
            flex: 1,
            margin: "0 16px",
            accentColor: "#60a5fa",
            cursor: "pointer",
          }}
        />

        {/* Counter */}
        <span
          style={{
            color: theme.textMuted,
            fontSize: 11,
            minWidth: 52,
            textAlign: "center",
            marginRight: 16,
            fontVariantNumeric: "tabular-nums",
            flexShrink: 0,
          }}
        >
          {index} / {elements.length}
        </span>
      </div>
    </>
  );
}
