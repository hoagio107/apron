
"use client";

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { ref, onValue, push, set, update, remove } from 'firebase/database';
import { CalorieItem } from '@/lib/recipe-types';

export function useCalories() {
  const [items, setItems] = useState<CalorieItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const caloriesRef = ref(db, 'calories');
    const unsubscribe = onValue(caloriesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data).map(([key, value]) => ({
          id: key,
          ...(value as any)
        }));
        // Sort alphabetically
        list.sort((a, b) => a.name.localeCompare(b.name));
        setItems(list);
      } else {
        setItems([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const addCalorie = async (item: Omit<CalorieItem, 'id'>) => {
    const caloriesRef = ref(db, 'calories');
    const newRef = push(caloriesRef);
    await set(newRef, item);
    return newRef.key;
  };

  const updateCalorie = async (id: string, item: Partial<CalorieItem>) => {
    const calorieRef = ref(db, `calories/${id}`);
    await update(calorieRef, item);
  };

  const deleteCalories = async (ids: string[]) => {
    const promises = ids.map(id => remove(ref(db, `calories/${id}`)));
    await Promise.all(promises);
  };

  return { items, loading, addCalorie, updateCalorie, deleteCalories };
}
