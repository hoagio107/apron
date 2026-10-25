import { describe, it, expect, beforeEach } from 'vitest';
import { useRecipeStore } from '../store/useRecipeStore';
import { setStorageProvider } from '../storage';
import { MockStorageProvider } from './mockStorage';
import type { Recipe } from '../types/recipe';

describe('useRecipeStore', () => {
  beforeEach(() => {
    const mockStorage = new MockStorageProvider();
    setStorageProvider(mockStorage);
    useRecipeStore.setState({ recipes: [], isLoading: false, error: null });
  });

  const baseRecipe: Recipe = {
    id: 'store-r-1',
    title: 'Gà Hấp Lá Chanh',
    slug: 'ga-hap-la-chanh',
    image_url: 'ga-hap.webp',
    prep_time: 15,
    cook_time: 30,
    difficulty: 'Dễ',
    calories: 300,
    taste_score: 9.0,
    servings: 4,
    ingredients: [
      { ingredient_id: 'ing-1', name: 'Gà ta', quantity: 1, unit: 'con' },
      { ingredient_id: 'ing-2', name: 'Lá chanh', quantity: 10, unit: 'lá' }
    ],
    steps: [{ instruction: 'Hấp gà trong nồi cách thủy 30 phút' }],
    author_id: 'user-1'
  };

  it('adds a recipe and updates store state', async () => {
    const added = await useRecipeStore.getState().addRecipe(baseRecipe);

    expect(added.id).toBe('store-r-1');
    const { recipes } = useRecipeStore.getState();
    expect(recipes).toHaveLength(1);
    expect(recipes[0].title).toBe('Gà Hấp Lá Chanh');
  });

  it('updates a recipe in store state', async () => {
    await useRecipeStore.getState().addRecipe(baseRecipe);

    const updatedRecipe: Recipe = {
      ...baseRecipe,
      title: 'Gà Hấp Muối Tiêu Lá Chanh',
      prep_time: 20
    };

    await useRecipeStore.getState().updateRecipe(updatedRecipe);

    const { recipes } = useRecipeStore.getState();
    expect(recipes[0].title).toBe('Gà Hấp Muối Tiêu Lá Chanh');
    expect(recipes[0].prep_time).toBe(20);
  });

  it('deletes a recipe from store state', async () => {
    await useRecipeStore.getState().addRecipe(baseRecipe);
    expect(useRecipeStore.getState().recipes).toHaveLength(1);

    await useRecipeStore.getState().deleteRecipe('store-r-1');
    expect(useRecipeStore.getState().recipes).toHaveLength(0);
  });

  it('cascades ingredient name update across recipes', async () => {
    await useRecipeStore.getState().addRecipe(baseRecipe);

    await useRecipeStore.getState().updateIngredientInRecipes('ing-1', 'Gà Đồi Tiên Yên');

    const { recipes } = useRecipeStore.getState();
    const gaIng = recipes[0].ingredients.find(i => i.ingredient_id === 'ing-1');
    expect(gaIng?.name).toBe('Gà Đồi Tiên Yên');
  });

  it('cascades ingredient deletion across recipes', async () => {
    await useRecipeStore.getState().addRecipe(baseRecipe);

    await useRecipeStore.getState().removeIngredientFromRecipes('ing-2');

    const { recipes } = useRecipeStore.getState();
    expect(recipes[0].ingredients).toHaveLength(1);
    expect(recipes[0].ingredients[0].ingredient_id).toBe('ing-1');
  });
});
