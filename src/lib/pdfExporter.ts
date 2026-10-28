import { Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { Transaction } from '../db/types';
import { formatNumberWithDots } from './formatters';

export async function exportTransactionsToPDF(
  transactions: Transaction[],
  filenamePrefix = 'daydream_money_transaksi'
): Promise<boolean> {
  let totalIncome = 0;
  let totalExpense = 0;
  transactions.forEach((t) => {
    if (t.type === 'income') totalIncome += t.amount;
    if (t.type === 'expense') totalExpense += t.amount;
  });
  const netSavings = totalIncome - totalExpense;

  const rowsHtml = transactions
    .map((t, idx) => {
      const d = new Date(t.occurredAt);
      const dateStr = d.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
      const timeStr = d.toTimeString().split(' ')[0].substring(0, 5);

      let typeBadge = '<span class="badge badge-expense">Pengeluaran</span>';
      let amountFormatted = `-Rp ${formatNumberWithDots(t.amount)}`;
      let amountClass = 'amount-expense';

      if (t.type === 'income') {
        typeBadge = '<span class="badge badge-income">Pemasukan</span>';
        amountFormatted = `+Rp ${formatNumberWithDots(t.amount)}`;
        amountClass = 'amount-income';
      } else if (t.type === 'transfer') {
        typeBadge = '<span class="badge badge-transfer">Transfer</span>';
        amountFormatted = `Rp ${formatNumberWithDots(t.amount)}`;
        amountClass = 'amount-transfer';
      }

      const walletInfo =
        t.type === 'transfer' && t.toWalletName
          ? `${t.walletName || 'Dompet'} &rarr; ${t.toWalletName}`
          : t.walletName || '-';

      return `
        <tr>
          <td style="text-align: center; color: #8E98A8;">${idx + 1}</td>
          <td><strong>${dateStr}</strong><br><small style="color: #8E98A8;">${timeStr} WIB</small></td>
          <td>${typeBadge}</td>
          <td>${t.categoryName || '-'}</td>
          <td>${walletInfo}</td>
          <td class="${amountClass}" style="text-align: right; font-weight: 600;">${amountFormatted}</td>
          <td style="color: #6B7789; font-size: 11px;">${t.note || '-'}</td>
        </tr>
      `;
    })
    .join('');

  const printDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Laporan Transaksi - Daydream Money</title>
        <style>
          @page {
            margin: 18mm 14mm;
            size: A4 portrait;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: #1E2A3D;
            background: #FFFFFF;
            margin: 0;
            padding: 0;
            font-size: 12px;
            line-height: 1.4;
          }
          .header {
            border-bottom: 2px solid #8195E5;
            padding-bottom: 14px;
            margin-bottom: 18px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }
          .app-title {
            font-size: 22px;
            font-weight: 800;
            color: #8195E5;
            margin: 0;
            letter-spacing: -0.5px;
          }
          .report-title {
            font-size: 13px;
            color: #6B7789;
            margin-top: 3px;
          }
          .meta-info {
            text-align: right;
            font-size: 11px;
            color: #8E98A8;
          }
          .summary-cards {
            display: flex;
            gap: 12px;
            margin-bottom: 20px;
          }
          .card {
            flex: 1;
            background: #F4F5FB;
            border-radius: 10px;
            padding: 12px 14px;
            border: 1px solid #E2E8F5;
          }
          .card-label {
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #6B7789;
            font-weight: 600;
            margin-bottom: 4px;
          }
          .card-value {
            font-size: 15px;
            font-weight: 700;
          }
          .text-income { color: #56C898; }
          .text-expense { color: #1E2A3D; }
          .text-net { color: ${netSavings >= 0 ? '#8195E5' : '#EB6B78'}; }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 8px;
          }
          th {
            background-color: #F4F5FB;
            color: #6B7789;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 9px 8px;
            text-align: left;
            border-bottom: 1.5px solid #E2E8F5;
          }
          td {
            padding: 8px 8px;
            border-bottom: 1px solid #F0F2F8;
            font-size: 11px;
          }
          tr:nth-child(even) td {
            background-color: #FAFBFE;
          }
          .badge {
            display: inline-block;
            padding: 2px 7px;
            border-radius: 12px;
            font-size: 9px;
            font-weight: 700;
          }
          .badge-income { background: rgba(86, 200, 152, 0.15); color: #2B9C6E; }
          .badge-expense { background: rgba(235, 107, 120, 0.15); color: #D13B4A; }
          .badge-transfer { background: rgba(129, 149, 229, 0.15); color: #647AC7; }
          .amount-income { color: #2B9C6E; }
          .amount-expense { color: #1E2A3D; }
          .amount-transfer { color: #647AC7; }
          .footer {
            margin-top: 28px;
            text-align: center;
            font-size: 10px;
            color: #8E98A8;
            border-top: 1px solid #E2E8F5;
            padding-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="app-title">Daydream Money</h1>
            <div class="report-title">Laporan Riwayat Transaksi</div>
          </div>
          <div class="meta-info">
            <div>Dicetak: ${printDate}</div>
            <div>Total: ${transactions.length} Transaksi</div>
          </div>
        </div>

        <div class="summary-cards">
          <div class="card">
            <div class="card-label">Total Pemasukan</div>
            <div class="card-value text-income">+Rp ${formatNumberWithDots(totalIncome)}</div>
          </div>
          <div class="card">
            <div class="card-label">Total Pengeluaran</div>
            <div class="card-value text-expense">-Rp ${formatNumberWithDots(totalExpense)}</div>
          </div>
          <div class="card">
            <div class="card-label">Selisih Bersih</div>
            <div class="card-value text-net">${netSavings >= 0 ? '+' : ''}Rp ${formatNumberWithDots(netSavings)}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 25px; text-align: center;">No</th>
              <th style="width: 80px;">Tanggal</th>
              <th style="width: 75px;">Tipe</th>
              <th style="width: 95px;">Kategori</th>
              <th style="width: 100px;">Dompet</th>
              <th style="width: 100px; text-align: right;">Nominal</th>
              <th>Catatan</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="footer">
          Laporan dibuat otomatis oleh Daydream Money &bull; Pencatatan Keuangan Pribadi Offline-First
        </div>
      </body>
    </html>
  `;

  if (Platform.OS === 'web') {
    await Print.printAsync({ html });
    return true;
  }

  // Native iOS / Android: save to scoped documentDirectory so FileProvider allows sharing
  const { uri, base64 } = await Print.printToFileAsync({ html, base64: true });
  const filename = `${filenamePrefix}_${new Date().toISOString().split('T')[0]}.pdf`;
  const targetUri = `${FileSystem.documentDirectory}${filename}`;

  if (base64) {
    await FileSystem.writeAsStringAsync(targetUri, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });
  } else {
    await FileSystem.copyAsync({ from: uri, to: targetUri });
  }

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(targetUri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Ekspor PDF Transaksi',
      UTI: 'com.adobe.pdf',
    });
    return true;
  }

  return false;
}
