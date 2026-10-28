import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import { ButtonPrimary } from '../glass/ButtonPrimary';
import { ButtonIconGlass } from '../glass/ButtonIconGlass';
import { colors, radius } from '../../theme/tokens';
import { fontFamilies } from '../../theme/typography';
import { AppIcon } from '../../theme/icons';
import { MONTH_NAMES_SHORT_ID } from '../../lib/formatters';

interface DateFilterModalProps {
  visible: boolean;
  onClose: () => void;
  currentMonth: string; // YYYY-MM
  monthStartDay?: number;
  onSelectMonth: (ym: string) => void;
  onSelectDateRange: (range: { startDate: string; endDate: string; label: string }) => void;
  onReset: () => void;
  onOpenCalendar: () => void;
}

type TabMode = 'preset' | 'month' | 'range';

export function DateFilterModal({
  visible,
  onClose,
  currentMonth,
  onSelectMonth,
  onSelectDateRange,
  onReset,
  onOpenCalendar,
}: DateFilterModalProps) {
  const [tabMode, setTabMode] = useState<TabMode>('preset');

  // Month selector state
  const [selectedYear, setSelectedYear] = useState(() => {
    const [y] = currentMonth.split('-').map(Number);
    return y || new Date().getFullYear();
  });
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(() => {
    const [, m] = currentMonth.split('-').map(Number);
    return (m || 1) - 1;
  });

  // Range selector state
  const now = new Date();
  const [startYear, setStartYear] = useState(now.getFullYear());
  const [startMonth, setStartMonth] = useState(now.getMonth() + 1);
  const [startDay, setStartDay] = useState(1);

  const [endYear, setEndYear] = useState(now.getFullYear());
  const [endMonth, setEndMonth] = useState(now.getMonth() + 1);
  const [endDay, setEndDay] = useState(now.getDate());

  const handleApplyPreset = (type: 'today' | '7days' | '30days' | 'thisMonth' | 'lastMonth') => {
    const today = new Date();
    const todayEndStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}T23:59:59.999Z`;

    if (type === 'today') {
      const todayStartStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}T00:00:00.000Z`;
      onSelectDateRange({
        startDate: todayStartStr,
        endDate: todayEndStr,
        label: `Hari Ini (${today.getDate()} ${MONTH_NAMES_SHORT_ID[today.getMonth()]})`,
      });
      onClose();
      return;
    }

    if (type === '7days') {
      const past = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000);
      const startStr = `${past.getFullYear()}-${String(past.getMonth() + 1).padStart(2, '0')}-${String(past.getDate()).padStart(2, '0')}T00:00:00.000Z`;
      onSelectDateRange({
        startDate: startStr,
        endDate: todayEndStr,
        label: `7 Hari Terakhir`,
      });
      onClose();
      return;
    }

    if (type === '30days') {
      const past = new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000);
      const startStr = `${past.getFullYear()}-${String(past.getMonth() + 1).padStart(2, '0')}-${String(past.getDate()).padStart(2, '0')}T00:00:00.000Z`;
      onSelectDateRange({
        startDate: startStr,
        endDate: todayEndStr,
        label: `30 Hari Terakhir`,
      });
      onClose();
      return;
    }

    if (type === 'thisMonth') {
      const ym = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
      onSelectMonth(ym);
      onClose();
      return;
    }

    if (type === 'lastMonth') {
      let y = today.getFullYear();
      let m = today.getMonth(); // 0-based
      if (m === 0) {
        m = 12;
        y -= 1;
      }
      const ym = `${y}-${String(m).padStart(2, '0')}`;
      onSelectMonth(ym);
      onClose();
      return;
    }
  };

  const handleApplyMonth = () => {
    const ym = `${selectedYear}-${String(selectedMonthIndex + 1).padStart(2, '0')}`;
    onSelectMonth(ym);
    onClose();
  };

  const handleApplyRange = () => {
    const sDate = new Date(startYear, startMonth - 1, startDay);
    const eDate = new Date(endYear, endMonth - 1, endDay);

    const actualStart = sDate <= eDate ? sDate : eDate;
    const actualEnd = sDate <= eDate ? eDate : sDate;

    const startISO = `${actualStart.getFullYear()}-${String(actualStart.getMonth() + 1).padStart(2, '0')}-${String(actualStart.getDate()).padStart(2, '0')}T00:00:00.000Z`;
    const endISO = `${actualEnd.getFullYear()}-${String(actualEnd.getMonth() + 1).padStart(2, '0')}-${String(actualEnd.getDate()).padStart(2, '0')}T23:59:59.999Z`;

    const label = `${actualStart.getDate()} ${MONTH_NAMES_SHORT_ID[actualStart.getMonth()]} - ${actualEnd.getDate()} ${MONTH_NAMES_SHORT_ID[actualEnd.getMonth()]} ${actualEnd.getFullYear()}`;

    onSelectDateRange({
      startDate: startISO,
      endDate: endISO,
      label,
    });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Filter Periode & Tanggal</Text>
            <ButtonIconGlass
              icon="close"
              size={36}
              iconSize={18}
              onPress={onClose}
              accessibilityLabel="Tutup"
            />
          </View>

          {/* Mode Switcher */}
          <View style={styles.tabRow}>
            <Pressable
              onPress={() => setTabMode('preset')}
              style={[styles.tabBtn, tabMode === 'preset' && styles.tabBtnActive]}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  tabMode === 'preset' && styles.tabBtnTextActive,
                ]}
              >
                Pilihan Cepat
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setTabMode('month')}
              style={[styles.tabBtn, tabMode === 'month' && styles.tabBtnActive]}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  tabMode === 'month' && styles.tabBtnTextActive,
                ]}
              >
                Pilih Bulan
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setTabMode('range')}
              style={[styles.tabBtn, tabMode === 'range' && styles.tabBtnActive]}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  tabMode === 'range' && styles.tabBtnTextActive,
                ]}
              >
                Rentang Tanggal
              </Text>
            </Pressable>
          </View>

          <ScrollView style={styles.contentBody} showsVerticalScrollIndicator={false}>
            {/* Mode 1: Presets */}
            {tabMode === 'preset' && (
              <View style={styles.presetSection}>
                <Pressable
                  style={styles.presetItem}
                  onPress={() => handleApplyPreset('thisMonth')}
                >
                  <AppIcon name="calendar" size={18} color={colors.primary} />
                  <Text style={styles.presetText}>Bulan Ini</Text>
                  <AppIcon name="chevronRight" size={16} color={colors.onSurfaceMuted} />
                </Pressable>
                <Pressable
                  style={styles.presetItem}
                  onPress={() => handleApplyPreset('lastMonth')}
                >
                  <AppIcon name="calendar" size={18} color={colors.primary} />
                  <Text style={styles.presetText}>Bulan Lalu</Text>
                  <AppIcon name="chevronRight" size={16} color={colors.onSurfaceMuted} />
                </Pressable>
                <Pressable
                  style={styles.presetItem}
                  onPress={() => handleApplyPreset('today')}
                >
                  <AppIcon name="calendar" size={18} color={colors.primary} />
                  <Text style={styles.presetText}>Hari Ini</Text>
                  <AppIcon name="chevronRight" size={16} color={colors.onSurfaceMuted} />
                </Pressable>
                <Pressable
                  style={styles.presetItem}
                  onPress={() => handleApplyPreset('7days')}
                >
                  <AppIcon name="history" size={18} color={colors.primary} />
                  <Text style={styles.presetText}>7 Hari Terakhir</Text>
                  <AppIcon name="chevronRight" size={16} color={colors.onSurfaceMuted} />
                </Pressable>
                <Pressable
                  style={styles.presetItem}
                  onPress={() => handleApplyPreset('30days')}
                >
                  <AppIcon name="history" size={18} color={colors.primary} />
                  <Text style={styles.presetText}>30 Hari Terakhir</Text>
                  <AppIcon name="chevronRight" size={16} color={colors.onSurfaceMuted} />
                </Pressable>
              </View>
            )}

            {/* Mode 2: Month Grid */}
            {tabMode === 'month' && (
              <View style={styles.monthSection}>
                {/* Year Navigation */}
                <View style={styles.yearRow}>
                  <Pressable
                    onPress={() => setSelectedYear((y) => y - 1)}
                    style={styles.navArrow}
                  >
                    <AppIcon name="chevronLeft" size={20} color={colors.onSurface} />
                  </Pressable>
                  <Text style={styles.yearText}>{selectedYear}</Text>
                  <Pressable
                    onPress={() => setSelectedYear((y) => y + 1)}
                    style={styles.navArrow}
                  >
                    <AppIcon name="chevronRight" size={20} color={colors.onSurface} />
                  </Pressable>
                </View>

                {/* Months Grid */}
                <View style={styles.monthsGrid}>
                  {MONTH_NAMES_SHORT_ID.map((name, index) => {
                    const isSelected = selectedMonthIndex === index;
                    return (
                      <Pressable
                        key={name}
                        onPress={() => setSelectedMonthIndex(index)}
                        style={[
                          styles.monthGridCell,
                          isSelected && styles.monthGridCellActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.monthGridText,
                            isSelected && styles.monthGridTextActive,
                          ]}
                        >
                          {name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <View style={{ marginTop: 14 }}>
                  <ButtonPrimary label="Terapkan Bulan" onPress={handleApplyMonth} />
                </View>
              </View>
            )}

            {/* Mode 3: Date Range */}
            {tabMode === 'range' && (
              <View style={styles.rangeSection}>
                {/* Start Date */}
                <Text style={styles.rangeFieldLabel}>DARI TANGGAL</Text>
                <View style={styles.stepperRow}>
                  <View style={styles.stepperCol}>
                    <Text style={styles.stepperSublabel}>Hari</Text>
                    <View style={styles.stepperControls}>
                      <Pressable
                        onPress={() => setStartDay((d) => Math.max(1, d - 1))}
                        style={styles.stepBtn}
                      >
                        <Text style={styles.stepBtnText}>-</Text>
                      </Pressable>
                      <Text style={styles.stepValue}>{startDay}</Text>
                      <Pressable
                        onPress={() => setStartDay((d) => Math.min(31, d + 1))}
                        style={styles.stepBtn}
                      >
                        <Text style={styles.stepBtnText}>+</Text>
                      </Pressable>
                    </View>
                  </View>

                  <View style={styles.stepperCol}>
                    <Text style={styles.stepperSublabel}>Bulan</Text>
                    <View style={styles.stepperControls}>
                      <Pressable
                        onPress={() => setStartMonth((m) => Math.max(1, m - 1))}
                        style={styles.stepBtn}
                      >
                        <Text style={styles.stepBtnText}>-</Text>
                      </Pressable>
                      <Text style={styles.stepValue}>
                        {MONTH_NAMES_SHORT_ID[startMonth - 1]}
                      </Text>
                      <Pressable
                        onPress={() => setStartMonth((m) => Math.min(12, m + 1))}
                        style={styles.stepBtn}
                      >
                        <Text style={styles.stepBtnText}>+</Text>
                      </Pressable>
                    </View>
                  </View>

                  <View style={styles.stepperCol}>
                    <Text style={styles.stepperSublabel}>Tahun</Text>
                    <View style={styles.stepperControls}>
                      <Pressable
                        onPress={() => setStartYear((y) => y - 1)}
                        style={styles.stepBtn}
                      >
                        <Text style={styles.stepBtnText}>-</Text>
                      </Pressable>
                      <Text style={styles.stepValue}>{startYear}</Text>
                      <Pressable
                        onPress={() => setStartYear((y) => y + 1)}
                        style={styles.stepBtn}
                      >
                        <Text style={styles.stepBtnText}>+</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>

                {/* End Date */}
                <Text style={[styles.rangeFieldLabel, { marginTop: 14 }]}>
                  SAMPAI TANGGAL
                </Text>
                <View style={styles.stepperRow}>
                  <View style={styles.stepperCol}>
                    <Text style={styles.stepperSublabel}>Hari</Text>
                    <View style={styles.stepperControls}>
                      <Pressable
                        onPress={() => setEndDay((d) => Math.max(1, d - 1))}
                        style={styles.stepBtn}
                      >
                        <Text style={styles.stepBtnText}>-</Text>
                      </Pressable>
                      <Text style={styles.stepValue}>{endDay}</Text>
                      <Pressable
                        onPress={() => setEndDay((d) => Math.min(31, d + 1))}
                        style={styles.stepBtn}
                      >
                        <Text style={styles.stepBtnText}>+</Text>
                      </Pressable>
                    </View>
                  </View>

                  <View style={styles.stepperCol}>
                    <Text style={styles.stepperSublabel}>Bulan</Text>
                    <View style={styles.stepperControls}>
                      <Pressable
                        onPress={() => setEndMonth((m) => Math.max(1, m - 1))}
                        style={styles.stepBtn}
                      >
                        <Text style={styles.stepBtnText}>-</Text>
                      </Pressable>
                      <Text style={styles.stepValue}>
                        {MONTH_NAMES_SHORT_ID[endMonth - 1]}
                      </Text>
                      <Pressable
                        onPress={() => setEndMonth((m) => Math.min(12, m + 1))}
                        style={styles.stepBtn}
                      >
                        <Text style={styles.stepBtnText}>+</Text>
                      </Pressable>
                    </View>
                  </View>

                  <View style={styles.stepperCol}>
                    <Text style={styles.stepperSublabel}>Tahun</Text>
                    <View style={styles.stepperControls}>
                      <Pressable
                        onPress={() => setEndYear((y) => y - 1)}
                        style={styles.stepBtn}
                      >
                        <Text style={styles.stepBtnText}>-</Text>
                      </Pressable>
                      <Text style={styles.stepValue}>{endYear}</Text>
                      <Pressable
                        onPress={() => setEndYear((y) => y + 1)}
                        style={styles.stepBtn}
                      >
                        <Text style={styles.stepBtnText}>+</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>

                <View style={{ marginTop: 16 }}>
                  <ButtonPrimary label="Terapkan Rentang Tanggal" onPress={handleApplyRange} />
                </View>
              </View>
            )}

            {/* Quick Link to Calendar Screen */}
            <View style={styles.calendarLinkWrap}>
              <Pressable
                style={styles.calendarLinkBtn}
                onPress={() => {
                  onClose();
                  onOpenCalendar();
                }}
              >
                <AppIcon name="calendar" size={18} color={colors.primary} />
                <Text style={styles.calendarLinkText}>
                  Lihat Kalender Lengkap Transaksi
                </Text>
              </Pressable>
            </View>
          </ScrollView>

          {/* Footer Reset */}
          <View style={styles.footer}>
            <Pressable
              onPress={() => {
                onReset();
                onClose();
              }}
              style={styles.resetBtn}
            >
              <Text style={styles.resetBtnText}>Reset ke Bulan Ini</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 28,
    maxHeight: '88%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: fontFamilies.bold,
    color: colors.onSurface,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderRadius: radius.full,
    padding: 3,
    marginBottom: 16,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
  },
  tabBtnActive: {
    backgroundColor: colors.primary,
  },
  tabBtnText: {
    fontSize: 12,
    fontFamily: fontFamilies.medium,
    color: colors.onSurfaceVariant,
  },
  tabBtnTextActive: {
    color: colors.onPrimary,
    fontFamily: fontFamilies.bold,
  },
  contentBody: {
    maxHeight: 380,
  },
  presetSection: {
    marginBottom: 10,
  },
  presetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#FAFAFC',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.glass.borderSoft,
    marginBottom: 8,
  },
  presetText: {
    flex: 1,
    fontSize: 14,
    fontFamily: fontFamilies.medium,
    color: colors.onSurface,
    marginLeft: 12,
  },
  monthSection: {
    paddingVertical: 4,
  },
  yearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  navArrow: {
    padding: 8,
  },
  yearText: {
    fontSize: 18,
    fontFamily: fontFamilies.bold,
    color: colors.onSurface,
    marginHorizontal: 16,
  },
  monthsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  monthGridCell: {
    width: '23%',
    paddingVertical: 10,
    backgroundColor: '#FAFAFC',
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.glass.borderSoft,
  },
  monthGridCellActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  monthGridText: {
    fontSize: 13,
    fontFamily: fontFamilies.medium,
    color: colors.onSurface,
  },
  monthGridTextActive: {
    color: colors.onPrimary,
    fontFamily: fontFamilies.bold,
  },
  rangeSection: {
    paddingVertical: 4,
  },
  rangeFieldLabel: {
    fontSize: 11,
    fontFamily: fontFamilies.bold,
    color: colors.onSurfaceMuted,
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  stepperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stepperCol: {
    flex: 1,
    marginHorizontal: 4,
    backgroundColor: '#FAFAFC',
    borderRadius: radius.md,
    padding: 8,
    borderWidth: 1,
    borderColor: colors.glass.borderSoft,
    alignItems: 'center',
  },
  stepperSublabel: {
    fontSize: 10,
    color: colors.onSurfaceMuted,
    fontFamily: fontFamilies.medium,
    marginBottom: 4,
  },
  stepperControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  stepBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.glass.borderSoft,
  },
  stepBtnText: {
    fontSize: 16,
    fontFamily: fontFamilies.bold,
    color: colors.primary,
  },
  stepValue: {
    fontSize: 13,
    fontFamily: fontFamilies.bold,
    color: colors.onSurface,
  },
  calendarLinkWrap: {
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.glass.borderSoft,
  },
  calendarLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: radius.full,
    backgroundColor: 'rgba(129, 149, 229, 0.12)',
  },
  calendarLinkText: {
    fontSize: 13,
    fontFamily: fontFamilies.semiBold,
    color: colors.primary,
    marginLeft: 8,
  },
  footer: {
    marginTop: 12,
    alignItems: 'center',
  },
  resetBtn: {
    paddingVertical: 6,
  },
  resetBtnText: {
    fontSize: 12,
    fontFamily: fontFamilies.medium,
    color: colors.onSurfaceMuted,
  },
});
