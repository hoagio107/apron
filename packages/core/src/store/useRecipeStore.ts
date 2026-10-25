import { create } from 'zustand';
import { RecipeRepository } from '../db/recipe-repository';
import type { Recipe } from '../types/recipe';

interface RecipeState {
  recipes: Recipe[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchRecipes: () => Promise<void>;
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
      const newRecipe = { ...recipe, id: recipe.id || crypto.randomUUID() };
      set((state) => ({ recipes: [newRecipe, ...state.recipes] }));
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
        return { recipes: updatedRecipes };
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
        let updatedRecipes = state.recipes.filter((r) => r.id !== id);
        if (childrenToUpdate.length > 0) {
          const childIds = childrenToUpdate.map(c => c.id);
          updatedRecipes = updatedRecipes.map(r => childIds.includes(r.id!) ? childrenToUpdate.find(c => c.id === r.id)! : r);
        }
        return { recipes: updatedRecipes };
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
        return { recipes: state.recipes.map(r => ids.includes(r.id!) ? updated.find(u => u.id === r.id)! : r) };
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
        return { recipes: state.recipes.map(r => ids.includes(r.id!) ? updated.find(u => u.id === r.id)! : r) };
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
        return { recipes: state.recipes.map(r => ids.includes(r.id!) ? updated.find(u => u.id === r.id)! : r) };
      });
    } catch (e: any) {
      set({ error: e.message });
      throw e;
    }
  },
}));
