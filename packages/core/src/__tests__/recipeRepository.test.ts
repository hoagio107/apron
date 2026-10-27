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

  it('creates and maintains recipes_index.json on save and delete', async () => {
    await RecipeRepository.save(sampleRecipe);

    // Index file should exist
    const hasIndex = await mockStorage.exists('recipes_index.json');
    expect(hasIndex).toBe(true);

    const indexContent = await mockStorage.readTextFile('recipes_index.json');
    const indexRecipes = JSON.parse(indexContent) as Recipe[];
    expect(indexRecipes).toHaveLength(1);
    expect(indexRecipes[0].id).toBe('test-recipe-1');

    // Delete updates the index file
    await RecipeRepository.delete('test-recipe-1');
    const updatedIndexContent = await mockStorage.readTextFile('recipes_index.json');
    const updatedIndexRecipes = JSON.parse(updatedIndexContent) as Recipe[];
    expect(updatedIndexRecipes).toHaveLength(0);
  });

  it('rebuilds recipes_index.json if the index file is missing', async () => {
    // Manually write an individual file directly without index
    const manualRecipe: Recipe = {
      ...sampleRecipe,
      id: 'manual-r1',
      title: 'Manual Recipe'
    };
    await mockStorage.writeTextFile('recipes/manual-r1.json', JSON.stringify(manualRecipe));

    // Ensure recipes_index.json does NOT exist yet
    expect(await mockStorage.exists('recipes_index.json')).toBe(false);

    // getAll should trigger rebuildIndex and write recipes_index.json
    const all = await RecipeRepository.getAll();
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe('manual-r1');
    expect(await mockStorage.exists('recipes_index.json')).toBe(true);
  });

  it('strips recipe_snapshot in recipes_index.json but keeps it in getById', async () => {
    const recipeWithHistory: Recipe = {
      ...sampleRecipe,
      id: 'history-r1',
      cooking_history: [
        {
          id: 'hist-1',
          date: '2026-10-27',
          rating: 5,
          notes: 'Ngon tuyệt',
          recipe_snapshot: {
            id: 'history-r1',
            title: 'Phở Bò Cũ',
            slug: 'pho-bo-cu',
            image_url: '',
            prep_time: 20,
            cook_time: 100,
            difficulty: 'Vừa',
            calories: 400,
            taste_score: 9,
            servings: 4,
            ingredients: [],
            steps: [],
            author_id: 'user-1'
          }
        }
      ]
    };

    await RecipeRepository.save(recipeWithHistory);

    // Check individual file: snapshot preserved
    const individual = await RecipeRepository.getById('history-r1');
    expect(individual?.cooking_history?.[0]?.recipe_snapshot).toBeDefined();
    expect(individual?.cooking_history?.[0]?.recipe_snapshot?.title).toBe('Phở Bò Cũ');

    // Check index file: snapshot stripped
    const indexContent = await mockStorage.readTextFile('recipes_index.json');
    const indexRecipes = JSON.parse(indexContent) as Recipe[];
    expect(indexRecipes[0].cooking_history?.[0]?.recipe_snapshot).toBeUndefined();
    expect(indexRecipes[0].cooking_history?.[0]?.rating).toBe(5);
  });

  it('handles saveBulk and deleteBulk updating the index file in a single pass', async () => {
    const r1 = { ...sampleRecipe, id: 'bulk-1', title: 'Bulk 1' };
    const r2 = { ...sampleRecipe, id: 'bulk-2', title: 'Bulk 2' };

    await RecipeRepository.saveBulk([r1, r2]);

    const all = await RecipeRepository.getAll();
    expect(all).toHaveLength(2);

    await RecipeRepository.deleteBulk(['bulk-1']);
    const remaining = await RecipeRepository.getAll();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe('bulk-2');
  });
});

