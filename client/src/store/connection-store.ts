import { create } from "zustand";
import type { ConnectedUser } from "shared";

interface ConnectionState {
  connected: boolean;
  users: ConnectedUser[];
  setConnected: (connected: boolean) => void;
  setUsers: (users: ConnectedUser[]) => void;
}

export const useConnectionStore = create<ConnectionState>((set) => ({
  connected: false,
  users: [],
  setConnected: (connected: boolean) => set({ connected }),
  setUsers: (users: ConnectedUser[]) => set({ users }),
}));
