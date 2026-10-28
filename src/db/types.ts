export type WalletType = 'cash' | 'bank' | 'ewallet' | 'credit_card' | 'other';

export interface Wallet {
  id: string;
  name: string;
  type: WalletType;
  colorKey: string;
  iconKey: string;
  initialBalance: number;
  includeInTotal: boolean;
  isArchived: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  currentBalance?: number;
}

export type CategoryKind = 'expense' | 'income';

export interface Category {
  id: string;
  name: string;
  kind: CategoryKind;
  iconKey: string;
  colorKey: string;
  isDefault: boolean;
  isArchived: boolean;
  sortOrder: number;
}

export type TransactionType = 'expense' | 'income' | 'transfer';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  walletId: string;
  toWalletId?: string | null;
  categoryId?: string | null;
  note?: string | null;
  occurredAt: string; // ISO 8601 UTC
  transferGroupId?: string | null;
  createdAt: string;
  updatedAt: string;

  // Joined fields for display
  walletName?: string;
  toWalletName?: string;
  categoryName?: string;
  categoryIcon?: string;
  categoryColor?: string;
}

export interface Budget {
  id: string;
  categoryId: string | null; // null = total monthly budget
  period: 'monthly';
  amount: number;
  rollover: boolean;
  startMonth: string; // e.g. '2026-10'
  createdAt: string;
  updatedAt: string;

  // Computed fields
  categoryName?: string;
  categoryIcon?: string;
  categoryColor?: string;
  spent?: number;
  remaining?: number;
  percentage?: number;
}

export interface MonthSummary {
  month: string; // 'YYYY-MM'
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  totalBalance: number;
}
