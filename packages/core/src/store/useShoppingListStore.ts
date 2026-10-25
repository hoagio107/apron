import { create } from 'zustand';
import { ShoppingListRepository } from '../db/shopping-list-repository';
import { autoCategorizeIngredient } from '../utils/ingredientParser';
import type { ShoppingListItem } from '../types/shopping-list';

interface ShoppingListState {
  items: ShoppingListItem[];
  isLoading: boolean;
  
  fetchItems: () => Promise<void>;
  addItem: (name: string, quantity?: number | string, unit?: string, group?: string) => Promise<void>;
  addItems: (items: Omit<ShoppingListItem, 'id' | 'checked' | 'created_at'>[]) => Promise<void>;
  updateItem: (id: string, updates: Partial<ShoppingListItem>) => Promise<void>;
  toggleItem: (id: string) => Promise<void>;
  removeItems: (ids: string[]) => Promise<void>;
  clearCompleted: () => Promise<void>;
}

export const useShoppingListStore = create<ShoppingListState>((set, get) => ({
  items: [],
  isLoading: false,

  fetchItems: async () => {
    set({ isLoading: true });
    try {
      const items = await ShoppingListRepository.getAll();
      set({ items });
    } finally {
      set({ isLoading: false });
    }
  },

  addItem: async (name, quantity, unit, group) => {
    const newItem: ShoppingListItem = {
      id: crypto.randomUUID(),
      name,
      quantity,
      unit,
      group: group || autoCategorizeIngredient(name),
      checked: false,
      created_at: new Date().toISOString()
    };
    
    const newItems = [...get().items, newItem];
    set({ items: newItems });
    await ShoppingListRepository.saveAll(newItems);
  },

  addItems: async (newItemsData) => {
    const timestamp = new Date().toISOString();
    const newItems = newItemsData.map(item => ({
      ...item,
      group: item.group || autoCategorizeIngredient(item.name),
      id: crypto.randomUUID(),
      checked: false,
      created_at: timestamp
    }));
    
    const updatedList = [...get().items, ...newItems];
    set({ items: updatedList });
    await ShoppingListRepository.saveAll(updatedList);
  },

  updateItem: async (id, updates) => {
    const newItems = get().items.map(item => 
      item.id === id ? { ...item, ...updates } : item
    );
    set({ items: newItems });
    await ShoppingListRepository.saveAll(newItems);
  },

  toggleItem: async (id) => {
    const newItems = get().items.map(item => 
      item.id === id ? { ...item, checked: !item.checked } : item
    );
    set({ items: newItems });
    await ShoppingListRepository.saveAll(newItems);
  },

  removeItems: async (ids) => {
    const newItems = get().items.filter(item => !ids.includes(item.id));
    set({ items: newItems });
    await ShoppingListRepository.saveAll(newItems);
  },

  clearCompleted: async () => {
    const newItems = get().items.filter(item => !item.checked);
    set({ items: newItems });
    await ShoppingListRepository.saveAll(newItems);
  }
}));
