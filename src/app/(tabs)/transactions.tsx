import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  RefreshControl,
  ScrollView,
  Pressable,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PageGradient } from '../../components/PageGradient';
import { InputText } from '../../components/glass/InputText';
import { Chip } from '../../components/glass/Chip';
import { ListRow } from '../../components/glass/ListRow';
import { Heading } from '../../components/glass/Heading';
import { EmptyStateCard } from '../../components/glass/EmptyStateCard';
import { DateFilterModal } from '../../components/forms/DateFilterModal';
import { useTransactionStore } from '../../store/transactionStore';
import { useSettingsStore } from '../../store/settingsStore';
import { Transaction, TransactionType } from '../../db/types';
import { colors, radius, spacing } from '../../theme/tokens';
import { typography, fontFamilies } from '../../theme/typography';
import { AppIcon } from '../../theme/icons';
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
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  const {
    filteredTransactions,
    filter,
    setFilter,
    currentMonth,
    monthRangeLabel,
    customDateRange,
    setCurrentMonth,
    setCustomDateRange,
    nextMonth,
    prevMonth,
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
        {/* Header Bar */}
        <View style={styles.headerRow}>
          <Heading
            eyebrow="RIWAYAT TRANSAKSI"
            title="Catatan Keuangan"
            variant="headline"
            style={styles.header}
          />
          <Pressable
            onPress={() => router.push('/calendar')}
            style={styles.calendarHeaderBtn}
            accessibilityRole="button"
            accessibilityLabel="Buka Kalender"
          >
            <AppIcon name="calendar" size={18} color={colors.onSurface} />
          </Pressable>
        </View>

        {/* Period Selector: prev ← [Month / Filter] → next */}
        <View style={styles.periodRow}>
          <Pressable
            onPress={() => prevMonth(monthStartDay)}
            style={styles.periodNavBtn}
            accessibilityLabel="Bulan sebelumnya"
          >
            <AppIcon name="chevronLeft" size={18} color={colors.onSurfaceVariant} />
          </Pressable>

          <Pressable
            onPress={() => setFilterModalVisible(true)}
            style={styles.periodCenter}
            accessibilityRole="button"
            accessibilityLabel="Pilih periode dan tanggal"
          >
            <AppIcon name="calendar" size={13} color={colors.primary} />
            <Text style={styles.periodText} numberOfLines={1}>
              {monthRangeLabel || currentMonth}
            </Text>
            <AppIcon name="filter" size={12} color={colors.primary} />
          </Pressable>

          <Pressable
            onPress={() => nextMonth(monthStartDay)}
            style={styles.periodNavBtn}
            accessibilityLabel="Bulan berikutnya"
          >
            <AppIcon name="chevronRight" size={18} color={colors.onSurfaceVariant} />
          </Pressable>
        </View>

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
                icon={filter.search || selectedType !== 'all' || customDateRange ? 'search' : 'history'}
                title={
                  filter.search || selectedType !== 'all' || customDateRange
                    ? 'Tidak ada transaksi ditemukan'
                    : 'Belum ada transaksi'
                }
                subtitle={
                  filter.search || selectedType !== 'all' || customDateRange
                    ? 'Coba ubah kata kunci pencarian atau ganti periode filter yang dipilih.'
                    : 'Catat transaksi pemasukan atau pengeluaran pertama Anda sekarang.'
                }
                actionLabel={
                  filter.search || selectedType !== 'all' || customDateRange
                    ? 'Reset Filter'
                    : 'Tambah Transaksi'
                }
                onAction={() => {
                  if (filter.search || selectedType !== 'all' || customDateRange) {
                    setSelectedType('all');
                    setFilter({ search: '', type: undefined });
                    const now = new Date();
                    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
                    setCurrentMonth(ym, monthStartDay);
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

      {/* Date Filter Modal */}
      <DateFilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        currentMonth={currentMonth}
        monthStartDay={monthStartDay}
        onSelectMonth={(ym) => setCurrentMonth(ym, monthStartDay)}
        onSelectDateRange={(range) => setCustomDateRange(range, monthStartDay)}
        onReset={() => {
          const now = new Date();
          const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
          setCurrentMonth(ym, monthStartDay);
        }}
        onOpenCalendar={() => router.push('/calendar')}
      />
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  header: {
    marginBottom: 0,
    flex: 1,
  },
  calendarHeaderBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.glass.borderSoft,
  },
  periodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  periodNavBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodCenter: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '75%',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.glass.borderSoft,
    gap: 6,
  },
  periodText: {
    color: colors.onSurface,
    fontSize: 13,
    fontFamily: fontFamilies.semiBold,
  },
  searchWrap: {
    marginBottom: spacing.xs,
  },
  chipScroll: {
    height: 44,
    maxHeight: 44,
    flexGrow: 0,
    flexShrink: 0,
    marginBottom: spacing.xs,
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
