import * as SQLite from 'expo-sqlite';
import {
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
  DEFAULT_WALLETS,
} from './seed';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) {
    return dbInstance;
  }

  const db = await SQLite.openDatabaseAsync('daydream_money.db');
  await initDatabase(db);
  dbInstance = db;
  return dbInstance;
}

export async function initDatabase(db: SQLite.SQLiteDatabase): Promise<void> {
  // Enable foreign keys & WAL mode for performance and safety
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS wallets (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      color_key TEXT,
      icon_key TEXT,
      initial_balance INTEGER NOT NULL DEFAULT 0,
      include_in_total INTEGER NOT NULL DEFAULT 1,
      is_archived INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      kind TEXT NOT NULL,
      icon_key TEXT,
      color_key TEXT,
      is_default INTEGER NOT NULL DEFAULT 0,
      is_archived INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      amount INTEGER NOT NULL,
      wallet_id TEXT NOT NULL,
      to_wallet_id TEXT,
      category_id TEXT,
      note TEXT,
      occurred_at TEXT NOT NULL,
      transfer_group_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (wallet_id) REFERENCES wallets (id),
      FOREIGN KEY (to_wallet_id) REFERENCES wallets (id),
      FOREIGN KEY (category_id) REFERENCES categories (id)
    );

    CREATE TABLE IF NOT EXISTS budgets (
      id TEXT PRIMARY KEY,
      category_id TEXT,
      period TEXT NOT NULL DEFAULT 'monthly',
      amount INTEGER NOT NULL,
      rollover INTEGER NOT NULL DEFAULT 0,
      start_month TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (category_id) REFERENCES categories (id)
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // Check if categories already seeded
  const existingCategories = await db.getAllAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM categories;'
  );

  if (!existingCategories[0] || existingCategories[0].count === 0) {
    const allCategories = [
      ...DEFAULT_EXPENSE_CATEGORIES,
      ...DEFAULT_INCOME_CATEGORIES,
    ];

    for (const cat of allCategories) {
      await db.runAsync(
        `INSERT INTO categories (id, name, kind, icon_key, color_key, is_default, is_archived, sort_order)
         VALUES (?, ?, ?, ?, ?, 1, 0, ?);`,
        [cat.id, cat.name, cat.kind, cat.iconKey, cat.colorKey, cat.sortOrder]
      );
    }
  }

  // Check if wallets already seeded
  const existingWallets = await db.getAllAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM wallets;'
  );

  if (!existingWallets[0] || existingWallets[0].count === 0) {
    const now = new Date().toISOString();
    for (const wallet of DEFAULT_WALLETS) {
      await db.runAsync(
        `INSERT INTO wallets (id, name, type, color_key, icon_key, initial_balance, include_in_total, is_archived, sort_order, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?);`,
        [
          wallet.id,
          wallet.name,
          wallet.type,
          wallet.colorKey,
          wallet.iconKey,
          wallet.initialBalance,
          wallet.includeInTotal,
          wallet.sortOrder,
          now,
          now,
        ]
      );
    }
  }

  // Seed default settings if not exists
  const settingsCount = await db.getAllAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM settings;'
  );

  if (!settingsCount[0] || settingsCount[0].count === 0) {
    const defaultSettings: Record<string, string> = {
      currency: 'IDR',
      locale: 'id-ID',
      month_start_day: '1',
      app_lock_enabled: '0',
      onboarding_completed: '0',
      hide_balance: '0',
    };

    for (const [key, value] of Object.entries(defaultSettings)) {
      await db.runAsync(
        'INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?);',
        [key, value]
      );
    }
  }
}
