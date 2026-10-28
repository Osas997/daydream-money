export interface DefaultCategory {
  id: string;
  name: string;
  kind: 'expense' | 'income';
  iconKey: string;
  colorKey: string;
  sortOrder: number;
}

export const DEFAULT_EXPENSE_CATEGORIES: DefaultCategory[] = [
  { id: 'cat-exp-food', name: 'Makan & Minum', kind: 'expense', iconKey: 'food', colorKey: '#F7A072', sortOrder: 1 },
  { id: 'cat-exp-transport', name: 'Transportasi', kind: 'expense', iconKey: 'transport', colorKey: '#8496E6', sortOrder: 2 },
  { id: 'cat-exp-shopping', name: 'Belanja', kind: 'expense', iconKey: 'shopping', colorKey: '#F3B562', sortOrder: 3 },
  { id: 'cat-exp-bills', name: 'Tagihan & Utilitas', kind: 'expense', iconKey: 'bills', colorKey: '#E97B86', sortOrder: 4 },
  { id: 'cat-exp-entertainment', name: 'Hiburan', kind: 'expense', iconKey: 'entertainment', colorKey: '#9B89B3', sortOrder: 5 },
  { id: 'cat-exp-health', name: 'Kesehatan', kind: 'expense', iconKey: 'health', colorKey: '#77BA99', sortOrder: 6 },
  { id: 'cat-exp-education', name: 'Pendidikan', kind: 'expense', iconKey: 'education', colorKey: '#64B5F6', sortOrder: 7 },
  { id: 'cat-exp-home', name: 'Rumah', kind: 'expense', iconKey: 'home', colorKey: '#A1887F', sortOrder: 8 },
  { id: 'cat-exp-subscription', name: 'Langganan', kind: 'expense', iconKey: 'subscription', colorKey: '#7986CB', sortOrder: 9 },
  { id: 'cat-exp-gift', name: 'Hadiah & Donasi', kind: 'expense', iconKey: 'gift', colorKey: '#F06292', sortOrder: 10 },
  { id: 'cat-exp-other', name: 'Lainnya', kind: 'expense', iconKey: 'other', colorKey: '#A0AAB8', sortOrder: 11 },
];

export const DEFAULT_INCOME_CATEGORIES: DefaultCategory[] = [
  { id: 'cat-inc-salary', name: 'Gaji', kind: 'income', iconKey: 'salary', colorKey: '#77BA99', sortOrder: 1 },
  { id: 'cat-inc-bonus', name: 'Bonus', kind: 'income', iconKey: 'sparkles', colorKey: '#F3B562', sortOrder: 2 },
  { id: 'cat-inc-freelance', name: 'Freelance', kind: 'income', iconKey: 'freelance', colorKey: '#8496E6', sortOrder: 3 },
  { id: 'cat-inc-investment', name: 'Investasi', kind: 'income', iconKey: 'investment', colorKey: '#4DB6AC', sortOrder: 4 },
  { id: 'cat-inc-gift', name: 'Hadiah', kind: 'income', iconKey: 'gift', colorKey: '#BA68C8', sortOrder: 5 },
  { id: 'cat-inc-other', name: 'Lainnya', kind: 'income', iconKey: 'other', colorKey: '#A0AAB8', sortOrder: 6 },
];

export const DEFAULT_WALLETS = [
  {
    id: 'wallet-default-cash',
    name: 'Tunai',
    type: 'cash' as const,
    colorKey: '#77BA99',
    iconKey: 'cash',
    initialBalance: 0,
    includeInTotal: 1,
    sortOrder: 1,
  },
  {
    id: 'wallet-default-bank',
    name: 'Rekening Bank',
    type: 'bank' as const,
    colorKey: '#8496E6',
    iconKey: 'bank',
    initialBalance: 0,
    includeInTotal: 1,
    sortOrder: 2,
  },
];
