import React, { useEffect, useState } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet, AppState, AppStateStatus } from 'react-native';
import {
  useFonts,
  PlusJakartaSans_200ExtraLight,
  PlusJakartaSans_300Light,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { getDb } from '../db/client';
import { useSettingsStore } from '../store/settingsStore';
import { useWalletStore } from '../store/walletStore';
import { useCategoryStore } from '../store/categoryStore';
import { useTransactionStore } from '../store/transactionStore';
import { colors } from '../theme/tokens';

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_200ExtraLight,
    PlusJakartaSans_300Light,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  const [dbReady, setDbReady] = useState(false);
  const {
    refreshSettings,
    appLockEnabled,
    isUnlocked,
    onboardingCompleted,
    loading: settingsLoading,
    lockApp,
  } = useSettingsStore();

  const { refreshWallets } = useWalletStore();
  const { refreshCategories } = useCategoryStore();
  const { refreshTransactions } = useTransactionStore();

  useEffect(() => {
    async function init() {
      try {
        await getDb();
        await refreshSettings();
        await refreshWallets();
        await refreshCategories();
        await refreshTransactions();
        setDbReady(true);
      } catch (err) {
        console.error('Initialization error:', err);
        setDbReady(true);
      }
    }
    init();
  }, []);

  // Handle app switcher & locking on active
  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'background' || nextState === 'inactive') {
        lockApp();
      }
    };

    const sub = AppState.addEventListener('change', handleAppStateChange);
    return () => sub.remove();
  }, [lockApp]);

  // Handle navigation guard for lock & onboarding
  useEffect(() => {
    if (!dbReady || (!fontsLoaded && !fontError) || settingsLoading) return;

    if (!onboardingCompleted) {
      router.replace('/(onboarding)');
    } else if (appLockEnabled && !isUnlocked) {
      router.replace('/lock');
    }
  }, [dbReady, fontsLoaded, fontError, settingsLoading, onboardingCompleted, appLockEnabled, isUnlocked]);

  if ((!fontsLoaded && !fontError) || !dbReady || settingsLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.surface }}>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          contentStyle: { backgroundColor: colors.surface },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="add-transaction"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="transaction/[id]"
          options={{
            animation: 'slide_from_right',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="calendar"
          options={{
            animation: 'slide_from_right',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="wallets/index"
          options={{
            animation: 'slide_from_right',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="wallets/add"
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="categories/index"
          options={{
            animation: 'slide_from_right',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="settings/index"
          options={{
            animation: 'slide_from_right',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="lock"
          options={{
            gestureEnabled: false,
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="(onboarding)/index"
          options={{
            gestureEnabled: false,
            headerShown: false,
          }}
        />
      </Stack>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
