import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface IngredientMeta {
  id: string;
  name: string;
  image_url?: string;
  default_category?: string;
  default_unit?: string;
}

interface IngredientCatalogState {
  catalog: Record<string, IngredientMeta>;
  
  // Hành động
  addIngredientMeta: (name: string, data?: Partial<IngredientMeta>) => IngredientMeta;
  updateIngredientMeta: (id: string, data: Partial<IngredientMeta>) => void;
  getIngredientMeta: (id: string) => IngredientMeta | undefined;
  getIngredientMetaByName: (name: string) => IngredientMeta | undefined;
  removeIngredientMeta: (id: string) => void;
  getAllIngredients: () => IngredientMeta[];
}

const normalizeName = (name: string) => {
  return name.trim().toLowerCase();
};

const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const useIngredientCatalogStore = create<IngredientCatalogState>()(
  persist(
    (set, get) => ({
      catalog: {},

      addIngredientMeta: (name, data) => {
        const id = generateId();
        const newIngredient: IngredientMeta = {
          id,
          name: name.trim(),
          ...data,
        };
        set((state) => ({
          catalog: { ...state.catalog, [id]: newIngredient }
        }));
        return newIngredient;
      },

      updateIngredientMeta: (id, data) => {
        set((state) => {
          if (!state.catalog[id]) return state;
          return {
            catalog: {
              ...state.catalog,
              [id]: {
                ...state.catalog[id],
                ...data,
                name: data.name || state.catalog[id].name,
              },
            },
          };
        });
      },

      getIngredientMeta: (id) => {
        return get().catalog[id];
      },

      getIngredientMetaByName: (name) => {
        const normName = normalizeName(name);
        return Object.values(get().catalog).find(i => normalizeName(i.name) === normName);
      },

      removeIngredientMeta: (id) => {
        set((state) => {
          const newCatalog = { ...state.catalog };
          delete newCatalog[id];
          return { catalog: newCatalog };
        });
      },

      getAllIngredients: () => {
        return Object.values(get().catalog);
      }
    }),
    {
      name: 'apron-ingredient-catalog',
      version: 1,
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          // Migrate old catalog (keyed by name) to new catalog (keyed by id)
          const oldCatalog = persistedState.catalog || {};
          const newCatalog: Record<string, IngredientMeta> = {};
          
          for (const key in oldCatalog) {
            const item = oldCatalog[key];
            const id = generateId();
            newCatalog[id] = { ...item, id };
          }
          
          return { ...persistedState, catalog: newCatalog };
        }
        return persistedState;
      }
    }
  )
);
