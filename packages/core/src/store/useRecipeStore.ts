import { create } from 'zustand';
import { RecipeRepository } from '../db/recipe-repository';
import type { Recipe } from '../types/recipe';

interface RecipeState {
  recipes: Recipe[];
  isLoading: boolean;
  error: string | null;
  hasFetched: boolean;
  recipeDetails: Record<string, Recipe>;
  
  // Actions
  fetchRecipes: (force?: boolean) => Promise<void>;
  fetchRecipeDetail: (id: string) => Promise<Recipe | null>;
  toggleFavorite: (id: string) => Promise<void>;
  addRecipe: (recipe: Recipe) => Promise<Recipe>;
  updateRecipe: (recipe: Recipe) => Promise<void>;
  deleteRecipe: (id: string) => Promise<void>;
  addBulkRecipes: (recipes: Recipe[]) => Promise<void>;
  deleteBulkRecipes: (ids: string[]) => Promise<void>;
  
  // Ingredient cascades
  updateIngredientInRecipes: (ingredientId: string, newName: string) => Promise<void>;
  removeIngredientFromRecipes: (ingredientId: string) => Promise<void>;
  detachIngredientFromRecipes: (ingredientId: string) => Promise<void>;
}

export const useRecipeStore = create<RecipeState>((set, get) => ({
  recipes: [],
  isLoading: false,
  error: null,
  hasFetched: false,
  recipeDetails: {},

  fetchRecipes: async (force = false) => {
    // Nếu đã fetch và không force thì tái sử dụng dữ liệu trong RAM (0ms)
    if (!force && get().hasFetched && get().recipes.length > 0) {
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const data = await RecipeRepository.getAll();
      set({ recipes: data, isLoading: false, hasFetched: true });
    } catch (e: any) {
      set({ error: e.message || 'Failed to fetch recipes', isLoading: false });
    }
  },

  fetchRecipeDetail: async (id: string) => {
    // 1. Kiểm tra cache recipeDetails trước
    const cached = get().recipeDetails[id];
    if (cached) return cached;

    // 2. Kiểm tra trong recipes hiện tại
    const inStore = get().recipes.find(r => r.id === id);
    if (inStore && inStore.steps && inStore.steps.length > 0) {
      set(state => ({
        recipeDetails: { ...state.recipeDetails, [id]: inStore }
      }));
      return inStore;
    }

    // 3. Đọc từ file chi tiết gốc
    try {
      const detail = await RecipeRepository.getById(id);
      if (detail) {
        set(state => ({
          recipeDetails: { ...state.recipeDetails, [id]: detail }
        }));
        return detail;
      }
    } catch (e) {
      console.error(`Failed to fetch recipe detail ${id}`, e);
    }
    return inStore || null;
  },

  toggleFavorite: async (id: string) => {
    const target = get().recipes.find(r => r.id === id);
    if (!target) return;

    const nextFavorite = !target.is_favorite;
    const updated = { ...target, is_favorite: nextFavorite };

    // Optimistic update trong state tức thì, không gây khựng UI
    set(state => {
      const updatedRecipes = state.recipes.map(r => r.id === id ? updated : r);
      const updatedDetails = state.recipeDetails[id]
        ? { ...state.recipeDetails, [id]: { ...state.recipeDetails[id], is_favorite: nextFavorite } }
        : state.recipeDetails;
      return { recipes: updatedRecipes, recipeDetails: updatedDetails };
    });

    try {
      await RecipeRepository.save(updated);
    } catch (e: any) {
      // Rollback khi lỗi
      set(state => ({
        recipes: state.recipes.map(r => r.id === id ? target : r),
        error: e.message || 'Failed to toggle favorite'
      }));
      throw e;
    }
  },

  addRecipe: async (recipe: Recipe) => {
    try {
      await RecipeRepository.save(recipe);
      const newRecipe = { ...recipe, id: recipe.id || crypto.randomUUID() };
      set((state) => ({ 
        recipes: [newRecipe, ...state.recipes],
        recipeDetails: { ...state.recipeDetails, [newRecipe.id]: newRecipe }
      }));
      return newRecipe;
    } catch (e: any) {
      set({ error: e.message || 'Failed to add recipe' });
      throw e;
    }
  },

  updateRecipe: async (recipe: Recipe) => {
    try {
      const currentRecipes = get().recipes;
      const oldRecipe = currentRecipes.find(r => r.id === recipe.id);
      
      const childrenToUpdate: Recipe[] = [];
      if (recipe.parent_id && oldRecipe?.parent_id !== recipe.parent_id) {
        const myChildren = currentRecipes.filter(r => r.parent_id === recipe.id);
        myChildren.forEach(child => {
          childrenToUpdate.push({ ...child, parent_id: recipe.parent_id });
        });
      }

      await RecipeRepository.save(recipe);
      if (childrenToUpdate.length > 0) {
        await RecipeRepository.saveBulk(childrenToUpdate);
      }
      
      set((state) => {
        let updatedRecipes = state.recipes.map((r) => (r.id === recipe.id ? recipe : r));
        if (childrenToUpdate.length > 0) {
          const childIds = childrenToUpdate.map(c => c.id);
          updatedRecipes = updatedRecipes.map(r => childIds.includes(r.id!) ? childrenToUpdate.find(c => c.id === r.id)! : r);
        }
        return { 
          recipes: updatedRecipes,
          recipeDetails: { ...state.recipeDetails, [recipe.id]: recipe }
        };
      });
    } catch (e: any) {
      set({ error: e.message || 'Failed to update recipe' });
      throw e;
    }
  },

  deleteRecipe: async (id: string) => {
    try {
      const currentRecipes = get().recipes;
      const childrenToUpdate = currentRecipes.filter(r => r.parent_id === id).map(child => ({ ...child, parent_id: null }));
      
      await RecipeRepository.delete(id);
      if (childrenToUpdate.length > 0) {
        await RecipeRepository.saveBulk(childrenToUpdate);
      }
      
      set((state) => {
        const updatedDetails = { ...state.recipeDetails };
        delete updatedDetails[id];
        let updatedRecipes = state.recipes.filter((r) => r.id !== id);
        if (childrenToUpdate.length > 0) {
          const childIds = childrenToUpdate.map(c => c.id);
          updatedRecipes = updatedRecipes.map(r => childIds.includes(r.id!) ? childrenToUpdate.find(c => c.id === r.id)! : r);
        }
        return { recipes: updatedRecipes, recipeDetails: updatedDetails };
      });
    } catch (e: any) {
      set({ error: e.message || 'Failed to delete recipe' });
      throw e;
    }
  },

  addBulkRecipes: async (recipes: Recipe[]) => {
    try {
      await RecipeRepository.saveBulk(recipes);
      const current = get().recipes;
      const currentDetails = { ...get().recipeDetails };
      for (const r of recipes) {
        if (r.id) currentDetails[r.id] = r;
      }
      set({ recipes: [...recipes, ...current], recipeDetails: currentDetails });
    } catch (e: any) {
      set({ error: e.message || 'Failed to bulk add recipes' });
      throw e;
    }
  },

  deleteBulkRecipes: async (ids: string[]) => {
    try {
      await RecipeRepository.deleteBulk(ids);
      const idsSet = new Set(ids);
      set((state) => {
        const updatedDetails = { ...state.recipeDetails };
        for (const id of ids) {
          delete updatedDetails[id];
        }
        return {
          recipes: state.recipes.filter((r) => !idsSet.has(r.id!)),
          recipeDetails: updatedDetails
        };
      });
    } catch (e: any) {
      set({ error: e.message || 'Failed to bulk delete recipes' });
    }
  },

  updateIngredientInRecipes: async (ingredientId: string, newName: string) => {
    try {
      const currentRecipes = get().recipes;
      const toUpdate = currentRecipes.filter(r => r.ingredients && r.ingredients.some(i => i.ingredient_id === ingredientId));
      if (toUpdate.length === 0) return;
      
      const updated = toUpdate.map(r => ({
        ...r,
        ingredients: r.ingredients.map(i => i.ingredient_id === ingredientId ? { ...i, name: newName } : i)
      }));
      
      await RecipeRepository.saveBulk(updated);
      set((state) => {
        const ids = updated.map(u => u.id);
        const newDetails = { ...state.recipeDetails };
        for (const u of updated) {
          if (u.id && newDetails[u.id]) newDetails[u.id] = u;
        }
        return { 
          recipes: state.recipes.map(r => ids.includes(r.id!) ? updated.find(u => u.id === r.id)! : r),
          recipeDetails: newDetails
        };
      });
    } catch (e: any) {
      set({ error: e.message });
      throw e;
    }
  },

  removeIngredientFromRecipes: async (ingredientId: string) => {
    try {
      const currentRecipes = get().recipes;
      const toUpdate = currentRecipes.filter(r => r.ingredients && r.ingredients.some(i => i.ingredient_id === ingredientId));
      if (toUpdate.length === 0) return;
      
      const updated = toUpdate.map(r => ({
        ...r,
        ingredients: r.ingredients.filter(i => i.ingredient_id !== ingredientId)
      }));
      
      await RecipeRepository.saveBulk(updated);
      set((state) => {
        const ids = updated.map(u => u.id);
        const newDetails = { ...state.recipeDetails };
        for (const u of updated) {
          if (u.id && newDetails[u.id]) newDetails[u.id] = u;
        }
        return { 
          recipes: state.recipes.map(r => ids.includes(r.id!) ? updated.find(u => u.id === r.id)! : r),
          recipeDetails: newDetails
        };
      });
    } catch (e: any) {
      set({ error: e.message });
      throw e;
    }
  },

  detachIngredientFromRecipes: async (ingredientId: string) => {
    try {
      const currentRecipes = get().recipes;
      const toUpdate = currentRecipes.filter(r => r.ingredients && r.ingredients.some(i => i.ingredient_id === ingredientId));
      if (toUpdate.length === 0) return;
      
      const updated = toUpdate.map(r => ({
        ...r,
        ingredients: r.ingredients.map(i => {
          if (i.ingredient_id === ingredientId) {
            const newI = { ...i };
            delete newI.ingredient_id;
            return newI;
          }
          return i;
        })
      }));
      
      await RecipeRepository.saveBulk(updated);
      set((state) => {
        const ids = updated.map(u => u.id);
        const newDetails = { ...state.recipeDetails };
        for (const u of updated) {
          if (u.id && newDetails[u.id]) newDetails[u.id] = u;
        }
        return { 
          recipes: state.recipes.map(r => ids.includes(r.id!) ? updated.find(u => u.id === r.id)! : r),
          recipeDetails: newDetails
        };
      });
    } catch (e: any) {
      set({ error: e.message });
      throw e;
    }
  },
}));
