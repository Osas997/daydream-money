import { getDb } from '../client';
import { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES, DEFAULT_WALLETS } from '../seed';

export async function getSettings(): Promise<Record<string, string>> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ key: string; value: string }>(
    'SELECT key, value FROM settings;'
  );
  const result: Record<string, string> = {};
  for (const row of rows) {
    result[row.key] = row.value;
  }
  return result;
}

export async function getSetting(key: string, defaultValue = ''): Promise<string> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM settings WHERE key = ?;',
    [key]
  );
  return row ? row.value : defaultValue;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value;',
    [key, value]
  );
}

export async function resetAllData(): Promise<void> {
  const db = await getDb();
  await db.execAsync(`
    DELETE FROM transactions;
    DELETE FROM budgets;
    DELETE FROM wallets;
    DELETE FROM categories;
    DELETE FROM settings;
  `);

  // Re-seed defaults
  const now = new Date().toISOString();
  for (const cat of [...DEFAULT_EXPENSE_CATEGORIES, ...DEFAULT_INCOME_CATEGORIES]) {
    await db.runAsync(
      `INSERT INTO categories (id, name, kind, icon_key, color_key, is_default, is_archived, sort_order)
       VALUES (?, ?, ?, ?, ?, 1, 0, ?);`,
      [cat.id, cat.name, cat.kind, cat.iconKey, cat.colorKey, cat.sortOrder]
    );
  }

  for (const wallet of DEFAULT_WALLETS) {
    await db.runAsync(
      `INSERT INTO wallets (id, name, type, color_key, icon_key, initial_balance, include_in_total, is_archived, sort_order, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?);`,
      [wallet.id, wallet.name, wallet.type, wallet.colorKey, wallet.iconKey, wallet.initialBalance, wallet.includeInTotal, wallet.sortOrder, now, now]
    );
  }

  const defaultSettings: Record<string, string> = {
    currency: 'IDR',
    locale: 'id-ID',
    month_start_day: '1',
    app_lock_enabled: '0',
    onboarding_completed: '1',
    hide_balance: '0',
  };

  for (const [key, value] of Object.entries(defaultSettings)) {
    await db.runAsync(
      'INSERT INTO settings (key, value) VALUES (?, ?);',
      [key, value]
    );
  }
}
