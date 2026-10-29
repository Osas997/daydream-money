import { describe, test, expect } from '@jest/globals';
import { parseNominal } from '../nominalParser';

describe('Nominal Parser Unit Tests', () => {
  test('handles suffix thousands: rb, k, ribu', () => {
    expect(parseNominal('35rb')).toBe(35000);
    expect(parseNominal('35k')).toBe(35000);
    expect(parseNominal('35ribu')).toBe(35000);
    expect(parseNominal('500k')).toBe(500000);
    expect(parseNominal('2,5k')).toBe(2500);
  });

  test('handles prefix thousands: rb, k, ribu', () => {
    expect(parseNominal('rb50')).toBe(50000);
    expect(parseNominal('k100')).toBe(100000);
    expect(parseNominal('ribu75')).toBe(75000);
    expect(parseNominal('rb2,5')).toBe(2500);
  });

  test('handles suffix millions: jt, juta', () => {
    expect(parseNominal('1,5jt')).toBe(1500000);
    expect(parseNominal('1.5jt')).toBe(1500000);
    expect(parseNominal('3jt')).toBe(3000000);
    expect(parseNominal('10juta')).toBe(10000000);
    expect(parseNominal('0,5jt')).toBe(500000);
  });

  test('handles prefix millions: jt, juta', () => {
    expect(parseNominal('jt1.5')).toBe(1500000);
    expect(parseNominal('jt2')).toBe(2000000);
    expect(parseNominal('juta5')).toBe(5000000);
  });

  test('handles compound combinations of manual input and units', () => {
    expect(parseNominal('50rb500')).toBe(50500);
    expect(parseNominal('1jt500')).toBe(1500000);
    expect(parseNominal('1jt500rb')).toBe(1500000);
    expect(parseNominal('2jt50rb')).toBe(2050000);
    expect(parseNominal('50k200')).toBe(50200);
  });

  test('handles standard formatted numbers with dots', () => {
    expect(parseNominal('12.500')).toBe(12500);
    expect(parseNominal('1.250.000')).toBe(1250000);
    expect(parseNominal('250')).toBe(250);
  });

  test('handles plain numbers and spaces', () => {
    expect(parseNominal('50000')).toBe(50000);
    expect(parseNominal(' 75 rb ')).toBe(75000);
    expect(parseNominal('2.5 jt')).toBe(2500000);
  });

  test('handles empty or invalid inputs safely', () => {
    expect(parseNominal('')).toBe(0);
    expect(parseNominal('abc')).toBe(0);
    expect(parseNominal('-50')).toBe(0);
    expect(parseNominal('0')).toBe(0);
  });

  test('handles onboarding initial balance and budget inputs', () => {
    expect(parseNominal('1.5jt')).toBe(1500000);
    expect(parseNominal('3.000.000')).toBe(3000000);
    expect(parseNominal('500rb')).toBe(500000);
  });
});
