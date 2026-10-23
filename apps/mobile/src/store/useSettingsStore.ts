import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MealSlotConfig } from '@apron/core';

export const DEFAULT_MEAL_SLOTS: MealSlotConfig[] = [
  { id: 'breakfast', name: 'Bữa sáng' },
  { id: 'lunch', name: 'Bữa trưa' },
  { id: 'dinner', name: 'Bữa tối' },
  { id: 'snack', name: 'Ăn nhẹ' },
];

interface SettingsState {
  viewMode: 'list' | 'card';
  showDailyAggregates: boolean;
  defaultSlots: MealSlotConfig[];

  setViewMode: (mode: 'list' | 'card') => void;
  setShowDailyAggregates: (show: boolean) => void;
  setDefaultSlots: (slots: MealSlotConfig[]) => void;
  addDefaultSlot: (name: string) => void;
  removeDefaultSlot: (id: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      viewMode: 'list',
      showDailyAggregates: true,
      defaultSlots: DEFAULT_MEAL_SLOTS,

      setViewMode: (mode) => set({ viewMode: mode }),
      setShowDailyAggregates: (show) => set({ showDailyAggregates: show }),
      setDefaultSlots: (slots) => set({ defaultSlots: slots }),
      
      addDefaultSlot: (name) => set((state) => {
        const newId = `slot_${Date.now()}`;
        return {
          defaultSlots: [...state.defaultSlots, { id: newId, name }]
        };
      }),
      
      removeDefaultSlot: (id) => set((state) => ({
        defaultSlots: state.defaultSlots.filter(s => s.id !== id)
      })),
    }),
    {
      name: 'apron-settings-storage',
    }
  )
);
