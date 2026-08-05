
'use client';

import { useMemo } from 'react';
import { collection, doc, query, orderBy } from 'firebase/firestore';
import { 
  useCollection, 
  useFirestore, 
  useUser, 
  useMemoFirebase,
  addDocumentNonBlocking,
  updateDocumentNonBlocking,
  deleteDocumentNonBlocking
} from '@/firebase';
import { Unit } from '@/lib/recipe-types';

export function useUnits() {
  const firestore = useFirestore();
  const { user } = useUser();

  const unitsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(
      collection(firestore, 'users', user.uid, 'units'),
      orderBy('name', 'asc')
    );
  }, [firestore, user?.uid]);

  const { data: units, isLoading } = useCollection<Unit>(unitsQuery);

  const addUnit = async (name: string) => {
    if (!firestore || !user?.uid) return;
    const colRef = collection(firestore, 'users', user.uid, 'units');
    return addDocumentNonBlocking(colRef, { name });
  };

  const updateUnit = async (id: string, data: Partial<Unit>) => {
    if (!firestore || !user?.uid) return;
    const docRef = doc(firestore, 'users', user.uid, 'units', id);
    return updateDocumentNonBlocking(docRef, data);
  };

  const deleteUnit = async (id: string) => {
    if (!firestore || !user?.uid) return;
    const docRef = doc(firestore, 'users', user.uid, 'units', id);
    return deleteDocumentNonBlocking(docRef);
  };

  return { 
    units: units || [], 
    loading: isLoading, 
    addUnit, 
    updateUnit, 
    deleteUnit 
  };
}
