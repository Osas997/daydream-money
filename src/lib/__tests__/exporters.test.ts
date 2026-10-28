import { describe, test, expect, jest } from '@jest/globals';
import * as XLSX from 'xlsx';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import { exportTransactionsToExcel } from '../excelExporter';
import { exportTransactionsToPDF } from '../pdfExporter';
import { Transaction } from '../../db/types';

jest.mock('react-native', () => ({
  Platform: { OS: 'android' },
}));

jest.mock('expo-file-system/legacy', () => ({
  documentDirectory: 'file:///data/user/0/daydream/',
  writeAsStringAsync: jest.fn(() => Promise.resolve()),
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

    // Verify valid base64 workbook parsable by XLSX
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
});
