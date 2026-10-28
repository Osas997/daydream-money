import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as DocumentPicker from 'expo-document-picker';
import * as XLSX from 'xlsx';
import { getDb } from '../db/client';

function parseDateTime(dateVal: any, timeVal?: any): string {
  let dateObj: Date | null = null;

  if (typeof dateVal === 'number') {
    // Excel date serial number
    dateObj = new Date(Math.round((dateVal - 25569) * 86400 * 1000));
  } else if (typeof dateVal === 'string') {
    const s = dateVal.trim();
    const [datePart, timePart] = s.split(/\s+/);
    if (!timeVal && timePart) {
      timeVal = timePart;
    }
    if (/^\d{4}-\d{2}-\d{2}/.test(datePart)) {
      dateObj = new Date(datePart);
    } else if (/^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}/.test(datePart)) {
      const parts = datePart.split(/[/-]/);
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      let year = parseInt(parts[2], 10);
      if (year < 100) year += 2000;
      dateObj = new Date(year, month, day);
    } else {
      const parsed = new Date(s);
      if (!isNaN(parsed.getTime())) dateObj = parsed;
    }
  }

  if (!dateObj || isNaN(dateObj.getTime())) {
    dateObj = new Date();
  }

  if (timeVal && typeof timeVal === 'string' && /^\d{1,2}:\d{2}/.test(timeVal.trim())) {
    const [hh, mm, ss] = timeVal.trim().split(':').map((x: string) => parseInt(x, 10));
    dateObj.setHours(hh || 12, mm || 0, ss || 0, 0);
  }

  return dateObj.toISOString();
}

function parseAmount(val: any): number {
  if (typeof val === 'number') return Math.abs(Math.round(val));
  if (typeof val === 'string') {
    const digits = val.replace(/[^0-9]/g, '');
    const num = parseInt(digits, 10);
    return isNaN(num) ? 0 : Math.abs(num);
  }
  return 0;
}

function parseType(val: any): 'expense' | 'income' | 'transfer' {
  const s = String(val || '').toLowerCase();
  if (
    s.includes('income') ||
    s.includes('pemasukan') ||
    s.includes('masuk') ||
    s.includes('pendapatan')
  ) {
    return 'income';
  }
  if (s.includes('transfer') || s.includes('pindah')) return 'transfer';
  return 'expense';
}

function findValue(row: Record<string, any>, candidates: string[]): any {
  for (const c of candidates) {
    if (row[c] !== undefined && row[c] !== null && String(row[c]).trim() !== '') {
      return row[c];
    }
  }
  return undefined;
}

