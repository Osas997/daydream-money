import { create } from 'zustand';
import { Transaction, TransactionType } from '../db/types';
import * as txRepo from '../db/repositories/transactionsRepo';
import { getFinancialMonthRange } from '../lib/formatters';
import { useWalletStore } from './walletStore';
import { useBudgetStore } from './budgetStore';

export interface CustomDateRange {
  startDate: string;
  endDate: string;
  label: string;
}

interface FilterState {
  search: string;
  type?: TransactionType;
  walletId?: string;
  categoryId?: string;
  minAmount?: number;
  maxAmount?: number;
}

interface TransactionState {
  currentMonth: string; // 'YYYY-MM'
  customDateRange: CustomDateRange | null;
  monthRangeLabel: string;
  monthIncome: number;
  monthExpense: number;
  recentTransactions: Transaction[];
  filteredTransactions: Transaction[];
  filter: FilterState;
  deletedBackup: Transaction | null;

  setCurrentMonth: (ym: string, startDay?: number) => Promise<void>;
  setCustomDateRange: (range: CustomDateRange | null, startDay?: number) => Promise<void>;
  nextMonth: (startDay?: number) => Promise<void>;
  prevMonth: (startDay?: number) => Promise<void>;

  setFilter: (newFilter: Partial<FilterState>) => Promise<void>;
  clearFilter: () => Promise<void>;

  refreshTransactions: (startDay?: number) => Promise<void>;

  createTransaction: (params: {
    type: TransactionType;
    amount: number;
    walletId: string;
    toWalletId?: string | null;
    categoryId?: string | null;
    note?: string | null;
    occurredAt?: string;
  }) => Promise<Transaction>;

  updateTransaction: (
    id: string,
    params: Partial<{
      amount: number;
      walletId: string;
      toWalletId: string | null;
      categoryId: string | null;
      note: string | null;
      occurredAt: string;
    }>
  ) => Promise<void>;

  deleteTransaction: (id: string) => Promise<void>;
  undoDelete: () => Promise<void>;
}

const getCurrentMonthString = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, '0');
  return `${y}-${m}`;
};

export const useTransactionStore = create<TransactionState>((set, get) => ({
  currentMonth: getCurrentMonthString(),
  customDateRange: null,
  monthRangeLabel: '',
  monthIncome: 0,
  monthExpense: 0,
  recentTransactions: [],
  filteredTransactions: [],
  filter: { search: '' },
  deletedBackup: null,

  setCurrentMonth: async (ym: string, startDay = 1) => {
    set({ currentMonth: ym, customDateRange: null });
    await get().refreshTransactions(startDay);
  },

  setCustomDateRange: async (range: CustomDateRange | null, startDay = 1) => {
    set({ customDateRange: range });
    await get().refreshTransactions(startDay);
  },

  nextMonth: async (startDay = 1) => {
    const [y, m] = get().currentMonth.split('-').map(Number);
    let nextY = y;
    let nextM = m + 1;
    if (nextM > 12) {
      nextM = 1;
      nextY += 1;
    }
    const ym = `${nextY}-${nextM.toString().padStart(2, '0')}`;
    await get().setCurrentMonth(ym, startDay);
  },

  prevMonth: async (startDay = 1) => {
    const [y, m] = get().currentMonth.split('-').map(Number);
    let prevY = y;
    let prevM = m - 1;
    if (prevM < 1) {
      prevM = 12;
      prevY -= 1;
    }
    const ym = `${prevY}-${prevM.toString().padStart(2, '0')}`;
    await get().setCurrentMonth(ym, startDay);
  },

  setFilter: async (newFilter) => {
    set((state) => ({ filter: { ...state.filter, ...newFilter } }));
    await get().refreshTransactions();
  },

  clearFilter: async () => {
    set({ filter: { search: '' } });
    await get().refreshTransactions();
  },

  refreshTransactions: async (startDay = 1) => {
    const { currentMonth, customDateRange, filter } = get();
    let startDate: string | undefined;
    let endDate: string | undefined;
    let label: string;

    if (customDateRange) {
      startDate = customDateRange.startDate || undefined;
      endDate = customDateRange.endDate || undefined;
      label = customDateRange.label;
    } else {
      const range = getFinancialMonthRange(currentMonth, startDay);
      startDate = range.startDate;
      endDate = range.endDate;
      label = range.label;
    }

    try {
      // 1. Fetch transactions in range for income/expense calculations
      const monthTxs = await txRepo.getTransactions({
        startDate,
        endDate,
      });

      let monthIncome = 0;
      let monthExpense = 0;

      for (const t of monthTxs) {
        if (t.type === 'income') monthIncome += t.amount;
        if (t.type === 'expense') monthExpense += t.amount;
      }

      // 2. Recent transactions (latest 10)
      const recentTransactions = await txRepo.getTransactions({
        startDate,
        endDate,
        limit: 10,
      });

      // 3. Filtered transactions for the transactions tab
      const filteredTransactions = await txRepo.getTransactions({
        ...filter,
        startDate,
        endDate,
      });

      set({
        monthRangeLabel: label,
        monthIncome,
        monthExpense,
        recentTransactions,
        filteredTransactions,
      });
    } catch (e) {
      console.error('Error refreshing transactions:', e);
    }
  },

  createTransaction: async (params) => {
    const newTx = await txRepo.createTransaction(params);

    // Refresh wallet, budget, and transaction stores immediately
    useWalletStore.getState().refreshWallets().catch(() => {});
    useBudgetStore.getState().refreshBudgets(get().currentMonth).catch(() => {});
    get().refreshTransactions().catch(() => {});

    return newTx;
  },

  updateTransaction: async (id, params) => {
    await txRepo.updateTransaction(id, params);
    useWalletStore.getState().refreshWallets().catch(() => {});
    useBudgetStore.getState().refreshBudgets(get().currentMonth).catch(() => {});
    await get().refreshTransactions();
  },

  deleteTransaction: async (id) => {
    const tx = await txRepo.getTransactionById(id);
    if (tx) {
      set({ deletedBackup: tx });
    }
    await txRepo.deleteTransaction(id);
    useWalletStore.getState().refreshWallets().catch(() => {});
    useBudgetStore.getState().refreshBudgets(get().currentMonth).catch(() => {});
    await get().refreshTransactions();
  },

  undoDelete: async () => {
    const backup = get().deletedBackup;
    if (!backup) return;

    await txRepo.createTransaction({
      type: backup.type,
      amount: backup.amount,
      walletId: backup.walletId,
      toWalletId: backup.toWalletId,
      categoryId: backup.categoryId,
      note: backup.note,
      occurredAt: backup.occurredAt,
    });

    set({ deletedBackup: null });
    useWalletStore.getState().refreshWallets().catch(() => {});
    useBudgetStore.getState().refreshBudgets(get().currentMonth).catch(() => {});
    await get().refreshTransactions();
  },
}));
