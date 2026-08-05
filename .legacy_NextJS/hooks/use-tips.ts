
'use client';

import { useMemo } from 'react';
import { collection, doc, query, orderBy, limit, where } from 'firebase/firestore';
import { 
  useCollection, 
  useFirestore, 
  useUser, 
  useMemoFirebase,
  addDocumentNonBlocking,
  updateDocumentNonBlocking,
  deleteDocumentNonBlocking
} from '@/firebase';
import { Tip } from '@/lib/recipe-types';

export function useTips(categoryId?: string) {
  const firestore = useFirestore();
  const { user } = useUser();

  const tipsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    
    const tipsRef = collection(firestore, 'users', user.uid, 'tips');
    
    // Xây dựng query: Luôn ưu tiên WHERE trước ORDER BY
    if (categoryId) {
      return query(
        tipsRef, 
        where('category_id', '==', categoryId),
        orderBy('createdAt', 'desc')
      );
    }

    return query(
      tipsRef,
      orderBy('createdAt', 'desc')
    );
  }, [firestore, user?.uid, categoryId]);

  const { data: tips, isLoading } = useCollection<Tip>(tipsQuery);

  const addTip = async (tip: Omit<Tip, 'id' | 'userId' | 'createdAt'>) => {
    if (!firestore || !user?.uid) return;
    const colRef = collection(firestore, 'users', user.uid, 'tips');
    const data = {
      ...tip,
      userId: user.uid,
      createdAt: new Date().toISOString(),
    };
    return addDocumentNonBlocking(colRef, data);
  };

  const updateTip = async (id: string, data: Partial<Tip>) => {
    if (!firestore || !user?.uid) return;
    const docRef = doc(firestore, 'users', user.uid, 'tips', id);
    return updateDocumentNonBlocking(docRef, data);
  };

  const deleteTips = async (ids: string[]) => {
    if (!firestore || !user?.uid) return;
    const promises = ids.map(id => {
      const docRef = doc(firestore, 'users', user.uid, 'tips', id);
      return deleteDocumentNonBlocking(docRef);
    });
    return Promise.all(promises);
  };

  return { 
    tips: tips || [], 
    loading: isLoading, 
    addTip, 
    updateTip, 
    deleteTips 
  };
}
