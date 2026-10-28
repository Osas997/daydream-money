import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import Svg, { G, Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { GlassCard } from '../glass/GlassCard';
import { EmptyStateCard } from '../glass/EmptyStateCard';
import { colors, radius, spacing } from '../../theme/tokens';
import { typography, fontFamilies } from '../../theme/typography';
import { AppIcon } from '../../theme/icons';
import { formatCurrency } from '../../lib/formatters';

export interface CategoryShare {
  categoryId: string;
  categoryName: string;
  iconKey: string;
  colorKey: string;
  total: number;
  percentage: number;
}

export interface DailySpendingPoint {
  day: number;
  dateStr: string;
  amount: number;
}

interface CategoryBreakdownChartProps {
  categories: CategoryShare[];
  totalAmount?: number;
  totalExpense?: number;
  type?: 'expense' | 'income';
}

interface DonutSlice extends CategoryShare {
  strokeDashoffset: number;
  rotationAngle: number;
}

function computeDonutSlices(categories: CategoryShare[], circumference: number): DonutSlice[] {
  let accumulated = 0;
  return categories.map((cat) => {
    const strokeDashoffset = circumference - (cat.percentage / 100) * circumference;
    const rotationAngle = (accumulated / 100) * 360;
    accumulated += cat.percentage;
    return {
      ...cat,
      strokeDashoffset,
      rotationAngle,
    };
  });
}

export function CategoryBreakdownChart({
  categories,
  totalAmount,
  totalExpense,
  type = 'expense',
}: CategoryBreakdownChartProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const actualTotal = totalAmount !== undefined ? totalAmount : (totalExpense ?? 0);

  if (categories.length === 0 || actualTotal <= 0) {
    return (
      <EmptyStateCard
        icon={type === 'income' ? 'income' : 'expense'}
        title={type === 'income' ? 'Belum ada data pemasukan' : 'Belum ada data pengeluaran'}
        subtitle={
          type === 'income'
            ? 'Grafik distribusi kategori akan tampil setelah Anda mencatat pemasukan pada periode ini.'
            : 'Grafik distribusi kategori akan tampil setelah Anda mencatat pengeluaran pada periode ini.'
        }
      />
    );
  }

  const handleSelectCategory = (catId: string) => {
    Haptics.selectionAsync().catch(() => {});
    setSelectedCategoryId((prev) => (prev === catId ? null : catId));
  };

  const handleReset = () => {
    Haptics.selectionAsync().catch(() => {});
    setSelectedCategoryId(null);
  };

  const activeCategory = selectedCategoryId
    ? categories.find((c) => c.categoryId === selectedCategoryId)
    : null;

  // SVG Donut calculation
  const size = 154;
  const baseStrokeWidth = 16;
  const radiusCircle = (size - 24) / 2;
  const circumference = 2 * Math.PI * radiusCircle;
  const donutSlices = computeDonutSlices(categories, circumference);

  const titleText = type === 'income' ? 'DISTRIBUSI PEMASUKAN' : 'DISTRIBUSI PENGELUARAN';

  return (
    <GlassCard style={styles.card}>
      <View style={styles.cardHeaderRow}>
        <Text style={[typography.labelUppercase, styles.eyebrow]}>{titleText}</Text>
        {selectedCategoryId && (
          <Pressable
            onPress={handleReset}
            style={styles.resetBadge}
            accessibilityRole="button"
            accessibilityLabel="Reset pilihan kategori"
          >
            <Text style={styles.resetBadgeText}>Reset Pilihan ✕</Text>
          </Pressable>
        )}
      </View>

      {/* Donut Chart with Interactive Center and Slices */}
      <View style={styles.donutWrapper}>
        <Svg width={size} height={size}>
          <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
            {/* Background Base Ring */}
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radiusCircle}
              stroke="rgba(0, 0, 0, 0.05)"
              strokeWidth={baseStrokeWidth}
              fill="none"
            />
            {/* Category Arcs */}
            {donutSlices.map((cat) => {
              const isSelected = selectedCategoryId === cat.categoryId;
              const isDimmed = selectedCategoryId !== null && !isSelected;
              const strokeW = isSelected ? baseStrokeWidth + 4 : baseStrokeWidth;

              return (
                <Circle
                  key={cat.categoryId}
                  cx={size / 2}
                  cy={size / 2}
                  r={radiusCircle}
                  stroke={cat.colorKey || colors.primary}
                  strokeWidth={strokeW}
                  strokeDasharray={`${circumference} ${circumference}`}
                  strokeDashoffset={cat.strokeDashoffset}
                  strokeLinecap="round"
                  fill="none"
                  opacity={isDimmed ? 0.35 : 1}
                  transform={`rotate(${cat.rotationAngle}, ${size / 2}, ${size / 2})`}
                  onPress={() => handleSelectCategory(cat.categoryId)}
                />
              );
            })}
          </G>
        </Svg>

        <Pressable
          onPress={handleReset}
          style={styles.donutCenter}
          accessibilityRole="button"
          accessibilityLabel="Reset pilihan donat"
        >
          <Text style={styles.donutCenterLabel} numberOfLines={1}>
            {activeCategory
              ? activeCategory.categoryName.toUpperCase()
              : type === 'income'
              ? 'PEMASUKAN'
              : 'PENGELUARAN'}
          </Text>
          <Text style={styles.donutCenterValue} numberOfLines={1}>
            {formatCurrency(activeCategory ? activeCategory.total : actualTotal)}
          </Text>
          <Text style={styles.donutCenterSub}>
            {activeCategory ? `${activeCategory.percentage}% dari total` : 'Semua kategori'}
          </Text>
        </Pressable>
      </View>

      {/* Multi-segment horizontal distribution bar */}
      <View style={styles.barContainer}>
        {categories.slice(0, 8).map((cat) => {
          const isSelected = selectedCategoryId === cat.categoryId;
          const isDimmed = selectedCategoryId !== null && !isSelected;

          return (
            <Pressable
              key={cat.categoryId}
              onPress={() => handleSelectCategory(cat.categoryId)}
              style={[
                styles.barSegment,
                {
                  flex: Math.max(cat.percentage, 3),
                  backgroundColor: cat.colorKey || colors.primary,
                  opacity: isDimmed ? 0.35 : 1,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Kategori ${cat.categoryName}`}
            />
          );
        })}
      </View>

      {/* Interactive Categories ranked list */}
      <View style={styles.list}>
        {categories.map((cat) => {
          const isSelected = selectedCategoryId === cat.categoryId;
          const isDimmed = selectedCategoryId !== null && !isSelected;

          return (
            <Pressable
              key={cat.categoryId}
              onPress={() => handleSelectCategory(cat.categoryId)}
              style={({ pressed }) => [
                styles.itemRow,
                isSelected && styles.itemRowActive,
                isDimmed && styles.itemRowDimmed,
                pressed && styles.itemRowPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`${cat.categoryName}, ${formatCurrency(cat.total)}, ${cat.percentage}%`}
            >
              <View style={styles.leftPart}>
                <View
                  style={[
                    styles.dot,
                    { backgroundColor: cat.colorKey || colors.primary },
                  ]}
                />
                <View
                  style={[
                    styles.iconBadge,
                    { backgroundColor: cat.colorKey || colors.primary },
                  ]}
                >
                  <AppIcon name={cat.iconKey} size={14} color="#FFF" />
                </View>
                <Text
                  style={[
                    typography.bodySm,
                    styles.categoryName,
                    isSelected && styles.categoryNameActive,
                  ]}
                  numberOfLines={1}
                >
                  {cat.categoryName}
                </Text>
              </View>

              <View style={styles.rightPart}>
                <Text
                  style={[
                    typography.bodySm,
                    styles.amount,
                    isSelected && styles.amountActive,
                  ]}
                >
                  {formatCurrency(cat.total)}
                </Text>
                <Text style={[typography.caption, styles.percentage]}>
                  {cat.percentage}%
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </GlassCard>
  );
}

interface DailyTrendBarChartProps {
  data: DailySpendingPoint[];
  type?: 'expense' | 'income';
}

export function DailyTrendBarChart({ data, type = 'expense' }: DailyTrendBarChartProps) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  if (data.length === 0) {
    return null;
  }

  const maxAmount = Math.max(...data.map((d) => d.amount), 1);
  const totalAmount = data.reduce((acc, d) => acc + d.amount, 0);
  const activeDays = data.filter((d) => d.amount > 0).length || 1;
  const avgAmount = Math.round(totalAmount / activeDays);

  const activePoint = selectedDay !== null ? data.find((d) => d.day === selectedDay) : null;

  const handleDayPress = (day: number) => {
    Haptics.selectionAsync().catch(() => {});
    setSelectedDay((prev) => (prev === day ? null : day));
  };

  const headerTitle =
    type === 'income' ? 'TREN PEMASUKAN HARIAN' : 'TREN PENGELUARAN HARIAN';

  return (
    <GlassCard style={styles.card}>
      <View style={styles.trendHeader}>
        <Text style={[typography.labelUppercase, styles.eyebrow]}>{headerTitle}</Text>
        {activePoint ? (
          <Pressable
            onPress={() => setSelectedDay(null)}
            style={styles.activeDayBadge}
            accessibilityRole="button"
            accessibilityLabel="Reset filter tanggal"
          >
            <Text style={styles.activeDayBadgeText}>
              Tgl {activePoint.day}: {formatCurrency(activePoint.amount)} ✕
            </Text>
          </Pressable>
        ) : (
          <Text style={[typography.caption, { color: colors.onSurfaceMuted }]}>
            Rata-rata: {formatCurrency(avgAmount)}
          </Text>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dailyBarsContainer}
      >
        {data.map((point) => {
          const heightPercent =
            point.amount > 0 ? Math.max((point.amount / maxAmount) * 100, 8) : 4;
          const isSelected = selectedDay === point.day;
          const isPeak = point.amount === maxAmount && maxAmount > 0;

          return (
            <Pressable
              key={point.day}
              onPress={() => handleDayPress(point.day)}
              style={styles.dailyBarCol}
              accessibilityRole="button"
              accessibilityLabel={`Tanggal ${point.day}: ${formatCurrency(point.amount)}`}
            >
              <View
                style={[
                  styles.dailyBarTrack,
                  isSelected && styles.dailyBarTrackSelected,
                ]}
              >
                <View
                  style={[
                    styles.dailyBarFill,
                    {
                      height: `${heightPercent}%`,
                      backgroundColor: isSelected
                        ? colors.primary
                        : isPeak
                        ? colors.primary
                        : point.amount > 0
                        ? 'rgba(129, 149, 229, 0.55)'
                        : 'rgba(0, 0, 0, 0.08)',
                    },
                  ]}
                />
              </View>
              <Text
                style={[
                  styles.dailyDayLabel,
                  isSelected && styles.dailyDayLabelSelected,
                  isPeak && !isSelected && { color: colors.primary, fontFamily: fontFamilies.bold },
                ]}
              >
                {point.day}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </GlassCard>
  );
}

interface TrendComparisonCardProps {
  income: number;
  expense: number;
}

export function TrendComparisonCard({ income, expense }: TrendComparisonCardProps) {
  const maxVal = Math.max(income, expense, 1);
  const incomeRatio = Math.round((income / maxVal) * 100);
  const expenseRatio = Math.round((expense / maxVal) * 100);
  const netSavings = income - expense;

  return (
    <GlassCard style={styles.card}>
      <Text style={[typography.labelUppercase, styles.eyebrow]}>
        ARUS KAS PERIODE INI
      </Text>

      <View style={styles.trendRow}>
        {/* Income Column */}
        <View style={styles.trendCol}>
          <Text style={[typography.caption, styles.trendLabel]}>Pemasukan</Text>
          <Text style={[typography.headlineSm, { color: colors.primary }]}>
            {formatCurrency(income)}
          </Text>
          <View style={styles.meterTrack}>
            <View
              style={[
                styles.meterFill,
                { height: `${Math.max(incomeRatio, 6)}%`, backgroundColor: colors.primary },
              ]}
            />
          </View>
        </View>

        {/* Expense Column */}
        <View style={styles.trendCol}>
          <Text style={[typography.caption, styles.trendLabel]}>Pengeluaran</Text>
          <Text style={[typography.headlineSm, { color: colors.onSurface }]}>
            {formatCurrency(expense)}
          </Text>
          <View style={styles.meterTrack}>
            <View
              style={[
                styles.meterFill,
                { height: `${Math.max(expenseRatio, 6)}%`, backgroundColor: colors.onSurfaceVariant },
              ]}
            />
          </View>
        </View>
      </View>

      <View style={styles.summaryFooter}>
        <Text style={[typography.caption, { color: colors.onSurfaceVariant }]}>
          Sisa Bersih:
        </Text>
        <Text
          style={[
            typography.labelMd,
            { color: netSavings >= 0 ? colors.primary : colors.error },
          ]}
        >
          {formatCurrency(netSavings)}
        </Text>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  eyebrow: {
    color: colors.onSurfaceVariant,
  },
  resetBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(129, 149, 229, 0.12)',
    borderRadius: radius.full,
  },
  resetBadgeText: {
    fontSize: 10,
    fontFamily: fontFamilies.bold,
    color: colors.primary,
  },
  donutWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
    position: 'relative',
  },
  donutCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: 104,
  },
  donutCenterLabel: {
    fontSize: 9,
    color: colors.onSurfaceMuted,
    fontFamily: fontFamilies.bold,
    letterSpacing: 0.5,
  },
  donutCenterValue: {
    fontSize: 13,
    color: colors.onSurface,
    fontFamily: fontFamilies.bold,
    marginTop: 2,
    textAlign: 'center',
  },
  donutCenterSub: {
    fontSize: 9,
    color: colors.onSurfaceMuted,
    fontFamily: fontFamilies.regular,
    marginTop: 1,
    textAlign: 'center',
  },
  barContainer: {
    height: 9,
    flexDirection: 'row',
    borderRadius: radius.full,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginBottom: spacing.md,
  },
  barSegment: {
    height: '100%',
    marginRight: 2,
  },
  list: {
    marginTop: spacing.xs,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 14,
    marginVertical: 1,
  },
  itemRowActive: {
    backgroundColor: 'rgba(129, 149, 229, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(129, 149, 229, 0.3)',
  },
  itemRowDimmed: {
    opacity: 0.45,
  },
  itemRowPressed: {
    opacity: 0.7,
  },
  leftPart: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
  },
  iconBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  categoryName: {
    color: colors.onSurface,
    fontFamily: fontFamilies.medium,
    fontSize: 13,
    flex: 1,
  },
  categoryNameActive: {
    color: colors.primary,
    fontFamily: fontFamilies.bold,
  },
  rightPart: {
    alignItems: 'flex-end',
    marginLeft: spacing.sm,
  },
  amount: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 13,
    color: colors.onSurface,
  },
  amountActive: {
    color: colors.primary,
    fontFamily: fontFamilies.bold,
  },
  percentage: {
    color: colors.onSurfaceVariant,
    fontSize: 11,
  },
  trendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  activeDayBadge: {
    backgroundColor: 'rgba(129, 149, 229, 0.14)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: radius.full,
  },
  activeDayBadgeText: {
    fontSize: 11,
    fontFamily: fontFamilies.bold,
    color: colors.primary,
  },
  dailyBarsContainer: {
    paddingVertical: 10,
    alignItems: 'flex-end',
  },
  dailyBarCol: {
    width: 18,
    alignItems: 'center',
    marginHorizontal: 3,
  },
  dailyBarTrack: {
    width: 9,
    height: 80,
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    borderRadius: 5,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  dailyBarTrackSelected: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: 'rgba(129, 149, 229, 0.12)',
  },
  dailyBarFill: {
    width: '100%',
    borderRadius: 5,
  },
  dailyDayLabel: {
    fontSize: 9,
    color: colors.onSurfaceMuted,
    fontFamily: fontFamilies.medium,
    marginTop: 6,
  },
  dailyDayLabelSelected: {
    color: colors.primary,
    fontFamily: fontFamilies.bold,
  },
  trendRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  trendCol: {
    alignItems: 'center',
    flex: 1,
  },
  trendLabel: {
    color: colors.onSurfaceVariant,
    marginBottom: 2,
  },
  meterTrack: {
    width: 28,
    height: 90,
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    borderRadius: 14,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    marginTop: spacing.xs,
  },
  meterFill: {
    width: '100%',
    borderRadius: 14,
  },
  summaryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.glass.borderSoft,
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
  },
});
