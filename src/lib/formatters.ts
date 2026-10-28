export const MONTH_NAMES_ID = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

export const MONTH_NAMES_SHORT_ID = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agt',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

export const DAY_NAMES_ID = [
  'Minggu',
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
];

export const DAY_NAMES_SHORT_ID = [
  'Min',
  'Sen',
  'Sel',
  'Rab',
  'Kam',
  'Jum',
  'Sab',
];

export function formatCurrency(amount: number, hideBalance = false): string {
  if (hideBalance) {
    return '••••••••';
  }

  const isNegative = amount < 0;
  const absAmount = Math.abs(Math.round(amount || 0));
  const formatted = absAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  return (isNegative ? '- Rp ' : 'Rp ') + formatted;
}

export function formatNumberWithDots(amount: number): string {
  const abs = Math.abs(Math.round(amount || 0));
  return abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function getMonthName(yearMonth: string): string {
  // input: 'YYYY-MM'
  const parts = yearMonth.split('-');
  if (parts.length < 2) return yearMonth;
  const monthIdx = parseInt(parts[1], 10) - 1;
  const year = parts[0];
  return `${MONTH_NAMES_ID[monthIdx] || ''} ${year}`;
}

export function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = d.getDate();
  const month = MONTH_NAMES_SHORT_ID[d.getMonth()];
  return `${day} ${month}`;
}

export function formatFullDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const dayName = DAY_NAMES_ID[d.getDay()];
  const day = d.getDate();
  const month = MONTH_NAMES_ID[d.getMonth()];
  const year = d.getFullYear();
  return `${dayName}, ${day} ${month} ${year}`;
}

export function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function getRelativeDateLabel(dateStr: string): string {
  const target = new Date(dateStr);
  if (isNaN(target.getTime())) return dateStr;
  const now = new Date();

  const isToday =
    target.getDate() === now.getDate() &&
    target.getMonth() === now.getMonth() &&
    target.getFullYear() === now.getFullYear();

  if (isToday) return 'Hari ini';

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    target.getDate() === yesterday.getDate() &&
    target.getMonth() === yesterday.getMonth() &&
    target.getFullYear() === yesterday.getFullYear();

  if (isYesterday) return 'Kemarin';

  const isThisYear = target.getFullYear() === now.getFullYear();
  if (isThisYear) {
    return formatShortDate(dateStr);
  }

  return `${target.getDate()} ${MONTH_NAMES_SHORT_ID[target.getMonth()]} ${target.getFullYear()}`;
}

export function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

export function isToday(d: Date): boolean {
  return isSameDay(d, new Date());
}

export function isYesterday(d: Date): boolean {
  const y = new Date();
  y.setDate(y.getDate() - 1);
  return isSameDay(d, y);
}

export function formatDateLabel(date: Date): string {
  const now = new Date();
  if (isSameDay(date, now)) {
    return `Hari ini, ${date.getDate()} ${MONTH_NAMES_SHORT_ID[date.getMonth()]}`;
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(date, yesterday)) {
    return `Kemarin, ${date.getDate()} ${MONTH_NAMES_SHORT_ID[date.getMonth()]}`;
  }
  return `${DAY_NAMES_SHORT_ID[date.getDay()]}, ${date.getDate()} ${MONTH_NAMES_SHORT_ID[date.getMonth()]} ${date.getFullYear()}`;
}

/**
 * Calculates start and end ISO dates for a given month and start day.
 * Example: if startDay is 25, '2026-10' means 25 Sep 2026 to 24 Oct 2026.
 */
export function getFinancialMonthRange(yearMonth: string, startDay = 1): {
  startDate: string;
  endDate: string;
  label: string;
} {
  const [yearStr, monthStr] = yearMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10); // 1-12

  if (startDay <= 1) {
    const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
    const lastDayOfMonth = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
    return {
      startDate: start.toISOString(),
      endDate: lastDayOfMonth.toISOString(),
      label: getMonthName(yearMonth),
    };
  }

  // When startDay > 1, month window is from previous month (startDay) to current month (startDay - 1)
  const prevMonth = month - 2; // 0-indexed month - 1
  const prevDate = new Date(Date.UTC(year, prevMonth, startDay, 0, 0, 0, 0));
  const endDate = new Date(Date.UTC(year, month - 1, startDay - 1, 23, 59, 59, 999));

  const startLabel = `${startDay} ${MONTH_NAMES_SHORT_ID[prevDate.getUTCMonth()]}`;
  const endLabel = `${startDay - 1} ${MONTH_NAMES_SHORT_ID[endDate.getUTCMonth()]}`;

  return {
    startDate: prevDate.toISOString(),
    endDate: endDate.toISOString(),
    label: `${startLabel} – ${endLabel}`,
  };
}
