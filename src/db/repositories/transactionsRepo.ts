import { getDb } from '../client';
import { Transaction, TransactionType } from '../types';

export interface TransactionFilter {
  startDate?: string;
  endDate?: string;
  type?: TransactionType;
  walletId?: string;
  categoryId?: string;
  search?: string;
  minAmount?: number;
  maxAmount?: number;
  limit?: number;
  offset?: number;
}

export async function getTransactions(
  filter: TransactionFilter = {}
): Promise<Transaction[]> {
  const db = await getDb();
  let query = `
    SELECT 
      t.id,
      t.type,
      t.amount,
      t.wallet_id as walletId,
      t.to_wallet_id as toWalletId,
      t.category_id as categoryId,
      t.note,
      t.occurred_at as occurredAt,
      t.transfer_group_id as transferGroupId,
      t.created_at as createdAt,
      t.updated_at as updatedAt,
      w.name as walletName,
      tw.name as toWalletName,
      c.name as categoryName,
      c.icon_key as categoryIcon,
      c.color_key as categoryColor
    FROM transactions t
    LEFT JOIN wallets w ON t.wallet_id = w.id
    LEFT JOIN wallets tw ON t.to_wallet_id = tw.id
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (filter.startDate) {
    query += ` AND t.occurred_at >= ?`;
    params.push(filter.startDate);
  }
  if (filter.endDate) {
    query += ` AND t.occurred_at <= ?`;
    params.push(filter.endDate);
  }
  if (filter.type) {
    query += ` AND t.type = ?`;
    params.push(filter.type);
  }
  if (filter.walletId) {
    query += ` AND (t.wallet_id = ? OR t.to_wallet_id = ?)`;
    params.push(filter.walletId, filter.walletId);
  }
  if (filter.categoryId) {
    query += ` AND t.category_id = ?`;
    params.push(filter.categoryId);
  }
  if (filter.minAmount !== undefined) {
    query += ` AND t.amount >= ?`;
    params.push(filter.minAmount);
  }
  if (filter.maxAmount !== undefined) {
    query += ` AND t.amount <= ?`;
    params.push(filter.maxAmount);
  }
  if (filter.search) {
    const s = `%${filter.search.trim().toLowerCase()}%`;
    query += ` AND (LOWER(t.note) LIKE ? OR LOWER(c.name) LIKE ? OR CAST(t.amount AS TEXT) LIKE ?)`;
    params.push(s, s, s);
  }

  query += ` ORDER BY t.occurred_at DESC, t.created_at DESC`;

  if (filter.limit) {
    query += ` LIMIT ?`;
    params.push(filter.limit);
    if (filter.offset) {
      query += ` OFFSET ?`;
      params.push(filter.offset);
    }
  }

  const rows = await db.getAllAsync<any>(query, params);
  return rows.map((r) => ({
    id: r.id,
    type: r.type as TransactionType,
    amount: Math.round(Number(r.amount) || 0),
    walletId: r.walletId,
    toWalletId: r.toWalletId,
    categoryId: r.categoryId,
    note: r.note,
    occurredAt: r.occurredAt,
    transferGroupId: r.transferGroupId,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    walletName: r.walletName,
    toWalletName: r.toWalletName,
    categoryName: r.categoryName,
    categoryIcon: r.categoryIcon,
    categoryColor: r.categoryColor,
  }));
}

export async function getTransactionById(id: string): Promise<Transaction | null> {
  const db = await getDb();
  const query = `
    SELECT 
      t.id,
      t.type,
      t.amount,
      t.wallet_id as walletId,
      t.to_wallet_id as toWalletId,
      t.category_id as categoryId,
      t.note,
      t.occurred_at as occurredAt,
      t.transfer_group_id as transferGroupId,
      t.created_at as createdAt,
      t.updated_at as updatedAt,
      w.name as walletName,
      tw.name as toWalletName,
      c.name as categoryName,
      c.icon_key as categoryIcon,
      c.color_key as categoryColor
    FROM transactions t
    LEFT JOIN wallets w ON t.wallet_id = w.id
    LEFT JOIN wallets tw ON t.to_wallet_id = tw.id
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.id = ?;
  `;
  const r = await db.getFirstAsync<any>(query, [id]);
  if (!r) return null;

  return {
    id: r.id,
    type: r.type as TransactionType,
    amount: Math.round(Number(r.amount) || 0),
    walletId: r.walletId,
    toWalletId: r.toWalletId,
    categoryId: r.categoryId,
    note: r.note,
    occurredAt: r.occurredAt,
    transferGroupId: r.transferGroupId,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    walletName: r.walletName,
    toWalletName: r.toWalletName,
    categoryName: r.categoryName,
    categoryIcon: r.categoryIcon,
    categoryColor: r.categoryColor,
  };
}

export async function createTransaction(params: {
  type: TransactionType;
  amount: number;
  walletId: string;
  toWalletId?: string | null;
  categoryId?: string | null;
  note?: string | null;
  occurredAt?: string;
}): Promise<Transaction> {
  const db = await getDb();
  const now = new Date().toISOString();
  const occurredAt = params.occurredAt || now;
  const amount = Math.round(params.amount);

  if (amount <= 0) {
    throw new Error('Nominal transaksi harus lebih dari 0');
  }

  const id = 'tx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const transferGroupId = params.type === 'transfer' ? 'tg_' + Date.now() : null;

  await db.runAsync(
    `INSERT INTO transactions (id, type, amount, wallet_id, to_wallet_id, category_id, note, occurred_at, transfer_group_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      id,
      params.type,
      amount,
      params.walletId,
      params.toWalletId || null,
      params.categoryId || null,
      params.note?.trim() || null,
      occurredAt,
      transferGroupId,
      now,
      now,
    ]
  );

  return (await getTransactionById(id))!;
}

