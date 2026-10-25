import { describe, it, expect } from 'vitest';
import { 
  autoCategorizeIngredient, 
  parseIngredientLine, 
  CATEGORIES 
} from '../utils/ingredientParser';

describe('autoCategorizeIngredient', () => {
  it('correctly categorizes vegetables and herbs', () => {
    expect(autoCategorizeIngredient('Cà chua bi')).toBe(CATEGORIES.VEGGIES);
    expect(autoCategorizeIngredient('Hành lá')).toBe(CATEGORIES.VEGGIES);
    expect(autoCategorizeIngredient('Tỏi băm')).toBe(CATEGORIES.VEGGIES);
    expect(autoCategorizeIngredient('Cà rốt Đà Lạt')).toBe(CATEGORIES.VEGGIES);
    expect(autoCategorizeIngredient('Nấm hương')).toBe(CATEGORIES.VEGGIES);
  });

  it('correctly categorizes meats and seafood', () => {
    expect(autoCategorizeIngredient('Thịt bò phi lê')).toBe(CATEGORIES.MEAT_SEAFOOD);
    expect(autoCategorizeIngredient('Cá hồi phi lê')).toBe(CATEGORIES.MEAT_SEAFOOD);
    expect(autoCategorizeIngredient('Tôm sú')).toBe(CATEGORIES.MEAT_SEAFOOD);
    expect(autoCategorizeIngredient('Thịt heo xay')).toBe(CATEGORIES.MEAT_SEAFOOD);
    expect(autoCategorizeIngredient('Ức gà')).toBe(CATEGORIES.MEAT_SEAFOOD);
  });

  it('correctly categorizes dairy and eggs', () => {
    expect(autoCategorizeIngredient('Trứng gà ta')).toBe(CATEGORIES.DAIRY_EGGS);
    expect(autoCategorizeIngredient('Sữa tươi không đường')).toBe(CATEGORIES.DAIRY_EGGS);
    expect(autoCategorizeIngredient('Phô mai Mozzarella')).toBe(CATEGORIES.DAIRY_EGGS);
    expect(autoCategorizeIngredient('Bơ lạt')).toBe(CATEGORIES.DAIRY_EGGS);
  });

  it('correctly categorizes spices and sauces', () => {
    expect(autoCategorizeIngredient('Nước mắm Phú Quốc')).toBe(CATEGORIES.SPICES_SAUCES);
    expect(autoCategorizeIngredient('Hạt tiêu xay')).toBe(CATEGORIES.SPICES_SAUCES);
    expect(autoCategorizeIngredient('Đường cát trắng')).toBe(CATEGORIES.SPICES_SAUCES);
    expect(autoCategorizeIngredient('Dầu hào Maggi')).toBe(CATEGORIES.SPICES_SAUCES);
    expect(autoCategorizeIngredient('Muối tinh')).toBe(CATEGORIES.SPICES_SAUCES);
  });

  it('correctly categorizes grains and carbs', () => {
    expect(autoCategorizeIngredient('Gạo ST25')).toBe(CATEGORIES.GRAINS_CARBS);
    expect(autoCategorizeIngredient('Bún tươi')).toBe(CATEGORIES.GRAINS_CARBS);
    expect(autoCategorizeIngredient('Bột mì số 11')).toBe(CATEGORIES.GRAINS_CARBS);
    expect(autoCategorizeIngredient('Mì Ý spaghetti')).toBe(CATEGORIES.GRAINS_CARBS);
  });

  it('falls back to OTHERS for unrecognized ingredients', () => {
    expect(autoCategorizeIngredient('Khăn giấy ăn')).toBe(CATEGORIES.OTHERS);
  });
});

describe('parseIngredientLine', () => {
  it('parses quantity, unit and name correctly', () => {
    const res1 = parseIngredientLine('500g thịt bò');
    expect(res1.quantity).toBe(500);
    expect(res1.unit).toBe('g');
    expect(res1.name).toBe('thịt bò');
    expect(res1.group).toBe(CATEGORIES.MEAT_SEAFOOD);

    const res2 = parseIngredientLine('2 muỗng canh nước mắm');
    expect(res2.quantity).toBe(2);
    expect(res2.unit).toBe('muỗng canh');
    expect(res2.name).toBe('nước mắm');
    expect(res2.group).toBe(CATEGORIES.SPICES_SAUCES);
  });

  it('parses fraction quantities', () => {
    const res = parseIngredientLine('1/2 quả chanh');
    expect(res.quantity).toBe(0.5);
    expect(res.unit).toBe('quả');
    expect(res.name).toBe('chanh');
    expect(res.group).toBe(CATEGORIES.VEGGIES);
  });

  it('parses decimal quantities with comma or dot', () => {
    const resDot = parseIngredientLine('1.5 kg cá hồi');
    expect(resDot.quantity).toBe(1.5);
    expect(resDot.unit).toBe('kg');
    expect(resDot.name).toBe('cá hồi');

    const resComma = parseIngredientLine('2,5 lít sữa tươi');
    expect(resComma.quantity).toBe(2.5);
    expect(resComma.unit).toBe('lít');
    expect(resComma.name).toBe('sữa tươi');
  });

  it('handles ingredients without quantity or unit', () => {
    const res = parseIngredientLine('Muối');
    expect(res.quantity).toBeUndefined();
    expect(res.unit).toBeUndefined();
    expect(res.name).toBe('Muối');
    expect(res.group).toBe(CATEGORIES.SPICES_SAUCES);
  });

  it('handles empty line gracefully', () => {
    const res = parseIngredientLine('');
    expect(res.name).toBe('');
    expect(res.group).toBe(CATEGORIES.OTHERS);
  });
});
