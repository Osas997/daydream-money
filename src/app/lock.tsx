import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { PageGradient } from '../components/PageGradient';
import { CustomKeypad } from '../components/forms/CustomKeypad';
import { ButtonIconGlass } from '../components/glass/ButtonIconGlass';
import { useSettingsStore } from '../store/settingsStore';
import { colors, spacing } from '../theme/tokens';
import { typography } from '../theme/typography';
import { AppIcon } from '../theme/icons';

export default function LockScreen() {
  const insets = useSafeAreaInsets();
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const { verifyPin, authenticateWithBiometrics } = useSettingsStore();

  const triggerShake = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
  };

  const handleDigit = async (d: string) => {
    if (pin.length >= 6) return;
    const nextPin = pin + d;
    setPin(nextPin);
    setErrorMsg('');

    if (nextPin.length === 6) {
      const ok = await verifyPin(nextPin);
      if (ok) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        router.replace('/(tabs)');
      } else {
        triggerShake();
        setErrorMsg('PIN yang Anda masukkan salah');
        setPin('');
      }
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setErrorMsg('');
  };

  const handleBiometrics = async () => {
    const success = await authenticateWithBiometrics();
    if (success) {
      router.replace('/(tabs)');
    }
  };

  useEffect(() => {
    authenticateWithBiometrics().then((success) => {
      if (success) router.replace('/(tabs)');
    });
  }, [authenticateWithBiometrics]);

  return (
    <PageGradient>
      <View
        style={[
          styles.container,
          {
            paddingTop: Math.max(insets.top, 32),
            paddingBottom: Math.max(insets.bottom, 16),
          },
        ]}
      >
        <View style={styles.topArea}>
          <View style={styles.lockIconCircle}>
            <AppIcon name="lock" size={32} color={colors.primary} />
          </View>
          <Text style={[typography.headlineMd, styles.title]}>
            Aplikasi Terkunci
          </Text>
          <Text style={[typography.caption, styles.subtitle]}>
            Masukkan 6 digit PIN untuk membuka
          </Text>

          {/* PIN dots */}
          <View style={styles.dotsRow}>
            {[0, 1, 2, 3, 4, 5].map((idx) => {
              const filled = pin.length > idx;
              return (
                <View
                  key={idx}
                  style={[
                    styles.dot,
                    filled && styles.dotFilled,
                  ]}
                />
              );
            })}
          </View>

          {errorMsg ? (
            <Text style={[typography.caption, styles.errorText]}>{errorMsg}</Text>
          ) : null}

          <ButtonIconGlass
            icon="shield"
            onPress={handleBiometrics}
            size={44}
            iconSize={22}
            style={styles.bioBtn}
            accessibilityLabel="Gunakan Biometrik"
          />
        </View>

        <CustomKeypad
          onDigitPress={handleDigit}
          onBackspacePress={handleBackspace}
          onClear={() => setPin('')}
          variant="pin"
        />
      </View>
    </PageGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    maxWidth: 420,
    width: '100%',
    alignSelf: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  topArea: {
    alignItems: 'center',
    paddingTop: spacing.lg,
  },
  lockIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(132, 150, 230, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    color: colors.onSurface,
    fontWeight: '600',
  },
  subtitle: {
    color: colors.onSurfaceVariant,
    marginTop: 4,
  },
  dotsRow: {
    flexDirection: 'row',
    marginVertical: spacing.lg,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: colors.onSurfaceMuted,
    marginHorizontal: 8,
  },
  dotFilled: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    transform: [{ scale: 1.2 }],
  },
  errorText: {
    color: colors.error,
    marginBottom: spacing.sm,
  },
  bioBtn: {
    marginTop: spacing.xs,
  },
});
