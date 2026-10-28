import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Switch,
  Alert,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PageGradient } from '../../components/PageGradient';
import { TopAppBar } from '../../components/glass/TopAppBar';
import { GlassCard } from '../../components/glass/GlassCard';
import { ListRow } from '../../components/glass/ListRow';
import { InputText } from '../../components/glass/InputText';
import { ButtonPrimary } from '../../components/glass/ButtonPrimary';
import { useSettingsStore } from '../../store/settingsStore';
import { useTransactionStore } from '../../store/transactionStore';
import { useWalletStore } from '../../store/walletStore';
import { useCategoryStore } from '../../store/categoryStore';
import * as txRepo from '../../db/repositories/transactionsRepo';
import * as settingsRepo from '../../db/repositories/settingsRepo';
import { exportTransactionsToPDF } from '../../lib/pdfExporter';
import { exportTransactionsToExcel } from '../../lib/excelExporter';
import { exportBackup, importBackup } from '../../lib/backupManager';
import { importTransactionsFromExcel } from '../../lib/excelImporter';
import { colors, radius, spacing } from '../../theme/tokens';
import { typography } from '../../theme/typography';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const {
    monthStartDay,
    setMonthStartDay,
    appLockEnabled,
    setAppLockEnabled,
    refreshSettings,
  } = useSettingsStore();

  const { refreshTransactions } = useTransactionStore();
  const { refreshWallets } = useWalletStore();
  const { refreshCategories } = useCategoryStore();

  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [exporting, setExporting] = useState(false);

  const handleStartDayChange = () => {
    if (Alert.prompt) {
      Alert.prompt(
        'Tanggal Awal Bulan',
        'Masukkan tanggal awal siklus keuangan bulanan (1-28):',
        async (text) => {
          const day = parseInt(text, 10);
          if (day >= 1 && day <= 28) {
            await setMonthStartDay(day);
            await refreshTransactions(day);
          } else {
            Alert.alert('Perhatian', 'Tanggal harus antara 1 sampai 28');
          }
        },
        'plain-text',
        monthStartDay.toString()
      );
    } else {
      // Fallback toggle between common salary days (1 or 25)
      const nextDay = monthStartDay === 1 ? 25 : 1;
      setMonthStartDay(nextDay);
      refreshTransactions(nextDay);
    }
  };

  const handleToggleLock = (val: boolean) => {
    if (val) {
      setNewPin('');
      setConfirmPin('');
      setPinModalVisible(true);
    } else {
      Alert.alert(
        'Nonaktifkan Kunci',
        'Apakah Anda yakin ingin mematikan kunci keamanan aplikasi?',
        [
          { text: 'Batal', style: 'cancel' },
          {
            text: 'Matikan',
            style: 'destructive',
            onPress: () => setAppLockEnabled(false),
          },
        ]
      );
    }
  };

  const handleSavePin = async () => {
    if (newPin.length !== 6 || !/^\d+$/.test(newPin)) {
      Alert.alert('Perhatian', 'PIN harus berupa 6 angka');
      return;
    }
    if (newPin !== confirmPin) {
      Alert.alert('Perhatian', 'Konfirmasi PIN tidak cocok');
      return;
    }

    await setAppLockEnabled(true, newPin);
    setPinModalVisible(false);
    Alert.alert('Berhasil', 'Kunci PIN keamanan aplikasi telah aktif');
  };

  const handleExportPDF = async () => {
    if (exporting) return;
    try {
      setExporting(true);
      const allTransactions = await txRepo.getTransactions({});
      if (allTransactions.length === 0) {
        Alert.alert('Informasi', 'Tidak ada data transaksi untuk diekspor.');
        return;
      }

      await exportTransactionsToPDF(allTransactions);
    } catch (e: any) {
      Alert.alert('Gagal Ekspor PDF', e?.message || 'Terjadi kesalahan saat mengekspor dokumen PDF.');
    } finally {
      setExporting(false);
    }
  };

  const handleExportExcel = async () => {
    if (exporting) return;
    try {
      setExporting(true);
      const allTransactions = await txRepo.getTransactions({});
      if (allTransactions.length === 0) {
        Alert.alert('Informasi', 'Tidak ada data transaksi untuk diekspor.');
        return;
      }

      await exportTransactionsToExcel(allTransactions);
    } catch (e: any) {
      Alert.alert('Gagal Ekspor Excel', e?.message || 'Terjadi kesalahan saat mengekspor spreadsheet Excel.');
    } finally {
      setExporting(false);
    }
  };

  const handleExportBackup = async () => {
    if (exporting) return;
    try {
      setExporting(true);
      await exportBackup();
    } catch (e: any) {
      Alert.alert('Gagal Ekspor Cadangan', e?.message || 'Terjadi kesalahan saat mengekspor data cadangan.');
    } finally {
      setExporting(false);
    }
  };

  const handleImportBackup = () => {
    Alert.alert(
      'Pulihkan Cadangan (.mmbak)',
      'Memulihkan berkas cadangan akan menimpa seluruh data dan transaksi saat ini. Pastikan Anda telah mencadangkan data penting sebelumnya. Lanjutkan?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Pilih Berkas & Pulihkan',
          onPress: async () => {
            try {
              setExporting(true);
              const result = await importBackup();
              if (result) {
                await refreshSettings();
                await refreshWallets();
                await refreshCategories();
                await refreshTransactions(monthStartDay);
                Alert.alert(
                  'Pemulihan Berhasil',
                  `Berhasil memulihkan ${result.transactionCount} transaksi dan ${result.walletCount} dompet.`
                );
              }
            } catch (e: any) {
              Alert.alert('Gagal Impor Cadangan', e?.message || 'Berkas cadangan tidak valid atau rusak.');
            } finally {
              setExporting(false);
            }
          },
        },
      ]
    );
  };

  const handleImportExcel = async () => {
    try {
      setExporting(true);
      const result = await importTransactionsFromExcel();
      if (result) {
        await refreshWallets();
        await refreshCategories();
        await refreshTransactions(monthStartDay);
        Alert.alert(
          'Impor Selesai',
          `Berhasil menambahkan ${result.importedCount} transaksi dari spreadsheet Excel.`
        );
      }
    } catch (e: any) {
      Alert.alert('Gagal Impor Excel', e?.message || 'Terjadi kesalahan saat mengimpor data Excel.');
    } finally {
      setExporting(false);
    }
  };

  const handleResetData = () => {
    Alert.alert(
      'Reset Semua Data',
      'Peringatan: Semua transaksi, dompet kustom, dan anggaran akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Lanjutkan',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Konfirmasi Ulang',
              'Apakah Anda benar-benar yakin ingin menghapus SEMUA data?',
              [
                { text: 'Batal', style: 'cancel' },
                {
                  text: 'Ya, Hapus Semua',
                  style: 'destructive',
                  onPress: async () => {
                    await settingsRepo.resetAllData();
                    await refreshSettings();
                    await refreshWallets();
                    await refreshCategories();
                    await refreshTransactions(1);
                    Alert.alert('Selesai', 'Data aplikasi telah di-reset ke kondisi awal.');
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  return (
    <PageGradient>
      <TopAppBar
        leftIcon="chevronLeft"
        onLeftPress={() => router.back()}
        title="Pengaturan"
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: Math.max(insets.bottom, 24),
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* General Settings */}
        <Text style={[typography.labelUppercase, styles.sectionHeader]}>
          PENGATURAN UMUM
        </Text>

        <ListRow
          title="Tanggal Awal Bulan"
          subtitle={`Siklus keuangan dimulai setiap tanggal ${monthStartDay}`}
          icon="calendar"
          onPress={handleStartDayChange}
        />

        <ListRow
          title="Kelola Dompet"
          subtitle="Tambah atau ubah rekening dan e-wallet"
          icon="bank"
          onPress={() => router.push('/wallets')}
        />

        <ListRow
          title="Kelola Kategori"
          subtitle="Atur kategori pengeluaran & pemasukan"
          icon="shopping"
          onPress={() => router.push('/categories')}
        />

        {/* Security Section */}
        <Text style={[typography.labelUppercase, styles.sectionHeader, { marginTop: spacing.md }]}>
          KEAMANAN & PRIVASI
        </Text>

        <ListRow
          title="Kunci Aplikasi (PIN 6 Digit)"
          subtitle={appLockEnabled ? 'Aktif' : 'Nonaktif'}
          icon="lock"
          rightElement={
            <Switch
              value={appLockEnabled}
              onValueChange={handleToggleLock}
              trackColor={{ false: colors.glass.borderSoft, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          }
        />

        {/* Backup & Data Section */}
        <Text style={[typography.labelUppercase, styles.sectionHeader, { marginTop: spacing.md }]}>
          CADANGAN & PEMULIHAN (.MMBAK)
        </Text>

        <ListRow
          title="Ekspor Cadangan (.mmbak)"
          subtitle="Simpan data ke berkas @MM(...).mmbak untuk dipindahkan"
          icon="backup"
          onPress={handleExportBackup}
        />

        <ListRow
          title="Impor Cadangan (.mmbak)"
          subtitle="Pulihkan seluruh data aplikasi dari berkas .mmbak"
          icon="upload"
          onPress={handleImportBackup}
        />

        {/* Documents Export & Import */}
        <Text style={[typography.labelUppercase, styles.sectionHeader, { marginTop: spacing.md }]}>
          DOKUMEN & SPREADSHEET
        </Text>

        <ListRow
          title="Ekspor PDF"
          subtitle="Unduh riwayat transaksi dalam dokumen PDF rapi"
          icon="pdf"
          onPress={handleExportPDF}
        />

        <ListRow
          title="Ekspor Excel (.xlsx)"
          subtitle="Unduh riwayat transaksi ke spreadsheet Excel"
          icon="excel"
          onPress={handleExportExcel}
        />

        <ListRow
          title="Impor Excel (.xlsx)"
          subtitle="Masukkan data transaksi dari berkas spreadsheet Excel"
          icon="excel"
          onPress={handleImportExcel}
        />

        <ListRow
          title="Reset Semua Data"
          subtitle="Hapus semua catatan dan kembalikan ke awal"
          icon="trash"
          iconColor={colors.error}
          iconBgColor="rgba(233, 123, 134, 0.15)"
          onPress={handleResetData}
        />

        {/* About App */}
        <Text style={[typography.labelUppercase, styles.sectionHeader, { marginTop: spacing.md }]}>
          TENTANG APLIKASI
        </Text>

        <GlassCard style={styles.aboutCard} padding={spacing.md}>
          <Text style={[typography.headlineSm, styles.appName]}>
            Daydream Money
          </Text>
          <Text style={[typography.caption, styles.version]}>Versi 1.0.0 (MVP)</Text>
          <Text style={[typography.bodySm, styles.aboutDesc]}>
            Pencatatan keuangan pribadi cepat, tenang, dan offline-first dengan Soft Glass Daydream UI.
          </Text>
        </GlassCard>
      </ScrollView>

      {/* Set PIN Modal */}
      <Modal
        visible={pinModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPinModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <GlassCard style={styles.modalCard} padding={spacing.lg}>
            <Text style={[typography.headlineSm, styles.modalTitle]}>
              Buat PIN Keamanan (6 Digit)
            </Text>
            <Text style={[typography.caption, styles.modalDesc]}>
              PIN ini akan diminta setiap kali aplikasi dibuka.
            </Text>

            <InputText
              placeholder="Masukkan 6 angka PIN"
              value={newPin}
              onChangeText={setNewPin}
              keyboardType="numeric"
              maxLength={6}
              secureTextEntry
              containerStyle={{ marginTop: spacing.md, marginBottom: spacing.sm }}
            />

            <InputText
              placeholder="Konfirmasi 6 angka PIN"
              value={confirmPin}
              onChangeText={setConfirmPin}
              keyboardType="numeric"
              maxLength={6}
              secureTextEntry
              containerStyle={{ marginBottom: spacing.md }}
            />

            <ButtonPrimary label="Simpan PIN" onPress={handleSavePin} />
          </GlassCard>
        </View>
      </Modal>
    </PageGradient>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.gutter,
    paddingTop: spacing.sm,
  },
  sectionHeader: {
    color: colors.onSurfaceVariant,
    marginBottom: spacing.xs,
    marginLeft: 4,
  },
  aboutCard: {
    marginTop: 4,
  },
  appName: {
    color: colors.onSurface,
    fontWeight: '600',
  },
  version: {
    color: colors.primary,
    marginBottom: 6,
  },
  aboutDesc: {
    color: colors.onSurfaceVariant,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
    padding: spacing.sm,
  },
  modalCard: {
    borderRadius: radius.xl,
    backgroundColor: '#FFFFFF',
  },
  modalTitle: {
    color: colors.onSurface,
  },
  modalDesc: {
    color: colors.onSurfaceVariant,
    marginTop: 4,
  },
});
