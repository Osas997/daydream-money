import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PageGradient } from '../components/PageGradient';
import { ButtonPrimary } from '../components/glass/ButtonPrimary';
import { ButtonIconGlass } from '../components/glass/ButtonIconGlass';
import { InputText } from '../components/glass/InputText';
import { CustomKeypad } from '../components/forms/CustomKeypad';
import { CategoryPickerHorizontal } from '../components/forms/CategoryPickerHorizontal';
import { WalletPickerHorizontal } from '../components/forms/WalletPickerHorizontal';
import { DatePickerModal } from '../components/forms/DatePickerModal';
import { useWalletStore } from '../store/walletStore';
import { useCategoryStore } from '../store/categoryStore';
import { useTransactionStore } from '../store/transactionStore';
import { TransactionType } from '../db/types';
import { colors, radius } from '../theme/tokens';
import { typography, fontFamilies } from '../theme/typography';
import { AppIcon } from '../theme/icons';
import { parseNominal } from '../lib/nominalParser';
import { formatCurrency, formatDateLabel, isToday, isYesterday } from '../lib/formatters';

export default function AddTransactionModal() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ type?: string; editId?: string }>();

  const initialType: TransactionType =
    params.type === 'income'
      ? 'income'
      : params.type === 'transfer'
      ? 'transfer'
      : 'expense';

  const [txType, setTxType] = useState<TransactionType>(initialType);
  const [nominalRaw, setNominalRaw] = useState('');
  const [note, setNote] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [isKeypadOpen, setIsKeypadOpen] = useState(true);

  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
    const showSub = Keyboard.addListener('keyboardDidShow', () => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setIsKeypadOpen(false);
    });
    return () => {
      showSub.remove();
    };
  }, []);

  const toggleKeypad = (open?: boolean) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsKeypadOpen((prev) => (open !== undefined ? open : !prev));
  };

  const { wallets } = useWalletStore();
  const { expenseCategories, incomeCategories } = useCategoryStore();
  const { createTransaction } = useTransactionStore();

  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(
    wallets[0]?.id || null
  );
  const [toWalletId, setToWalletId] = useState<string | null>(
    wallets[1]?.id || wallets[0]?.id || null
  );

  const activeCategories = txType === 'income' ? incomeCategories : expenseCategories;
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    activeCategories[0]?.id || null
  );

  const [loading, setLoading] = useState(false);

  // Keypad operations
  const handleDigitPress = (digit: string) => {
    setNominalRaw((prev) => {
      if (!prev) return digit === ',' ? '0,' : digit;
      if (/(rb|jt|k|ribu|juta)/i.test(prev)) {
        const parsed = parseNominal(prev);
        return `${parsed}${digit}`;
      }
      return prev + digit;
    });
  };

  const handleShortcut = (suffix: string) => {
    setNominalRaw((prev) => {
      if (!prev) return '';
      const current = parseNominal(prev);
      if (current <= 0) return '';
      const multiplier = suffix === 'jt' ? 1_000_000 : 1_000;
      return String(current * multiplier);
    });
  };

  const handleBackspace = () => {
    setNominalRaw((prev) => {
      if (!prev) return '';
      if (prev.endsWith('rb') || prev.endsWith('jt')) {
        return prev.slice(0, -2);
      }
      return prev.slice(0, -1);
    });
  };

  const handleClear = () => {
    setNominalRaw('');
  };

  const parsedAmount = parseNominal(nominalRaw);

  const handleSave = async () => {
    if (parsedAmount <= 0) {
      Alert.alert('Perhatian', 'Masukkan nominal transaksi yang valid');
      return;
    }

    if (!selectedWalletId) {
      Alert.alert('Perhatian', 'Pilih dompet sumber transaksi');
      return;
    }

    if (txType === 'transfer') {
      if (!toWalletId || toWalletId === selectedWalletId) {
        Alert.alert('Perhatian', 'Pilih dompet tujuan yang berbeda');
        return;
      }
    } else {
      if (!selectedCategoryId) {
        Alert.alert('Perhatian', 'Pilih kategori transaksi');
        return;
      }
    }

    setLoading(true);
    try {
      const txDate = new Date(selectedDate);
      const now = new Date();
      txDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());

      await createTransaction({
        type: txType,
        amount: parsedAmount,
        walletId: selectedWalletId,
        toWalletId: txType === 'transfer' ? toWalletId : null,
        categoryId: txType === 'transfer' ? null : selectedCategoryId,
        note: note.trim() || null,
        occurredAt: txDate.toISOString(),
      });

      router.back();
    } catch (e: any) {
      Alert.alert('Gagal Menyimpan', e.message || 'Terjadi kesalahan saat menyimpan');
    } finally {
      setLoading(false);
    }
  };

  const handleSourceWalletChange = (walletId: string) => {
    setSelectedWalletId(walletId);
    if (txType === 'transfer' && toWalletId === walletId) {
      setToWalletId(wallets.find((wallet) => wallet.id !== walletId)?.id ?? null);
    }
  };

  return (
    <PageGradient>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoider}
      >
      <View
        style={[
          styles.container,
          {
            paddingTop: Math.max(insets.top, 16),
            paddingBottom: Math.max(insets.bottom, 16),
          },
        ]}
      >
        {/* Header Bar */}
        <View style={styles.header}>
          <ButtonIconGlass
            icon="close"
            onPress={() => router.back()}
            size={40}
            iconSize={20}
            accessibilityLabel="Tutup"
          />
          <Text style={styles.headerTitle}>
            {txType === 'expense'
              ? 'Catat Pengeluaran'
              : txType === 'income'
              ? 'Catat Pemasukan'
              : 'Transfer Dompet'}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Segmented Type Bar */}
        <View style={styles.segmentContainer}>
          <Pressable
            onPress={() => {
              setTxType('expense');
              setSelectedCategoryId(expenseCategories[0]?.id || null);
            }}
            style={[
              styles.segmentItem,
              txType === 'expense' && styles.segmentItemActive,
            ]}
          >
            <Text
              style={[
                styles.segmentText,
                txType === 'expense' && styles.segmentTextActive,
              ]}
            >
              Pengeluaran
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              setTxType('income');
              setSelectedCategoryId(incomeCategories[0]?.id || null);
            }}
            style={[
              styles.segmentItem,
              txType === 'income' && styles.segmentItemActive,
            ]}
          >
            <Text
              style={[
                styles.segmentText,
                txType === 'income' && styles.segmentTextActive,
              ]}
            >
              Pemasukan
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setTxType('transfer')}
            style={[
              styles.segmentItem,
              txType === 'transfer' && styles.segmentItemActive,
            ]}
          >
            <Text
              style={[
                styles.segmentText,
                txType === 'transfer' && styles.segmentTextActive,
              ]}
            >
              Transfer
            </Text>
          </Pressable>
        </View>

        {/* Scrollable Form Content */}
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Lavender amount stage with centered raised amount card. */}
          <View style={styles.amountStage}>
            <Pressable
              onPress={() => {
                Keyboard.dismiss();
                toggleKeypad(true);
              }}
              style={styles.amountCard}
              accessibilityRole="button"
              accessibilityLabel="Ubah nominal transaksi"
            >
              <View style={styles.amountHeaderRow}>
                <Text style={styles.amountLabel}>
                  NOMINAL TRANSAKSI
                </Text>
                <View style={styles.amountEditBadge}>
                  <AppIcon name="edit" size={11} color={colors.primary} />
                  <Text style={styles.amountEditText}>
                    {isKeypadOpen ? 'Input aktif' : 'Buka keypad'}
                  </Text>
                </View>
              </View>
              <Text style={styles.amountNumber} numberOfLines={1}>
                {nominalRaw ? formatCurrency(parsedAmount) : 'Rp 0'}
              </Text>
              {nominalRaw ? (
                <Text style={styles.rawHelper}>
                  Input: {nominalRaw}
                </Text>
              ) : (
                <Text style={styles.rawPlaceholder}>
                  Ketuk untuk memasukkan nominal
                </Text>
              )}
            </Pressable>
          </View>

          {/* Date Selector Row */}
          <View style={styles.dateSection}>
            <Text style={[typography.labelUppercase, styles.sectionLabel]}>
              TANGGAL TRANSAKSI
            </Text>
            <View style={styles.dateRow}>
              <Pressable
                onPress={() => setDatePickerVisible(true)}
                style={styles.dateBadge}
                accessibilityRole="button"
                accessibilityLabel="Pilih tanggal transaksi"
              >
                <AppIcon name="calendar" size={16} color={colors.primary} />
                <Text style={styles.dateBadgeText}>
                  {formatDateLabel(selectedDate)}
                </Text>
                <AppIcon name="chevronRight" size={14} color={colors.onSurfaceMuted} />
              </Pressable>

              <View style={styles.quickDateRow}>
                <Pressable
                  onPress={() => setSelectedDate(new Date())}
                  style={[
                    styles.quickDateBtn,
                    isToday(selectedDate) && styles.quickDateBtnActive,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Pilih hari ini"
                >
                  <Text
                    style={[
                      styles.quickDateText,
                      isToday(selectedDate) && styles.quickDateTextActive,
                    ]}
                  >
                    Hari Ini
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    const y = new Date();
                    y.setDate(y.getDate() - 1);
                    setSelectedDate(y);
                  }}
                  style={[
                    styles.quickDateBtn,
                    isYesterday(selectedDate) && styles.quickDateBtnActive,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Pilih kemarin"
                >
                  <Text
                    style={[
                      styles.quickDateText,
                      isYesterday(selectedDate) && styles.quickDateTextActive,
                    ]}
                  >
                    Kemarin
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>

          {/* Category Selector (for expense/income) */}
          {txType !== 'transfer' && (
            <View style={styles.pickerSection}>
              <Text style={[typography.labelUppercase, styles.sectionLabel]}>
                KATEGORI
              </Text>
              <CategoryPickerHorizontal
                categories={activeCategories}
                selectedCategoryId={selectedCategoryId}
                onSelectCategory={setSelectedCategoryId}
              />
            </View>
          )}

          {/* Source Wallet Selector */}
          <View style={styles.pickerSection}>
            <Text style={[typography.labelUppercase, styles.sectionLabel]}>
              {txType === 'transfer' ? 'DARI DOMPET' : 'PAKAI DOMPET'}
            </Text>
            <WalletPickerHorizontal
              wallets={wallets}
              selectedWalletId={selectedWalletId}
              onSelectWallet={handleSourceWalletChange}
              showBalance
            />
          </View>

          {/* Destination Wallet Selector (for transfer) */}
          {txType === 'transfer' && (
            <View style={styles.pickerSection}>
              <Text style={[typography.labelUppercase, styles.sectionLabel]}>
                KE DOMPET TUJUAN
              </Text>
              {wallets.filter((w) => w.id !== selectedWalletId).length > 0 ? (
                <WalletPickerHorizontal
                  wallets={wallets.filter((w) => w.id !== selectedWalletId)}
                  selectedWalletId={toWalletId}
                  onSelectWallet={setToWalletId}
                  showBalance
                />
              ) : (
                <View style={styles.emptyWalletCard}>
                  <Text style={styles.emptyWalletText}>
                    Belum ada dompet lain untuk tujuan transfer
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Note Input */}
          <View style={styles.inputSection}>
            <InputText
              icon="edit"
              placeholder="Catatan transaksi (opsional)..."
              value={note}
              onChangeText={setNote}
              onFocus={() => toggleKeypad(false)}
            />
          </View>
        </ScrollView>

        {/* Floating Docked Keypad and Action Area */}
        <View style={styles.floatingContainer}>
          {isKeypadOpen ? (
            <View style={styles.floatingKeypadCard}>
              <View style={styles.keypadControlBar}>
                <View style={styles.keypadDragIndicator} />
                <Pressable
                  onPress={() => toggleKeypad(false)}
                  style={styles.keypadCollapseBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Sembunyikan keypad"
                >
                  <Text style={styles.keypadCollapseText}>Sembunyikan</Text>
                  <AppIcon name="chevronDown" size={14} color={colors.primary} />
                </Pressable>
              </View>

              <CustomKeypad
                onDigitPress={handleDigitPress}
                onBackspacePress={handleBackspace}
                onShortcutPress={handleShortcut}
                onClear={handleClear}
              />

              <View style={styles.keypadSaveWrap}>
                <ButtonPrimary
                  label="Simpan Transaksi"
                  icon="check"
                  onPress={handleSave}
                  loading={loading}
                />
              </View>
            </View>
          ) : (
            <View style={styles.collapsedBottomBar}>
              <Pressable
                onPress={() => {
                  Keyboard.dismiss();
                  toggleKeypad(true);
                }}
                style={styles.openKeypadBtn}
                accessibilityRole="button"
                accessibilityLabel="Buka keypad nominal"
              >
                <AppIcon name="edit" size={16} color={colors.primary} />
                <Text style={styles.openKeypadText}>Buka Keypad</Text>
              </Pressable>

              <View style={{ flex: 1, marginLeft: 10 }}>
                <ButtonPrimary
                  label="Simpan Transaksi"
                  icon="check"
                  onPress={handleSave}
                  loading={loading}
                />
              </View>
            </View>
          )}
        </View>
      </View>
      </KeyboardAvoidingView>

      <DatePickerModal
        visible={datePickerVisible}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        onClose={() => setDatePickerVisible(false)}
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
  },
  keyboardAvoider: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  headerTitle: {
    color: colors.onSurface,
    fontSize: 18,
    fontFamily: fontFamilies.semiBold,
  },
  segmentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
  },
  segmentItemActive: {
    backgroundColor: colors.primary,
  },
  segmentText: {
    color: colors.onSurfaceVariant,
    fontSize: 13,
    fontFamily: fontFamilies.medium,
  },
  segmentTextActive: {
    color: colors.onPrimary,
    fontFamily: fontFamilies.semiBold,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  amountStage: {
    backgroundColor: '#DFE5F8',
    borderRadius: 28,
    padding: 10,
    marginBottom: 14,
  },
  amountCard: {
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    shadowColor: '#8190C0',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  amountHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 2,
  },
  amountEditBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(129, 149, 229, 0.1)',
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  amountEditText: {
    fontSize: 10,
    fontFamily: fontFamilies.semiBold,
    color: colors.primary,
    marginLeft: 3,
  },
  amountLabel: {
    color: colors.onSurfaceMuted,
    fontSize: 10,
    letterSpacing: 1.4,
    fontFamily: fontFamilies.bold,
  },
  amountNumber: {
    color: colors.onSurface,
    fontSize: 34,
    lineHeight: 40,
    fontFamily: fontFamilies.light,
    letterSpacing: -0.5,
  },
  rawHelper: {
    color: colors.primary,
    fontSize: 11,
    fontFamily: fontFamilies.medium,
    marginTop: 1,
  },
  rawPlaceholder: {
    color: colors.onSurfaceMuted,
    fontSize: 11,
    fontFamily: fontFamilies.regular,
    marginTop: 2,
  },
  emptyWalletCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.glass.borderSoft,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  emptyWalletText: {
    fontSize: 12,
    fontFamily: fontFamilies.medium,
    color: colors.onSurfaceMuted,
  },
  pickerSection: {
    marginBottom: 14,
  },
  dateSection: {
    marginBottom: 14,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.full,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.glass.borderSoft,
    flexShrink: 1,
  },
  dateBadgeText: {
    fontSize: 12,
    fontFamily: fontFamilies.medium,
    color: colors.onSurface,
    marginHorizontal: 6,
  },
  quickDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  quickDateBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radius.full,
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    marginLeft: 6,
  },
  quickDateBtnActive: {
    backgroundColor: colors.primary,
  },
  quickDateText: {
    fontSize: 11,
    fontFamily: fontFamilies.medium,
    color: colors.onSurfaceVariant,
  },
  quickDateTextActive: {
    color: colors.onPrimary,
    fontFamily: fontFamilies.bold,
  },
  sectionLabel: {
    color: colors.onSurfaceMuted,
    fontSize: 11,
    letterSpacing: 1.5,
    fontFamily: fontFamilies.bold,
    marginLeft: 4,
    marginBottom: 5,
  },
  inputSection: {
    marginBottom: 12,
  },
  floatingContainer: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  floatingKeypadCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 10,
    borderWidth: 1,
    borderColor: colors.glass.borderSoft,
    shadowColor: '#8190C0',
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: -4 },
    elevation: 8,
  },
  keypadControlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    marginBottom: 4,
  },
  keypadDragIndicator: {
    width: 32,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.12)',
    alignSelf: 'center',
  },
  keypadCollapseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: radius.full,
    backgroundColor: 'rgba(129, 149, 229, 0.1)',
  },
  keypadCollapseText: {
    fontSize: 11,
    fontFamily: fontFamilies.semiBold,
    color: colors.primary,
    marginRight: 2,
  },
  keypadSaveWrap: {
    marginTop: 8,
  },
  collapsedBottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 4,
  },
  openKeypadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.full,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.glass.borderSoft,
    shadowColor: '#8190C0',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  openKeypadText: {
    fontSize: 13,
    fontFamily: fontFamilies.semiBold,
    color: colors.primary,
    marginLeft: 6,
  },
});
