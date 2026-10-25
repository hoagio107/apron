import { describe, it, expect, beforeEach } from 'vitest';
import { RecipeRepository } from '../db/recipe-repository';
import { setStorageProvider } from '../storage';
import { MockStorageProvider } from './mockStorage';
import type { Recipe } from '../types/recipe';

describe('RecipeRepository', () => {
  let mockStorage: MockStorageProvider;

  beforeEach(() => {
    mockStorage = new MockStorageProvider();
    setStorageProvider(mockStorage);
  });

  const sampleRecipe: Recipe = {
    id: 'test-recipe-1',
    title: 'Phở Bò Hà Nội',
    slug: 'pho-bo-ha-noi',
    image_url: 'images/pho-bo.webp',
    prep_time: 30,
    cook_time: 120,
    difficulty: 'Vừa',
    calories: 450,
    taste_score: 9.5,
    servings: 4,
    ingredients: [
      { name: 'Thịt bò phi lê', quantity: 500, unit: 'g' },
      { name: 'Bánh phở', quantity: 1, unit: 'kg' }
    ],
    steps: [
      { instruction: 'Hầm xương ống bò trong 4-6 tiếng' },
      { instruction: 'Chần bánh phở và xếp thịt bò tươi' }
    ],
    author_id: 'user-1',
    created_at: '2026-10-01T10:00:00.000Z'
  };

  it('saves and retrieves a recipe by id', async () => {
    await RecipeRepository.save(sampleRecipe);

    const retrieved = await RecipeRepository.getById('test-recipe-1');
    expect(retrieved).not.toBeNull();
    expect(retrieved?.id).toBe('test-recipe-1');
    expect(retrieved?.title).toBe('Phở Bò Hà Nội');
    expect(retrieved?.ingredients).toHaveLength(2);
  });

  it('auto generates slug from title when slug is not provided', async () => {
    const recipeWithoutSlug: Recipe = {
      ...sampleRecipe,
      id: 'test-recipe-2',
      title: 'Bún Chả Đắc Kim',
      slug: ''
    };

    await RecipeRepository.save(recipeWithoutSlug);
    const retrieved = await RecipeRepository.getById('test-recipe-2');
    expect(retrieved?.slug).toBe('bun-cha-dac-kim');
  });

  it('returns all recipes sorted by created_at descending', async () => {
    const older: Recipe = {
      ...sampleRecipe,
      id: 'r-older',
      title: 'Older Recipe',
      created_at: '2026-09-01T00:00:00.000Z'
    };
    const newer: Recipe = {
      ...sampleRecipe,
      id: 'r-newer',
      title: 'Newer Recipe',
      created_at: '2026-10-15T00:00:00.000Z'
    };

    await RecipeRepository.save(older);
    await RecipeRepository.save(newer);

    const all = await RecipeRepository.getAll();
    expect(all.length).toBeGreaterThanOrEqual(2);
    expect(all[0].id).toBe('r-newer');
  });

  it('deletes a recipe and invokes registered delete hooks', async () => {
    await RecipeRepository.save(sampleRecipe);

    let hookedRecipes: Recipe[] = [];
    const unsubscribe = RecipeRepository.addDeleteHook((recipes) => {
      hookedRecipes = recipes;
    });

    await RecipeRepository.delete('test-recipe-1');

    const retrieved = await RecipeRepository.getById('test-recipe-1');
    expect(retrieved).toBeNull();
    expect(hookedRecipes).toHaveLength(1);
    expect(hookedRecipes[0].id).toBe('test-recipe-1');

    unsubscribe();
  });
});
