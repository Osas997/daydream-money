import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import * as settingsRepo from '../db/repositories/settingsRepo';

interface SettingsState {
  hideBalance: boolean;
  currency: string;
  monthStartDay: number;
  appLockEnabled: boolean;
  isUnlocked: boolean;
  onboardingCompleted: boolean;
  loading: boolean;

  toggleHideBalance: () => Promise<void>;
  setMonthStartDay: (day: number) => Promise<void>;
  setOnboardingCompleted: (completed: boolean) => Promise<void>;
  setAppLockEnabled: (enabled: boolean, pin?: string) => Promise<void>;
  verifyPin: (pin: string) => Promise<boolean>;
  authenticateWithBiometrics: () => Promise<boolean>;
  lockApp: () => void;
  unlockApp: () => void;
  refreshSettings: () => Promise<void>;
}

const PIN_STORE_KEY = 'daydream_money_pin_code';

export const useSettingsStore = create<SettingsState>((set, get) => ({
  hideBalance: false,
  currency: 'IDR',
  monthStartDay: 1,
  appLockEnabled: false,
  isUnlocked: false,
  onboardingCompleted: false,
  loading: true,

  refreshSettings: async () => {
    try {
      const all = await settingsRepo.getSettings();
      const hideBalance = all.hide_balance === '1';
      const currency = all.currency || 'IDR';
      const monthStartDay = parseInt(all.month_start_day || '1', 10);
      const appLockEnabled = all.app_lock_enabled === '1';
      const onboardingCompleted = all.onboarding_completed === '1';

      set({
        hideBalance,
        currency,
        monthStartDay,
        appLockEnabled,
        onboardingCompleted,
        // if appLock is disabled, user is unlocked by default
        isUnlocked: !appLockEnabled,
        loading: false,
      });
    } catch (e) {
      console.error('Error refreshing settings:', e);
      set({ loading: false });
    }
  },

  toggleHideBalance: async () => {
    const next = !get().hideBalance;
    set({ hideBalance: next });
    await settingsRepo.setSetting('hide_balance', next ? '1' : '0');
  },

  setMonthStartDay: async (day: number) => {
    set({ monthStartDay: day });
    await settingsRepo.setSetting('month_start_day', day.toString());
  },

  setOnboardingCompleted: async (completed: boolean) => {
    set({ onboardingCompleted: completed });
    await settingsRepo.setSetting('onboarding_completed', completed ? '1' : '0');
  },

  setAppLockEnabled: async (enabled: boolean, pin?: string) => {
    if (enabled && pin) {
      try {
        await SecureStore.setItemAsync(PIN_STORE_KEY, pin);
      } catch (e) {
        console.warn('SecureStore unavailable:', e);
      }
    } else if (!enabled) {
      try {
        await SecureStore.deleteItemAsync(PIN_STORE_KEY);
      } catch (e) {
        console.warn('SecureStore delete error:', e);
      }
    }

    set({ appLockEnabled: enabled, isUnlocked: true });
    await settingsRepo.setSetting('app_lock_enabled', enabled ? '1' : '0');
  },

  verifyPin: async (inputPin: string) => {
    try {
      const savedPin = await SecureStore.getItemAsync(PIN_STORE_KEY);
      if (savedPin === inputPin) {
        set({ isUnlocked: true });
        return true;
      }
    } catch (e) {
      console.warn('Error reading pin from SecureStore:', e);
    }
    return false;
  },

  authenticateWithBiometrics: async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) return false;

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Buka Daydream Money',
        fallbackLabel: 'Gunakan PIN',
      });

      if (result.success) {
        set({ isUnlocked: true });
        return true;
      }
    } catch (e) {
      console.warn('Biometrics error:', e);
    }
    return false;
  },

  lockApp: () => {
    if (get().appLockEnabled) {
      set({ isUnlocked: false });
    }
  },

  unlockApp: () => {
    set({ isUnlocked: true });
  },
}));
