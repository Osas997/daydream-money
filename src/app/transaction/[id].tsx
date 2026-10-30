import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, Pressable } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { PageGradient } from '../../components/PageGradient';
import { GlassCard } from '../../components/glass/GlassCard';
import { TopAppBar } from '../../components/glass/TopAppBar';
import { AppIcon } from '../../theme/icons';
import { colors, radius, spacing } from '../../theme/tokens';
import { fontFamilies, typography } from '../../theme/typography';
import { formatCurrency, formatFullDate, formatTime } from '../../lib/formatters';
import { useTransactionStore } from '../../store/transactionStore';
import * as txRepo from '../../db/repositories/transactionsRepo';
import { Transaction } from '../../db/types';

export default function TransactionDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);

  const { deleteTransaction } = useTransactionStore();

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        const tx = await txRepo.getTransactionById(id);
        setTransaction(tx);
      } catch (e) {
        console.error('Error loading transaction:', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    Alert.alert(
      'Hapus Transaksi',
      'Apakah Anda yakin ingin menghapus catatan transaksi ini?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            if (id) {
              await deleteTransaction(id);
              router.back();
            }
          },
        },
      ]
    );
  };

  if (loading || !transaction) {
    return (
      <PageGradient>
        <TopAppBar
          leftIcon="chevronLeft"
          onLeftPress={() => router.back()}
          title="Detail Transaksi"
        />
        <View style={styles.center}>
          <Text style={typography.bodyMd}>Memuat data...</Text>
        </View>
      </PageGradient>
    );
  }

  const isIncome = transaction.type === 'income';
  const isTransfer = transaction.type === 'transfer';
  const prefix = isIncome ? '+' : isTransfer ? '' : '-';

  return (
    <PageGradient>
      <TopAppBar
        leftIcon="chevronLeft"
        onLeftPress={() => router.back()}
        title="Detail Transaksi"
        rightIcon="trash"
        onRightPress={handleDelete}
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
        {/* Hero Card */}
        <GlassCard
          style={styles.heroCard}
          innerStyle={styles.heroInner}
          padding={24}
        >
          <View
            style={[
              styles.iconCircle,
              {
                backgroundColor:
                  transaction.categoryColor ||
                  (isTransfer ? colors.primary : isIncome ? '#56C898' : colors.error),
              },
            ]}
          >
            <AppIcon
              name={transaction.categoryIcon || (isTransfer ? 'transfer' : 'cash')}
              size={32}
              color="#FFFFFF"
              strokeWidth={2}
            />
          </View>

          <View
            style={[
              styles.typeBadge,
              {
                backgroundColor: isTransfer
                  ? 'rgba(129, 149, 229, 0.12)'
                  : isIncome
                  ? 'rgba(86, 200, 152, 0.12)'
                  : 'rgba(235, 107, 120, 0.12)',
              },
            ]}
          >
            <Text
              style={[
                styles.typeBadgeText,
                {
                  color: isTransfer
                    ? colors.primary
                    : isIncome
                    ? '#2E9A68'
                    : colors.error,
                },
              ]}
            >
              {isTransfer ? 'Transfer' : isIncome ? 'Pemasukan' : 'Pengeluaran'}
            </Text>
          </View>

          <Text
            style={[
              styles.amountText,
              { color: isIncome ? colors.primary : colors.onSurface },
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {prefix}
            {formatCurrency(transaction.amount)}
          </Text>

          <Text style={styles.categoryTitle} numberOfLines={1}>
            {transaction.categoryName || (isTransfer ? 'Transfer' : 'Lainnya')}
          </Text>
        </GlassCard>

        {/* Metadata Details */}
        <GlassCard style={styles.detailCard} padding={16}>
          <View style={styles.metaRow}>
            <View style={styles.metaKeyWrap}>
              <AppIcon name="calendar" size={16} color={colors.onSurfaceMuted} />
              <Text style={styles.metaKey}>Tanggal</Text>
            </View>
            <Text style={styles.metaVal}>
              {formatFullDate(transaction.occurredAt)}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.metaRow}>
            <View style={styles.metaKeyWrap}>
              <AppIcon name="history" size={16} color={colors.onSurfaceMuted} />
              <Text style={styles.metaKey}>Waktu</Text>
            </View>
            <Text style={styles.metaVal}>
              {formatTime(transaction.occurredAt)} WIB
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.metaRow}>
            <View style={styles.metaKeyWrap}>
              <AppIcon name="bank" size={16} color={colors.onSurfaceMuted} />
              <Text style={styles.metaKey}>
                {isTransfer ? 'Dompet Asal' : 'Dompet'}
              </Text>
            </View>
            <Text style={styles.metaVal}>
              {transaction.walletName || '-'}
            </Text>
          </View>

          {isTransfer && transaction.toWalletName && (
            <>
              <View style={styles.divider} />
              <View style={styles.metaRow}>
                <View style={styles.metaKeyWrap}>
                  <AppIcon name="transfer" size={16} color={colors.onSurfaceMuted} />
                  <Text style={styles.metaKey}>Dompet Tujuan</Text>
                </View>
                <Text style={styles.metaVal}>
                  {transaction.toWalletName}
                </Text>
              </View>
            </>
          )}

          {Boolean(transaction.note && transaction.note.trim()) && (
            <>
              <View style={styles.divider} />
              <View style={styles.metaRow}>
                <View style={styles.metaKeyWrap}>
                  <AppIcon name="edit" size={16} color={colors.onSurfaceMuted} />
                  <Text style={styles.metaKey}>Catatan</Text>
                </View>
                <Text style={[styles.metaVal, styles.noteVal]}>
                  {transaction.note}
                </Text>
              </View>
            </>
          )}
        </GlassCard>

        {/* Delete Action Button */}
        <View style={styles.actionRow}>
          <Pressable
            onPress={handleDelete}
            style={({ pressed }) => [
              styles.deleteButton,
              pressed && styles.deleteButtonPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Hapus Transaksi"
          >
            <AppIcon name="trash" size={18} color={colors.error} strokeWidth={2} />
            <Text style={styles.deleteButtonText}>Hapus Transaksi</Text>
          </Pressable>
        </View>
      </ScrollView>
    </PageGradient>
  );
}

const styles = StyleSheet.create({
  content: {
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingTop: spacing.md,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCard: {
    marginBottom: spacing.md,
  },
  heroInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: radius.full,
    marginBottom: 8,
  },
  typeBadgeText: {
    fontSize: 11,
    fontFamily: fontFamilies.bold,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  amountText: {
    fontSize: 34,
    lineHeight: 42,
    fontFamily: fontFamilies.bold,
    letterSpacing: -0.8,
    textAlign: 'center',
    marginBottom: 6,
  },
  categoryTitle: {
    fontSize: 16,
    fontFamily: fontFamilies.semiBold,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
  detailCard: {
    marginBottom: spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  metaKeyWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaKey: {
    fontSize: 13,
    fontFamily: fontFamilies.medium,
    color: colors.onSurfaceVariant,
  },
  metaVal: {
    fontSize: 14,
    fontFamily: fontFamilies.semiBold,
    color: colors.onSurface,
    textAlign: 'right',
    flexShrink: 1,
    marginLeft: 16,
  },
  noteVal: {
    fontFamily: fontFamilies.regular,
    color: colors.onSurfaceVariant,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(226, 232, 245, 0.7)',
  },
  actionRow: {
    marginTop: spacing.xs,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: radius.full,
    backgroundColor: 'rgba(235, 107, 120, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(235, 107, 120, 0.25)',
    gap: 8,
  },
  deleteButtonPressed: {
    opacity: 0.75,
    backgroundColor: 'rgba(235, 107, 120, 0.16)',
  },
  deleteButtonText: {
    fontSize: 14,
    fontFamily: fontFamilies.semiBold,
    color: colors.error,
  },
});
