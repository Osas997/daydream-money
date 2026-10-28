import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PageGradient } from '../../components/PageGradient';
import { GlassCard } from '../../components/glass/GlassCard';
import { TopAppBar } from '../../components/glass/TopAppBar';
import { ButtonPrimary } from '../../components/glass/ButtonPrimary';
import { ButtonSecondary } from '../../components/glass/ButtonSecondary';
import { AppIcon } from '../../theme/icons';
import { colors, radius, spacing } from '../../theme/tokens';
import { typography } from '../../theme/typography';
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
      >
        {/* Hero Card */}
        <GlassCard style={styles.heroCard}>
          <View
            style={[
              styles.iconCircle,
              {
                backgroundColor:
                  transaction.categoryColor ||
                  (isTransfer ? colors.primary : colors.error),
              },
            ]}
          >
            <AppIcon
              name={transaction.categoryIcon || (isTransfer ? 'transfer' : 'cash')}
              size={28}
              color="#FFFFFF"
            />
          </View>

          <Text style={[typography.labelUppercase, styles.typeLabel]}>
            {isTransfer
              ? 'TRANSFER ANTAR DOMPET'
              : isIncome
              ? 'PEMASUKAN'
              : 'PENGELUARAN'}
          </Text>

          <Text
            style={[
              typography.displayLg,
              styles.amountText,
              { color: isIncome ? colors.primary : colors.onSurface },
            ]}
          >
            {prefix}
            {formatCurrency(transaction.amount)}
          </Text>

          <Text style={[typography.headlineSm, styles.categoryTitle]}>
            {transaction.categoryName || (isTransfer ? 'Transfer' : 'Lainnya')}
          </Text>
        </GlassCard>

        {/* Metadata Details */}
        <GlassCard style={styles.detailCard} padding={spacing.md}>
          <View style={styles.metaRow}>
            <Text style={[typography.caption, styles.metaKey]}>Tanggal</Text>
            <Text style={[typography.bodyMd, styles.metaVal]}>
              {formatFullDate(transaction.occurredAt)}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.metaRow}>
            <Text style={[typography.caption, styles.metaKey]}>Waktu</Text>
            <Text style={[typography.bodyMd, styles.metaVal]}>
              {formatTime(transaction.occurredAt)} WIB
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.metaRow}>
            <Text style={[typography.caption, styles.metaKey]}>
              {isTransfer ? 'Dompet Asal' : 'Dompet'}
            </Text>
            <Text style={[typography.bodyMd, styles.metaVal]}>
              {transaction.walletName || '-'}
            </Text>
          </View>

          {isTransfer && transaction.toWalletName && (
            <>
              <View style={styles.divider} />
              <View style={styles.metaRow}>
                <Text style={[typography.caption, styles.metaKey]}>
                  Dompet Tujuan
                </Text>
                <Text style={[typography.bodyMd, styles.metaVal]}>
                  {transaction.toWalletName}
                </Text>
              </View>
            </>
          )}

          {transaction.note && (
            <>
              <View style={styles.divider} />
              <View style={styles.metaRow}>
                <Text style={[typography.caption, styles.metaKey]}>Catatan</Text>
                <Text style={[typography.bodyMd, styles.metaVal]}>
                  {transaction.note}
                </Text>
              </View>
            </>
          )}
        </GlassCard>

        {/* Actions */}
        <View style={styles.actionRow}>
          <ButtonSecondary
            label="Hapus Transaksi"
            icon="trash"
            iconColor={colors.error}
            iconBgColor="rgba(233, 123, 134, 0.15)"
            onPress={handleDelete}
          />
        </View>
      </ScrollView>
    </PageGradient>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.gutter,
    paddingTop: spacing.md,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCard: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  typeLabel: {
    color: colors.onSurfaceVariant,
    marginBottom: 4,
  },
  amountText: {
    marginBottom: 4,
  },
  categoryTitle: {
    color: colors.onSurface,
    fontWeight: '600',
  },
  detailCard: {
    marginBottom: spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  metaKey: {
    color: colors.onSurfaceVariant,
  },
  metaVal: {
    color: colors.onSurface,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: colors.glass.borderSoft,
  },
  actionRow: {
    marginTop: spacing.sm,
  },
});
