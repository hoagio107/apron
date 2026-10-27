import { describe, it, expect } from 'vitest';
import {
  normalizeUnit,
  detectUnitCategory,
  extractAndNormalizeUnits,
  DEFAULT_COOKING_UNITS
} from '../utils/unitNormalizer';

describe('unitNormalizer', () => {
  describe('normalizeUnit', () => {
    it('normalizes common abbreviations to Vietnamese standards', () => {
      expect(normalizeUnit('mc')).toBe('muỗng canh');
      expect(normalizeUnit('thìa canh')).toBe('muỗng canh');
      expect(normalizeUnit('tbsp')).toBe('muỗng canh');
      expect(normalizeUnit('tablespoon')).toBe('muỗng canh');

      expect(normalizeUnit('mcf')).toBe('muỗng cà phê');
      expect(normalizeUnit('cf')).toBe('muỗng cà phê');
      expect(normalizeUnit('thìa cà phê')).toBe('muỗng cà phê');
      expect(normalizeUnit('tsp')).toBe('muỗng cà phê');
      expect(normalizeUnit('teaspoon')).toBe('muỗng cà phê');

      expect(normalizeUnit('gr')).toBe('g');
      expect(normalizeUnit('gram')).toBe('g');
      expect(normalizeUnit('gam')).toBe('g');

      expect(normalizeUnit('kilo')).toBe('kg');
      expect(normalizeUnit('kilogram')).toBe('kg');
      expect(normalizeUnit('cân')).toBe('kg');

      expect(normalizeUnit('lit')).toBe('lít');
      expect(normalizeUnit('l')).toBe('lít');
      expect(normalizeUnit('mililit')).toBe('ml');
    });

    it('normalizes unaccented Vietnamese units', () => {
      expect(normalizeUnit('qua')).toBe('quả');
      expect(normalizeUnit('trai')).toBe('trái');
      expect(normalizeUnit('cu')).toBe('củ');
      expect(normalizeUnit('cai')).toBe('cái');
      expect(normalizeUnit('bo')).toBe('bó');
      expect(normalizeUnit('tep')).toBe('tép');
      expect(normalizeUnit('lat')).toBe('lát');
      expect(normalizeUnit('mieng')).toBe('miếng');
      expect(normalizeUnit('chen')).toBe('chén');
      expect(normalizeUnit('bat')).toBe('bát');
      expect(normalizeUnit('hop')).toBe('hộp');
      expect(normalizeUnit('goi')).toBe('gói');
    });

    it('returns empty string for null, undefined, or empty strings', () => {
      expect(normalizeUnit(null)).toBe('');
      expect(normalizeUnit(undefined)).toBe('');
      expect(normalizeUnit('')).toBe('');
      expect(normalizeUnit('   ')).toBe('');
    });

    it('preserves valid custom units trimmed', () => {
      expect(normalizeUnit('con')).toBe('con');
      expect(normalizeUnit('lon')).toBe('lon');
      expect(normalizeUnit('thanh')).toBe('thanh');
    });
  });

  describe('detectUnitCategory', () => {
    it('detects weight category correctly', () => {
      expect(detectUnitCategory('g')).toBe('Khối lượng');
      expect(detectUnitCategory('kg')).toBe('Khối lượng');
      expect(detectUnitCategory('lạng')).toBe('Khối lượng');
      expect(detectUnitCategory('gram')).toBe('Khối lượng');
    });

    it('detects volume category correctly', () => {
      expect(detectUnitCategory('ml')).toBe('Thể tích');
      expect(detectUnitCategory('lít')).toBe('Thể tích');
      expect(detectUnitCategory('muỗng canh')).toBe('Thể tích');
      expect(detectUnitCategory('muỗng cà phê')).toBe('Thể tích');
      expect(detectUnitCategory('chén')).toBe('Thể tích');
    });

    it('detects count category correctly', () => {
      expect(detectUnitCategory('quả')).toBe('Số lượng / Đếm');
      expect(detectUnitCategory('củ')).toBe('Số lượng / Đếm');
      expect(detectUnitCategory('tép')).toBe('Số lượng / Đếm');
      expect(detectUnitCategory('lát')).toBe('Số lượng / Đếm');
      expect(detectUnitCategory('miếng')).toBe('Số lượng / Đếm');
    });

    it('detects packaging category correctly', () => {
      expect(detectUnitCategory('hộp')).toBe('Đóng gói & Khác');
      expect(detectUnitCategory('gói')).toBe('Đóng gói & Khác');
      expect(detectUnitCategory('lon')).toBe('Đóng gói & Khác');
      expect(detectUnitCategory('chai')).toBe('Đóng gói & Khác');
    });
  });

  describe('extractAndNormalizeUnits', () => {
    it('extracts and deduplicates units from recipe data', () => {
      const mockRecipe = {
        title: 'Món ngon',
        ingredientSections: [
          {
            name: 'Chính',
            ingredients: [
              { name: 'Thịt', unit: 'kg' },
              { name: 'Hành', unit: 'cu' },
              { name: 'Tỏi', unit: 'tép' }
            ]
          },
          {
            name: 'Sốt',
            ingredients: [
              { name: 'Đường', unit: 'mc' },
              { name: 'Nước mắm', unit: 'muỗng canh' },
              { name: 'Muối', unit: 'gr' }
            ]
          }
        ]
      };

      const extracted = extractAndNormalizeUnits(mockRecipe);
      expect(extracted).toContain('kg');
      expect(extracted).toContain('củ');
      expect(extracted).toContain('tép');
      expect(extracted).toContain('muỗng canh');
      expect(extracted).toContain('g');
      // 'mc' and 'muỗng canh' both normalized to 'muỗng canh' and deduplicated
      expect(extracted.filter(u => u === 'muỗng canh').length).toBe(1);
    });
  });

  describe('DEFAULT_COOKING_UNITS', () => {
    it('contains essential Vietnamese cooking units', () => {
      expect(DEFAULT_COOKING_UNITS).toContain('g');
      expect(DEFAULT_COOKING_UNITS).toContain('kg');
      expect(DEFAULT_COOKING_UNITS).toContain('ml');
      expect(DEFAULT_COOKING_UNITS).toContain('lít');
      expect(DEFAULT_COOKING_UNITS).toContain('muỗng canh');
      expect(DEFAULT_COOKING_UNITS).toContain('muỗng cà phê');
    });
  });
});
