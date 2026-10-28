import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  RefreshControl,
  Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PageGradient } from '../../components/PageGradient';
import { GlassCard } from '../../components/glass/GlassCard';
import { ButtonSecondary } from '../../components/glass/ButtonSecondary';
import { ButtonIconGlass } from '../../components/glass/ButtonIconGlass';
import { ButtonText } from '../../components/glass/ButtonText';
import { ListRow } from '../../components/glass/ListRow';
import { Heading } from '../../components/glass/Heading';
import { EmptyStateCard } from '../../components/glass/EmptyStateCard';
import { DateFilterModal } from '../../components/forms/DateFilterModal';
import { useWalletStore } from '../../store/walletStore';
import { useTransactionStore } from '../../store/transactionStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useBudgetStore } from '../../store/budgetStore';
import { colors, spacing } from '../../theme/tokens';
import { typography, fontFamilies } from '../../theme/typography';
import { AppIcon } from '../../theme/icons';
import {
  formatCurrency,
  getRelativeDateLabel,
} from '../../lib/formatters';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  const { totalBalance, refreshWallets } = useWalletStore();
  const {
    currentMonth,
    monthRangeLabel,
    monthIncome,
    monthExpense,
    recentTransactions,
    nextMonth,
    prevMonth,
    setCurrentMonth,
    setCustomDateRange,
    refreshTransactions,
  } = useTransactionStore();

  const { hideBalance, toggleHideBalance, monthStartDay } = useSettingsStore();
  const { budgets, refreshBudgets } = useBudgetStore();

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refreshWallets(),
      refreshTransactions(monthStartDay),
      refreshBudgets(currentMonth, monthStartDay),
    ]);
    setRefreshing(false);
  };

  // Find top threatened budget
  const activeBudgets = budgets.filter((b) => b.amount > 0);
  const highestBudget = activeBudgets.length > 0
    ? [...activeBudgets].sort((a, b) => (b.percentage ?? 0) - (a.percentage ?? 0))[0]
    : null;

  return (
    <PageGradient>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top, 16),
            paddingBottom: 132,
          },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Top Header Bar */}
        <View style={styles.headerBar}>
          <View>
            <Text style={typography.labelUppercase}>DAYDREAM MONEY</Text>
            <Text style={[typography.displayMd, styles.appName]}>Keuangan Tenang</Text>
          </View>
          <View style={styles.headerActions}>
            <ButtonIconGlass
              icon="calendar"
              onPress={() => router.push('/calendar')}
              style={styles.iconMargin}
              accessibilityLabel="Kalender Transaksi"
            />
            <ButtonIconGlass
              icon="bank"
              onPress={() => router.push('/wallets')}
              style={styles.iconMargin}
              accessibilityLabel="Daftar Dompet"
            />
            <ButtonIconGlass
              icon="settings"
              onPress={() => router.push('/settings')}
              accessibilityLabel="Pengaturan"
            />
          </View>
        </View>

        {/* Period Selector: prev ← [Month / Filter] → next */}
        <View style={styles.periodRow}>
          <Pressable
            onPress={() => prevMonth(monthStartDay)}
            style={styles.periodNavBtn}
            accessibilityLabel="Bulan sebelumnya"
          >
            <AppIcon name="chevronLeft" size={20} color={colors.onSurfaceVariant} />
          </Pressable>

          <Pressable
            onPress={() => setFilterModalVisible(true)}
            style={styles.periodCenter}
            accessibilityRole="button"
            accessibilityLabel="Pilih periode dan tanggal"
          >
            <Text style={[typography.labelMd, styles.periodText]}>
              {monthRangeLabel || currentMonth}
            </Text>
            <View style={{ marginLeft: 6 }}>
              <AppIcon name="filter" size={13} color={colors.primary} />
            </View>
          </Pressable>

          <Pressable
            onPress={() => nextMonth(monthStartDay)}
            style={styles.periodNavBtn}
            accessibilityLabel="Bulan berikutnya"
          >
            <AppIcon name="chevronRight" size={20} color={colors.onSurfaceVariant} />
          </Pressable>
        </View>

        {/* Hero Card: Total Saldo */}
        <GlassCard style={styles.heroCard} padding={22}>
          <View style={styles.heroTop}>
            <Text style={[typography.labelUppercase, styles.heroEyebrow]}>
              TOTAL SALDO
            </Text>
            <Pressable
              onPress={toggleHideBalance}
              style={styles.eyeBtn}
              accessibilityRole="button"
              accessibilityLabel={hideBalance ? 'Tampilkan saldo' : 'Sembunyikan saldo'}
            >
              <AppIcon
                name={hideBalance ? 'eyeOff' : 'eye'}
                size={20}
                color={colors.onSurfaceMuted}
              />
            </Pressable>
          </View>

          <Text style={[typography.displayLg, styles.heroBalance]} numberOfLines={1}>
            {formatCurrency(totalBalance, hideBalance)}
          </Text>

          {/* Month Cash Flow summary (+ and -) */}
          <View style={styles.flowRow}>
            <View style={styles.flowItem}>
              <View style={[styles.flowIconCircle, { backgroundColor: 'rgba(129, 149, 229, 0.15)' }]}> 
                <AppIcon name="income" size={18} color={colors.primary} strokeWidth={2} />
              </View>
              <View>
                <Text style={styles.flowLabel}>Pemasukan</Text>
                <Text style={[styles.flowAmount, { color: colors.primary }]}> 
                  {formatCurrency(monthIncome, hideBalance)}
                </Text>
              </View>
            </View>

            <View style={styles.flowItem}>
              <View style={[styles.flowIconCircle, { backgroundColor: 'rgba(235, 107, 120, 0.15)' }]}>
                <AppIcon name="expense" size={18} color={colors.error} strokeWidth={2} />
              </View>
              <View>
                <Text style={styles.flowLabel}>Pengeluaran</Text>
                <Text style={[styles.flowAmount, { color: colors.onSurface }]}> 
                  {formatCurrency(monthExpense, hideBalance)}
                </Text>
              </View>
            </View>
          </View>
        </GlassCard>

        {/* Quick Action Row */}
        <View style={styles.quickActionRow}>
          <ButtonSecondary
            label="Pengeluaran"
            icon="expense"
            iconColor={colors.error}
            iconBgColor="rgba(233, 123, 134, 0.12)"
            onPress={() => router.push({ pathname: '/add-transaction', params: { type: 'expense' } })}
            style={styles.actionBtnMargin}
          />
          <ButtonSecondary
            label="Pemasukan"
            icon="income"
            iconColor={colors.primary}
            iconBgColor="rgba(132, 150, 230, 0.15)"
            onPress={() => router.push({ pathname: '/add-transaction', params: { type: 'income' } })}
            style={styles.actionBtnMargin}
          />
          <ButtonSecondary
            label="Transfer"
            icon="transfer"
            iconColor={colors.onSurface}
            iconBgColor="rgba(28, 43, 65, 0.08)"
            onPress={() => router.push({ pathname: '/add-transaction', params: { type: 'transfer' } })}
          />
        </View>

        {/* Budget Warning / Summary Preview */}
        {highestBudget && (
          <GlassCard style={styles.budgetPreviewCard} padding={spacing.md}>
            <View style={styles.budgetHeader}>
              <View style={styles.budgetHeaderLeft}>
                <AppIcon name="budget" size={16} color={colors.primary} />
                <Text style={[typography.labelMd, styles.budgetTitle]}>
                  {highestBudget.categoryName}
                </Text>
              </View>
              <Text
                style={[
                  typography.caption,
                  {
                    color:
                      (highestBudget.percentage ?? 0) >= 100
                        ? colors.error
                        : (highestBudget.percentage ?? 0) >= 80
                        ? colors.warning
                        : colors.primary,
                    fontWeight: '700',
                  },
                ]}
              >
                {highestBudget.percentage}% terpakai
              </Text>
            </View>

            <View style={styles.budgetProgressBar}>
              <View
                style={[
                  styles.budgetProgressFill,
                  {
                    width: `${Math.min(highestBudget.percentage ?? 0, 100)}%`,
                    backgroundColor:
                      (highestBudget.percentage ?? 0) >= 100
                        ? colors.error
                        : (highestBudget.percentage ?? 0) >= 80
                        ? colors.warning
                        : colors.primary,
                  },
                ]}
              />
            </View>

            <View style={styles.budgetFooter}>
              <Text style={typography.caption}>
                Terpakai: {formatCurrency(highestBudget.spent ?? 0)}
              </Text>
              <Text style={typography.caption}>
                Batas: {formatCurrency(highestBudget.amount)}
              </Text>
            </View>
          </GlassCard>
        )}

        {/* Recent Transactions Section */}
        <View style={styles.recentSection}>
          <Heading
            eyebrow="MUTASI TERBARU"
            title="Aktivitas Keuangan"
            variant="headline"
            rightAction={
              <ButtonText
                label="Lihat semua"
                onPress={() => router.push('/transactions')}
              />
            }
          />

          {recentTransactions.length === 0 ? (
            <EmptyStateCard
              icon="history"
              title="Belum ada transaksi"
              subtitle="Ketuk tombol + untuk mencatat pengeluaran atau pemasukan pertama Anda."
              actionLabel="Catat Transaksi"
              onAction={() => router.push('/add-transaction')}
            />
          ) : (
            recentTransactions.map((tx) => {
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
                  title={tx.categoryName || (isTransfer ? 'Transfer Dompet' : 'Lainnya')}
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

      {/* Date / Month / Range Filter Modal */}
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
  scrollContent: {
    paddingHorizontal: 20,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  appName: {
    color: colors.onSurface,
    fontFamily: fontFamilies.regular,
    fontSize: 24,
    lineHeight: 32,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconMargin: {
    marginRight: 8,
  },
  periodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  periodNavBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodCenter: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  periodText: {
    color: colors.onSurface,
    fontSize: 15,
    fontFamily: fontFamilies.semiBold,
  },
  heroCard: {
    marginBottom: 20,
    borderRadius: 28,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroEyebrow: {
    color: colors.onSurfaceMuted,
    fontSize: 10,
    letterSpacing: 1.6,
    fontFamily: fontFamilies.bold,
  },
  eyeBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBalance: {
    marginVertical: 20,
    fontSize: 40,
    lineHeight: 48,
    letterSpacing: -1,
    fontFamily: fontFamilies.light,
    color: colors.onSurface,
  },
  flowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  flowItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flowIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  flowLabel: {
    fontSize: 11,
    color: colors.onSurfaceMuted,
    fontFamily: fontFamilies.medium,
  },
  flowAmount: {
    fontSize: 14,
    fontFamily: fontFamilies.bold,
    marginTop: 1,
  },
  quickActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  actionBtnMargin: {
    marginRight: 10,
  },
  budgetPreviewCard: {
    marginBottom: spacing.md,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  budgetHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  budgetTitle: {
    marginLeft: 6,
    color: colors.onSurface,
  },
  budgetProgressBar: {
    height: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 3,
    overflow: 'hidden',
    marginVertical: 4,
  },
  budgetProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  budgetFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  recentSection: {
    marginTop: 0,
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  emptyTitle: {
    marginTop: spacing.sm,
    color: colors.onSurface,
    fontWeight: '600',
  },
  emptySubtitle: {
    textAlign: 'center',
    marginTop: 4,
    color: colors.onSurfaceVariant,
    paddingHorizontal: spacing.md,
  },
});
