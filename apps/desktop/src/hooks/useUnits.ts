import { useUnitStore } from '../store/useUnitStore';

export function useUnits() {
  const { units, addUnit } = useUnitStore();

  return {
    units,
    loading: false,
    addUnit: async (name: string) => {
      addUnit({ name });
    }
  };
}
