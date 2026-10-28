import { create } from 'zustand';
import { RecipeRepository } from '../db/recipe-repository';
import type { Recipe, RecipeIngredient } from '../types/recipe';

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

export const useRecipeStore = create<RecipeState>((set, get) => {
  const cascadeIngredientChange = async (
    ingredientId: string,
    transformIngredients: (ingredients: RecipeIngredient[]) => RecipeIngredient[]
  ) => {
    try {
      const currentRecipes = get().recipes;
      const toUpdate = currentRecipes.filter(
        (r) => r.ingredients && r.ingredients.some((i) => i.ingredient_id === ingredientId)
      );
      if (toUpdate.length === 0) return;

      const updated = toUpdate.map((r) => ({
        ...r,
        ingredients: transformIngredients(r.ingredients),
      }));

      await RecipeRepository.saveBulk(updated);
      const updatedMap = new Map(updated.map((u) => [u.id, u]));

      set((state) => {
        const newDetails = { ...state.recipeDetails };
        for (const u of updated) {
          if (u.id && newDetails[u.id]) newDetails[u.id] = u;
        }
        return {
          recipes: state.recipes.map((r) => (r.id ? updatedMap.get(r.id) ?? r : r)),
          recipeDetails: newDetails,
        };
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to cascade ingredient update';
      set({ error: msg });
      throw e;
    }
  };

  return {
    recipes: [],
    isLoading: false,
    error: null,
    hasFetched: false,
    recipeDetails: {},

    fetchRecipes: async (force = false) => {
      if (!force && get().hasFetched && get().recipes.length > 0) {
        return;
      }

      set({ isLoading: true, error: null });
      try {
        const data = await RecipeRepository.getAll();
        set({ recipes: data, isLoading: false, hasFetched: true });
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Failed to fetch recipes';
        set({ error: msg, isLoading: false });
      }
    },

    fetchRecipeDetail: async (id: string) => {
      // 1. Kiểm tra cache recipeDetails trước
      const cached = get().recipeDetails[id];
      if (cached) return cached;

      // 2. Kiểm tra trong recipes hiện tại (nếu không có lịch sử nấu ăn bị lược bỏ snapshot)
      const inStore = get().recipes.find((r) => r.id === id);
      const hasStrippedHistory = inStore?.cooking_history?.some((h) => h.recipe_snapshot === undefined);
      if (inStore && inStore.steps && inStore.steps.length > 0 && !hasStrippedHistory) {
        set((state) => ({
          recipeDetails: { ...state.recipeDetails, [id]: inStore },
        }));
        return inStore;
      }

      // 3. Đọc từ file chi tiết gốc recipes/{id}.json
      try {
        const detail = await RecipeRepository.getById(id);
        if (detail) {
          set((state) => ({
            recipeDetails: { ...state.recipeDetails, [id]: detail },
          }));
          return detail;
        }
      } catch (e) {
        console.error(`Failed to fetch recipe detail ${id}`, e);
      }
      return inStore || null;
    },

    toggleFavorite: async (id: string) => {
      const target = get().recipes.find((r) => r.id === id);
      if (!target) return;

      const prevDetail = get().recipeDetails[id];
      const nextFavorite = !target.is_favorite;
      const updated = { ...target, is_favorite: nextFavorite };

      // Optimistic update trong state tức thì
      set((state) => {
        const updatedRecipes = state.recipes.map((r) => (r.id === id ? updated : r));
        const updatedDetails = state.recipeDetails[id]
          ? { ...state.recipeDetails, [id]: { ...state.recipeDetails[id], is_favorite: nextFavorite } }
          : state.recipeDetails;
        return { recipes: updatedRecipes, recipeDetails: updatedDetails };
      });

      try {
        // Bảo toàn recipe_snapshot trong file chi tiết nếu có cooking_history
        let baseToSave = prevDetail || target;
        if (!prevDetail && target.cooking_history?.some((h) => h.recipe_snapshot === undefined)) {
          const fromDisk = await RecipeRepository.getById(id);
          if (fromDisk) baseToSave = fromDisk;
        }
        await RecipeRepository.save({ ...baseToSave, is_favorite: nextFavorite });
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Failed to toggle favorite';
        set((state) => {
          const rolledBackDetails = { ...state.recipeDetails };
          if (prevDetail) {
            rolledBackDetails[id] = prevDetail;
          }
          return {
            recipes: state.recipes.map((r) => (r.id === id ? target : r)),
            recipeDetails: rolledBackDetails,
            error: msg,
          };
        });
        throw e;
      }
    },

    addRecipe: async (recipe: Recipe) => {
      try {
        await RecipeRepository.save(recipe);
        const newRecipe = { ...recipe, id: recipe.id || crypto.randomUUID() };
        set((state) => ({
          recipes: [newRecipe, ...state.recipes],
          recipeDetails: { ...state.recipeDetails, [newRecipe.id]: newRecipe },
        }));
        return newRecipe;
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Failed to add recipe';
        set({ error: msg });
        throw e;
      }
    },

    updateRecipe: async (recipe: Recipe) => {
      try {
        const currentRecipes = get().recipes;
        const oldRecipe = currentRecipes.find((r) => r.id === recipe.id);

        const childrenToUpdate: Recipe[] = [];
        if (recipe.parent_id && oldRecipe?.parent_id !== recipe.parent_id) {
          for (const child of currentRecipes) {
            if (child.parent_id === recipe.id) {
              childrenToUpdate.push({ ...child, parent_id: recipe.parent_id });
            }
          }
        }

        await RecipeRepository.save(recipe);
        if (childrenToUpdate.length > 0) {
          await RecipeRepository.saveBulk(childrenToUpdate);
        }

        const childMap = new Map(childrenToUpdate.map((c) => [c.id, c]));
        set((state) => ({
          recipes: state.recipes.map((r) => {
            if (r.id === recipe.id) return recipe;
            return r.id ? childMap.get(r.id) ?? r : r;
          }),
          recipeDetails: { ...state.recipeDetails, [recipe.id]: recipe },
        }));
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Failed to update recipe';
        set({ error: msg });
        throw e;
      }
    },

    deleteRecipe: async (id: string) => {
      try {
        const currentRecipes = get().recipes;
        const childrenToUpdate = currentRecipes
          .filter((r) => r.parent_id === id)
          .map((child) => ({ ...child, parent_id: null }));

        await RecipeRepository.delete(id);
        if (childrenToUpdate.length > 0) {
          await RecipeRepository.saveBulk(childrenToUpdate);
        }

        const childMap = new Map(childrenToUpdate.map((c) => [c.id, c]));
        set((state) => {
          const updatedDetails = { ...state.recipeDetails };
          delete updatedDetails[id];
          const updatedRecipes = state.recipes
            .filter((r) => r.id !== id)
            .map((r) => (r.id ? childMap.get(r.id) ?? r : r));
          return { recipes: updatedRecipes, recipeDetails: updatedDetails };
        });
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Failed to delete recipe';
        set({ error: msg });
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
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Failed to bulk add recipes';
        set({ error: msg });
        throw e;
      }
    },

    deleteBulkRecipes: async (ids: string[]) => {
      try {
        const idsSet = new Set(ids);
        const currentRecipes = get().recipes;
        const childrenToUpdate = currentRecipes
          .filter((r) => r.parent_id && idsSet.has(r.parent_id) && !idsSet.has(r.id))
          .map((child) => ({ ...child, parent_id: null }));

        await RecipeRepository.deleteBulk(ids);
        if (childrenToUpdate.length > 0) {
          await RecipeRepository.saveBulk(childrenToUpdate);
        }

        const childMap = new Map(childrenToUpdate.map((c) => [c.id, c]));
        set((state) => {
          const updatedDetails = { ...state.recipeDetails };
          for (const id of ids) {
            delete updatedDetails[id];
          }
          return {
            recipes: state.recipes
              .filter((r) => !idsSet.has(r.id!))
              .map((r) => (r.id ? childMap.get(r.id) ?? r : r)),
            recipeDetails: updatedDetails,
          };
        });
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Failed to bulk delete recipes';
        set({ error: msg });
        throw e;
      }
    },

    updateIngredientInRecipes: async (ingredientId: string, newName: string) => {
      await cascadeIngredientChange(ingredientId, (ingredients) =>
        ingredients.map((i) => (i.ingredient_id === ingredientId ? { ...i, name: newName } : i))
      );
    },

    removeIngredientFromRecipes: async (ingredientId: string) => {
      await cascadeIngredientChange(ingredientId, (ingredients) =>
        ingredients.filter((i) => i.ingredient_id !== ingredientId)
      );
    },

    detachIngredientFromRecipes: async (ingredientId: string) => {
      await cascadeIngredientChange(ingredientId, (ingredients) =>
        ingredients.map((i) => {
          if (i.ingredient_id === ingredientId) {
            const { ingredient_id: _removed, ...rest } = i;
            return rest;
          }
          return i;
        })
      );
    },
  };
});
