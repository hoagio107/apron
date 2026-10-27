import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Unit } from '../types/recipe';
import { normalizeUnit, DEFAULT_COOKING_UNITS } from '../utils/unitNormalizer';

interface UnitState {
  units: Unit[];
  addUnit: (unit: Omit<Unit, 'id'>) => void;
  bulkAddUnits: (units: (Omit<Unit, 'id'> | Unit)[]) => number;
  ensureUnits: (incomingNames: string[]) => number;
  seedDefaultUnits: () => number;
  updateUnit: (id: string, updates: Partial<Omit<Unit, 'id'>>) => void;
  removeUnit: (id: string) => void;
  setUnits: (units: Unit[]) => void;
}

export const useUnitStore = create<UnitState>()(
  persist(
    (set) => ({
      units: [],
      addUnit: (unit) => 
        set((state) => {
          const normName = normalizeUnit(unit.name);
          if (!normName) return state;
          const lower = normName.toLowerCase();
          if (state.units.some(u => u.name.trim().toLowerCase() === lower)) {
            return state;
          }
          return {
            units: [...state.units, { ...unit, name: normName, id: crypto.randomUUID() }]
          };
        }),
      bulkAddUnits: (incoming) => {
        let addedCount = 0;
        set((state) => {
          const existingNames = new Set(state.units.map(u => u.name.trim().toLowerCase()));
          const newUnits = [...state.units];
          for (const u of incoming) {
            if (!u.name || !u.name.trim()) continue;
            const normName = normalizeUnit(u.name);
            if (!normName) continue;
            const normLower = normName.toLowerCase();
            if (!existingNames.has(normLower)) {
              existingNames.add(normLower);
              newUnits.push({
                ...u,
                name: normName,
                id: ('id' in u && u.id) ? (u as Unit).id : crypto.randomUUID()
              });
              addedCount++;
            }
          }
          return { units: newUnits };
        });
        return addedCount;
      },
      ensureUnits: (incomingNames: string[]) => {
        let addedCount = 0;
        set((state) => {
          const existingNames = new Set(state.units.map(u => u.name.trim().toLowerCase()));
          const newUnits = [...state.units];
          for (const raw of incomingNames) {
            if (!raw || !raw.trim()) continue;
            const normName = normalizeUnit(raw);
            if (!normName) continue;
            const normLower = normName.toLowerCase();
            if (!existingNames.has(normLower)) {
              existingNames.add(normLower);
              newUnits.push({
                id: crypto.randomUUID(),
                name: normName
              });
              addedCount++;
            }
          }
          return { units: newUnits };
        });
        return addedCount;
      },
      seedDefaultUnits: () => {
        let addedCount = 0;
        set((state) => {
          const existingNames = new Set(state.units.map(u => u.name.trim().toLowerCase()));
          const newUnits = [...state.units];
          for (const name of DEFAULT_COOKING_UNITS) {
            const lower = name.toLowerCase();
            if (!existingNames.has(lower)) {
              existingNames.add(lower);
              newUnits.push({
                id: crypto.randomUUID(),
                name
              });
              addedCount++;
            }
          }
          return { units: newUnits };
        });
        return addedCount;
      },
      updateUnit: (id, updates) =>
        set((state) => ({
          units: state.units.map(u => {
            if (u.id !== id) return u;
            const updated = { ...u, ...updates };
            if (updates.name) {
              updated.name = normalizeUnit(updates.name);
            }
            return updated;
          })
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
