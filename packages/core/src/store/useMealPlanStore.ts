import { create } from 'zustand';
import { MealPlanRepository } from '../db/meal-plan-repository';
import type { MealPlan, MealPlanEntry, MealSlotConfig } from '../types/recipe';
import { useSettingsStore } from './useSettingsStore';

interface MealPlanState {
  mealPlans: MealPlan[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchMealPlans: (startDate: string, endDate: string) => Promise<void>;
  addMealPlanEntry: (date: string, entry: Omit<MealPlanEntry, 'id'>) => Promise<void>;
  removeMealPlanEntry: (date: string, entryId: string) => Promise<void>;
  updateMealPlanEntry: (date: string, entry: MealPlanEntry) => Promise<void>;
  addMealSlot: (date: string, slotName: string) => Promise<void>;
  removeMealSlot: (date: string, slotId: string) => Promise<void>;
  updateMealSlots: (date: string, slots: MealSlotConfig[]) => Promise<void>;
}

export const useMealPlanStore = create<MealPlanState>((set, get) => ({
  mealPlans: [],
  isLoading: false,
  error: null,

  fetchMealPlans: async (startDate: string, endDate: string) => {
    set({ isLoading: true, error: null });
    try {
      const data = await MealPlanRepository.getInRange(startDate, endDate);
      const { defaultSlots } = useSettingsStore.getState();
      
      const migratedData = data.map(plan => {
        if (!plan.slots || plan.slots.length === 0) {
          return { ...plan, slots: [...defaultSlots] };
        }
        return plan;
      });

      set({ mealPlans: migratedData, isLoading: false });
    } catch (e: any) {
      set({ error: e.message || 'Failed to fetch meal plans', isLoading: false });
    }
  },

  addMealPlanEntry: async (date: string, entryData: Omit<MealPlanEntry, 'id'>) => {
    try {
      const { mealPlans } = get();
      const existingPlan = mealPlans.find((p) => p.date === date);
      
      const newEntry: MealPlanEntry = {
        ...entryData,
        id: crypto.randomUUID(),
      };
      const { defaultSlots } = useSettingsStore.getState();

      const updatedPlan: MealPlan = existingPlan
        ? { ...existingPlan, meals: [...existingPlan.meals, newEntry] }
        : { id: crypto.randomUUID(), date, slots: [...defaultSlots], meals: [newEntry] };

      await MealPlanRepository.save(updatedPlan);

      set((state) => {
        const filtered = state.mealPlans.filter((p) => p.date !== date);
        return { mealPlans: [...filtered, updatedPlan].sort((a, b) => a.date.localeCompare(b.date)) };
      });
    } catch (e: any) {
      set({ error: e.message || 'Failed to add meal plan entry' });
      throw e;
    }
  },

  removeMealPlanEntry: async (date: string, entryId: string) => {
    try {
      const { mealPlans } = get();
      const existingPlan = mealPlans.find((p) => p.date === date);
      
      if (!existingPlan) return;

      const updatedPlan: MealPlan = {
        ...existingPlan,
        meals: existingPlan.meals.filter((m) => m.id !== entryId),
      };

      await MealPlanRepository.save(updatedPlan);
      set((state) => ({
        mealPlans: state.mealPlans.map((p) => (p.date === date ? updatedPlan : p)),
      }));
    } catch (e: any) {
      set({ error: e.message || 'Failed to remove meal plan entry' });
      throw e;
    }
  },

  updateMealPlanEntry: async (date: string, entry: MealPlanEntry) => {
    try {
      const { mealPlans } = get();
      const existingPlan = mealPlans.find((p) => p.date === date);
      
      if (!existingPlan) return;

      const updatedPlan: MealPlan = {
        ...existingPlan,
        meals: existingPlan.meals.map((m) => (m.id === entry.id ? entry : m)),
      };

      await MealPlanRepository.save(updatedPlan);

      set((state) => ({
        mealPlans: state.mealPlans.map((p) => (p.date === date ? updatedPlan : p)),
      }));
    } catch (e: any) {
      set({ error: e.message || 'Failed to update meal plan entry' });
      throw e;
    }
  },

  addMealSlot: async (date: string, slotName: string) => {
    try {
      const { mealPlans } = get();
      let existingPlan = mealPlans.find((p) => p.date === date);
      if (!existingPlan) {
        const { defaultSlots } = useSettingsStore.getState();
        existingPlan = { id: crypto.randomUUID(), date, slots: [...defaultSlots], meals: [] };
      }

      const newSlot: MealSlotConfig = {
        id: crypto.randomUUID(),
        name: slotName,
      };

      const updatedPlan: MealPlan = {
        ...existingPlan,
        slots: [...existingPlan.slots, newSlot],
      };

      await MealPlanRepository.save(updatedPlan);

      set((state) => {
        const filtered = state.mealPlans.filter((p) => p.date !== date);
        return { mealPlans: [...filtered, updatedPlan].sort((a, b) => a.date.localeCompare(b.date)) };
      });
    } catch (e: any) {
      set({ error: e.message || 'Failed to add meal slot' });
      throw e;
    }
  },

  removeMealSlot: async (date: string, slotId: string) => {
    try {
      const { mealPlans } = get();
      let existingPlan = mealPlans.find((p) => p.date === date);
      if (!existingPlan) {
        const { defaultSlots } = useSettingsStore.getState();
        existingPlan = { id: crypto.randomUUID(), date, slots: [...defaultSlots], meals: [] };
      }

      // Don't remove if there are meals in this slot
      const hasMeals = existingPlan.meals.some(m => m.meal_type === slotId);
      if (hasMeals) throw new Error('Cannot remove slot with meals');

      const updatedPlan: MealPlan = {
        ...existingPlan,
        slots: existingPlan.slots.filter(s => s.id !== slotId),
      };

      await MealPlanRepository.save(updatedPlan);

      set((state) => {
        const filtered = state.mealPlans.filter((p) => p.date !== date);
        return { mealPlans: [...filtered, updatedPlan].sort((a, b) => a.date.localeCompare(b.date)) };
      });
    } catch (e: any) {
      set({ error: e.message || 'Failed to remove meal slot' });
      throw e;
    }
  },

  updateMealSlots: async (date: string, slots: MealSlotConfig[]) => {
    try {
      const { mealPlans } = get();
      let existingPlan = mealPlans.find((p) => p.date === date);
      if (!existingPlan) {
        const { defaultSlots } = useSettingsStore.getState();
        existingPlan = { id: crypto.randomUUID(), date, slots: [...defaultSlots], meals: [] };
      }

      const updatedPlan: MealPlan = {
        ...existingPlan,
        slots,
      };

      await MealPlanRepository.save(updatedPlan);

      set((state) => {
        const filtered = state.mealPlans.filter((p) => p.date !== date);
        return { mealPlans: [...filtered, updatedPlan].sort((a, b) => a.date.localeCompare(b.date)) };
      });
    } catch (e: any) {
      set({ error: e.message || 'Failed to update meal slots' });
      throw e;
    }
  },
}));