export async function updateTransaction(
  id: string,
  params: Partial<{
    amount: number;
    walletId: string;
    toWalletId: string | null;
    categoryId: string | null;
    note: string | null;
    occurredAt: string;
  }>
): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();
  const sets: string[] = ['updated_at = ?'];
  const values: any[] = [now];

  if (params.amount !== undefined) {
    sets.push('amount = ?');
    values.push(Math.round(params.amount));
  }
  if (params.walletId !== undefined) {
    sets.push('wallet_id = ?');
    values.push(params.walletId);
  }
  if (params.toWalletId !== undefined) {
    sets.push('to_wallet_id = ?');
    values.push(params.toWalletId);
  }
  if (params.categoryId !== undefined) {
    sets.push('category_id = ?');
    values.push(params.categoryId);
  }
  if (params.note !== undefined) {
    sets.push('note = ?');
    values.push(params.note?.trim() || null);
  }
  if (params.occurredAt !== undefined) {
    sets.push('occurred_at = ?');
    values.push(params.occurredAt);
  }

  values.push(id);
  await db.runAsync(`UPDATE transactions SET ${sets.join(', ')} WHERE id = ?;`, values);
}

export async function deleteTransaction(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(`DELETE FROM transactions WHERE id = ?;`, [id]);
}

export async function getCategorySpendingSummary(
  startDate: string,
  endDate: string,
  type: 'expense' | 'income' = 'expense'
): Promise<{ categoryId: string; categoryName: string; iconKey: string; colorKey: string; total: number }[]> {
  const db = await getDb();
  const query = `
    SELECT 
      c.id as categoryId,
      c.name as categoryName,
      c.icon_key as iconKey,
      c.color_key as colorKey,
      SUM(t.amount) as total
    FROM transactions t
    JOIN categories c ON t.category_id = c.id
    WHERE t.type = ?
      AND t.occurred_at >= ?
      AND t.occurred_at <= ?
    GROUP BY c.id
    ORDER BY total DESC;
  `;
  const rows = await db.getAllAsync<any>(query, [type, startDate, endDate]);
  return rows.map((r) => ({
    categoryId: r.categoryId,
    categoryName: r.categoryName,
    iconKey: r.iconKey || 'tag',
    colorKey: r.colorKey || '#8496E6',
    total: Math.round(Number(r.total) || 0),
  }));
}
