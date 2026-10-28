import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import * as SQLite from 'expo-sqlite';
import { getDb } from '../db/client';

export function generateBackupFilename(d = new Date()): string {
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = String(d.getFullYear()).slice(-2);
  const hours = String(d.getHours()).padStart(2, '0');
  const mins = String(d.getMinutes()).padStart(2, '0');
  const secs = String(d.getSeconds()).padStart(2, '0');
  return `@MM(${day}-${month}-${year}-${hours}${mins}${secs}).mmbak`;
}

export async function exportBackup(): Promise<boolean> {
  const db = await getDb();

  const [wallets, categories, transactions, budgets, settings] = await Promise.all([
    db.getAllAsync<any>('SELECT * FROM wallets;'),
    db.getAllAsync<any>('SELECT * FROM categories;'),
    db.getAllAsync<any>('SELECT * FROM transactions;'),
    db.getAllAsync<any>('SELECT * FROM budgets;'),
    db.getAllAsync<any>('SELECT * FROM settings;'),
  ]);

  const payload = {
    format: 'daydream_mmbak',
    version: 1,
    app: 'Daydream Money',
    exportedAt: new Date().toISOString(),
    data: {
      wallets,
      categories,
      transactions,
      budgets,
      settings,
    },
  };

  const jsonStr = JSON.stringify(payload, null, 2);
  const filename = generateBackupFilename();

  if (Platform.OS === 'web') {
    const blob = new Blob([jsonStr], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  }

  // Native iOS / Android: write to documentDirectory so Sharing allows access
  const fileUri = `${FileSystem.documentDirectory}${filename}`;
  await FileSystem.writeAsStringAsync(fileUri, jsonStr, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(fileUri, {
      mimeType: 'application/octet-stream',
      dialogTitle: 'Simpan Cadangan Data (.mmbak)',
    });
    return true;
  }

  return false;
}

export async function importBackup(): Promise<{
  transactionCount: number;
  walletCount: number;
} | null> {
  const res = await DocumentPicker.getDocumentAsync({
    type: '*/*',
    copyToCacheDirectory: Platform.OS === 'ios',
  });

  if (res.canceled || !res.assets || res.assets.length === 0) {
    return null;
  }

  const asset = res.assets[0];
  const db = await getDb();

  // Check if file is SQLite binary or JSON
  let isSqlite = false;
  let rawText = '';

  if (Platform.OS === 'web' && asset.file) {
    const buf = await asset.file.arrayBuffer();
    const bytes = new Uint8Array(buf);
    const header = String.fromCharCode(...bytes.subarray(0, 15));
    if (header.startsWith('SQLite format 3')) {
      isSqlite = true;
    } else {
      rawText = new TextDecoder().decode(bytes);
    }
  } else {
    // Read the first 16 bytes to check SQLite magic header
    const header = await FileSystem.readAsStringAsync(asset.uri, {
      encoding: FileSystem.EncodingType.UTF8,
      position: 0,
      length: 16,
    }).catch(() => '');

    if (header.startsWith('SQLite format 3')) {
      isSqlite = true;
    } else {
      rawText = await FileSystem.readAsStringAsync(asset.uri, {
        encoding: FileSystem.EncodingType.UTF8,
      });
    }
  }

  if (isSqlite && Platform.OS !== 'web') {
    const targetDir = `${FileSystem.documentDirectory}SQLite`;
    const dirInfo = await FileSystem.getInfoAsync(targetDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(targetDir, { intermediates: true });
    }
    const tempDbPath = `${targetDir}/temp_import_mm.db`;
    await FileSystem.copyAsync({ from: asset.uri, to: tempDbPath });

    let tempDb: SQLite.SQLiteDatabase | null = null;
    try {
      tempDb = await SQLite.openDatabaseAsync('temp_import_mm.db');
      const tables = await tempDb.getAllAsync<{ name: string }>(
        "SELECT name FROM sqlite_master WHERE type='table';"
      );
      const tableNames = new Set(tables.map((t) => t.name.toUpperCase()));

      // Money Manager format (@MM(...).mmbak)
      if (tableNames.has('INOUTCOME') && tableNames.has('ASSETS')) {
        const mmAssets = await tempDb.getAllAsync<any>('SELECT * FROM ASSETS;');
        const mmCategories = tableNames.has('ZCATEGORY')
          ? await tempDb.getAllAsync<any>('SELECT * FROM ZCATEGORY;')
          : [];
        const mmTxs = await tempDb.getAllAsync<any>('SELECT * FROM INOUTCOME;');

        await db.execAsync('PRAGMA foreign_keys = OFF;');
        try {
          await db.execAsync(`
            DELETE FROM transactions;
            DELETE FROM budgets;
            DELETE FROM categories;
            DELETE FROM wallets;
          `);

          const now = new Date().toISOString();
          const walletMap = new Map<string, string>();
          for (const a of mmAssets) {
            const wId = `w_${a.uid || a.ID}`;
            const name = (a.NIC_NAME || 'Dompet').trim();
            walletMap.set(String(a.uid || a.ID), wId);
            await db.runAsync(
              `INSERT INTO wallets (id, name, type, color_key, icon_key, initial_balance, include_in_total, is_archived, sort_order, created_at, updated_at)
               VALUES (?, ?, 'cash', '#8195E5', 'cash', 0, 1, 0, ?, ?, ?);`,
              [wId, name, a.ORDERSEQ || 0, now, now]
            );
          }

          const categoryMap = new Map<string, string>();
          for (const c of mmCategories) {
            const cId = `c_${c.uid || c.ID}`;
            const kind = String(c.TYPE) === '0' ? 'income' : 'expense';
            categoryMap.set(String(c.uid || c.ID), cId);
            await db.runAsync(
              `INSERT INTO categories (id, name, kind, icon_key, color_key, is_default, is_archived, sort_order)
               VALUES (?, ?, ?, 'tag', '#8195E5', 0, 0, ?);`,
              [cId, c.NAME || 'Lainnya', kind, c.ORDERSEQ || 0]
            );
          }

          let txCount = 0;
          for (const t of mmTxs) {
            const txId = t.uid || `tx_${t.AID || Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
            const doType = String(t.DO_TYPE);
            const type = doType === '0' ? 'income' : doType === '1' ? 'expense' : 'transfer';
            const amount = Math.round(Math.abs(Number(t.ZMONEY) || 0));
            const occurredAt = t.ZDATE ? new Date(Number(t.ZDATE)).toISOString() : now;
            const walletId = walletMap.get(String(t.assetUid)) || Array.from(walletMap.values())[0] || 'w_default';
            const toWalletId = type === 'transfer' ? walletMap.get(String(t.toAssetUid)) || null : null;
            const categoryId = type !== 'transfer' ? categoryMap.get(String(t.ctgUid)) || null : null;
            const note = t.ZCONTENT || '';

            await db.runAsync(
              `INSERT INTO transactions (id, type, amount, wallet_id, to_wallet_id, category_id, note, occurred_at, transfer_group_id, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?);`,
              [txId, type, amount, walletId, toWalletId, categoryId, note, occurredAt, now, now]
            );
            txCount++;
          }

          return {
            transactionCount: txCount,
            walletCount: mmAssets.length,
          };
        } finally {
          await db.execAsync('PRAGMA foreign_keys = ON;');
        }
      }
    } finally {
      if (tempDb) {
        await (tempDb as any).closeAsync().catch(() => {});
      }
      await SQLite.deleteDatabaseAsync('temp_import_mm.db').catch(() => {});
      await FileSystem.deleteAsync(tempDbPath, { idempotent: true }).catch(() => {});
    }
  }

  // Fallback / standard: JSON .mmbak parsing
  let parsed: any;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new Error('Format berkas tidak dikenali (bukan JSON atau SQLite .mmbak yang valid).');
  }

  if (!parsed?.data || !Array.isArray(parsed.data.wallets) || !Array.isArray(parsed.data.transactions)) {
    throw new Error('Struktur berkas cadangan .mmbak tidak valid.');
  }

  const { wallets = [], categories = [], transactions = [], budgets = [], settings = [] } = parsed.data;

  await db.execAsync('PRAGMA foreign_keys = OFF;');
  try {
    await db.execAsync(`
      DELETE FROM transactions;
      DELETE FROM budgets;
      DELETE FROM categories;
      DELETE FROM wallets;
      DELETE FROM settings;
    `);

    for (const w of wallets) {
      await db.runAsync(
        `INSERT INTO wallets (id, name, type, color_key, icon_key, initial_balance, include_in_total, is_archived, sort_order, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [w.id, w.name, w.type, w.color_key, w.icon_key, w.initial_balance, w.include_in_total, w.is_archived, w.sort_order, w.created_at, w.updated_at]
      );
    }

    for (const c of categories) {
      await db.runAsync(
        `INSERT INTO categories (id, name, kind, icon_key, color_key, is_default, is_archived, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
        [c.id, c.name, c.kind, c.icon_key, c.color_key, c.is_default, c.is_archived, c.sort_order]
      );
    }

    for (const t of transactions) {
      await db.runAsync(
        `INSERT INTO transactions (id, type, amount, wallet_id, to_wallet_id, category_id, note, occurred_at, transfer_group_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [t.id, t.type, t.amount, t.wallet_id, t.to_wallet_id, t.category_id, t.note, t.occurred_at, t.transfer_group_id, t.created_at, t.updated_at]
      );
    }

    for (const b of budgets) {
      await db.runAsync(
        `INSERT INTO budgets (id, category_id, period, amount, rollover, start_month, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
        [b.id, b.category_id, b.period, b.amount, b.rollover, b.start_month, b.created_at, b.updated_at]
      );
    }

    for (const s of settings) {
      await db.runAsync(
        `INSERT INTO settings (key, value) VALUES (?, ?);`,
        [s.key, s.value]
      );
    }
  } finally {
    await db.execAsync('PRAGMA foreign_keys = ON;');
  }

  return {
    transactionCount: transactions.length,
    walletCount: wallets.length,
  };
}
