import React, { useState, useEffect, useCallback } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PageGradient } from '../../components/PageGradient';
import { GlassCard } from '../../components/glass/GlassCard';
import { EmptyStateCard } from '../../components/glass/EmptyStateCard';
import { Heading } from '../../components/glass/Heading';
import { ButtonPrimary } from '../../components/glass/ButtonPrimary';
import { ButtonIconGlass } from '../../components/glass/ButtonIconGlass';
import { InputText } from '../../components/glass/InputText';
import { CategoryPickerHorizontal } from '../../components/forms/CategoryPickerHorizontal';
import { useBudgetStore } from '../../store/budgetStore';
import { useCategoryStore } from '../../store/categoryStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useTransactionStore } from '../../store/transactionStore';
import { colors, radius, spacing } from '../../theme/tokens';
import { typography } from '../../theme/typography';
import { AppIcon } from '../../theme/icons';
import { formatCurrency, formatNumberWithDots } from '../../lib/formatters';
import { parseNominal } from '../../lib/nominalParser';

export default function BudgetsScreen() {
  const insets = useSafeAreaInsets();
  const { currentMonth, monthRangeLabel, nextMonth, prevMonth } = useTransactionStore();
  const { monthStartDay, hideBalance } = useSettingsStore();
  const { budgets, totalBudgeted, totalSpent, refreshBudgets, saveBudget, deleteBudget } =
    useBudgetStore();
  const { expenseCategories } = useCategoryStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [budgetLimitText, setBudgetLimitText] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshBudgets(currentMonth, monthStartDay);
    setRefreshing(false);
  }, [currentMonth, monthStartDay, refreshBudgets]);

  useEffect(() => {
    refreshBudgets(currentMonth, monthStartDay);
  }, [currentMonth, monthStartDay, refreshBudgets]);

  useFocusEffect(
    useCallback(() => {
      refreshBudgets(currentMonth, monthStartDay);
    }, [currentMonth, monthStartDay, refreshBudgets])
  );

  const handleOpenAddModal = (catId?: string, existingAmount?: number) => {
    if (catId) {
      setSelectedCatId(catId);
      setBudgetLimitText(existingAmount ? formatNumberWithDots(existingAmount) : '');
    } else {
      setSelectedCatId(expenseCategories[0]?.id || null);
      setBudgetLimitText('');
    }
    setModalVisible(true);
  };

  const handleSave = async () => {
    const amount = parseNominal(budgetLimitText);
    if (amount <= 0) {
      Alert.alert('Perhatian', 'Masukkan nominal batas anggaran yang valid');
      return;
    }

    await saveBudget({
      categoryId: selectedCatId,
      amount,
      startMonth: currentMonth,
    }, monthStartDay);

    setModalVisible(false);
    setBudgetLimitText('');
  };

  const handleDelete = (budgetId: string) => {
    Alert.alert('Hapus Anggaran', 'Apakah Anda yakin ingin menghapus batas anggaran ini?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
          onPress: () => deleteBudget(budgetId, currentMonth, monthStartDay),
      },
    ]);
  };

  const totalPercentage =
    totalBudgeted > 0 ? Math.round((totalSpent / totalBudgeted) * 100) : 0;

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
          eyebrow="RENCANA KEUANGAN"
          title="Anggaran Bulanan"
          variant="headline"
          rightAction={
            <ButtonIconGlass
              icon="plus"
              onPress={() => handleOpenAddModal()}
              accessibilityLabel="Tambah Anggaran"
            />
          }
        />

        {/* Period Selector */}
        <View style={styles.periodRow}>
          <Pressable
            onPress={() => prevMonth(monthStartDay)}
            style={styles.periodNavBtn}
          >
            <AppIcon name="chevronLeft" size={18} color={colors.onSurfaceVariant} />
          </Pressable>
          <Text style={[typography.labelMd, styles.periodText]}>
            {monthRangeLabel || currentMonth}
          </Text>
          <Pressable
            onPress={() => nextMonth(monthStartDay)}
            style={styles.periodNavBtn}
          >
            <AppIcon name="chevronRight" size={18} color={colors.onSurfaceVariant} />
          </Pressable>
        </View>

        {/* Total Budget Card */}
        <GlassCard style={styles.totalCard}>
          <Text style={[typography.labelUppercase, styles.cardEyebrow]}>
            TOTAL ANGGARAN BULAN INI
          </Text>
          <View style={styles.amountRow}>
            <Text style={[typography.displayMd, styles.spentAmount]}>
              {formatCurrency(totalSpent, hideBalance)}
            </Text>
            <Text style={[typography.headlineSm, styles.limitAmount]}>
              / {formatCurrency(totalBudgeted, hideBalance)}
            </Text>
          </View>

          {/* Progress bar */}
          <View style={styles.barTrack}>
            <View
              style={[
                styles.barFill,
                {
                  width: `${Math.min(totalPercentage, 100)}%`,
                  backgroundColor:
                    totalPercentage >= 100
                      ? colors.error
                      : totalPercentage >= 80
                      ? colors.warning
                      : colors.success,
                },
              ]}
            />
          </View>

          <View style={styles.totalCardFooter}>
            <Text style={typography.caption}>
              Sisa:{' '}
              {formatCurrency(
                Math.max(totalBudgeted - totalSpent, 0),
                hideBalance
              )}
            </Text>
            <Text
              style={[
                typography.caption,
                {
                  color:
                    totalPercentage >= 100
                      ? colors.error
                      : totalPercentage >= 80
                      ? colors.warning
                      : colors.primary,
                  fontWeight: '700',
                },
              ]}
            >
              {totalPercentage}% terpakai
            </Text>
          </View>
        </GlassCard>

        {/* Categories Budgets List */}
        <Heading
          eyebrow="RINCIAN KATEGORI"
          title="Batas Per Kategori"
          variant="small"
          style={styles.sectionHeader}
        />

        {budgets.length === 0 ? (
          <EmptyStateCard
            icon="budget"
            title="Belum ada anggaran"
            subtitle="Atur batas belanja per kategori agar keuangan Anda tetap terkendali."
            actionLabel="Atur Anggaran Sekarang"
            onAction={() => handleOpenAddModal()}
          />
        ) : (
          budgets.map((b) => {
            const pct = b.percentage ?? 0;
            const isExceeded = pct >= 100;
            const isWarning = pct >= 80 && pct < 100;

            const progressColor = isExceeded
              ? colors.error
              : isWarning
              ? colors.warning
              : colors.success;

            return (
              <GlassCard key={b.id} style={styles.itemCard} padding={spacing.md}>
                <View style={styles.itemHeader}>
                  <View style={styles.itemLeft}>
                    <View
                      style={[
                        styles.iconCircle,
                        { backgroundColor: b.categoryColor || colors.primary },
                      ]}
                    >
                      <AppIcon name={b.categoryIcon || 'tag'} size={18} color="#FFFFFF" />
                    </View>
                    <View>
                      <Text style={[typography.bodyMd, styles.itemTitle]}>
                        {b.categoryName}
                      </Text>
                      <Text style={typography.caption}>
                        Batas: {formatCurrency(b.amount, hideBalance)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.itemRight}>
                    <Pressable
                      onPress={() => handleDelete(b.id)}
                      style={styles.deleteBtn}
                      accessibilityLabel="Hapus batas anggaran"
                    >
                      <AppIcon name="trash" size={16} color={colors.onSurfaceVariant} />
                    </Pressable>
                  </View>
                </View>

                {/* Progress bar */}
                <View style={styles.itemBarTrack}>
                  <View
                    style={[
                      styles.itemBarFill,
                      {
                        width: `${Math.min(pct, 100)}%`,
                        backgroundColor: progressColor,
                      },
                    ]}
                  />
                </View>

                <View style={styles.itemFooter}>
                  <Text style={typography.caption}>
                    Terpakai: {formatCurrency(b.spent ?? 0, hideBalance)}
                  </Text>
                  <Text style={[typography.caption, { color: progressColor, fontWeight: '700' }]}>
                    {pct}%
                  </Text>
                </View>
              </GlassCard>
            );
          })
        )}
      </ScrollView>

      {/* Add / Edit Budget Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <GlassCard style={styles.modalContent} padding={spacing.lg}>
            <View style={styles.modalHeader}>
              <Text style={[typography.headlineSm, styles.modalTitle]}>
                Atur Batas Anggaran
              </Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <AppIcon name="close" size={22} color={colors.onSurface} />
              </Pressable>
            </View>

            <Text style={[typography.caption, styles.modalLabel]}>
              PILIH KATEGORI
            </Text>
            <CategoryPickerHorizontal
              categories={expenseCategories}
              selectedCategoryId={selectedCatId}
              onSelectCategory={(id) => setSelectedCatId(id)}
            />

            <Text style={[typography.caption, styles.modalLabel, { marginTop: spacing.md }]}>
              NOMINAL BATAS (Rp)
            </Text>
            <InputText
              placeholder="Contoh: 1.500.000 atau 1.5jt"
              value={budgetLimitText}
              onChangeText={setBudgetLimitText}
              keyboardType="numeric"
            />

            <ButtonPrimary
              label="Simpan Anggaran"
              onPress={handleSave}
              style={styles.modalSaveBtn}
            />
          </GlassCard>
        </KeyboardAvoidingView>
      </Modal>
    </PageGradient>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: spacing.gutter,
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
  totalCard: {
    marginBottom: spacing.md,
  },
  cardEyebrow: {
    color: colors.onSurfaceVariant,
    marginBottom: 4,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginVertical: spacing.sm,
  },
  spentAmount: {
    color: colors.onSurface,
  },
  limitAmount: {
    marginLeft: 6,
    color: colors.onSurfaceVariant,
  },
  barTrack: {
    height: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: radius.full,
    overflow: 'hidden',
    marginVertical: spacing.sm,
  },
  barFill: {
    height: '100%',
    borderRadius: radius.full,
  },
  totalCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sectionHeader: {
    marginTop: spacing.sm,
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
  emptyBtn: {
    marginTop: spacing.md,
    width: '100%',
  },
  itemCard: {
    marginBottom: spacing.sm,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  itemTitle: {
    color: colors.onSurface,
    fontWeight: '600',
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteBtn: {
    padding: 6,
  },
  itemBarTrack: {
    height: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: spacing.sm,
    marginBottom: 4,
  },
  itemBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
    padding: spacing.sm,
  },
  modalContent: {
    borderRadius: radius.xl,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    color: colors.onSurface,
  },
  modalLabel: {
    color: colors.onSurfaceVariant,
    marginBottom: 6,
  },
  modalSaveBtn: {
    marginTop: spacing.lg,
  },
});
