import { getDb } from '../client';
import { Wallet, WalletType } from '../types';

export async function getWallets(includeArchived = false): Promise<Wallet[]> {
  const db = await getDb();
  const query = `
    SELECT 
      w.id,
      w.name,
      w.type,
      w.color_key as colorKey,
      w.icon_key as iconKey,
      w.initial_balance as initialBalance,
      w.include_in_total as includeInTotal,
      w.is_archived as isArchived,
      w.sort_order as sortOrder,
      w.created_at as createdAt,
      w.updated_at as updatedAt,
      (
        w.initial_balance + 
        COALESCE((SELECT SUM(amount) FROM transactions WHERE wallet_id = w.id AND type = 'income'), 0) -
        COALESCE((SELECT SUM(amount) FROM transactions WHERE wallet_id = w.id AND type = 'expense'), 0) +
        COALESCE((SELECT SUM(amount) FROM transactions WHERE to_wallet_id = w.id AND type = 'transfer'), 0) -
        COALESCE((SELECT SUM(amount) FROM transactions WHERE wallet_id = w.id AND type = 'transfer'), 0)
      ) as currentBalance
    FROM wallets w
    WHERE (? = 1 OR w.is_archived = 0)
    ORDER BY w.sort_order ASC, w.created_at ASC;
  `;

  const rows = await db.getAllAsync<any>(query, [includeArchived ? 1 : 0]);
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    type: r.type as WalletType,
    colorKey: r.colorKey || '#8496E6',
    iconKey: r.iconKey || 'cash',
    initialBalance: Math.round(Number(r.initialBalance) || 0),
    includeInTotal: Boolean(r.includeInTotal),
    isArchived: Boolean(r.isArchived),
    sortOrder: Number(r.sortOrder) || 0,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    currentBalance: Math.round(Number(r.currentBalance) || 0),
  }));
}

export async function getWalletById(id: string): Promise<Wallet | null> {
  const db = await getDb();
  const query = `
    SELECT 
      w.id,
      w.name,
      w.type,
      w.color_key as colorKey,
      w.icon_key as iconKey,
      w.initial_balance as initialBalance,
      w.include_in_total as includeInTotal,
      w.is_archived as isArchived,
      w.sort_order as sortOrder,
      w.created_at as createdAt,
      w.updated_at as updatedAt,
      (
        w.initial_balance + 
        COALESCE((SELECT SUM(amount) FROM transactions WHERE wallet_id = w.id AND type = 'income'), 0) -
        COALESCE((SELECT SUM(amount) FROM transactions WHERE wallet_id = w.id AND type = 'expense'), 0) +
        COALESCE((SELECT SUM(amount) FROM transactions WHERE to_wallet_id = w.id AND type = 'transfer'), 0) -
        COALESCE((SELECT SUM(amount) FROM transactions WHERE wallet_id = w.id AND type = 'transfer'), 0)
      ) as currentBalance
    FROM wallets w
    WHERE w.id = ?;
  `;

  const row = await db.getFirstAsync<any>(query, [id]);
  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    type: row.type as WalletType,
    colorKey: row.colorKey || '#8496E6',
    iconKey: row.iconKey || 'cash',
    initialBalance: Math.round(Number(row.initialBalance) || 0),
    includeInTotal: Boolean(row.includeInTotal),
    isArchived: Boolean(row.isArchived),
    sortOrder: Number(row.sortOrder) || 0,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    currentBalance: Math.round(Number(row.currentBalance) || 0),
  };
}

export async function createWallet(params: {
  name: string;
  type: WalletType;
  colorKey: string;
  iconKey: string;
  initialBalance: number;
  includeInTotal?: boolean;
}): Promise<Wallet> {
  const db = await getDb();
  const id = 'w_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const now = new Date().toISOString();
  const includeInTotalVal = params.includeInTotal ?? true ? 1 : 0;
  const initialBalance = Math.round(params.initialBalance || 0);

  await db.runAsync(
    `INSERT INTO wallets (id, name, type, color_key, icon_key, initial_balance, include_in_total, is_archived, sort_order, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?);`,
    [
      id,
      params.name.trim(),
      params.type,
      params.colorKey,
      params.iconKey,
      initialBalance,
      includeInTotalVal,
      now,
      now,
    ]
  );

  return (await getWalletById(id))!;
}

export async function updateWallet(
  id: string,
  params: Partial<{
    name: string;
    type: WalletType;
    colorKey: string;
    iconKey: string;
    includeInTotal: boolean;
    sortOrder: number;
  }>
): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();
  const sets: string[] = ['updated_at = ?'];
  const values: any[] = [now];

  if (params.name !== undefined) {
    sets.push('name = ?');
    values.push(params.name.trim());
  }
  if (params.type !== undefined) {
    sets.push('type = ?');
    values.push(params.type);
  }
  if (params.colorKey !== undefined) {
    sets.push('color_key = ?');
    values.push(params.colorKey);
  }
  if (params.iconKey !== undefined) {
    sets.push('icon_key = ?');
    values.push(params.iconKey);
  }
  if (params.includeInTotal !== undefined) {
    sets.push('include_in_total = ?');
    values.push(params.includeInTotal ? 1 : 0);
  }
  if (params.sortOrder !== undefined) {
    sets.push('sort_order = ?');
    values.push(params.sortOrder);
  }

  values.push(id);
  await db.runAsync(`UPDATE wallets SET ${sets.join(', ')} WHERE id = ?;`, values);
}

export async function archiveWallet(id: string): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();
  await db.runAsync(
    `UPDATE wallets SET is_archived = 1, updated_at = ? WHERE id = ?;`,
    [now, id]
  );
}

export async function correctWalletBalance(
  walletId: string,
  targetBalance: number,
  reason = 'Koreksi Saldo'
): Promise<void> {
  const db = await getDb();
  const wallet = await getWalletById(walletId);
  if (!wallet) throw new Error('Wallet not found');

  const current = wallet.currentBalance ?? 0;
  const diff = Math.round(targetBalance) - current;

  if (diff === 0) return;

  const txId = 'tx_adj_' + Date.now();
  const now = new Date().toISOString();

  if (diff > 0) {
    // Add adjustment income
    await db.runAsync(
      `INSERT INTO transactions (id, type, amount, wallet_id, note, occurred_at, created_at, updated_at)
       VALUES (?, 'income', ?, ?, ?, ?, ?, ?);`,
      [txId, diff, walletId, reason, now, now, now]
    );
  } else {
    // Add adjustment expense
    await db.runAsync(
      `INSERT INTO transactions (id, type, amount, wallet_id, note, occurred_at, created_at, updated_at)
       VALUES (?, 'expense', ?, ?, ?, ?, ?, ?);`,
      [txId, Math.abs(diff), walletId, reason, now, now, now]
    );
  }
}
