import { create } from 'zustand';
import { Budget } from '../db/types';
import * as budgetsRepo from '../db/repositories/budgetsRepo';
import { getFinancialMonthRange } from '../lib/formatters';

interface BudgetState {
  budgets: Budget[];
  totalBudgeted: number;
  totalSpent: number;
  loading: boolean;
  refreshBudgets: (month: string, startDay?: number) => Promise<void>;
  saveBudget: (params: {
    categoryId: string | null;
    amount: number;
    startMonth: string;
    rollover?: boolean;
  }, startDay?: number) => Promise<void>;
  deleteBudget: (id: string, month: string, startDay?: number) => Promise<void>;
}

export const useBudgetStore = create<BudgetState>((set, get) => ({
  budgets: [],
  totalBudgeted: 0,
  totalSpent: 0,
  loading: false,

  refreshBudgets: async (month: string, startDay = 1) => {
    try {
      const { startDate, endDate } = getFinancialMonthRange(month, startDay);
      const budgets = await budgetsRepo.getBudgetsWithSpending(month, startDate, endDate);

      const totalBudgeted = budgets.reduce((acc, b) => acc + b.amount, 0);
      const totalSpent = budgets.reduce((acc, b) => acc + (b.spent || 0), 0);

      set({ budgets, totalBudgeted, totalSpent });
    } catch (e) {
      console.error('Error refreshing budgets:', e);
    }
  },

  saveBudget: async (params, startDay = 1) => {
    await budgetsRepo.createOrUpdateBudget(params);
    await get().refreshBudgets(params.startMonth, startDay);
  },

  deleteBudget: async (id, month, startDay = 1) => {
    await budgetsRepo.deleteBudget(id);
    await get().refreshBudgets(month, startDay);
  },
}));
