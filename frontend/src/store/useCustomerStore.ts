import { api } from "@/convex/_generated/api";
import { convex } from "@/providers/ClerkAndConvexProvider";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { mmkvStorage } from "./storage";

export interface CustomerDebt {
  id: string;
  date: string;
  items: {
    id: string;
    title: string;
    quantity: number;
    price: number;
    total: number;
  }[];
  totalOwed: number;
}

export interface CustomerPayment {
  id: string;
  date: string;
  amount: number;
  note?: string;
}

export interface Customer {
  id: string;
  name: string;
  debts: CustomerDebt[];
  payments: CustomerPayment[];
  balance: number;
}

interface CustomerState {
  customers: Customer[];
  currentCustomer: Customer | null;

  addCustomer: (name: string) => Promise<void>;
  addDebtToCustomer: (customerId: string, debt: CustomerDebt) => Promise<void>;
  recordPayment: (
    customerId: string,
    payment: CustomerPayment
  ) => Promise<void>;
  syncFromConvex: () => Promise<void>;
}

export const useCustomerStore = create<CustomerState>()(
  persist(
    (set, get) => ({
      customers: [],
      currentCustomer: null,

      addCustomer: async (name: string) => {
        const newCustomer: Customer = {
          id: Math.random().toString(),
          name,
          debts: [],
          payments: [],
          balance: 0,
        };

        set((state) => ({
          customers: [...state.customers, newCustomer],
          currentCustomer: newCustomer,
        }));

        try {
          await convex.mutation(api.customers.add, { name });
        } catch (err) {
          console.warn("Convex sync failed (addCustomer):", err);
        }
      },

      addDebtToCustomer: async (customerId: string, debt: CustomerDebt) => {
        const state = get();
        const updatedCustomers = state.customers.map((customer) => {
          if (customer.id !== customerId) return customer;
          const newDebts = [...customer.debts, debt];
          const newBalance =
            customer.balance + debt.items.reduce((sum, i) => sum + i.total, 0);
          return { ...customer, debts: newDebts, balance: newBalance };
        });

        set({ customers: updatedCustomers });

        const updatedCustomer = updatedCustomers.find(
          (c) => c.id === customerId
        );
        if (!updatedCustomer) return;

        try {
          await convex.mutation(api.customers.upsert, updatedCustomer);
        } catch (err) {
          console.warn("Convex sync failed (addDebtToCustomer):", err);
        }
      },

      recordPayment: async (customerId: string, payment: CustomerPayment) => {
        const state = get();
        const updatedCustomers = state.customers.map((customer) => {
          if (customer.id !== customerId) return customer;
          const newPayments = [...customer.payments, payment];
          const newBalance = Math.max(0, customer.balance - payment.amount);
          return { ...customer, payments: newPayments, balance: newBalance };
        });

        set({ customers: updatedCustomers });

        const updatedCustomer = updatedCustomers.find(
          (c) => c.id === customerId
        );
        if (!updatedCustomer) return;

        try {
          await convex.mutation(api.customers.upsert, updatedCustomer);
        } catch (err) {
          console.warn("Convex sync failed (recordPayment):", err);
        }
      },

      syncFromConvex: async () => {
        try {
          const remoteCustomers = await convex.query(api.customers.list, {});
          set({ customers: remoteCustomers });
        } catch (err) {
          console.warn("Convex sync failed (syncFromConvex):", err);
        }
      },
    }),
    {
      name: "customer-store",
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);
