import { describe, test, expect, jest } from '@jest/globals';
import * as XLSX from 'xlsx';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import * as DocumentPicker from 'expo-document-picker';
import * as SQLite from 'expo-sqlite';
import { exportTransactionsToExcel } from '../excelExporter';
import { exportTransactionsToPDF } from '../pdfExporter';
import { generateBackupFilename, exportBackup, importBackup } from '../backupManager';
import { importTransactionsFromExcel } from '../excelImporter';
import { Transaction } from '../../db/types';

jest.mock('react-native', () => ({
  Platform: { OS: 'android' },
}));

type AnyMock = jest.Mock<(...args: any[]) => any>;

const mockDb = {
  getAllAsync: jest.fn<(...args: any[]) => any>(),
  runAsync: jest.fn<(...args: any[]) => any>(),
  execAsync: jest.fn<(...args: any[]) => any>(),
};

jest.mock('../../db/client', () => ({
  getDb: jest.fn(() => Promise.resolve(mockDb)),
}));

jest.mock('expo-file-system/legacy', () => ({
  documentDirectory: 'file:///data/user/0/daydream/',
  writeAsStringAsync: jest.fn(() => Promise.resolve()),
  readAsStringAsync: jest.fn(() => Promise.resolve('')),
  getInfoAsync: jest.fn(() => Promise.resolve({ exists: true })),
  makeDirectoryAsync: jest.fn(() => Promise.resolve()),
  copyAsync: jest.fn(() => Promise.resolve()),
  deleteAsync: jest.fn(() => Promise.resolve()),
  EncodingType: { Base64: 'base64', UTF8: 'utf8' },
}));

jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(() => Promise.resolve(true)),
  shareAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('expo-print', () => ({
  printToFileAsync: jest.fn(() => Promise.resolve({ uri: 'file:///cache/print.pdf', base64: 'fake-pdf-base64', numberOfPages: 1 })),
  printAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn<any>(),
}));

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn<any>(),
  deleteDatabaseAsync: jest.fn<any>(() => Promise.resolve()),
}));

const mockTransactions: Transaction[] = [
  {
    id: 'tx-1',
    amount: 50000,
    type: 'expense',
    categoryId: 'c-1',
    categoryName: 'Makanan',
    walletId: 'w-1',
    walletName: 'Dompet Utama',
    occurredAt: '2026-10-28T12:00:00.000Z',
    note: 'Makan siang',
    createdAt: '2026-10-28T12:00:00.000Z',
    updatedAt: '2026-10-28T12:00:00.000Z',
  },
  {
    id: 'tx-2',
    amount: 5000000,
    type: 'income',
    categoryId: 'c-2',
    categoryName: 'Gaji',
    walletId: 'w-1',
    walletName: 'Dompet Utama',
    occurredAt: '2026-10-28T09:00:00.000Z',
    note: 'Gaji bulanan',
    createdAt: '2026-10-28T09:00:00.000Z',
    updatedAt: '2026-10-28T09:00:00.000Z',
  },
];

