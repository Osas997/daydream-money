/**
 * Parses informal Indonesian currency text into exact integer amount.
 * Supports:
 * - Prefix units: "rb50", "k50", "jt1.5", "jt2", "juta5"
 * - Suffix units: "35rb", "35k", "1,5jt", "1.5jt", "10juta"
 * - Compound combinations: "50rb500", "1jt500", "1jt500rb", "2jt50rb"
 * - Formatted numbers: "12.500", "1.250.000", "12,500"
 * - Plain digits: "50000", "250"
 */
export function parseNominal(input: string): number {
  if (!input) return 0;

  // Clean whitespace and normalize to lower case
  const raw = input.trim().toLowerCase().replace(/\s+/g, '');
  if (!raw) return 0;

  // 1. Prefix: e.g. "rb50", "k50", "ribu50" -> 50 * 1000
  if (/^(rb|k|ribu)/.test(raw)) {
    const rest = raw.replace(/^(rb|k|ribu)/, '');
    if (!rest) return 0;
    const parsed = parseStandardNumber(rest);
    return Math.round(parsed * 1_000);
  }

  // 1b. Prefix: e.g. "jt1.5", "juta2" -> 1.5 * 1000000
  if (/^(jt|juta)/.test(raw)) {
    const rest = raw.replace(/^(jt|juta)/, '');
    if (!rest) return 0;
    const parsed = parseStandardNumber(rest);
    return Math.round(parsed * 1_000_000);
  }

  // 2. Compound / Suffix with millions: "1jt500", "1jt500rb", "1,5jt", "2juta"
  if (raw.includes('jt') || raw.includes('juta')) {
    const parts = raw.split(/jt|juta/);
    const millions = parseStandardNumber(parts[0]);
    let remainder = 0;

    if (parts[1]) {
      const rest = parts[1];
      if (rest.endsWith('rb') || rest.endsWith('k') || rest.endsWith('ribu')) {
        const rNum = parseStandardNumber(rest.replace(/(rb|k|ribu)$/, ''));
        remainder = rNum * 1_000;
      } else {
        const rNum = parseStandardNumber(rest);
        // In Indonesian colloquial speech, "1jt 500" means 1.500.000 (500 thousand)
        if (rNum > 0 && rNum < 1000) {
          remainder = rNum * 1_000;
        } else {
          remainder = rNum;
        }
      }
    }

    return Math.round(millions * 1_000_000 + remainder);
  }

  // 3. Compound / Suffix with thousands: "50rb", "50rb500", "50k", "50k500"
  if (raw.includes('rb') || raw.includes('k') || raw.includes('ribu')) {
    const parts = raw.split(/rb|k|ribu/);
    const thousands = parseStandardNumber(parts[0]);
    let remainder = 0;

    if (parts[1]) {
      remainder = parseStandardNumber(parts[1]);
    }

    return Math.round(thousands * 1_000 + remainder);
  }

  // 4. Standard numbers with dots, commas, or plain digits
  const standardParsed = parseStandardNumber(raw);
  return Math.round(standardParsed);
}

function parseStandardNumber(str: string): number {
  if (!str) return 0;
  const s = str.trim();

  // If contains both dots and commas: "1.250.000,00"
  if (s.includes('.') && s.includes(',')) {
    const base = s.split(',')[0].replace(/\./g, '');
    const parsed = parseInt(base, 10);
    return isNaN(parsed) ? 0 : parsed;
  }

  // If contains dots: thousand separator ("1.250.000" or "12.500") vs decimal ("1.5")
  if (s.includes('.')) {
    const dotParts = s.split('.');
    const isThousand =
      dotParts.length > 2 ||
      (dotParts.length === 2 && dotParts[1].length === 3);

    if (isThousand) {
      const cleaned = s.replace(/\./g, '');
      const parsed = parseInt(cleaned, 10);
      return isNaN(parsed) ? 0 : parsed;
    }

    const parsed = parseFloat(s);
    return isNaN(parsed) ? 0 : parsed;
  }

  // If contains commas: thousand separator ("12,500") vs decimal ("12,5")
  if (s.includes(',')) {
    const commaParts = s.split(',');
    const isThousand =
      commaParts.length > 2 ||
      (commaParts.length === 2 && commaParts[1].length === 3);

    if (isThousand) {
      const cleaned = s.replace(/,/g, '');
      const parsed = parseInt(cleaned, 10);
      return isNaN(parsed) ? 0 : parsed;
    }

    const cleaned = s.replace(',', '.');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }

  // Plain integer
  const parsed = parseInt(s, 10);
  return isNaN(parsed) || parsed < 0 ? 0 : parsed;
}
