import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';

import {
  GENDER_OPTIONS,
  generateUniqueIdNumbers,
} from './id-card-number';

describe('ID Card Number utils', () => {
  it('GENDER_OPTIONS has male and female', () => {
    const values = GENDER_OPTIONS.map((g) => g.value);
    expect(values).toContain('male');
    expect(values).toContain('female');
  });

  it('generateUniqueIdNumbers returns specified count', () => {
    const result = generateUniqueIdNumbers(
      {
        areaCode: '110101',
        birthDate: dayjs('2000-01-15'),
        gender: 'male',
      },
      5,
    );
    expect(result).toHaveLength(5);
  });

  it('all generated IDs have 18 characters', () => {
    const result = generateUniqueIdNumbers(
      {
        areaCode: '440305',
        birthDate: dayjs('1995-06-01'),
        gender: 'female',
      },
      10,
    );
    result.forEach((id) => {
      expect(id).toHaveLength(18);
    });
  });

  it('generated IDs contain the area code prefix', () => {
    const result = generateUniqueIdNumbers(
      {
        areaCode: '310101',
        birthDate: dayjs('1990-12-25'),
        gender: 'male',
      },
      3,
    );
    result.forEach((id) => {
      expect(id.startsWith('310101')).toBe(true);
    });
  });

  it('generates unique IDs', () => {
    const result = generateUniqueIdNumbers(
      {
        areaCode: '330102',
        birthDate: dayjs('1985-03-20'),
        gender: 'female',
      },
      20,
    );
    const unique = new Set(result);
    expect(unique.size).toBe(result.length);
  });
});
