import { useState, useEffect } from 'react';
import type { Unit } from '@apron/core';
import { MOCK_FETCH_DELAY_MS } from '../constants';

// Mock data for now until we have local storage DB wired up
const DEFAULT_UNITS: Unit[] = [
  { id: '1', name: 'g' },
  { id: '2', name: 'kg' },
  { id: '3', name: 'ml' },
  { id: '4', name: 'l' },
  { id: '5', name: 'muỗng canh' },
  { id: '6', name: 'muỗng cà phê' },
  { id: '7', name: 'bát' },
  { id: '8', name: 'chén' },
  { id: '9', name: 'quả' },
  { id: '10', name: 'trái' },
  { id: '11', name: 'củ' },
  { id: '12', name: 'tép' },
  { id: '13', name: 'lá' },
  { id: '14', name: 'nhánh' },
];

export function useUnits() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching from data
    const fetchUnits = async () => {
      setLoading(true);
      // In a real app, this would fetch from local DB
      await new Promise(resolve => setTimeout(resolve, MOCK_FETCH_DELAY_MS));
      setUnits(DEFAULT_UNITS);
      setLoading(false);
    };
    
    fetchUnits();
  }, []);

  const addUnit = async (name: string) => {
    const newUnit = { id: Date.now().toString(), name };
    setUnits(prev => [...prev, newUnit]);
  };

  return { units, loading, addUnit };
}
