import React from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Wallet } from '../../db/types';
import { colors, radius } from '../../theme/tokens';
import { fontFamilies } from '../../theme/typography';
import { AppIcon } from '../../theme/icons';
import { formatCurrency } from '../../lib/formatters';

interface WalletPickerHorizontalProps {
  wallets: Wallet[];
  selectedWalletId: string | null;
  onSelectWallet: (id: string) => void;
  showBalance?: boolean;
}

export function WalletPickerHorizontal({
  wallets,
  selectedWalletId,
  onSelectWallet,
  showBalance = false,
}: WalletPickerHorizontalProps) {
  const handleSelect = (id: string) => {
    Haptics.selectionAsync().catch(() => {});
    onSelectWallet(id);
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {wallets.map((w) => {
        const isSelected = selectedWalletId === w.id;
        return (
          <Pressable
            key={w.id}
            onPress={() => handleSelect(w.id)}
            style={({ pressed }) => [
              styles.item,
              isSelected ? styles.itemSelected : styles.itemUnselected,
              pressed && styles.itemPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={w.name}
          >
            <View
              style={[
                styles.iconWrap,
                { backgroundColor: w.colorKey || colors.primary },
              ]}
            >
              <AppIcon name={w.iconKey} size={16} color="#FFFFFF" strokeWidth={2} />
            </View>
            <View style={styles.textWrap}>
              <Text
                style={[
                  styles.name,
                  isSelected && styles.nameSelected,
                ]}
                numberOfLines={1}
              >
                {w.name}
              </Text>
              {showBalance && (
                <Text style={styles.balance}>
                  {formatCurrency(w.currentBalance ?? 0)}
                </Text>
              )}
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 0,
    paddingVertical: 4,
    flexDirection: 'row',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.full,
    paddingVertical: 7,
    paddingHorizontal: 14,
    marginRight: 10,
  },
  itemUnselected: {
    borderWidth: 1,
    borderColor: colors.glass.borderSoft,
  },
  itemSelected: {
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  itemPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }],
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },
  textWrap: {
    justifyContent: 'center',
  },
  name: {
    color: colors.onSurface,
    fontFamily: fontFamilies.semiBold,
    fontSize: 13,
  },
  nameSelected: {
    color: colors.primary,
  },
  balance: {
    color: colors.onSurfaceMuted,
    fontFamily: fontFamilies.regular,
    fontSize: 11,
    marginTop: 1,
  },
});
