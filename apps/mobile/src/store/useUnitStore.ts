import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Unit } from '@apron/core';

interface UnitState {
  units: Unit[];
  addUnit: (unit: Omit<Unit, 'id'>) => void;
  updateUnit: (id: string, updates: Partial<Omit<Unit, 'id'>>) => void;
  removeUnit: (id: string) => void;
}

const defaultUnits: Unit[] = [
  { id: '1', name: 'g' },
  { id: '2', name: 'kg' },
  { id: '3', name: 'ml' },
  { id: '4', name: 'lít' },
  { id: '5', name: 'muỗng cà phê' },
  { id: '6', name: 'muỗng canh' },
  { id: '7', name: 'quả' },
  { id: '8', name: 'bó' },
  { id: '9', name: 'củ' },
];

export const useUnitStore = create<UnitState>()(
  persist(
    (set) => ({
      units: defaultUnits,
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
        }))
    }),
    {
      name: 'apron-unit-storage'
    }
  )
);
