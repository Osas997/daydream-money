import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PageGradient } from '../../components/PageGradient';
import { GlassCard } from '../../components/glass/GlassCard';
import { ButtonPrimary } from '../../components/glass/ButtonPrimary';
import { InputText } from '../../components/glass/InputText';
import { useSettingsStore } from '../../store/settingsStore';
import { useWalletStore } from '../../store/walletStore';
import { useBudgetStore } from '../../store/budgetStore';
import { colors, spacing } from '../../theme/tokens';
import { typography } from '../../theme/typography';
import { AppIcon } from '../../theme/icons';
import { parseNominal } from '../../lib/nominalParser';

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const [slide, setSlide] = useState(0);
  const [walletName, setWalletName] = useState('Tunai');
  const [initialBalanceText, setInitialBalanceText] = useState('');
  const [budgetLimitText, setBudgetLimitText] = useState('');

  const { setOnboardingCompleted, onboardingCompleted, loading: settingsLoading } = useSettingsStore();
  const { wallets, updateWallet } = useWalletStore();
  const { saveBudget } = useBudgetStore();

  useEffect(() => {
    if (!settingsLoading && onboardingCompleted) {
      router.replace('/(tabs)');
    }
  }, [settingsLoading, onboardingCompleted]);

  const handleFinish = async () => {
    try {
      const initialBal = parseNominal(initialBalanceText);
      const budgetAmount = parseNominal(budgetLimitText);

      const targetWallet = wallets.find((w) => w.id === 'wallet-default-cash') || wallets[0];
      const trimmedName = walletName.trim() || 'Tunai';

      if (targetWallet) {
        await updateWallet(targetWallet.id, {
          name: trimmedName,
          initialBalance: initialBal,
        });
      }

      if (budgetAmount > 0) {
        const currentMonth = new Date().toISOString().slice(0, 7);
        await saveBudget({
          categoryId: null,
          amount: budgetAmount,
          startMonth: currentMonth,
        });
      }

      await setOnboardingCompleted(true);
      router.replace('/(tabs)');
    } catch (err) {
      console.error('Error finishing onboarding:', err);
      await setOnboardingCompleted(true);
      router.replace('/(tabs)');
    }
  };

  return (
    <PageGradient>
      <View
        style={[
          styles.container,
          {
            paddingTop: Math.max(insets.top, 32),
            paddingBottom: Math.max(insets.bottom, 24),
          },
        ]}
      >
        {/* Top Skip button */}
        <View style={styles.topBar}>
          <Text style={typography.labelUppercase}>DAYDREAM MONEY</Text>
          <Pressable onPress={handleFinish}>
            <Text style={[typography.labelMd, { color: colors.primary }]}>
              Lewati
            </Text>
          </Pressable>
        </View>

        {/* Slide Carousel Cards */}
        <View style={styles.cardArea}>
          {slide === 0 && (
            <GlassCard style={styles.slideCard} padding={spacing.xl}>
              <View style={styles.iconCircle}>
                <AppIcon name="sparkles" size={36} color={colors.primary} />
              </View>
              <Text style={[typography.labelUppercase, styles.eyebrow]}>
                SELAMAT DATANG
              </Text>
              <Text style={[typography.displayMd, styles.title]}>
                Keuangan Tenang, Hidup Lapang
              </Text>
              <Text style={[typography.bodyMd, styles.desc]}>
                Catat pengeluaran harian dalam hitungan detik. Tanpa ribet, offline 100%, dengan visual soft glass yang menenangkan.
              </Text>
            </GlassCard>
          )}

          {slide === 1 && (
            <GlassCard style={styles.slideCard} padding={spacing.xl}>
              <View style={styles.iconCircle}>
                <AppIcon name="budget" size={36} color={colors.primary} />
              </View>
              <Text style={[typography.labelUppercase, styles.eyebrow]}>
                KENDALI PENUH
              </Text>
              <Text style={[typography.displayMd, styles.title]}>
                Anggaran & Laporan Jelas
              </Text>
              <Text style={[typography.bodyMd, styles.desc]}>
                Ketahui ke mana uang Anda pergi dengan grafik intuitif dan batas anggaran cerdas sebelum pengeluaran bocor.
              </Text>
            </GlassCard>
          )}

          {slide === 2 && (
            <GlassCard style={styles.slideCard} padding={spacing.lg}>
              <View style={styles.iconCircle}>
                <AppIcon name="bank" size={32} color={colors.primary} />
              </View>
              <Text style={[typography.labelUppercase, styles.eyebrow]}>
                LANGKAH TERAKHIR
              </Text>
              <Text style={[typography.headlineMd, styles.title]}>
                Siapkan Dompet & Anggaran
              </Text>
              <Text style={[typography.caption, styles.desc]}>
                Atur nama dompet, saldo awal, dan target anggaran bulanan Anda.
              </Text>

              <View style={styles.inputArea}>
                <Text style={[typography.caption, styles.fieldLabel]}>
                  NAMA DOMPET
                </Text>
                <InputText
                  value={walletName}
                  onChangeText={setWalletName}
                  placeholder="Tunai / BCA / GoPay"
                  containerStyle={{ marginBottom: spacing.xs }}
                />

                <Text style={[typography.caption, styles.fieldLabel]}>
                  SALDO AWAL (OPSIONAL)
                </Text>
                <InputText
                  value={initialBalanceText}
                  onChangeText={setInitialBalanceText}
                  placeholder="0 atau 1.5jt"
                  keyboardType="numeric"
                  containerStyle={{ marginBottom: spacing.xs }}
                />

                <Text style={[typography.caption, styles.fieldLabel]}>
                  BATAS ANGGARAN BULAN INI (OPSIONAL)
                </Text>
                <InputText
                  value={budgetLimitText}
                  onChangeText={setBudgetLimitText}
                  placeholder="Contoh: 3jt atau 5.000.000"
                  keyboardType="numeric"
                />
              </View>
            </GlassCard>
          )}
        </View>

        {/* Bottom Pagination & Navigation */}
        <View style={styles.bottomSection}>
          <View style={styles.indicatorRow}>
            {[0, 1, 2].map((idx) => (
              <View
                key={idx}
                style={[
                  styles.indicatorDot,
                  slide === idx && styles.indicatorDotActive,
                ]}
              />
            ))}
          </View>

          {slide < 2 ? (
            <ButtonPrimary
              label="Lanjutkan"
              icon="chevronRight"
              onPress={() => setSlide(slide + 1)}
            />
          ) : (
            <ButtonPrimary
              label="Mulai Mencatat Sekarang"
              icon="check"
              onPress={handleFinish}
            />
          )}
        </View>
      </View>
    </PageGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardArea: {
    flex: 1,
    justifyContent: 'center',
    marginVertical: spacing.md,
  },
  slideCard: {
    alignItems: 'center',
    textAlign: 'center',
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(132, 150, 230, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  eyebrow: {
    color: colors.primary,
    marginBottom: 6,
  },
  title: {
    textAlign: 'center',
    color: colors.onSurface,
    marginBottom: spacing.sm,
  },
  desc: {
    textAlign: 'center',
    color: colors.onSurfaceVariant,
    lineHeight: 22,
  },
  inputArea: {
    width: '100%',
    marginTop: spacing.md,
  },
  fieldLabel: {
    color: colors.onSurfaceVariant,
    marginBottom: 4,
    marginLeft: 4,
  },
  bottomSection: {
    width: '100%',
  },
  indicatorRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(132, 150, 230, 0.25)',
    marginHorizontal: 4,
  },
  indicatorDotActive: {
    width: 24,
    backgroundColor: colors.primary,
  },
});
