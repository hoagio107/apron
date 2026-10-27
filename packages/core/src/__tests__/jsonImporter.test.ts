import { describe, it, expect, beforeEach } from 'vitest';
import { parseAndValidateJson, executeImport } from '../importer/json-importer';
import { setStorageProvider } from '../storage';
import { MockStorageProvider } from './mockStorage';
import { useRecipeStore } from '../store/useRecipeStore';
import { useTipStore } from '../store/useTipStore';
import { useUnitStore } from '../store/useUnitStore';
import type { Recipe } from '../types/recipe';

describe('JSON Importer', () => {
  beforeEach(() => {
    const mockStorage = new MockStorageProvider();
    setStorageProvider(mockStorage);
    useRecipeStore.setState({ recipes: [], isLoading: false, error: null });
    useTipStore.setState({ tips: [], isLoading: false, error: null });
    useUnitStore.setState({ units: [] });
  });

  const existingRecipe: Recipe = {
    id: 'rec-1',
    title: 'Phở Bò Gia Truyền',
    slug: 'pho-bo-gia-truyen',
    image_url: '',
    prep_time: 20,
    cook_time: 60,
    difficulty: 'Vừa',
    calories: 500,
    taste_score: 9,
    servings: 4,
    ingredients: [{ name: 'Bò tái', quantity: 200, unit: 'g' }],
    steps: [{ instruction: 'Nấu nước dùng' }],
    author_id: 'u1'
  };

  it('correctly classifies valid, duplicate, and invalid recipes', () => {
    const rawBackup = JSON.stringify({
      version: '1.0.0',
      recipes: [
        // Valid (mới)
        { id: 'rec-new', title: 'Bún Chả Hà Nội', difficulty: 'Dễ' },
        // Duplicate (trùng title hoặc trùng id)
        { id: 'rec-1', title: 'Phở Bò Gia Truyền', difficulty: 'Vừa' },
        // Invalid (thiếu title)
        { id: 'rec-bad', difficulty: 'Khó' }
      ]
    });

    const result = parseAndValidateJson(rawBackup, {
      recipes: [existingRecipe]
    });

    expect(result.totalItems).toBe(3);
    expect(result.validCount).toBe(1);
    expect(result.duplicateCount).toBe(1);
    expect(result.invalidCount).toBe(1);

    expect(result.items.find(i => i.id === 'rec-new')?.status).toBe('valid');
    expect(result.items.find(i => i.id === 'rec-1')?.status).toBe('duplicate');
    expect(result.items.find(i => i.id === 'rec-bad')?.status).toBe('invalid');
  });

  it('executes import with skip strategy', async () => {
    const rawBackup = JSON.stringify({
      recipes: [
        { id: 'r-new', title: 'Chả Cá Lã Vọng' },
        { id: 'rec-1', title: 'Phở Bò Gia Truyền' }
      ]
    });

    const parsed = parseAndValidateJson(rawBackup, { recipes: [existingRecipe] });
    const summary = await executeImport(parsed.items, 'skip');

    expect(summary.importedCount).toBe(1);
    expect(summary.skippedCount).toBe(1);
    expect(summary.updatedCount).toBe(0);
  });

  it('executes import with overwrite strategy', async () => {
    const rawBackup = JSON.stringify({
      recipes: [
        { id: 'rec-1', title: 'Phở Bò Gia Truyền (Đã cập nhật)', calories: 550 }
      ]
    });

    const parsed = parseAndValidateJson(rawBackup, { recipes: [existingRecipe] });
    const summary = await executeImport(parsed.items, 'overwrite');

    expect(summary.updatedCount).toBe(1);
    expect(summary.importedCount).toBe(0);
  });

  it('executes import with create_copy strategy', async () => {
    const rawBackup = JSON.stringify({
      recipes: [
        { id: 'rec-1', title: 'Phở Bò Gia Truyền' }
      ]
    });

    const parsed = parseAndValidateJson(rawBackup, { recipes: [existingRecipe] });
    const summary = await executeImport(parsed.items, 'create_copy');

    expect(summary.importedCount).toBe(1);
    expect(summary.updatedCount).toBe(0);
  });

  it('detects duplicate recipes within the same import file', () => {
    const rawBackup = JSON.stringify([
      { title: 'Cơm Tấm Sườn Bì Chả' },
      { title: 'Cơm Tấm Sườn Bì Chả' }
    ]);

    const result = parseAndValidateJson(rawBackup, { recipes: [] });
    expect(result.totalItems).toBe(2);
    expect(result.validCount).toBe(1);
    expect(result.duplicateCount).toBe(1);
    expect(result.items[0].status).toBe('valid');
    expect(result.items[1].status).toBe('duplicate');
  });
});