describe('Exporters Tests', () => {
  test('exportTransactionsToExcel builds valid xlsx workbook and triggers sharing', async () => {
    const success = await exportTransactionsToExcel(mockTransactions, 'test_export');
    expect(success).toBe(true);

    expect(FileSystem.writeAsStringAsync).toHaveBeenCalled();
    const [fileUri, base64Content] = (FileSystem.writeAsStringAsync as jest.Mock).mock.calls[0] as [string, string];
    expect(fileUri).toContain('test_export_');
    expect(fileUri.endsWith('.xlsx')).toBe(true);

    const parsedWb = XLSX.read(base64Content, { type: 'base64' });
    expect(parsedWb.SheetNames).toContain('Riwayat Transaksi');
    const sheetData = XLSX.utils.sheet_to_json(parsedWb.Sheets['Riwayat Transaksi']);
    expect(sheetData.length).toBe(2);

    expect(Sharing.shareAsync).toHaveBeenCalledWith(
      fileUri,
      expect.objectContaining({
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
    );
  });

  test('exportTransactionsToPDF generates HTML and creates PDF file for sharing', async () => {
    const success = await exportTransactionsToPDF(mockTransactions, 'test_pdf');
    expect(success).toBe(true);

    expect(Print.printToFileAsync).toHaveBeenCalled();
    const [{ html }] = (Print.printToFileAsync as jest.Mock).mock.calls[0] as [{ html: string }];
    expect(html).toContain('Daydream Money');
    expect(html).toContain('Makanan');
    expect(html).toContain('Gaji');
    expect(html).toContain('5.000.000');

    expect(Sharing.shareAsync).toHaveBeenCalledWith(
      expect.stringMatching(/test_pdf_.*\.pdf$/),
      expect.objectContaining({
        mimeType: 'application/pdf',
      })
    );
  });

  test('generateBackupFilename creates @MM(dd-mm-yy-hhmmss).mmbak pattern', () => {
    const fixedDate = new Date(2026, 9, 28, 13, 35, 35); // 28 Oct 2026 13:35:35
    const filename = generateBackupFilename(fixedDate);
    expect(filename).toBe('@MM(28-10-26-133535).mmbak');
  });

  test('exportBackup exports full sqlite tables to .mmbak file and shares it', async () => {
    mockDb.getAllAsync.mockResolvedValueOnce([
      { id: 'w-1', name: 'Dompet Utama', type: 'cash', color_key: '#8195E5', icon_key: 'cash', initial_balance: 0, include_in_total: 1, is_archived: 0, sort_order: 0, created_at: '2026-10-28', updated_at: '2026-10-28' },
    ]);
    mockDb.getAllAsync.mockResolvedValueOnce([
      { id: 'c-1', name: 'Makanan', kind: 'expense', icon_key: 'food', color_key: '#8195E5', is_default: 1, is_archived: 0, sort_order: 0 },
    ]);
    mockDb.getAllAsync.mockResolvedValueOnce([
      { id: 'tx-1', type: 'expense', amount: 50000, wallet_id: 'w-1', to_wallet_id: null, category_id: 'c-1', note: 'Bakso', occurred_at: '2026-10-28', transfer_group_id: null, created_at: '2026-10-28', updated_at: '2026-10-28' },
    ]);
    mockDb.getAllAsync.mockResolvedValueOnce([]);
    mockDb.getAllAsync.mockResolvedValueOnce([{ key: 'currency', value: 'IDR' }]);

    const success = await exportBackup();
    expect(success).toBe(true);

    expect(FileSystem.writeAsStringAsync).toHaveBeenCalled();
    const calls = (FileSystem.writeAsStringAsync as jest.Mock).mock.calls;
    const lastCall = calls[calls.length - 1] as [string, string];
    expect(lastCall[0]).toMatch(/@MM\(.*?\)\.mmbak$/);

    const payload = JSON.parse(lastCall[1]);
    expect(payload.format).toBe('daydream_mmbak');
    expect(payload.data.transactions.length).toBe(1);
    expect(payload.data.wallets.length).toBe(1);
  });

  test('importBackup restores tables from valid .mmbak content', async () => {
    const backupJson = JSON.stringify({
      format: 'daydream_mmbak',
      version: 1,
      data: {
        wallets: [{ id: 'w-1', name: 'Dompet Utama' }],
        categories: [{ id: 'c-1', name: 'Makanan', kind: 'expense' }],
        transactions: [{ id: 'tx-1', type: 'expense', amount: 25000, wallet_id: 'w-1' }],
        budgets: [],
        settings: [{ key: 'currency', value: 'IDR' }],
      },
    });

    (DocumentPicker.getDocumentAsync as AnyMock).mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file:///mock/@MM(28-10-26-133535).mmbak', name: '@MM(28-10-26-133535).mmbak' }],
    });
    (FileSystem.readAsStringAsync as AnyMock).mockResolvedValueOnce(backupJson.slice(0, 16));
    (FileSystem.readAsStringAsync as AnyMock).mockResolvedValueOnce(backupJson);

    const result = await importBackup();
    expect(result).not.toBeNull();
    expect(result?.transactionCount).toBe(1);
    expect(result?.walletCount).toBe(1);

    expect(mockDb.execAsync).toHaveBeenCalledWith('PRAGMA foreign_keys = OFF;');
    expect(mockDb.execAsync).toHaveBeenCalledWith('PRAGMA foreign_keys = ON;');
    expect(mockDb.runAsync).toHaveBeenCalled();
  });

  test('importBackup restores tables from Money Manager SQLite .mmbak format', async () => {
    const mockTempDb = {
      getAllAsync: jest.fn<(...args: any[]) => any>()
        .mockResolvedValueOnce([{ name: 'INOUTCOME' }, { name: 'ASSETS' }, { name: 'ZCATEGORY' }])
        .mockResolvedValueOnce([{ uid: '1', NIC_NAME: 'Bank', ORDERSEQ: 0 }])
        .mockResolvedValueOnce([{ uid: '2', NAME: 'Gaji', TYPE: '0', ORDERSEQ: 0 }])
        .mockResolvedValueOnce([
          { uid: 'tx-1', DO_TYPE: '0', ZMONEY: 5000000, ZDATE: 1792635201598, assetUid: '1', ctgUid: '2', ZCONTENT: 'Gaji pertama' },
        ]),
      closeAsync: jest.fn<(...args: any[]) => any>(() => Promise.resolve()),
    };

    (SQLite.openDatabaseAsync as AnyMock).mockResolvedValueOnce(mockTempDb);

    (DocumentPicker.getDocumentAsync as AnyMock).mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'content://mock/MM.mmbak', name: 'MM(28-10-26-133535).mmbak' }],
    });
    (FileSystem.readAsStringAsync as AnyMock).mockResolvedValueOnce('SQLite format 3\0');
    (FileSystem.getInfoAsync as AnyMock || jest.fn()).mockResolvedValueOnce({ exists: true });

    const result = await importBackup();
    expect(result).not.toBeNull();
    expect(result?.transactionCount).toBe(1);
    expect(result?.walletCount).toBe(1);
    expect(mockDb.execAsync).toHaveBeenCalledWith('PRAGMA foreign_keys = OFF;');
    expect(mockDb.execAsync).toHaveBeenCalledWith('PRAGMA foreign_keys = ON;');
  });

  test('importTransactionsFromExcel parses rows and inserts into transactions table', async () => {
    const wb = XLSX.utils.book_new();
    const data = [
      {
        'Tanggal': '2026-10-28',
        'Jam': '14:00',
        'Tipe': 'Pengeluaran',
        'Kategori': 'Makan',
        'Dompet': 'Dompet Tunai',
        'Nominal (Rp)': 35000,
        'Catatan': 'Nasi padang',
      },
    ];
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Transaksi');
    const base64 = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });

    (DocumentPicker.getDocumentAsync as AnyMock).mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file:///mock/transaksi.xlsx', name: 'transaksi.xlsx' }],
    });
    (FileSystem.readAsStringAsync as AnyMock).mockResolvedValueOnce(base64);

    mockDb.getAllAsync.mockResolvedValueOnce([{ id: 'w-tunai', name: 'Dompet Tunai' }]);
    mockDb.getAllAsync.mockResolvedValueOnce([{ id: 'c-makan', name: 'Makan', kind: 'expense' }]);

    const result = await importTransactionsFromExcel();
    expect(result).not.toBeNull();
    expect(result?.importedCount).toBe(1);
    expect(mockDb.runAsync).toHaveBeenCalled();
  });

  test('importTransactionsFromExcel handles Money Manager column naming (Tanggal, Aset, IDR, Pendapatan/Pengeluaran)', async () => {
    const wb = XLSX.utils.book_new();
    const data = [
      {
        'Tanggal': '28/10/2026 14:11:57',
        'Aset': 'Bank',
        'Kategori': '🍜 Makanan',
        'Catatan': 'Sisir',
        'IDR': 150000,
        'Pendapatan/Pengeluaran': 'Pengeluaran',
        'Deskripsi': 'Deskripsi Sisir',
        'Total': 150000,
      },
    ];
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Pengelola Keuangan');
    const base64 = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });

    (DocumentPicker.getDocumentAsync as AnyMock).mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file:///mock/Pengelola Keuangan.xls', name: 'Pengelola Keuangan.xls' }],
    });
    (FileSystem.readAsStringAsync as AnyMock).mockResolvedValueOnce(base64);

    mockDb.getAllAsync.mockResolvedValueOnce([{ id: 'wallet-default-bank', name: 'Rekening Bank' }]);
    mockDb.getAllAsync.mockResolvedValueOnce([{ id: 'cat-exp-food', name: 'Makan & Minum', kind: 'expense' }]);

    const result = await importTransactionsFromExcel();
    expect(result).not.toBeNull();
    expect(result?.importedCount).toBe(1);
    expect(mockDb.runAsync).toHaveBeenCalled();
  });
});
