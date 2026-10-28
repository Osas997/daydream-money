import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PageGradient } from '../../components/PageGradient';
import { TopAppBar } from '../../components/glass/TopAppBar';
import { GlassCard } from '../../components/glass/GlassCard';
import { ListRow } from '../../components/glass/ListRow';
import { ButtonPrimary } from '../../components/glass/ButtonPrimary';
import { InputText } from '../../components/glass/InputText';
import { useWalletStore } from '../../store/walletStore';
import { useSettingsStore } from '../../store/settingsStore';
import { colors, radius, spacing } from '../../theme/tokens';
import { typography } from '../../theme/typography';
import { AppIcon } from '../../theme/icons';
import { formatCurrency } from '../../lib/formatters';
import { parseNominal } from '../../lib/nominalParser';

export default function WalletsScreen() {
  const insets = useSafeAreaInsets();
  const { wallets, totalBalance, correctBalance, archiveWallet } = useWalletStore();
  const { hideBalance } = useSettingsStore();

  const [adjustModalVisible, setAdjustModalVisible] = useState(false);
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);
  const [targetBalanceText, setTargetBalanceText] = useState('');

  const openAdjustModal = (id: string) => {
    setSelectedWalletId(id);
    setTargetBalanceText('');
    setAdjustModalVisible(true);
  };

  const handleSaveCorrection = async () => {
    if (!selectedWalletId) return;
    const target = parseNominal(targetBalanceText);
    await correctBalance(selectedWalletId, target, 'Koreksi Saldo Manual');
    setAdjustModalVisible(false);
  };

  const handleArchive = (id: string, name: string) => {
    Alert.alert(
      'Arsipkan Dompet',
      `Apakah Anda yakin ingin mengarsipkan dompet "${name}"?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Arsipkan',
          style: 'destructive',
          onPress: () => archiveWallet(id),
        },
      ]
    );
  };

  return (
    <PageGradient>
      <TopAppBar
        leftIcon="chevronLeft"
        onLeftPress={() => router.back()}
        title="Kelola Dompet"
        rightIcon="plus"
        onRightPress={() => router.push('/wallets/add')}
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
        {/* Total Balance Card */}
        <GlassCard style={styles.totalCard}>
          <Text style={[typography.labelUppercase, styles.totalEyebrow]}>
            TOTAL SEMUA DOMPET AKTIF
          </Text>
          <Text style={[typography.displayLg, styles.totalAmount]}>
            {formatCurrency(totalBalance, hideBalance)}
          </Text>
        </GlassCard>

        {/* Wallets List */}
        <View style={styles.listSection}>
          <Text style={[typography.labelUppercase, styles.sectionTitle]}>
            DAFTAR DOMPET
          </Text>

          {wallets.map((wallet) => (
            <View key={wallet.id} style={styles.walletItemContainer}>
              <ListRow
                title={wallet.name}
                subtitle={`Tipe: ${wallet.type.toUpperCase()}`}
                nominal={formatCurrency(wallet.currentBalance ?? 0, hideBalance)}
                icon={wallet.iconKey || 'cash'}
                iconBgColor={
                  wallet.colorKey
                    ? `${wallet.colorKey}22`
                    : 'rgba(132, 150, 230, 0.15)'
                }
                iconColor={wallet.colorKey || colors.primary}
              />
              <View style={styles.walletActionRow}>
                <Pressable
                  onPress={() => openAdjustModal(wallet.id)}
                  style={styles.actionBtn}
                >
                  <AppIcon name="edit" size={14} color={colors.primary} />
                  <Text style={[typography.caption, styles.actionText]}>
                    Koreksi Saldo
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => handleArchive(wallet.id, wallet.name)}
                  style={styles.actionBtn}
                >
                  <AppIcon name="trash" size={14} color={colors.error} />
                  <Text style={[typography.caption, { color: colors.error }]}>
                    Arsipkan
                  </Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>

        <ButtonPrimary
          label="Tambah Dompet Baru"
          icon="plus"
          onPress={() => router.push('/wallets/add')}
          style={styles.addBtn}
        />
      </ScrollView>

      {/* Balance Correction Modal */}
      <Modal
        visible={adjustModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAdjustModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <GlassCard style={styles.modalCard} padding={spacing.lg}>
            <View style={styles.modalHeader}>
              <Text style={[typography.headlineSm, styles.modalTitle]}>
                Koreksi Saldo Dompet
              </Text>
              <Pressable onPress={() => setAdjustModalVisible(false)}>
                <AppIcon name="close" size={22} color={colors.onSurface} />
              </Pressable>
            </View>

            <Text style={[typography.caption, styles.modalSubtitle]}>
              Masukkan saldo riil saat ini. Sistem akan otomatis mencatat selisihnya sebagai transaksi penyesuaian.
            </Text>

            <InputText
              placeholder="Contoh: 500.000 atau 500k"
              value={targetBalanceText}
              onChangeText={setTargetBalanceText}
              keyboardType="numeric"
              containerStyle={{ marginVertical: spacing.md }}
            />

            <ButtonPrimary
              label="Perbarui Saldo"
              onPress={handleSaveCorrection}
            />
          </GlassCard>
        </View>
      </Modal>
    </PageGradient>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.gutter,
    paddingTop: spacing.md,
  },
  totalCard: {
    marginBottom: spacing.md,
  },
  totalEyebrow: {
    color: colors.onSurfaceVariant,
    marginBottom: 4,
  },
  totalAmount: {
    color: colors.onSurface,
  },
  listSection: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    color: colors.onSurfaceVariant,
    marginBottom: spacing.xs,
    marginLeft: 4,
  },
  walletItemContainer: {
    marginBottom: 8,
  },
  walletActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 8,
    marginTop: 2,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
    paddingVertical: 4,
  },
  actionText: {
    color: colors.primary,
    marginLeft: 4,
    fontWeight: '600',
  },
  addBtn: {
    marginTop: spacing.sm,
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
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  modalTitle: {
    color: colors.onSurface,
  },
  modalSubtitle: {
    color: colors.onSurfaceVariant,
  },
});
