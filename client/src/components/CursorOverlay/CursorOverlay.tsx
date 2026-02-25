import { useRef } from "react";
import { useCursorStore } from "../../store/cursor-store";
import { useViewportStore } from "../../store/viewport-store";

const EDGE_MARGIN = 32;

// Speech-bubble arrow dimensions
const ARROW_D = 9;   // how far the tip extends beyond the pill edge
const ARROW_W = 11;  // width of the arrow base

// Pill dimensions
const PILL_H     = 24;
const PILL_PAD_X = 10;
const FONT_SIZE  = 11;
const AVG_CHAR_W = 6.6; // approximate for 11px bold system-ui

// Extra SVG padding so the arrow tip never clips the element bounds
const SVG_PAD = ARROW_D + 8;

/** Cast a ray from viewport center toward (sx, sy) and return the intersection
 *  with the inset rectangle plus the ray angle. */
function getEdgeIndicator(
  sx: number,
  sy: number,
  width: number,
  height: number,
): { x: number; y: number; angle: number } {
  const cx = width / 2;
  const cy = height / 2;
  const dx = sx - cx;
  const dy = sy - cy;
  const angle = Math.atan2(dy, dx);
  const hw = width  / 2 - EDGE_MARGIN;
  const hh = height / 2 - EDGE_MARGIN;
  const scaleX = Math.abs(dx) > 1e-9 ? hw / Math.abs(dx) : Infinity;
  const scaleY = Math.abs(dy) > 1e-9 ? hh / Math.abs(dy) : Infinity;
  const s = Math.min(scaleX, scaleY);
  return { x: cx + dx * s, y: cy + dy * s, angle };
}

/** A speech-bubble pill whose arrow tip points toward the off-screen cursor. */
function EdgeIndicator({
  name, color, ex, ey, angle,
}: {
  name: string; color: string; ex: number; ey: number; angle: number;
}) {
  const pillW = Math.max(name.length * AVG_CHAR_W + PILL_PAD_X * 2, 32);
  const hw = pillW / 2;
  const hh = PILL_H / 2;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  // Distance from pill center to its perimeter along `angle`
  const perimScale = Math.min(
    Math.abs(cos) > 1e-9 ? hw / Math.abs(cos) : Infinity,
    Math.abs(sin) > 1e-9 ? hh / Math.abs(sin) : Infinity,
  );

  // Pill center: back off from the arrow tip so the tip lands at (ex, ey)
  const pillCX = ex - cos * (perimScale + ARROW_D);
  const pillCY = ey - sin * (perimScale + ARROW_D);

  // Arrow vertices in pill-centered SVG coordinates
  // Base centre on pill perimeter; base wings along the perpendicular; tip at ARROW_D beyond
  const bx = cos * perimScale;        // base centre x
  const by = sin * perimScale;        // base centre y
  const tipX = cos * (perimScale + ARROW_D);
  const tipY = sin * (perimScale + ARROW_D);
  const wx = -sin * (ARROW_W / 2);   // wing offset x  (perp to angle)
  const wy =  cos * (ARROW_W / 2);   // wing offset y

  const svgW = pillW + SVG_PAD * 2;
  const svgH = PILL_H  + SVG_PAD * 2;
  const ocx  = svgW / 2;
  const ocy  = svgH / 2;

  return (
    <svg
      width={svgW}
      height={svgH}
      viewBox={`${-ocx} ${-ocy} ${svgW} ${svgH}`}
      style={{
        position: "absolute",
        left: pillCX - ocx,
        top:  pillCY - ocy,
        filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.22))",
        transition: "left 50ms linear, top 50ms linear",
        pointerEvents: "none",
        overflow: "visible",
      }}
    >
      {/* Arrow drawn first; pill body covers the base for a clean seam */}
      <polygon
        points={`${bx + wx},${by + wy} ${bx - wx},${by - wy} ${tipX},${tipY}`}
        fill={color}
      />
      {/* Pill body */}
      <rect
        x={-hw} y={-hh}
        width={pillW} height={PILL_H}
        rx={hh} ry={hh}
        fill={color}
      />
      {/* Name */}
      <text
        x={0}
        y={FONT_SIZE / 2 - 1}
        textAnchor="middle"
        fill="white"
        fontSize={FONT_SIZE}
        fontWeight="600"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        {name}
      </text>
    </svg>
  );
}

export function CursorOverlay() {
  const cursors = useCursorStore((s) => s.cursors);
  const { panX, panY, scale } = useViewportStore((s) => s);
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={containerRef}
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 1000,
      }}
    >
      {Array.from(cursors.entries()).map(([name, { x, y, color }]) => {
        const sx = x * scale + panX;
        const sy = y * scale + panY;
        const width  = containerRef.current?.clientWidth  ?? window.innerWidth;
        const height = containerRef.current?.clientHeight ?? window.innerHeight;
        const inView = sx >= 0 && sx <= width && sy >= 0 && sy <= height;

        if (inView) {
          return (
            <div
              key={name}
              style={{
                position: "absolute",
                left: sx,
                top: sy,
                transform: "translate(-2px, -2px)",
                transition: "left 50ms linear, top 50ms linear",
              }}
            >
              <svg width="16" height="20" viewBox="0 0 16 20" fill="none">
                <path
                  d="M0 0L16 12L8 12L6 20L0 0Z"
                  fill={color}
                  stroke="white"
                  strokeWidth="1"
                />
              </svg>
              <span style={{
                position: "absolute",
                left: 14,
                top: 12,
                background: color,
                color: "white",
                padding: "2px 6px",
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 600,
                whiteSpace: "nowrap",
                lineHeight: 1.2,
              }}>
                {name}
              </span>
            </div>
          );
        }

        const { x: ex, y: ey, angle } = getEdgeIndicator(sx, sy, width, height);
        return (
          <EdgeIndicator
            key={name}
            name={name}
            color={color}
            ex={ex}
            ey={ey}
            angle={angle}
          />
        );
      })}
    </div>
  );
}
