
'use client';

import { useMemo } from 'react';
import { collection, doc, query, orderBy, limit } from 'firebase/firestore';
import { 
  useCollection, 
  useFirestore, 
  useUser, 
  useMemoFirebase,
  addDocumentNonBlocking,
  updateDocumentNonBlocking,
  deleteDocumentNonBlocking
} from '@/firebase';
import { Recipe } from '@/lib/recipe-types';

/**
 * Loại bỏ tất cả các trường có giá trị undefined trong object để tránh lỗi Firestore.
 */
function sanitizeData(data: any) {
  const sanitized = { ...data };
  Object.keys(sanitized).forEach(key => {
    if (sanitized[key] === undefined) {
      delete sanitized[key];
    } else if (sanitized[key] && typeof sanitized[key] === 'object' && !Array.isArray(sanitized[key])) {
      sanitized[key] = sanitizeData(sanitized[key]);
    }
  });
  return sanitized;
}

export function useRecipes() {
  const firestore = useFirestore();
  const { user } = useUser();

  // Tối ưu hóa SWR: Sử dụng real-time listener kết hợp với giới hạn đọc lớn (10,000)
  const recipesQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(
      collection(firestore, 'users', user.uid, 'recipes'),
      orderBy('createdAt', 'desc'),
      limit(10000) 
    );
  }, [firestore, user?.uid]);

  const { data: recipes, isLoading } = useCollection<Recipe>(recipesQuery);

  const addRecipe = async (recipe: Omit<Recipe, 'id'>) => {
    if (!firestore || !user?.uid) return;
    const colRef = collection(firestore, 'users', user.uid, 'recipes');
    
    const data = sanitizeData({
      ...recipe,
      userId: user.uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Trả về promise để component có thể await (Pessimistic UI)
    return addDocumentNonBlocking(colRef, data);
  };

  const updateRecipe = async (id: string, data: Partial<Recipe>) => {
    if (!firestore || !user?.uid) return;
    const docRef = doc(firestore, 'users', user.uid, 'recipes', id);
    
    const sanitizedData = sanitizeData({
      ...data,
      updatedAt: new Date().toISOString(),
    });

    return updateDocumentNonBlocking(docRef, sanitizedData);
  };

  const deleteRecipe = async (id: string) => {
    if (!firestore || !user?.uid) return;
    const docRef = doc(firestore, 'users', user.uid, 'recipes', id);
    return deleteDocumentNonBlocking(docRef);
  };

  const deleteRecipes = async (ids: string[]) => {
    if (!firestore || !user?.uid) return;
    const promises = ids.map(id => {
      const docRef = doc(firestore, 'users', user.uid, 'recipes', id);
      return deleteDocumentNonBlocking(docRef);
    });
    return Promise.all(promises);
  };

  const toggleFavorite = async (id: string, currentState: boolean) => {
    if (!firestore || !user?.uid) return;
    const docRef = doc(firestore, 'users', user.uid, 'recipes', id);
    return updateDocumentNonBlocking(docRef, {
      is_favorite: !currentState,
      updatedAt: new Date().toISOString(),
    });
  };

  return { 
    recipes: recipes || [], 
    loading: isLoading, 
    addRecipe, 
    updateRecipe, 
    deleteRecipe,
    deleteRecipes,
    toggleFavorite
  };
}
