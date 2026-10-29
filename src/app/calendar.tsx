import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PageGradient } from '../components/PageGradient';
import { ButtonIconGlass } from '../components/glass/ButtonIconGlass';
import { GlassCard } from '../components/glass/GlassCard';
import { EmptyStateCard } from '../components/glass/EmptyStateCard';
import { ListRow } from '../components/glass/ListRow';
import { useSettingsStore } from '../store/settingsStore';
import { Transaction } from '../db/types';
import * as txRepo from '../db/repositories/transactionsRepo';
import { colors, radius, shadow } from '../theme/tokens';
import { typography, fontFamilies } from '../theme/typography';
import { AppIcon } from '../theme/icons';
import {
  MONTH_NAMES_ID,
  DAY_NAMES_SHORT_ID,
  formatCurrency,
  getRelativeDateLabel,
} from '../lib/formatters';

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const { hideBalance } = useSettingsStore();

  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1); // 1-based
  const [selectedDay, setSelectedDay] = useState(now.getDate());

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMonthTransactions = useCallback(async () => {
    const startStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01T00:00:00.000Z`;
    const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
    const endStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}T23:59:59.999Z`;

    try {
      const txs = await txRepo.getTransactions({
        startDate: startStr,
        endDate: endStr,
      });
      setTransactions(txs);
    } catch (e) {
      console.error('Error fetching calendar transactions:', e);
    }
  }, [selectedYear, selectedMonth]);

  useFocusEffect(
    useCallback(() => {
      fetchMonthTransactions();
    }, [fetchMonthTransactions])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchMonthTransactions();
    setRefreshing(false);
  };

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
    setSelectedDay(1);
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
    setSelectedDay(1);
  };

  // Group transactions by date day
  const dayData = useMemo(() => {
    const map: Record<number, { income: number; expense: number; count: number; items: Transaction[] }> = {};

    for (const tx of transactions) {
      const d = new Date(tx.occurredAt);
      const dayNum = d.getDate();
      if (!map[dayNum]) {
        map[dayNum] = { income: 0, expense: 0, count: 0, items: [] };
      }
      if (tx.type === 'income') {
        map[dayNum].income += tx.amount;
      } else if (tx.type === 'expense') {
        map[dayNum].expense += tx.amount;
      }
      map[dayNum].count += 1;
      map[dayNum].items.push(tx);
    }

    return map;
  }, [transactions]);

  // Calendar matrix calculation
  const calendarCells = useMemo(() => {
    const firstDayIndex = new Date(selectedYear, selectedMonth - 1, 1).getDay(); // 0 = Sun
    const totalDays = new Date(selectedYear, selectedMonth, 0).getDate();

    const cells: { day: number | null }[] = [];
    // Padding before day 1
    for (let i = 0; i < firstDayIndex; i++) {
      cells.push({ day: null });
    }
    // Days in month
    for (let d = 1; d <= totalDays; d++) {
      cells.push({ day: d });
    }
    return cells;
  }, [selectedYear, selectedMonth]);

  // Selected day items
  const selectedDayItems = dayData[selectedDay]?.items || [];
  const selectedDayIncome = dayData[selectedDay]?.income || 0;
  const selectedDayExpense = dayData[selectedDay]?.expense || 0;

  const isToday = (day: number) => {
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() + 1 === selectedMonth &&
      today.getFullYear() === selectedYear
    );
  };

  return (
    <PageGradient>
      <ScrollView
        contentContainerStyle={[
          styles.container,
          {
            paddingTop: Math.max(insets.top, 16),
            paddingBottom: Math.max(insets.bottom, 24),
          },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header Bar */}
        <View style={styles.header}>
          <ButtonIconGlass
            icon="chevronLeft"
            onPress={() => router.back()}
            size={40}
            iconSize={20}
            accessibilityLabel="Kembali"
          />
          <Text style={styles.headerTitle}>Kalender Transaksi</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Month Navigator */}
        <View style={styles.monthNav}>
          <Pressable onPress={handlePrevMonth} style={styles.navBtn}>
            <AppIcon name="chevronLeft" size={20} color={colors.onSurface} />
          </Pressable>
          <Text style={styles.monthNavTitle}>
            {MONTH_NAMES_ID[selectedMonth - 1]} {selectedYear}
          </Text>
          <Pressable onPress={handleNextMonth} style={styles.navBtn}>
            <AppIcon name="chevronRight" size={20} color={colors.onSurface} />
          </Pressable>
        </View>

        {/* Calendar Card */}
        <GlassCard style={styles.calendarCard} padding={16}>
          {/* Day of Week Header */}
          <View style={styles.daysOfWeekRow}>
            {DAY_NAMES_SHORT_ID.map((name) => (
              <Text key={name} style={styles.dayOfWeekText}>
                {name}
              </Text>
            ))}
          </View>

          {/* Grid of Days */}
          <View style={styles.gridContainer}>
            {calendarCells.map((cell, idx) => {
              if (cell.day === null) {
                return <View key={`empty-${idx}`} style={styles.gridCell} />;
              }

              const day = cell.day;
              const isSelected = selectedDay === day;
              const isTodayCell = isToday(day);
              const daySummary = dayData[day];
              const hasIncome = daySummary && daySummary.income > 0;
              const hasExpense = daySummary && daySummary.expense > 0;

              return (
                <Pressable
                  key={`day-${day}`}
                  onPress={() => setSelectedDay(day)}
                  style={[
                    styles.gridCell,
                    isSelected && styles.gridCellSelected,
                    isTodayCell && !isSelected && styles.gridCellToday,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayText,
                      isSelected && styles.dayTextSelected,
                      isTodayCell && !isSelected && styles.dayTextToday,
                    ]}
                  >
                    {day}
                  </Text>

                  {/* Indicators for income and expense */}
                  <View style={styles.indicatorsRow}>
                    {hasIncome && (
                      <View
                        style={[
                          styles.dotIndicator,
                          { backgroundColor: isSelected ? '#FFFFFF' : colors.primary },
                        ]}
                      />
                    )}
                    {hasExpense && (
                      <View
                        style={[
                          styles.dotIndicator,
                          { backgroundColor: isSelected ? '#FFFFFF' : colors.error },
                        ]}
                      />
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </GlassCard>

        {/* Selected Day Summary */}
        <View style={styles.daySummaryCard}>
          <View style={styles.summaryTopRow}>
            <Text style={styles.selectedDateTitle}>
              {selectedDay} {MONTH_NAMES_ID[selectedMonth - 1]} {selectedYear}
            </Text>
            <Text style={styles.selectedCountText}>
              {selectedDayItems.length} transaksi
            </Text>
          </View>

          <View style={styles.flowMetrics}>
            <View style={styles.flowMetricItem}>
              <Text style={styles.flowMetricLabel}>Pemasukan</Text>
              <Text style={[styles.flowMetricValue, { color: colors.primary }]}>
                +{formatCurrency(selectedDayIncome, hideBalance)}
              </Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.flowMetricItem}>
              <Text style={styles.flowMetricLabel}>Pengeluaran</Text>
              <Text style={[styles.flowMetricValue, { color: colors.error }]}>
                -{formatCurrency(selectedDayExpense, hideBalance)}
              </Text>
            </View>
          </View>
        </View>

        {/* Selected Day Transactions List */}
        <View style={styles.txListSection}>
          <Text style={[typography.labelUppercase, styles.sectionEyebrow]}>
            CATATAN TRANSAKSI HARI INI
          </Text>

          {selectedDayItems.length === 0 ? (
            <EmptyStateCard
              icon="calendar"
              title="Tidak ada transaksi"
              subtitle="Tidak ada transaksi tercatat pada tanggal yang dipilih ini."
              actionLabel="Tambah Transaksi"
              onAction={() => router.push('/add-transaction')}
            />
          ) : (
            selectedDayItems.map((tx) => {
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
                  key={tx.id}
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
            })
          )}
        </View>
      </ScrollView>
    </PageGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: fontFamilies.bold,
    color: colors.onSurface,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.full,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.glass.borderSoft,
  },
  navBtn: {
    padding: 6,
  },
  monthNavTitle: {
    fontSize: 15,
    fontFamily: fontFamilies.bold,
    color: colors.onSurface,
  },
  calendarCard: {
    marginBottom: 16,
    borderRadius: 24,
  },
  daysOfWeekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.glass.borderSoft,
    paddingBottom: 8,
  },
  dayOfWeekText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontFamily: fontFamilies.bold,
    color: colors.onSurfaceMuted,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridCell: {
    width: '14.28%',
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    marginBottom: 4,
  },
  gridCellSelected: {
    backgroundColor: colors.primary,
  },
  gridCellToday: {
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  dayText: {
    fontSize: 13,
    fontFamily: fontFamilies.medium,
    color: colors.onSurface,
  },
  dayTextSelected: {
    color: '#FFFFFF',
    fontFamily: fontFamilies.bold,
  },
  dayTextToday: {
    color: colors.primary,
    fontFamily: fontFamilies.bold,
  },
  indicatorsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    height: 4,
    gap: 3,
  },
  dotIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  daySummaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.glass.borderSoft,
    ...shadow.card,
  },
  summaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  selectedDateTitle: {
    fontSize: 15,
    fontFamily: fontFamilies.bold,
    color: colors.onSurface,
  },
  selectedCountText: {
    fontSize: 12,
    fontFamily: fontFamilies.medium,
    color: colors.onSurfaceMuted,
  },
  flowMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFC',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  flowMetricItem: {
    flex: 1,
    alignItems: 'center',
  },
  flowMetricLabel: {
    fontSize: 10,
    fontFamily: fontFamilies.medium,
    color: colors.onSurfaceMuted,
    marginBottom: 2,
  },
  flowMetricValue: {
    fontSize: 13,
    fontFamily: fontFamilies.bold,
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.glass.borderSoft,
  },
  txListSection: {
    marginTop: 4,
  },
  sectionEyebrow: {
    fontSize: 11,
    fontFamily: fontFamilies.bold,
    letterSpacing: 1.4,
    color: colors.onSurfaceMuted,
    marginBottom: 8,
    marginLeft: 4,
  },
  emptyDayCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  emptyDayText: {
    fontSize: 13,
    fontFamily: fontFamilies.medium,
    color: colors.onSurfaceMuted,
    marginTop: 8,
    textAlign: 'center',
  },
});
