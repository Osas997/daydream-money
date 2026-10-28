import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
} from 'react-native';
import { ButtonIconGlass } from '../glass/ButtonIconGlass';
import { colors, radius, shadow } from '../../theme/tokens';
import { fontFamilies } from '../../theme/typography';
import { AppIcon } from '../../theme/icons';
import {
  MONTH_NAMES_ID,
  DAY_NAMES_SHORT_ID,
  isSameDay,
} from '../../lib/formatters';

interface DatePickerModalProps {
  visible: boolean;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  onClose: () => void;
}

export function DatePickerModal({
  visible,
  selectedDate,
  onSelectDate,
  onClose,
}: DatePickerModalProps) {
  const [viewYear, setViewYear] = useState(() => selectedDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(() => selectedDate.getMonth() + 1); // 1-12

  const handlePrevMonth = () => {
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleDaySelect = (day: number) => {
    const newDate = new Date(viewYear, viewMonth - 1, day);
    onSelectDate(newDate);
    onClose();
  };

  const handleQuickSelect = (offsetDays: number) => {
    const target = new Date();
    target.setDate(target.getDate() + offsetDays);
    onSelectDate(target);
    onClose();
  };

  // Matrix calculation
  const firstDayOfWeek = new Date(viewYear, viewMonth - 1, 1).getDay(); // 0 = Sun
  const totalDays = new Date(viewYear, viewMonth, 0).getDate();

  const cells: { day: number | null }[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    cells.push({ day: null });
  }
  for (let d = 1; d <= totalDays; d++) {
    cells.push({ day: d });
  }

  const today = new Date();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Pilih Tanggal Transaksi</Text>
            <ButtonIconGlass
              icon="close"
              size={36}
              iconSize={18}
              onPress={onClose}
              accessibilityLabel="Tutup"
            />
          </View>

          {/* Month Navigator */}
          <View style={styles.monthNav}>
            <Pressable
              onPress={handlePrevMonth}
              style={styles.navArrow}
              accessibilityRole="button"
              accessibilityLabel="Bulan sebelumnya"
            >
              <AppIcon name="chevronLeft" size={20} color={colors.onSurface} />
            </Pressable>
            <Text style={styles.monthTitle}>
              {MONTH_NAMES_ID[viewMonth - 1]} {viewYear}
            </Text>
            <Pressable
              onPress={handleNextMonth}
              style={styles.navArrow}
              accessibilityRole="button"
              accessibilityLabel="Bulan berikutnya"
            >
              <AppIcon name="chevronRight" size={20} color={colors.onSurface} />
            </Pressable>
          </View>

          {/* Days of week */}
          <View style={styles.weekHeader}>
            {DAY_NAMES_SHORT_ID.map((name) => (
              <Text key={name} style={styles.weekHeaderText}>
                {name}
              </Text>
            ))}
          </View>

          {/* Calendar Grid */}
          <View style={styles.grid}>
            {cells.map((cell, idx) => {
              if (cell.day === null) {
                return <View key={`blank-${idx}`} style={styles.gridCell} />;
              }

              const cellDate = new Date(viewYear, viewMonth - 1, cell.day);
              const isSelected = isSameDay(cellDate, selectedDate);
              const isTodayCell = isSameDay(cellDate, today);

              return (
                <Pressable
                  key={`day-${cell.day}`}
                  onPress={() => handleDaySelect(cell.day!)}
                  style={[
                    styles.gridCell,
                    isSelected && styles.gridCellActive,
                    isTodayCell && !isSelected && styles.gridCellToday,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayText,
                      isSelected && styles.dayTextActive,
                      isTodayCell && !isSelected && styles.dayTextToday,
                    ]}
                  >
                    {cell.day}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Quick shortcuts */}
          <View style={styles.quickBar}>
            <Pressable
              onPress={() => handleQuickSelect(0)}
              style={styles.quickBtn}
            >
              <Text style={styles.quickBtnText}>Hari Ini</Text>
            </Pressable>
            <Pressable
              onPress={() => handleQuickSelect(-1)}
              style={styles.quickBtn}
            >
              <Text style={styles.quickBtnText}>Kemarin</Text>
            </Pressable>
            <Pressable
              onPress={() => handleQuickSelect(-2)}
              style={styles.quickBtn}
            >
              <Text style={styles.quickBtnText}>2 Hari Lalu</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  dialog: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.glass.borderSoft,
    ...shadow.card,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontFamily: fontFamilies.bold,
    color: colors.onSurface,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAFAFC',
    borderRadius: radius.full,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.glass.borderSoft,
  },
  navArrow: {
    padding: 6,
  },
  monthTitle: {
    fontSize: 14,
    fontFamily: fontFamilies.bold,
    color: colors.onSurface,
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.glass.borderSoft,
    paddingBottom: 6,
  },
  weekHeaderText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontFamily: fontFamilies.bold,
    color: colors.onSurfaceMuted,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridCell: {
    width: '14.28%',
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    marginBottom: 4,
  },
  gridCellActive: {
    backgroundColor: colors.primary,
  },
  gridCellToday: {
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  dayText: {
    fontSize: 13,
    fontFamily: fontFamilies.medium,
    color: colors.onSurface,
  },
  dayTextActive: {
    color: '#FFFFFF',
    fontFamily: fontFamilies.bold,
  },
  dayTextToday: {
    color: colors.primary,
    fontFamily: fontFamilies.bold,
  },
  quickBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.glass.borderSoft,
  },
  quickBtn: {
    flex: 1,
    paddingVertical: 7,
    marginHorizontal: 3,
    borderRadius: radius.full,
    backgroundColor: 'rgba(129, 149, 229, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickBtnText: {
    fontSize: 12,
    fontFamily: fontFamilies.semiBold,
    color: colors.primary,
  },
});
