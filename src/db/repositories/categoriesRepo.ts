import { getDb } from '../client';
import { Category, CategoryKind } from '../types';

export async function getCategories(
  kind?: CategoryKind,
  includeArchived = false
): Promise<Category[]> {
  const db = await getDb();
  let query = `
    SELECT 
      id, name, kind, icon_key as iconKey, color_key as colorKey,
      is_default as isDefault, is_archived as isArchived, sort_order as sortOrder
    FROM categories
    WHERE (? = 1 OR is_archived = 0)
  `;
  const params: any[] = [includeArchived ? 1 : 0];

  if (kind) {
    query += ` AND kind = ?`;
    params.push(kind);
  }

  query += ` ORDER BY sort_order ASC, name ASC;`;

  const rows = await db.getAllAsync<any>(query, params);
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    kind: r.kind as CategoryKind,
    iconKey: r.iconKey || 'tag',
    colorKey: r.colorKey || '#8496E6',
    isDefault: Boolean(r.isDefault),
    isArchived: Boolean(r.isArchived),
    sortOrder: Number(r.sortOrder) || 0,
  }));
}

export async function getCategoryById(id: string): Promise<Category | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<any>(
    `SELECT id, name, kind, icon_key as iconKey, color_key as colorKey,
            is_default as isDefault, is_archived as isArchived, sort_order as sortOrder
     FROM categories WHERE id = ?;`,
    [id]
  );
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    kind: row.kind as CategoryKind,
    iconKey: row.iconKey || 'tag',
    colorKey: row.colorKey || '#8496E6',
    isDefault: Boolean(row.isDefault),
    isArchived: Boolean(row.isArchived),
    sortOrder: Number(row.sortOrder) || 0,
  };
}

export async function createCategory(params: {
  name: string;
  kind: CategoryKind;
  iconKey: string;
  colorKey: string;
}): Promise<Category> {
  const db = await getDb();
  const id = 'c_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

  await db.runAsync(
    `INSERT INTO categories (id, name, kind, icon_key, color_key, is_default, is_archived, sort_order)
     VALUES (?, ?, ?, ?, ?, 0, 0, 99);`,
    [id, params.name.trim(), params.kind, params.iconKey, params.colorKey]
  );

  return (await getCategoryById(id))!;
}

export async function updateCategory(
  id: string,
  params: Partial<{
    name: string;
    iconKey: string;
    colorKey: string;
    sortOrder: number;
  }>
): Promise<void> {
  const db = await getDb();
  const sets: string[] = [];
  const values: any[] = [];

  if (params.name !== undefined) {
    sets.push('name = ?');
    values.push(params.name.trim());
  }
  if (params.iconKey !== undefined) {
    sets.push('icon_key = ?');
    values.push(params.iconKey);
  }
  if (params.colorKey !== undefined) {
    sets.push('color_key = ?');
    values.push(params.colorKey);
  }
  if (params.sortOrder !== undefined) {
    sets.push('sort_order = ?');
    values.push(params.sortOrder);
  }

  if (sets.length === 0) return;
  values.push(id);
  await db.runAsync(`UPDATE categories SET ${sets.join(', ')} WHERE id = ?;`, values);
}

export async function archiveCategory(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(`UPDATE categories SET is_archived = 1 WHERE id = ?;`, [id]);
}
