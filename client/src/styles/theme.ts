export const theme = {
  // Surfaces
  overlayBg: "#1f2937",        // dark panel/pill bg — NewsTab handle, ReplaySlider controls
  overlayControlBg: "#374151", // slightly lighter within dark overlay — ReplaySlider play button
  replayActiveBg: "#1d4ed8",   // replay mode active indicator pill
  toolbarBg: "#f9fafb",        // toolbar background

  // Borders & dividers
  borderSubtle: "#e5e7eb",     // panel borders, section dividers
  borderControl: "#d1d5db",    // button borders, toolbar dividers

  // Accent
  accentBlue: "#2563eb",       // primary action blue — active tool, links, text input border

  // Text
  textPrimary: "#111827",      // headings, primary content
  textSecondary: "#374151",    // labels, toolbar text
  textMuted: "#9ca3af",        // dates, secondary info, counter text

  // Status
  statusOnline: "#16a34a",     // connected / success
  statusOffline: "#dc2626",    // disconnected / error / destructive
} as const;