export async function importTransactionsFromExcel(): Promise<{ importedCount: number } | null> {
  const res = await DocumentPicker.getDocumentAsync({
    type: [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      '*/*',
    ],
    copyToCacheDirectory: Platform.OS === 'ios',
  });

  if (res.canceled || !res.assets || res.assets.length === 0) {
    return null;
  }

  const asset = res.assets[0];
  let workbook: XLSX.WorkBook;

  if (Platform.OS === 'web' && asset.file) {
    const arrayBuffer = await asset.file.arrayBuffer();
    workbook = XLSX.read(arrayBuffer, { type: 'array' });
  } else {
    const base64 = await FileSystem.readAsStringAsync(asset.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    workbook = XLSX.read(base64, { type: 'base64' });
  }

  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error('File Excel tidak memiliki lembar kerja (worksheet).');
  }

  const sheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: '' });

  if (rows.length === 0) {
    throw new Error('Tidak ada data transaksi ditemukan dalam file Excel.');
  }

  const db = await getDb();
  const existingWallets = await db.getAllAsync<{ id: string; name: string }>(
    'SELECT id, name FROM wallets WHERE is_archived = 0;'
  );
  const existingCategories = await db.getAllAsync<{ id: string; name: string; kind: string }>(
    'SELECT id, name, kind FROM categories;'
  );

  let defaultWalletId = existingWallets[0]?.id;
  if (!defaultWalletId) {
    defaultWalletId = 'w_default';
    const now = new Date().toISOString();
    await db.runAsync(
      `INSERT INTO wallets (id, name, type, color_key, icon_key, initial_balance, include_in_total, is_archived, sort_order, created_at, updated_at)
       VALUES (?, 'Dompet Utama', 'cash', '#8195E5', 'cash', 0, 1, 0, 0, ?, ?);`,
      [defaultWalletId, now, now]
    );
    existingWallets.push({ id: defaultWalletId, name: 'Dompet Utama' });
  }

  const getOrCreateWallet = async (name?: string): Promise<string> => {
    const clean = (name || '').trim();
    if (!clean) return defaultWalletId;
    const found = existingWallets.find(
      (w) =>
        w.name.toLowerCase() === clean.toLowerCase() ||
        (clean.toLowerCase() === 'bank' && w.name.toLowerCase().includes('bank'))
    );
    if (found) return found.id;

    const newId = `wallet_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    await db.runAsync(
      `INSERT INTO wallets (id, name, type, color_key, icon_key, initial_balance, include_in_total, is_archived, sort_order, created_at, updated_at)
       VALUES (?, ?, 'cash', '#8195E5', 'cash', 0, 1, 0, 99, ?, ?);`,
      [newId, clean, now, now]
    );
    existingWallets.push({ id: newId, name: clean });
    return newId;
  };

  const getOrCreateCategory = async (
    name?: string,
    kind: 'expense' | 'income' = 'expense'
  ): Promise<string | null> => {
    const clean = (name || '').trim();
    if (!clean) {
      const fallback = existingCategories.find((c) => c.kind === kind);
      return fallback ? fallback.id : null;
    }
    const found = existingCategories.find(
      (c) =>
        c.kind === kind &&
        (c.name.toLowerCase() === clean.toLowerCase() ||
          (clean.toLowerCase() === 'makanan' && c.name.toLowerCase().includes('makan')))
    );
    if (found) return found.id;

    const newId = `cat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    await db.runAsync(
      `INSERT INTO categories (id, name, kind, icon_key, color_key, is_default, is_archived, sort_order)
       VALUES (?, ?, ?, 'tag', '#8195E5', 0, 0, 99);`,
      [newId, clean, kind]
    );
    existingCategories.push({ id: newId, name: clean, kind });
    return newId;
  };

  let importedCount = 0;
  const now = new Date().toISOString();

  for (const row of rows) {
    const dateVal = findValue(row, ['Tanggal', 'Date', 'tanggal', 'date', 'Tgl', 'Waktu']);
    const timeVal = findValue(row, ['Jam', 'Time', 'jam', 'time', 'Waktu Jam']);
    const typeVal = findValue(row, [
      'Tipe',
      'Type',
      'tipe',
      'type',
      'Jenis',
      'Pendapatan/Pengeluaran',
      'pendapatan/pengeluaran',
      'Jenis Transaksi',
    ]);
    const amountVal = findValue(row, [
      'Nominal (Rp)',
      'Nominal',
      'Jumlah',
      'Amount',
      'nominal',
      'amount',
      'Total',
      'total',
      'IDR',
      'idr',
      'Nilai',
    ]);
    const catVal = findValue(row, ['Kategori', 'Category', 'kategori', 'category', 'Kategori Utama']);
    const subCatVal = findValue(row, ['Sub kategori', 'Subkategori', 'Sub Category', 'sub kategori']);
    const walletVal = findValue(row, ['Dompet', 'Wallet', 'Rekening', 'dompet', 'wallet', 'Aset', 'aset', 'Akun', 'Account']);
    const toWalletVal = findValue(row, ['Ke Dompet', 'To Wallet', 'ke dompet', 'to wallet', 'Ke Aset', 'ke aset', 'Tujuan']);
    const noteVal = findValue(row, ['Catatan', 'Note', 'catatan', 'note']);
    const descVal = findValue(row, ['Deskripsi', 'deskripsi', 'Keterangan', 'keterangan']);

    const amount = parseAmount(amountVal);
    if (amount <= 0) continue;

    const txType = parseType(typeVal);
    const occurredAt = parseDateTime(dateVal, timeVal);
    const walletId = await getOrCreateWallet(walletVal);
    const toWalletId = txType === 'transfer' ? await getOrCreateWallet(toWalletVal) : null;

    const rawCategory = catVal || subCatVal || '';
    const cleanCategory = rawCategory.replace(/^[\p{Extended_Pictographic}\u{1F300}-\u{1F9FF}\s]+/u, '').trim() || rawCategory.trim();
    const categoryId = txType !== 'transfer' ? await getOrCreateCategory(cleanCategory, txType) : null;

    const combinedNote = [noteVal, descVal && descVal !== noteVal ? descVal : null]
      .filter(Boolean)
      .join(' - ');

    const txId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    await db.runAsync(
      `INSERT INTO transactions (id, type, amount, wallet_id, to_wallet_id, category_id, note, occurred_at, transfer_group_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?);`,
      [txId, txType, amount, walletId, toWalletId, categoryId, combinedNote, occurredAt, now, now]
    );

    importedCount++;
  }

  return { importedCount };
}
