import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PageGradient } from '../../components/PageGradient';
import { TopAppBar } from '../../components/glass/TopAppBar';
import { GlassCard } from '../../components/glass/GlassCard';
import { InputText } from '../../components/glass/InputText';
import { ButtonPrimary } from '../../components/glass/ButtonPrimary';
import { useWalletStore } from '../../store/walletStore';
import { WalletType } from '../../db/types';
import { colors, radius, spacing } from '../../theme/tokens';
import { typography } from '../../theme/typography';
import { parseNominal } from '../../lib/nominalParser';

const WALLET_TYPES: Array<{ type: WalletType; label: string; icon: string }> = [
  { type: 'cash', label: 'Tunai', icon: 'cash' },
  { type: 'bank', label: 'Bank', icon: 'bank' },
  { type: 'ewallet', label: 'E-Wallet', icon: 'ewallet' },
  { type: 'credit_card', label: 'Kartu Kredit', icon: 'subscription' },
  { type: 'other', label: 'Lainnya', icon: 'other' },
];

const PRESET_COLORS = [
  '#77BA99',
  '#8496E6',
  '#F3B562',
  '#9B89B3',
  '#E97B86',
  '#4DB6AC',
  '#64B5F6',
  '#F06292',
];

export default function AddWalletScreen() {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [type, setType] = useState<WalletType>('bank');
  const [colorKey, setColorKey] = useState(PRESET_COLORS[0]);
  const [initialBalanceText, setInitialBalanceText] = useState('');
  const [includeInTotal, setIncludeInTotal] = useState(true);
  const [loading, setLoading] = useState(false);

  const { createWallet } = useWalletStore();

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Perhatian', 'Nama dompet tidak boleh kosong');
      return;
    }

    const initialBalance = parseNominal(initialBalanceText);
    const selectedTypeObj = WALLET_TYPES.find((w) => w.type === type);

    setLoading(true);
    try {
      await createWallet({
        name: name.trim(),
        type,
        colorKey,
        iconKey: selectedTypeObj?.icon || 'cash',
        initialBalance,
        includeInTotal,
      });

      router.back();
    } catch (e: any) {
      Alert.alert('Gagal', e.message || 'Terjadi kesalahan saat menambahkan dompet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageGradient>
      <TopAppBar
        leftIcon="close"
        onLeftPress={() => router.back()}
        title="Tambah Dompet"
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: Math.max(insets.bottom, 24),
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <GlassCard style={styles.card}>
          <Text style={[typography.caption, styles.label]}>NAMA DOMPET</Text>
          <InputText
            placeholder="Contoh: BCA Utama, Dompet Saku, GoPay..."
            value={name}
            onChangeText={setName}
            containerStyle={styles.inputWrap}
          />

          <Text style={[typography.caption, styles.label, { marginTop: spacing.md }]}>
            JENIS DOMPET
          </Text>
          <View style={styles.typesGrid}>
            {WALLET_TYPES.map((t) => (
              <Pressable
                key={t.type}
                onPress={() => setType(t.type)}
                style={[
                  styles.typeBtn,
                  type === t.type && styles.typeBtnActive,
                ]}
              >
                <Text
                  style={[
                    typography.bodySm,
                    styles.typeText,
                    type === t.type && styles.typeTextActive,
                  ]}
                >
                  {t.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={[typography.caption, styles.label, { marginTop: spacing.md }]}>
            WARNA AKSEN
          </Text>
          <View style={styles.colorsRow}>
            {PRESET_COLORS.map((c) => (
              <Pressable
                key={c}
                onPress={() => setColorKey(c)}
                style={[
                  styles.colorDot,
                  { backgroundColor: c },
                  colorKey === c && styles.colorDotActive,
                ]}
              />
            ))}
          </View>

          <Text style={[typography.caption, styles.label, { marginTop: spacing.md }]}>
            SALDO AWAL (Rp)
          </Text>
          <InputText
            placeholder="0 atau 1.5jt"
            value={initialBalanceText}
            onChangeText={setInitialBalanceText}
            keyboardType="numeric"
            containerStyle={styles.inputWrap}
          />

          <Pressable
            onPress={() => setIncludeInTotal(!includeInTotal)}
            style={styles.toggleRow}
          >
            <View
              style={[
                styles.checkbox,
                includeInTotal && styles.checkboxActive,
              ]}
            >
              {includeInTotal && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={[typography.bodyMd, styles.toggleText]}>
              Sertakan dalam total saldo
            </Text>
          </Pressable>
        </GlassCard>

        <ButtonPrimary
          label="Simpan Dompet"
          onPress={handleSave}
          loading={loading}
          style={styles.saveBtn}
        />
      </ScrollView>
    </PageGradient>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.gutter,
    paddingTop: spacing.md,
  },
  card: {
    marginBottom: spacing.md,
  },
  label: {
    color: colors.onSurfaceVariant,
    marginBottom: 6,
  },
  inputWrap: {
    marginBottom: 4,
  },
  typesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  typeBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderWidth: 1,
    borderColor: colors.glass.borderSoft,
    marginRight: 8,
    marginBottom: 8,
  },
  typeBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeText: {
    color: colors.onSurface,
  },
  typeTextActive: {
    color: colors.onPrimary,
    fontWeight: '700',
  },
  colorsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 4,
  },
  colorDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorDotActive: {
    borderColor: colors.onSurface,
    transform: [{ scale: 1.15 }],
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.onSurfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  checkboxActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  toggleText: {
    color: colors.onSurface,
  },
  saveBtn: {
    marginTop: spacing.sm,
  },
});
