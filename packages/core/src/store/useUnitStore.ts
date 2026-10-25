import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Unit } from '../types/recipe';

interface UnitState {
  units: Unit[];
  addUnit: (unit: Omit<Unit, 'id'>) => void;
  updateUnit: (id: string, updates: Partial<Omit<Unit, 'id'>>) => void;
  removeUnit: (id: string) => void;
  setUnits: (units: Unit[]) => void;
}

export const useUnitStore = create<UnitState>()(
  persist(
    (set) => ({
      units: [],
      addUnit: (unit) => 
        set((state) => ({
          units: [...state.units, { ...unit, id: crypto.randomUUID() }]
        })),
      updateUnit: (id, updates) =>
        set((state) => ({
          units: state.units.map(u => u.id === id ? { ...u, ...updates } : u)
        })),
      removeUnit: (id) =>
        set((state) => ({
          units: state.units.filter(u => u.id !== id)
        })),
      setUnits: (units) => set({ units })
    }),
    {
      name: 'apron-unit-storage',
      version: 2,
      migrate: (persistedState: any) => {
        if (persistedState && Array.isArray(persistedState.units)) {
          const legacyIds = new Set(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14']);
          const cleaned = persistedState.units.filter((u: any) => !legacyIds.has(String(u.id)));
          return { ...persistedState, units: cleaned };
        }
        return persistedState;
      }
    }
  )
);
