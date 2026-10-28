import { create } from 'zustand';
import { Category, CategoryKind } from '../db/types';
import * as categoriesRepo from '../db/repositories/categoriesRepo';

interface CategoryState {
  expenseCategories: Category[];
  incomeCategories: Category[];
  allCategories: Category[];
  loading: boolean;
  refreshCategories: () => Promise<void>;
  createCategory: (params: {
    name: string;
    kind: CategoryKind;
    iconKey: string;
    colorKey: string;
  }) => Promise<Category>;
  updateCategory: (
    id: string,
    params: Partial<{
      name: string;
      iconKey: string;
      colorKey: string;
      sortOrder: number;
    }>
  ) => Promise<void>;
  archiveCategory: (id: string) => Promise<void>;
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
  expenseCategories: [],
  incomeCategories: [],
  allCategories: [],
  loading: false,

  refreshCategories: async () => {
    try {
      const all = await categoriesRepo.getCategories(undefined, false);
      const expense = all.filter((c) => c.kind === 'expense');
      const income = all.filter((c) => c.kind === 'income');
      set({
        allCategories: all,
        expenseCategories: expense,
        incomeCategories: income,
      });
    } catch (e) {
      console.error('Error refreshing categories:', e);
    }
  },

  createCategory: async (params) => {
    const newCat = await categoriesRepo.createCategory(params);
    await get().refreshCategories();
    return newCat;
  },

  updateCategory: async (id, params) => {
    await categoriesRepo.updateCategory(id, params);
    await get().refreshCategories();
  },

  archiveCategory: async (id) => {
    await categoriesRepo.archiveCategory(id);
    await get().refreshCategories();
  },
}));
