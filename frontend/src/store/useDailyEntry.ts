import { api } from "@/convex/_generated/api";
import { convex } from "@/providers/ClerkAndConvexProvider";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { mmkvStorage } from "./storage";

export interface SaleItem {
  id: string;
  title: string;
  quantity: number;
  price: number;
  total: number;
}

export interface DebtRecord {
  id: string;
  customerId?: string;
  customerName?: string;
  items: SaleItem[];
  totalOwed: number;
}

export interface DailyEntry {
  id: string;
  date: string;
  sales: SaleItem[];
  debts: DebtRecord[];
  closed: boolean;
  totals: {
    salesTotal: number;
    debtsTotal: number;
  };
}

interface DailyState {
  entries: DailyEntry[];
  currentEntry: DailyEntry | null;

  // Actions
  startNewDay: () => Promise<void>;
  addSale: (item: SaleItem) => Promise<void>;
  addDebt: (debt: DebtRecord) => Promise<void>;
  closeDay: () => Promise<void>;
  reopenDay: () => Promise<void>;
  resetData: () => Promise<void>;
  syncFromConvex: () => Promise<void>;
  fetchTodayEntry: () => Promise<void>;
  isDayOpen: () => boolean;
}

function sanitizeRemoteEntry(raw: any): DailyEntry {
  // remove Convex system fields and normalize shape
  const { _id, _creationTime, ...rest } = raw || {};
  const id = rest.id ?? _id ?? Math.random().toString();
  return {
    id,
    date: rest.date ?? new Date().toISOString().split("T")[0],
    sales: Array.isArray(rest.sales) ? rest.sales : [],
    debts: Array.isArray(rest.debts) ? rest.debts : [],
    closed: !!rest.closed,
    totals:
      rest.totals && typeof rest.totals === "object"
        ? rest.totals
        : { salesTotal: 0, debtsTotal: 0 },
  };
}

