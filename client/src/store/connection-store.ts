import { create } from "zustand";
import type { ConnectedUser } from "shared";

interface ConnectionState {
  connected: boolean;
  reconnecting: boolean;
  users: ConnectedUser[];
  setConnected: (connected: boolean) => void;
  setReconnecting: (reconnecting: boolean) => void;
  setUsers: (users: ConnectedUser[]) => void;
}

export const useConnectionStore = create<ConnectionState>((set) => ({
  connected: false,
  reconnecting: false,
  users: [],
  setConnected: (connected: boolean) => set(connected ? { connected, reconnecting: false } : { connected, users: [] }),
  setReconnecting: (reconnecting: boolean) => set({ reconnecting }),
  setUsers: (users: ConnectedUser[]) => set({ users }),
}));
