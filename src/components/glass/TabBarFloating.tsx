import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { colors, shadow } from '../../theme/tokens';
import { fontFamilies } from '../../theme/typography';
import { AppIcon, IconName } from '../../theme/icons';

interface TabItem {
  name: string;
  label: string;
  icon: IconName;
}

const TABS: TabItem[] = [
  { name: 'index', label: 'Beranda', icon: 'home' },
  { name: 'transactions', label: 'Riwayat', icon: 'history' },
  { name: 'budgets', label: 'Anggaran', icon: 'budget' },
  { name: 'reports', label: 'Laporan', icon: 'report' },
];

interface AnimatedTabItemProps {
  tab: TabItem;
  isFocused: boolean;
  onPress: () => void;
}

function AnimatedTabItem({ tab, isFocused, onPress }: AnimatedTabItemProps) {
  const [anim] = useState(() => new Animated.Value(isFocused ? 1 : 0));

  useEffect(() => {
    Animated.spring(anim, {
      toValue: isFocused ? 1 : 0,
      friction: 6,
      tension: 80,
      useNativeDriver: true,
    }).start();
  }, [isFocused, anim]);

  const iconScale = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.14],
  });

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.tabItem,
        pressed && styles.tabItemPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={tab.label}
    >
      <Animated.View style={{ transform: [{ scale: iconScale }] }}>
        <AppIcon
          name={tab.icon}
          size={22}
          color={isFocused ? colors.primary : colors.onSurfaceMuted}
          strokeWidth={isFocused ? 2.2 : 1.6}
        />
      </Animated.View>
      <Text
        style={[
          styles.tabLabel,
          isFocused ? styles.activeLabel : styles.inactiveLabel,
        ]}
        numberOfLines={1}
      >
        {tab.label}
      </Text>
    </Pressable>
  );
}

export function TabBarFloating(props: any) {
  const { state, navigation, navigateToTab } = props;
  const insets = useSafeAreaInsets();

  const handleTabPress = (routeKey: string, routeName: string, isFocused: boolean) => {
    Haptics.selectionAsync().catch(() => {});
    if (navigation?.emit) {
      const event = navigation.emit({
        type: 'tabPress',
        target: routeKey,
        canPreventDefault: true,
      });

      if (!isFocused && !event?.defaultPrevented) {
        navigation.navigate(routeName);
      }
    } else if (navigateToTab) {
      if (!isFocused) {
        navigateToTab(routeKey);
      }
    } else {
      router.navigate(routeName as any);
    }
  };

  const handleAddPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    router.push('/add-transaction');
  };

  return (
    <View
      style={[
        styles.outerContainer,
        {
          bottom: Math.max(insets.bottom, 14),
        },
      ]}
      pointerEvents="box-none"
    >
      <View style={[styles.shadowWrap, shadow.floating]}>
        <View style={styles.barInner}>
          {/* Left 2 tabs */}
          {TABS.slice(0, 2).map((tab) => {
            const route = state.routes.find((r: any) => r.name === tab.name);
            const isFocused =
              state.index === state.routes.findIndex((r: any) => r.name === tab.name);

            return (
              <AnimatedTabItem
                key={tab.name}
                tab={tab}
                isFocused={isFocused}
                onPress={() => route && handleTabPress(route.key, route.name, isFocused)}
              />
            );
          })}

          {/* Central Add Button */}
          <View style={styles.addWrapper}>
            <Pressable
              onPress={handleAddPress}
              style={({ pressed }) => [
                styles.addButton,
                shadow.primary,
                pressed && styles.addPreferred,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Tambah Transaksi"
            >
              <AppIcon name="plus" size={26} color={colors.onPrimary} strokeWidth={2.2} />
            </Pressable>
          </View>

          {/* Right 2 tabs */}
          {TABS.slice(2, 4).map((tab) => {
            const route = state.routes.find((r: any) => r.name === tab.name);
            const isFocused =
              state.index === state.routes.findIndex((r: any) => r.name === tab.name);

            return (
              <AnimatedTabItem
                key={tab.name}
                tab={tab}
                isFocused={isFocused}
                onPress={() => route && handleTabPress(route.key, route.name, isFocused)}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 100,
  },
  shadowWrap: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#FFFFFF',
    borderRadius: 36,
    borderWidth: 1,
    borderColor: colors.glass.borderSoft,
  },
  barInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 4,
    height: 62,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    paddingHorizontal: 2,
  },
  tabItemPressed: {
    opacity: 0.7,
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 2,
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  activeLabel: {
    color: colors.primary,
    fontFamily: fontFamilies.bold,
  },
  inactiveLabel: {
    color: colors.onSurfaceMuted,
    fontFamily: fontFamilies.medium,
  },
  addWrapper: {
    paddingHorizontal: 2,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPreferred: {
    transform: [{ scale: 0.94 }],
  },
});
