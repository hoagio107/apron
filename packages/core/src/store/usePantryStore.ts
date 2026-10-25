import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PantryItem } from '../types/pantry';

interface PantryState {
  items: PantryItem[];
  addItem: (item: Omit<PantryItem, 'id'>) => void;
  updateItem: (id: string, updates: Partial<Omit<PantryItem, 'id'>>) => void;
  removeItem: (id: string) => void;
}

export const usePantryStore = create<PantryState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) => 
        set((state) => ({
          items: [...state.items, { ...item, id: crypto.randomUUID() }]
        })),
      updateItem: (id, updates) =>
        set((state) => ({
          items: state.items.map(i => i.id === id ? { ...i, ...updates } : i)
        })),
      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter(i => i.id !== id)
        }))
    }),
    {
      name: 'apron-pantry-storage'
    }
  )
);
