import { describe, test, expect } from '@jest/globals';
import {
  formatCurrency,
  formatNumberWithDots,
  getFinancialMonthRange,
  getMonthName,
  getRelativeDateLabel,
  MONTH_NAMES_ID,
  DAY_NAMES_ID,
  DAY_NAMES_SHORT_ID,
  isSameDay,
  isToday,
  isYesterday,
  formatDateLabel,
} from '../formatters';

describe('Formatters Unit Tests', () => {
  test('formatCurrency correctly formats IDR', () => {
    expect(formatCurrency(1250000)).toBe('Rp 1.250.000');
    expect(formatCurrency(0)).toBe('Rp 0');
    expect(formatCurrency(-50000)).toBe('- Rp 50.000');
    expect(formatCurrency(1250000, true)).toBe('••••••••');
  });

  test('formatNumberWithDots', () => {
    expect(formatNumberWithDots(35000)).toBe('35.000');
    expect(formatNumberWithDots(1000000)).toBe('1.000.000');
  });

  test('getMonthName returns Indonesian month name', () => {
    expect(getMonthName('2026-10')).toBe('Oktober 2026');
    expect(getMonthName('2026-01')).toBe('Januari 2026');
  });

  test('getFinancialMonthRange with startDay = 1', () => {
    const range = getFinancialMonthRange('2026-10', 1);
    expect(range.startDate.startsWith('2026-10-01')).toBe(true);
    expect(range.endDate.startsWith('2026-10-31')).toBe(true);
    expect(range.label).toBe('Oktober 2026');
  });

  test('getFinancialMonthRange with startDay = 25 (custom salary day)', () => {
    const range = getFinancialMonthRange('2026-10', 25);
    expect(range.startDate.startsWith('2026-09-25')).toBe(true);
    expect(range.endDate.startsWith('2026-10-24')).toBe(true);
  });

  test('getRelativeDateLabel returns compact and responsive labels', () => {
    const today = new Date().toISOString();
    expect(getRelativeDateLabel(today)).toBe('Hari ini');

    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    expect(getRelativeDateLabel(yesterday)).toBe('Kemarin');

    // Older date from past year
    expect(getRelativeDateLabel('2024-05-12T10:00:00.000Z')).toBe('12 Mei 2024');
  });

  test('Indonesian date constants contain correct mappings', () => {
    expect(MONTH_NAMES_ID).toHaveLength(12);
    expect(MONTH_NAMES_ID[0]).toBe('Januari');
    expect(MONTH_NAMES_ID[9]).toBe('Oktober');

    expect(DAY_NAMES_ID).toHaveLength(7);
    expect(DAY_NAMES_ID[0]).toBe('Minggu');
    expect(DAY_NAMES_SHORT_ID).toHaveLength(7);
    expect(DAY_NAMES_SHORT_ID[1]).toBe('Sen');
  });

  test('isSameDay correctly identifies matching calendar days', () => {
    const d1 = new Date(2026, 9, 28, 10, 30);
    const d2 = new Date(2026, 9, 28, 22, 15);
    const d3 = new Date(2026, 9, 27, 22, 15);

    expect(isSameDay(d1, d2)).toBe(true);
    expect(isSameDay(d1, d3)).toBe(false);

    const now = new Date();
    expect(isToday(now)).toBe(true);
    const y = new Date(now);
    y.setDate(now.getDate() - 1);
    expect(isYesterday(y)).toBe(true);
  });

  test('formatDateLabel formats relative labels and full dates', () => {
    const now = new Date();
    expect(formatDateLabel(now)).toContain('Hari ini');

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    expect(formatDateLabel(yesterday)).toContain('Kemarin');

    const past = new Date(2025, 4, 15); // 15 Mei 2025
    expect(formatDateLabel(past)).toContain('15 Mei 2025');
  });
});
