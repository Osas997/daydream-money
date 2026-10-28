import React from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Category } from '../../db/types';
import { colors } from '../../theme/tokens';
import { fontFamilies } from '../../theme/typography';
import { AppIcon } from '../../theme/icons';

interface CategoryPickerHorizontalProps {
  categories: Category[];
  selectedCategoryId: string | null;
  onSelectCategory: (id: string) => void;
}

export function CategoryPickerHorizontal({
  categories,
  selectedCategoryId,
  onSelectCategory,
}: CategoryPickerHorizontalProps) {
  const handleSelect = (id: string) => {
    Haptics.selectionAsync().catch(() => {});
    onSelectCategory(id);
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {categories.map((c) => {
        const isSelected = selectedCategoryId === c.id;
        return (
          <Pressable
            key={c.id}
            onPress={() => handleSelect(c.id)}
            style={({ pressed }) => [
              styles.item,
              pressed && styles.itemPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={c.name}
          >
            <View style={[styles.outerRing, isSelected && styles.outerRingSelected]}>
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: c.colorKey || colors.primary },
                ]}
              >
                <AppIcon name={c.iconKey} size={20} color="#FFFFFF" strokeWidth={2} />
              </View>
            </View>
            <Text
              style={[
                styles.name,
                isSelected ? styles.nameSelected : styles.nameUnselected,
              ]}
              numberOfLines={1}
            >
              {c.name}
            </Text>
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
    alignItems: 'center',
    marginRight: 14,
    width: 66,
  },
  itemPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.97 }],
  },
  outerRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
  },
  outerRingSelected: {
    borderColor: colors.primary,
  },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    textAlign: 'center',
    fontSize: 11,
  },
  nameUnselected: {
    color: colors.onSurfaceVariant,
    fontFamily: fontFamilies.medium,
  },
  nameSelected: {
    color: colors.primary,
    fontFamily: fontFamilies.bold,
  },
});
