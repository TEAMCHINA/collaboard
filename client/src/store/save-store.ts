import { create } from "zustand";

export type SaveDisplay = "idle" | "saving" | "saved" | "error";

const MIN_SAVING_DISPLAY_MS = 600;
const SAVED_DISPLAY_MS = 3000;
const ERROR_DISPLAY_MS = 8000;

interface SaveState {
  display: SaveDisplay;
  errorMessage: string | null;
}

interface SaveStoreState extends SaveState {
  onSaveStart: () => void;
  onSaveEnd: () => void;
  onSaveError: (message: string) => void;
}

let savingShownAt = 0;
let pendingTimer: ReturnType<typeof setTimeout> | null = null;

function clearPending() {
  if (pendingTimer) {
    clearTimeout(pendingTimer);
    pendingTimer = null;
  }
}

export const useSaveStore = create<SaveStoreState>((set) => ({
  display: "idle",
  errorMessage: null,

  onSaveStart: () => {
    clearPending();
    savingShownAt = Date.now();
    set({ display: "saving", errorMessage: null });
  },

  onSaveEnd: () => {
    clearPending();
    const elapsed = Date.now() - savingShownAt;
    const remaining = MIN_SAVING_DISPLAY_MS - elapsed;

    const showSaved = () => {
      set({ display: "saved", errorMessage: null });
      pendingTimer = setTimeout(() => {
        set({ display: "idle", errorMessage: null });
      }, SAVED_DISPLAY_MS);
    };

    if (remaining > 0) {
      // Buffer: keep "Saving..." visible for minimum duration before transitioning
      pendingTimer = setTimeout(showSaved, remaining);
    } else {
      showSaved();
    }
  },

  onSaveError: (message: string) => {
    clearPending();
    const elapsed = Date.now() - savingShownAt;
    const remaining = MIN_SAVING_DISPLAY_MS - elapsed;

    const showError = () => {
      set({ display: "error", errorMessage: message });
      pendingTimer = setTimeout(() => {
        set({ display: "idle", errorMessage: null });
      }, ERROR_DISPLAY_MS);
    };

    if (remaining > 0) {
      pendingTimer = setTimeout(showError, remaining);
    } else {
      showError();
    }
  },
}));
