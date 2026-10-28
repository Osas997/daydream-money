import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PageGradient } from '../../components/PageGradient';
import { TopAppBar } from '../../components/glass/TopAppBar';
import { GlassCard } from '../../components/glass/GlassCard';
import { ListRow } from '../../components/glass/ListRow';
import { Chip } from '../../components/glass/Chip';
import { InputText } from '../../components/glass/InputText';
import { ButtonPrimary } from '../../components/glass/ButtonPrimary';
import { useCategoryStore } from '../../store/categoryStore';
import { CategoryKind } from '../../db/types';
import { colors, radius, spacing } from '../../theme/tokens';
import { typography } from '../../theme/typography';
import { AppIcon } from '../../theme/icons';

const PRESET_COLORS = [
  '#F7A072',
  '#8496E6',
  '#F3B562',
  '#E97B86',
  '#9B89B3',
  '#77BA99',
  '#64B5F6',
  '#A1887F',
  '#7986CB',
  '#F06292',
  '#A0AAB8',
];

export default function CategoriesScreen() {
  const insets = useSafeAreaInsets();
  const [kind, setKind] = useState<CategoryKind>('expense');
  const [modalVisible, setModalVisible] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);

  const {
    expenseCategories,
    incomeCategories,
    createCategory,
    archiveCategory,
  } = useCategoryStore();

  const currentList = kind === 'expense' ? expenseCategories : incomeCategories;

  const handleAddCategory = async () => {
    if (!newCatName.trim()) {
      Alert.alert('Perhatian', 'Nama kategori tidak boleh kosong');
      return;
    }

    await createCategory({
      name: newCatName.trim(),
      kind,
      iconKey: kind === 'expense' ? 'shopping' : 'sparkles',
      colorKey: selectedColor,
    });

    setModalVisible(false);
    setNewCatName('');
  };

  const handleArchive = (id: string, name: string) => {
    Alert.alert(
      'Arsipkan Kategori',
      `Apakah Anda yakin ingin mengarsipkan kategori "${name}"?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Arsipkan',
          style: 'destructive',
          onPress: () => archiveCategory(id),
        },
      ]
    );
  };

  return (
    <PageGradient>
      <TopAppBar
        leftIcon="chevronLeft"
        onLeftPress={() => router.back()}
        title="Kelola Kategori"
        rightIcon="plus"
        onRightPress={() => setModalVisible(true)}
      />

      <View style={styles.tabRow}>
        <Chip
          label="Pengeluaran"
          active={kind === 'expense'}
          onPress={() => setKind('expense')}
          style={styles.tabChip}
        />
        <Chip
          label="Pemasukan"
          active={kind === 'income'}
          onPress={() => setKind('income')}
          style={styles.tabChip}
        />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: Math.max(insets.bottom, 24),
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {currentList.map((cat) => (
          <ListRow
            key={cat.id}
            title={cat.name}
            subtitle={cat.isDefault ? 'Kategori bawaan' : 'Kategori kustom'}
            icon={cat.iconKey}
            iconBgColor={`${cat.colorKey}22`}
            iconColor={cat.colorKey}
            rightElement={
              !cat.isDefault ? (
                <Pressable
                  onPress={() => handleArchive(cat.id, cat.name)}
                  style={styles.archiveBtn}
                >
                  <AppIcon name="trash" size={16} color={colors.error} />
                </Pressable>
              ) : null
            }
          />
        ))}

        <ButtonPrimary
          label={`Tambah Kategori ${kind === 'expense' ? 'Pengeluaran' : 'Pemasukan'}`}
          icon="plus"
          onPress={() => setModalVisible(true)}
          style={styles.addBtn}
        />
      </ScrollView>

      {/* Add Category Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <GlassCard style={styles.modalCard} padding={spacing.lg}>
            <View style={styles.modalHeader}>
              <Text style={[typography.headlineSm, styles.modalTitle]}>
                Tambah Kategori
              </Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <AppIcon name="close" size={22} color={colors.onSurface} />
              </Pressable>
            </View>

            <Text style={[typography.caption, styles.modalLabel]}>
              NAMA KATEGORI
            </Text>
            <InputText
              placeholder="Contoh: Kopi & Nongkrong..."
              value={newCatName}
              onChangeText={setNewCatName}
              containerStyle={{ marginBottom: spacing.md }}
            />

            <Text style={[typography.caption, styles.modalLabel]}>
              PILIH WARNA
            </Text>
            <View style={styles.colorGrid}>
              {PRESET_COLORS.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setSelectedColor(c)}
                  style={[
                    styles.colorDot,
                    { backgroundColor: c },
                    selectedColor === c && styles.colorDotActive,
                  ]}
                />
              ))}
            </View>

            <ButtonPrimary
              label="Simpan Kategori"
              onPress={handleAddCategory}
              style={{ marginTop: spacing.md }}
            />
          </GlassCard>
        </View>
      </Modal>
    </PageGradient>
  );
}

const styles = StyleSheet.create({
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.gutter,
    paddingVertical: spacing.sm,
  },
  tabChip: {
    marginRight: 8,
  },
  content: {
    paddingHorizontal: spacing.gutter,
    paddingTop: 4,
  },
  archiveBtn: {
    padding: 6,
  },
  addBtn: {
    marginTop: spacing.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
    padding: spacing.sm,
  },
  modalCard: {
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
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  colorDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorDotActive: {
    borderColor: colors.onSurface,
    transform: [{ scale: 1.15 }],
  },
});
