const CURSOR_COLORS = [
  "#e74c3c",
  "#3498db",
  "#2ecc71",
  "#f39c12",
  "#9b59b6",
  "#1abc9c",
  "#e67e22",
  "#e84393",
  "#00b894",
  "#6c5ce7",
  "#fd79a8",
  "#00cec9",
];

let colorIndex = 0;

export function getNextCursorColor(): string {
  const color = CURSOR_COLORS[colorIndex % CURSOR_COLORS.length];
  colorIndex++;
  return color;
}
