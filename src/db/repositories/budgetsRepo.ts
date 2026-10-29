import { getDb } from '../client';
import { Budget } from '../types';

export async function getBudgetsWithSpending(
  startMonth: string,
  startDate: string,
  endDate: string
): Promise<Budget[]> {
  const db = await getDb();
  const query = `
    SELECT 
      b.id,
      b.category_id as categoryId,
      b.period,
      b.amount,
      b.rollover,
      b.start_month as startMonth,
      b.created_at as createdAt,
      b.updated_at as updatedAt,
      c.name as categoryName,
      c.icon_key as categoryIcon,
      c.color_key as categoryColor,
      COALESCE(
        (
          SELECT SUM(t.amount)
          FROM transactions t
          WHERE t.type = 'expense'
            AND (b.category_id IS NULL OR t.category_id = b.category_id)
            AND t.occurred_at >= ?
            AND t.occurred_at <= ?
        ), 0
      ) as spent
    FROM budgets b
    LEFT JOIN categories c ON b.category_id = c.id
    WHERE b.start_month = ?
    ORDER BY b.amount DESC;
  `;

  const rows = await db.getAllAsync<any>(query, [startDate, endDate, startMonth]);
  return rows.map((r) => {
    const amount = Math.round(Number(r.amount) || 0);
    const spent = Math.round(Number(r.spent) || 0);
    const remaining = amount - spent;
    const percentage = amount > 0 ? Math.round((spent / amount) * 100) : 0;

    return {
      id: r.id,
      categoryId: r.categoryId,
      period: r.period || 'monthly',
      amount,
      rollover: Boolean(r.rollover),
      startMonth: r.startMonth,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      categoryName: r.categoryId ? (r.categoryName || 'Kategori') : 'Total Anggaran',
      categoryIcon: r.categoryId ? (r.categoryIcon || 'tag') : 'budget',
      categoryColor: r.categoryId ? (r.categoryColor || '#8496E6') : '#8496E6',
      spent,
      remaining,
      percentage,
    };
  });
}

export async function createOrUpdateBudget(params: {
  categoryId: string | null;
  amount: number;
  startMonth: string;
  rollover?: boolean;
}): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();
  const amount = Math.round(params.amount);
  const rollover = params.rollover ? 1 : 0;

  // Check if exists for this category and month (using null-safe IS operator)
  const existing = await db.getFirstAsync<{ id: string }>(
    `SELECT id FROM budgets WHERE category_id IS ? AND start_month = ?;`,
    [params.categoryId, params.startMonth]
  );

  if (existing) {
    await db.runAsync(
      `UPDATE budgets SET amount = ?, rollover = ?, updated_at = ? WHERE id = ?;`,
      [amount, rollover, now, existing.id]
    );
  } else {
    const id = 'b_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    await db.runAsync(
      `INSERT INTO budgets (id, category_id, period, amount, rollover, start_month, created_at, updated_at)
       VALUES (?, ?, 'monthly', ?, ?, ?, ?, ?);`,
      [id, params.categoryId, amount, rollover, params.startMonth, now, now]
    );
  }
}

export async function deleteBudget(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(`DELETE FROM budgets WHERE id = ?;`, [id]);
}
