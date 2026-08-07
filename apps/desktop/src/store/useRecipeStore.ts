import { create } from 'zustand';
import { RecipeRepository, type Recipe } from '@apron/core';

interface RecipeState {
  recipes: Recipe[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchRecipes: () => Promise<void>;
  addRecipe: (recipe: Recipe) => Promise<void>;
  updateRecipe: (recipe: Recipe) => Promise<void>;
  deleteRecipe: (id: string) => Promise<void>;
  addBulkRecipes: (recipes: Recipe[]) => Promise<void>;
  deleteBulkRecipes: (ids: string[]) => Promise<void>;
}

export const useRecipeStore = create<RecipeState>((set, get) => ({
  recipes: [],
  isLoading: false,
  error: null,

  fetchRecipes: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await RecipeRepository.getAll();
      set({ recipes: data, isLoading: false });
    } catch (e: any) {
      set({ error: e.message || 'Failed to fetch recipes', isLoading: false });
    }
  },

  addRecipe: async (recipe: Recipe) => {
    try {
      await RecipeRepository.save(recipe);
      // Giả lập add local state cho nhanh, hoặc fetch lại tuỳ cấu trúc
      // Nếu có id rồi thì dùng luôn
      const newRecipe = { ...recipe, id: recipe.id || crypto.randomUUID() };
      set((state) => ({ recipes: [newRecipe, ...state.recipes] }));
    } catch (e: any) {
      set({ error: e.message || 'Failed to add recipe' });
      throw e;
    }
  },

  updateRecipe: async (recipe: Recipe) => {
    try {
      await RecipeRepository.save(recipe);
      set((state) => ({
        recipes: state.recipes.map((r) => (r.id === recipe.id ? recipe : r)),
      }));
    } catch (e: any) {
      set({ error: e.message || 'Failed to update recipe' });
      throw e;
    }
  },

  deleteRecipe: async (id: string) => {
    try {
      await RecipeRepository.delete(id);
      set((state) => ({
        recipes: state.recipes.filter((r) => r.id !== id),
      }));
    } catch (e: any) {
      set({ error: e.message || 'Failed to delete recipe' });
      throw e;
    }
  },

  addBulkRecipes: async (recipes: Recipe[]) => {
    try {
      await RecipeRepository.saveBulk(recipes);
      // Đảm bảo fetch lại hoặc map id để update state local
      const current = get().recipes;
      set({ recipes: [...recipes, ...current] });
    } catch (e: any) {
      set({ error: e.message || 'Failed to bulk add recipes' });
      throw e;
    }
  },

  deleteBulkRecipes: async (ids: string[]) => {
    try {
      await RecipeRepository.deleteBulk(ids);
      set((state) => ({
        recipes: state.recipes.filter((r) => !ids.includes(r.id!)),
      }));
    } catch (e: any) {
      set({ error: e.message || 'Failed to bulk delete recipes' });
      throw e;
    }
  },
}));
