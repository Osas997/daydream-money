import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PageGradient } from '../../components/PageGradient';
import { InputText } from '../../components/glass/InputText';
import { Chip } from '../../components/glass/Chip';
import { ListRow } from '../../components/glass/ListRow';
import { Heading } from '../../components/glass/Heading';
import { EmptyStateCard } from '../../components/glass/EmptyStateCard';
import { useTransactionStore } from '../../store/transactionStore';
import { useSettingsStore } from '../../store/settingsStore';
import { Transaction, TransactionType } from '../../db/types';
import { colors, spacing } from '../../theme/tokens';
import { typography } from '../../theme/typography';
import {
  formatCurrency,
  getRelativeDateLabel,
} from '../../lib/formatters';

interface DateSection {
  title: string;
  dateKey: string;
  subtotal: number;
  data: Transaction[];
}

export default function TransactionsScreen() {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedType, setSelectedType] = useState<TransactionType | 'all'>('all');

  const {
    filteredTransactions,
    filter,
    setFilter,
    refreshTransactions,
  } = useTransactionStore();

  const { hideBalance, monthStartDay } = useSettingsStore();

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshTransactions(monthStartDay);
    setRefreshing(false);
  };

  const handleTypeSelect = (type: TransactionType | 'all') => {
    setSelectedType(type);
    setFilter({ type: type === 'all' ? undefined : type });
  };

  useFocusEffect(
    useCallback(() => {
      refreshTransactions(monthStartDay);
    }, [monthStartDay, refreshTransactions])
  );

  // Group transactions by date
  const sections: DateSection[] = useMemo(() => {
    const groups: Record<string, { title: string; subtotal: number; data: Transaction[] }> = {};

    for (const tx of filteredTransactions) {
      const dateKey = tx.occurredAt.split('T')[0];
      if (!groups[dateKey]) {
        groups[dateKey] = {
          title: getRelativeDateLabel(tx.occurredAt),
          subtotal: 0,
          data: [],
        };
      }
      groups[dateKey].data.push(tx);

      // Add to subtotal: + for income, - for expense
      if (tx.type === 'income') {
        groups[dateKey].subtotal += tx.amount;
      } else if (tx.type === 'expense') {
        groups[dateKey].subtotal -= tx.amount;
      }
    }

    return Object.entries(groups).map(([dateKey, group]) => ({
      dateKey,
      title: group.title,
      subtotal: group.subtotal,
      data: group.data,
    }));
  }, [filteredTransactions]);

  return (
    <PageGradient>
      <View
        style={[
          styles.container,
          {
            paddingTop: Math.max(insets.top, 16),
          },
        ]}
      >
        {/* Header */}
        <Heading
          eyebrow="RIWAYAT TRANSAKSI"
          title="Semua Catatan"
          variant="headline"
          style={styles.header}
        />

        {/* Search Bar */}
        <View style={styles.searchWrap}>
          <InputText
            icon="search"
            placeholder="Cari catatan, kategori, nominal..."
            value={filter.search || ''}
            onChangeText={(text) => setFilter({ search: text })}
            rightIcon={filter.search ? 'close' : undefined}
            onRightIconPress={() => setFilter({ search: '' })}
          />
        </View>

        {/* Filter Type Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipScroll}
          contentContainerStyle={styles.chipRow}
        >
          <Chip
            label="Semua"
            active={selectedType === 'all'}
            onPress={() => handleTypeSelect('all')}
            style={styles.chip}
          />
          <Chip
            label="Pengeluaran"
            active={selectedType === 'expense'}
            onPress={() => handleTypeSelect('expense')}
            icon="expense"
            style={styles.chip}
          />
          <Chip
            label="Pemasukan"
            active={selectedType === 'income'}
            onPress={() => handleTypeSelect('income')}
            icon="income"
            style={styles.chip}
          />
          <Chip
            label="Transfer"
            active={selectedType === 'transfer'}
            onPress={() => handleTypeSelect('transfer')}
            icon="transfer"
            style={styles.chip}
          />
        </ScrollView>

        {/* Transactions List */}
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <EmptyStateCard
                icon={filter.search || selectedType !== 'all' ? 'search' : 'history'}
                title={
                  filter.search || selectedType !== 'all'
                    ? 'Tidak ada transaksi ditemukan'
                    : 'Belum ada transaksi'
                }
                subtitle={
                  filter.search || selectedType !== 'all'
                    ? 'Coba ubah kata kunci pencarian atau ganti filter yang dipilih.'
                    : 'Catat transaksi pemasukan atau pengeluaran pertama Anda sekarang.'
                }
                actionLabel={
                  filter.search || selectedType !== 'all'
                    ? 'Reset Filter'
                    : 'Tambah Transaksi'
                }
                onAction={() => {
                  if (filter.search || selectedType !== 'all') {
                    setSelectedType('all');
                    setFilter({ search: '', type: undefined });
                  } else {
                    router.push('/add-transaction');
                  }
                }}
              />
            </View>
          }
          renderSectionHeader={({ section: { title, subtotal } }) => (
              <View style={styles.sectionHeader}>
                <Text style={[typography.labelUppercase, styles.sectionTitle]}>
                  {title}
                </Text>
                <Text
                  style={[
                    typography.caption,
                    {
                      color:
                        subtotal > 0
                          ? colors.primary
                          : subtotal < 0
                          ? colors.onSurface
                          : colors.onSurfaceMuted,
                      fontWeight: '700',
                    },
                  ]}
                >
                  {formatCurrency(subtotal, hideBalance)}
                </Text>
              </View>
            )}
            renderItem={({ item: tx }) => {
              const isIncome = tx.type === 'income';
              const isTransfer = tx.type === 'transfer';
              const prefix = isIncome ? '+' : isTransfer ? '' : '-';
              const nominalFormatted = `${prefix}${formatCurrency(tx.amount, hideBalance)}`;

              let subtitle = tx.walletName || 'Dompet';
              if (isTransfer && tx.toWalletName) {
                subtitle = `${tx.walletName} → ${tx.toWalletName}`;
              } else if (tx.note) {
                subtitle = `${tx.note} • ${tx.walletName || ''}`;
              }

              return (
                <ListRow
                  title={tx.categoryName || (isTransfer ? 'Transfer' : 'Lainnya')}
                  subtitle={subtitle}
                  nominal={nominalFormatted}
                  nominalType={isIncome ? 'income' : 'expense'}
                  icon={tx.categoryIcon || (isTransfer ? 'transfer' : 'cash')}
                  iconBgColor={
                    tx.categoryColor
                      ? `${tx.categoryColor}22`
                      : 'rgba(132, 150, 230, 0.15)'
                  }
                  iconColor={tx.categoryColor || colors.primary}
                  badge={getRelativeDateLabel(tx.occurredAt)}
                  onPress={() => router.push(`/transaction/${tx.id}`)}
                />
              );
            }}
          />
      </View>
    </PageGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    paddingHorizontal: 16,
  },
  header: {
    marginBottom: spacing.sm,
  },
  searchWrap: {
    marginBottom: spacing.sm,
  },
  chipScroll: {
    height: 44,
    maxHeight: 44,
    flexGrow: 0,
    flexShrink: 0,
    marginBottom: spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    height: 44,
  },
  chip: {
    marginRight: 8,
  },
  list: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 110,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    marginTop: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    color: colors.onSurfaceVariant,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
});
