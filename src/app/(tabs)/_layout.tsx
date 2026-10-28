import React from 'react';
import { Tabs } from 'expo-router';
import { TabBarFloating } from '../../components/glass/TabBarFloating';
import { colors } from '../../theme/tokens';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBarFloating {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.surface },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Beranda' }} />
      <Tabs.Screen name="transactions" options={{ title: 'Riwayat' }} />
      <Tabs.Screen name="budgets" options={{ title: 'Anggaran' }} />
      <Tabs.Screen name="reports" options={{ title: 'Laporan' }} />
    </Tabs>
  );
}
