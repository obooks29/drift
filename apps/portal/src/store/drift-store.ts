/**
 * Drift Zustand Store
 * Global client-side state for the portal
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { LiveLedgerEntry } from "../hooks/useLedgerStream";

interface DriftState {
  // Live ledger entries (from WebSocket)
  liveEntries: LiveLedgerEntry[];
  addLiveEntry: (entry: LiveLedgerEntry) => void;
  clearLiveEntries: () => void;

  // UI preferences
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;

  // Selected agent (for detail view)
  selectedAgentId: string | null;
  setSelectedAgent: (id: string | null) => void;

  // Alert: pending CIBA count
  pendingCIBACount: number;
  setPendingCIBACount: (n: number) => void;

  // Theme
  theme: "dark" | "light";
  setTheme: (t: "dark" | "light") => void;
}

export const useDriftStore = create<DriftState>()(
  persist(
    (set) => ({
      liveEntries: [],
      addLiveEntry: (entry) =>
        set((s) => ({ liveEntries: [entry, ...s.liveEntries].slice(0, 200) })),
      clearLiveEntries: () => set({ liveEntries: [] }),

      sidebarCollapsed: false,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

      selectedAgentId: null,
      setSelectedAgent: (id) => set({ selectedAgentId: id }),

      pendingCIBACount: 0,
      setPendingCIBACount: (n) => set({ pendingCIBACount: n }),

      theme: "dark",
      setTheme: (t) => set({ theme: t }),
    }),
    {
      name: "drift-portal-state",
      partialize: (s) => ({ sidebarCollapsed: s.sidebarCollapsed, theme: s.theme }),
    }
  )
);
