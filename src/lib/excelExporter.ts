import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as XLSX from 'xlsx';
import { Transaction } from '../db/types';

export async function exportTransactionsToExcel(
  transactions: Transaction[],
  filenamePrefix = 'daydream_money_transaksi'
): Promise<boolean> {
  const data = transactions.map((t, idx) => {
    const d = new Date(t.occurredAt);
    const dateStr = d.toISOString().split('T')[0];
    const timeStr = d.toTimeString().split(' ')[0].substring(0, 5);

    let typeLabel = 'Pengeluaran';
    if (t.type === 'income') typeLabel = 'Pemasukan';
    if (t.type === 'transfer') typeLabel = 'Transfer';

    return {
      'No': idx + 1,
      'Tanggal': dateStr,
      'Jam': timeStr,
      'Tipe': typeLabel,
      'Kategori': t.categoryName || '-',
      'Dompet': t.walletName || '-',
      'Ke Dompet': t.toWalletName || '-',
      'Nominal (Rp)': t.amount,
      'Catatan': t.note || '',
    };
  });

  const ws = XLSX.utils.json_to_sheet(data);
  ws['!cols'] = [
    { wch: 6 },
    { wch: 14 },
    { wch: 10 },
    { wch: 14 },
    { wch: 20 },
    { wch: 16 },
    { wch: 16 },
    { wch: 18 },
    { wch: 32 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Riwayat Transaksi');

  const filename = `${filenamePrefix}_${new Date().toISOString().split('T')[0]}.xlsx`;

  if (Platform.OS === 'web') {
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  }

  // Native iOS / Android
  const base64 = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
  const fileUri = `${FileSystem.documentDirectory}${filename}`;
  await FileSystem.writeAsStringAsync(fileUri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(fileUri, {
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      dialogTitle: 'Ekspor Excel Transaksi',
      UTI: 'com.microsoft.excel.openxml',
    });
    return true;
  }

  return false;
}
