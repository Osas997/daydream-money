import React, { useState, useCallback } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable, RefreshControl } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PageGradient } from '../../components/PageGradient';
import { Heading } from '../../components/glass/Heading';
import { Chip } from '../../components/glass/Chip';
import {
  CategoryBreakdownChart,
  DailyTrendBarChart,
  TrendComparisonCard,
  CategoryShare,
  DailySpendingPoint,
} from '../../components/charts/ReportCharts';
import { useTransactionStore } from '../../store/transactionStore';
import { useSettingsStore } from '../../store/settingsStore';
import * as txRepo from '../../db/repositories/transactionsRepo';
import { getFinancialMonthRange } from '../../lib/formatters';
import { colors, radius, spacing } from '../../theme/tokens';
import { typography } from '../../theme/typography';
import { AppIcon } from '../../theme/icons';

type PeriodMode = 'month' | 'year';
type ChartType = 'expense' | 'income';

export default function ReportsScreen() {
  const insets = useSafeAreaInsets();
  const { currentMonth, monthRangeLabel, nextMonth, prevMonth, setCurrentMonth } = useTransactionStore();
  const { monthStartDay } = useSettingsStore();

  const [periodMode, setPeriodMode] = useState<PeriodMode>('month');
  const [chartType, setChartType] = useState<ChartType>('expense');
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [expenseCategoryShares, setExpenseCategoryShares] = useState<CategoryShare[]>([]);
  const [incomeCategoryShares, setIncomeCategoryShares] = useState<CategoryShare[]>([]);
  const [dailyExpense, setDailyExpense] = useState<DailySpendingPoint[]>([]);
  const [dailyIncome, setDailyIncome] = useState<DailySpendingPoint[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const changeYear = (direction: 1 | -1) => {
    const [year, month] = currentMonth.split('-').map(Number);
    setCurrentMonth(`${year + direction}-${String(month).padStart(2, '0')}`, monthStartDay);
  };

  const loadData = useCallback(async () => {
    let startDate: string;
    let endDate: string;

    if (periodMode === 'year') {
      const year = currentMonth.split('-')[0];
      startDate = `${year}-01-01T00:00:00.000Z`;
      endDate = `${year}-12-31T23:59:59.999Z`;
    } else {
      const range = getFinancialMonthRange(currentMonth, monthStartDay);
      startDate = range.startDate;
      endDate = range.endDate;
    }

    // Fetch transactions in range
    const txs = await txRepo.getTransactions({ startDate, endDate });
    let inc = 0;
    let exp = 0;

    // Daily buckets for charts
    const dailyExpMap: Record<number, number> = {};
    const dailyIncMap: Record<number, number> = {};
    const [y, m] = currentMonth.split('-').map(Number);
    const daysInMonth = new Date(y, m, 0).getDate();
    const bucketCount = periodMode === 'year' ? 12 : daysInMonth;
    for (let d = 1; d <= bucketCount; d++) {
      dailyExpMap[d] = 0;
      dailyIncMap[d] = 0;
    }

    for (const t of txs) {
      const d = new Date(t.occurredAt);
      const bucketKey = periodMode === 'year' ? d.getMonth() + 1 : d.getDate();
      if (t.type === 'income') {
        inc += t.amount;
        if (dailyIncMap[bucketKey] !== undefined) {
          dailyIncMap[bucketKey] += t.amount;
        }
      } else if (t.type === 'expense') {
        exp += t.amount;
        if (dailyExpMap[bucketKey] !== undefined) {
          dailyExpMap[bucketKey] += t.amount;
        }
      }
    }

    setTotalIncome(inc);
    setTotalExpense(exp);

    const expPoints: DailySpendingPoint[] = Object.entries(dailyExpMap).map(([dayStr, amount]) => ({
      day: Number(dayStr),
      dateStr: dayStr,
      amount,
    }));
    setDailyExpense(expPoints);

    const incPoints: DailySpendingPoint[] = Object.entries(dailyIncMap).map(([dayStr, amount]) => ({
      day: Number(dayStr),
      dateStr: dayStr,
      amount,
    }));
    setDailyIncome(incPoints);

    // Fetch category breakdown for both expense and income
    const [expSpending, incSpending] = await Promise.all([
      txRepo.getCategorySpendingSummary(startDate, endDate, 'expense'),
      txRepo.getCategorySpendingSummary(startDate, endDate, 'income'),
    ]);

    const totalExpForPct = exp > 0 ? exp : 1;
    const expShares: CategoryShare[] = expSpending.map((s) => ({
      categoryId: s.categoryId,
      categoryName: s.categoryName,
      iconKey: s.iconKey,
      colorKey: s.colorKey,
      total: s.total,
      percentage: Math.round((s.total / totalExpForPct) * 100),
    }));
    setExpenseCategoryShares(expShares);

    const totalIncForPct = inc > 0 ? inc : 1;
    const incShares: CategoryShare[] = incSpending.map((s) => ({
      categoryId: s.categoryId,
      categoryName: s.categoryName,
      iconKey: s.iconKey,
      colorKey: s.colorKey,
      total: s.total,
      percentage: Math.round((s.total / totalIncForPct) * 100),
    }));
    setIncomeCategoryShares(incShares);
  }, [currentMonth, monthStartDay, periodMode]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  return (
    <PageGradient>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top, 16),
            paddingBottom: 110,
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
        {/* Header */}
        <Heading
          eyebrow="ANALISIS KEUANGAN"
          title="Laporan & Statistik"
          variant="headline"
        />

        {/* Period Mode Selector */}
        <View style={styles.modeRow}>
          <Chip
            label="Bulanan"
            active={periodMode === 'month'}
            onPress={() => setPeriodMode('month')}
            style={styles.modeChip}
          />
          <Chip
            label="Tahunan"
            active={periodMode === 'year'}
            onPress={() => setPeriodMode('year')}
            style={styles.modeChip}
          />
        </View>

        {/* Period Navigation */}
        <View style={styles.periodRow}>
          <Pressable
            onPress={() => (periodMode === 'year' ? changeYear(-1) : prevMonth(monthStartDay))}
            style={styles.periodNavBtn}
            accessibilityRole="button"
            accessibilityLabel={periodMode === 'year' ? 'Tahun sebelumnya' : 'Bulan sebelumnya'}
          >
            <AppIcon name="chevronLeft" size={18} color={colors.onSurfaceVariant} />
          </Pressable>
          <Text style={[typography.labelMd, styles.periodText]}>
            {periodMode === 'year'
              ? `Tahun ${currentMonth.split('-')[0]}`
              : monthRangeLabel || currentMonth}
          </Text>
          <Pressable
            onPress={() => (periodMode === 'year' ? changeYear(1) : nextMonth(monthStartDay))}
            style={styles.periodNavBtn}
            accessibilityRole="button"
            accessibilityLabel={periodMode === 'year' ? 'Tahun berikutnya' : 'Bulan berikutnya'}
          >
            <AppIcon name="chevronRight" size={18} color={colors.onSurfaceVariant} />
          </Pressable>
        </View>

        {/* Trend Comparison Card */}
        <TrendComparisonCard income={totalIncome} expense={totalExpense} />

        {/* Chart Filter Selector */}
        <View style={styles.chartFilterRow}>
          <Chip
            label="Pengeluaran"
            icon="expense"
            active={chartType === 'expense'}
            onPress={() => setChartType('expense')}
            style={styles.filterChip}
          />
          <Chip
            label="Pemasukan"
            icon="income"
            active={chartType === 'income'}
            onPress={() => setChartType('income')}
            style={styles.filterChip}
          />
        </View>

        {/* Daily Trend Bar Chart */}
        <DailyTrendBarChart
          key={`trend-${chartType}-${periodMode}-${currentMonth}`}
          data={chartType === 'income' ? dailyIncome : dailyExpense}
          type={chartType}
        />

        {/* Category Breakdown Donut & List Card */}
        <CategoryBreakdownChart
          key={`breakdown-${chartType}-${periodMode}-${currentMonth}`}
          categories={chartType === 'income' ? incomeCategoryShares : expenseCategoryShares}
          totalAmount={chartType === 'income' ? totalIncome : totalExpense}
          type={chartType}
        />
      </ScrollView>
    </PageGradient>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: spacing.gutter,
  },
  modeRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  modeChip: {
    marginRight: 8,
  },
  chartFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  filterChip: {
    marginRight: 8,
  },
  periodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderRadius: radius.full,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: colors.glass.borderSoft,
  },
  periodNavBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodText: {
    paddingHorizontal: spacing.md,
    color: colors.onSurface,
  },
});
