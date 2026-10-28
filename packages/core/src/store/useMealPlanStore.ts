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

export const useMealPlanStore = create<MealPlanState>((set, get) => {
  const getOrCreatePlan = (date: string): MealPlan => {
    const existing = get().mealPlans.find((p) => p.date === date);
    if (existing) return existing;
    const { defaultSlots } = useSettingsStore.getState();
    return { id: crypto.randomUUID(), date, slots: [...defaultSlots], meals: [] };
  };

  const upsertPlanInState = async (updatedPlan: MealPlan) => {
    await MealPlanRepository.save(updatedPlan);
    set((state) => {
      const filtered = state.mealPlans.filter((p) => p.date !== updatedPlan.date);
      return { mealPlans: [...filtered, updatedPlan].sort((a, b) => a.date.localeCompare(b.date)) };
    });
  };

  return {
    mealPlans: [],
    isLoading: false,
    error: null,

    fetchMealPlans: async (startDate: string, endDate: string) => {
      set({ isLoading: true, error: null });
      try {
        const data = await MealPlanRepository.getInRange(startDate, endDate);
        const { defaultSlots } = useSettingsStore.getState();

        const migratedData = data.map((plan) => {
          if (!plan.slots || plan.slots.length === 0) {
            return { ...plan, slots: [...defaultSlots] };
          }
          return plan;
        });

        set({ mealPlans: migratedData, isLoading: false });
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Failed to fetch meal plans';
        set({ error: msg, isLoading: false });
      }
    },

    addMealPlanEntry: async (date: string, entryData: Omit<MealPlanEntry, 'id'>) => {
      try {
        const basePlan = getOrCreatePlan(date);
        const newEntry: MealPlanEntry = {
          ...entryData,
          id: crypto.randomUUID(),
        };
        const updatedPlan: MealPlan = {
          ...basePlan,
          meals: [...basePlan.meals, newEntry],
        };
        await upsertPlanInState(updatedPlan);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Failed to add meal plan entry';
        set({ error: msg });
        throw e;
      }
    },

    removeMealPlanEntry: async (date: string, entryId: string) => {
      try {
        const existingPlan = get().mealPlans.find((p) => p.date === date);
        if (!existingPlan) return;

        const updatedPlan: MealPlan = {
          ...existingPlan,
          meals: existingPlan.meals.filter((m) => m.id !== entryId),
        };
        await upsertPlanInState(updatedPlan);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Failed to remove meal plan entry';
        set({ error: msg });
        throw e;
      }
    },

    updateMealPlanEntry: async (date: string, entry: MealPlanEntry) => {
      try {
        const existingPlan = get().mealPlans.find((p) => p.date === date);
        if (!existingPlan) return;

        const updatedPlan: MealPlan = {
          ...existingPlan,
          meals: existingPlan.meals.map((m) => (m.id === entry.id ? entry : m)),
        };
        await upsertPlanInState(updatedPlan);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Failed to update meal plan entry';
        set({ error: msg });
        throw e;
      }
    },

    addMealSlot: async (date: string, slotName: string) => {
      try {
        const basePlan = getOrCreatePlan(date);
        const newSlot: MealSlotConfig = {
          id: crypto.randomUUID(),
          name: slotName,
        };
        const updatedPlan: MealPlan = {
          ...basePlan,
          slots: [...basePlan.slots, newSlot],
        };
        await upsertPlanInState(updatedPlan);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Failed to add meal slot';
        set({ error: msg });
        throw e;
      }
    },

    removeMealSlot: async (date: string, slotId: string) => {
      try {
        const basePlan = getOrCreatePlan(date);
        const hasMeals = basePlan.meals.some((m) => m.meal_type === slotId);
        if (hasMeals) throw new Error('Cannot remove slot with meals');

        const updatedPlan: MealPlan = {
          ...basePlan,
          slots: basePlan.slots.filter((s) => s.id !== slotId),
        };
        await upsertPlanInState(updatedPlan);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Failed to remove meal slot';
        set({ error: msg });
        throw e;
      }
    },

    updateMealSlots: async (date: string, slots: MealSlotConfig[]) => {
      try {
        const basePlan = getOrCreatePlan(date);
        const updatedPlan: MealPlan = {
          ...basePlan,
          slots,
        };
        await upsertPlanInState(updatedPlan);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Failed to update meal slots';
        set({ error: msg });
        throw e;
      }
    },
  };
});