export const useDailyEntryStore = create<DailyState>()(
  persist(
    (set, get) => ({
      entries: [],
      currentEntry: null,

      // 🗓️ Start a new daily entry
      startNewDay: async () => {
        const date = new Date().toISOString().split("T")[0];
        const existing = get().entries.find((e) => e.date === date);

        if (existing) {
          set({ currentEntry: existing });
          return;
        }

        const newEntry: DailyEntry = {
          id: Math.random().toString(),
          date,
          sales: [],
          debts: [],
          closed: false,
          totals: { salesTotal: 0, debtsTotal: 0 },
        };

        set((state) => ({
          entries: [...state.entries, newEntry],
          currentEntry: newEntry,
        }));

        try {
          // send sanitized payload (no _id/_creationTime)
          await convex.mutation(api.dailyEntries.upsert, newEntry);
        } catch (err) {
          console.warn("Convex sync failed (startNewDay):", err);
        }
      },

      // ♻️ Reopen the day
      reopenDay: async () => {
        const current = get().currentEntry;
        if (!current) return;

        const reopenedEntry = { ...current, closed: false };

        set((state) => ({
          currentEntry: reopenedEntry,
          entries: state.entries.map((e) =>
            e.id === current.id ? reopenedEntry : e
          ),
        }));

        try {
          await convex.mutation(api.dailyEntries.upsert, reopenedEntry);
        } catch (err) {
          console.warn("Convex sync failed (reopenDay):", err);
        }
      },

      // 🧹 Clear local data (testing)
      resetData: async () => {
        set({ entries: [], currentEntry: null });
        try {
          mmkvStorage.clearAll();
          console.log("✅ Local data cleared successfully.");
        } catch (err) {
          console.warn("⚠️ Failed to clear local storage:", err);
        }
      },

      // 🛒 Add sale
      addSale: async (item: SaleItem) => {
        const current = get().currentEntry;
        if (!current || current.closed) return;

        const updatedSales = [...current.sales, item];
        const updatedTotals = {
          ...current.totals,
          salesTotal: updatedSales.reduce((sum, s) => sum + s.total, 0),
        };

        const updatedEntry: DailyEntry = {
          ...current,
          sales: updatedSales,
          totals: updatedTotals,
        };

        set((state) => ({
          currentEntry: updatedEntry,
          entries: state.entries.map((e) =>
            e.id === current.id ? updatedEntry : e
          ),
        }));

        try {
          await convex.mutation(api.dailyEntries.upsert, updatedEntry);
        } catch (err) {
          console.warn("Convex sync failed (addSale):", err);
        }
      },

      // 💸 Add debt
      addDebt: async (debt: DebtRecord) => {
        const current = get().currentEntry;
        if (!current || current.closed) return;

        const updatedDebts = [...current.debts, debt];
        const updatedTotals = {
          ...current.totals,
          debtsTotal: updatedDebts.reduce((sum, d) => sum + d.totalOwed, 0),
        };

        const updatedEntry: DailyEntry = {
          ...current,
          debts: updatedDebts,
          totals: updatedTotals,
        };

        set((state) => ({
          currentEntry: updatedEntry,
          entries: state.entries.map((e) =>
            e.id === current.id ? updatedEntry : e
          ),
        }));

        try {
          await convex.mutation(api.dailyEntries.upsert, updatedEntry);
        } catch (err) {
          console.warn("Convex sync failed (addDebt):", err);
        }
      },

      // ✅ Close the day
      closeDay: async () => {
        const current = get().currentEntry;
        if (!current) return;

        const closedEntry = { ...current, closed: true };

        set((state) => ({
          currentEntry: closedEntry,
          entries: state.entries.map((e) =>
            e.id === current.id ? closedEntry : e
          ),
        }));

        try {
          await convex.mutation(api.dailyEntries.upsert, closedEntry);
        } catch (err) {
          console.warn("Convex sync failed (closeDay):", err);
        }
      },

      // 🔁 Sync all entries from Convex
      syncFromConvex: async () => {
        try {
          const remoteEntriesRaw = await convex.query(
            api.dailyEntries.list,
            {}
          );
          const sanitized = Array.isArray(remoteEntriesRaw)
            ? remoteEntriesRaw.map((r: any) => sanitizeRemoteEntry(r))
            : [];
          // merge without duplicates (prefer sanitized remote)
          const local = get().entries || [];
          const merged = [
            ...sanitized,
            ...local.filter((l) => !sanitized.some((s) => s.date === l.date)),
          ];
          set({ entries: merged });
        } catch (err) {
          console.warn("Convex sync failed (syncFromConvex):", err);
        }
      },

      // 📅 Fetch today's entry or start new
      fetchTodayEntry: async () => {
        const date = new Date().toISOString().split("T")[0];

        // 1) Check local
        const local = get().entries.find((e) => e.date === date);
        if (local) {
          set({ currentEntry: local });
          return;
        }

        // 2) Try Convex for today's entry (fetch all and find today's)
        try {
          const remoteEntriesRaw = await convex.query(
            api.dailyEntries.list,
            {}
          );
          const remoteEntries = Array.isArray(remoteEntriesRaw)
            ? remoteEntriesRaw.map((r: any) => sanitizeRemoteEntry(r))
            : [];

          // prefer remote today's entry if exists
          const todayRemote = remoteEntries.find((e) => e.date === date);

          // merge remote entries into local store (avoid duplicates by date)
          const existingLocal = get().entries || [];
          const merged = [
            ...remoteEntries,
            ...existingLocal.filter(
              (l) => !remoteEntries.some((r) => r.date === l.date)
            ),
          ];

          set({ entries: merged });

          if (todayRemote) {
            set({ currentEntry: todayRemote });
            return;
          }

          // 3) no remote today entry -> create one locally + remote
          await get().startNewDay();
        } catch (err) {
          console.warn("Convex fetch failed (fetchTodayEntry):", err);
          // on failure, create local entry to ensure UI flows
          await get().startNewDay();
        }
      },

      // isDayOpen as a function so callers can get fresh value
      isDayOpen: () => {
        const current = get().currentEntry;
        return !!current && !current.closed;
      },
    }),
    {
      name: "dailyEntry-store",
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);
