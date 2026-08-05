
'use client';

import { useMemo } from 'react';
import { doc } from 'firebase/firestore';
import { 
  useDoc, 
  useFirestore, 
  useUser, 
  useMemoFirebase,
  setDocumentNonBlocking
} from '@/firebase';
import { ShoppingList, ExtraItem } from '@/lib/recipe-types';

export function useShoppingList() {
  const firestore = useFirestore();
  const { user } = useUser();

  const listRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid, 'settings', 'shopping_list');
  }, [firestore, user?.uid]);

  const { data: list, isLoading } = useDoc<ShoppingList>(listRef);

  const currentList: ShoppingList = useMemo(() => {
    // Đảm bảo đối tượng luôn có đầy đủ các mảng mặc định để tránh lỗi 'undefined'
    return {
      recipe_ids: [],
      extra_items: [],
      checked_ingredients: [],
      ...(list || {})
    };
  }, [list]);

  const updateList = async (updates: Partial<ShoppingList>) => {
    if (!listRef) return;
    // Sử dụng setDocumentNonBlocking với merge: true để tự động tạo tài liệu nếu chưa có
    return setDocumentNonBlocking(listRef, updates, { merge: true });
  };

  const addRecipeToList = async (recipeId: string) => {
    const nextIds = new Set(currentList.recipe_ids || []);
    if (nextIds.has(recipeId)) return;
    nextIds.add(recipeId);
    return updateList({ recipe_ids: Array.from(nextIds) });
  };

  const removeRecipeFromList = async (recipeId: string) => {
    const nextIds = (currentList.recipe_ids || []).filter(id => id !== recipeId);
    return updateList({ recipe_ids: nextIds });
  };

  const toggleRecipeInList = async (recipeId: string) => {
    const nextIds = new Set(currentList.recipe_ids || []);
    if (nextIds.has(recipeId)) nextIds.delete(recipeId);
    else nextIds.add(recipeId);
    return updateList({ recipe_ids: Array.from(nextIds) });
  };

  const addExtraItem = async (name: string) => {
    const newItem: ExtraItem = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      is_checked: false
    };
    return updateList({ extra_items: [...(currentList.extra_items || []), newItem] });
  };

  const toggleExtraItem = async (itemId: string) => {
    const nextExtras = (currentList.extra_items || []).map(item => 
      item.id === itemId ? { ...item, is_checked: !item.is_checked } : item
    );
    return updateList({ extra_items: nextExtras });
  };

  const removeExtraItem = async (itemId: string) => {
    const nextExtras = (currentList.extra_items || []).filter(item => item.id !== itemId);
    return updateList({ extra_items: nextExtras });
  };

  const toggleIngredientChecked = async (ingName: string) => {
    const nextChecked = new Set(currentList.checked_ingredients || []);
    if (nextChecked.has(ingName)) nextChecked.delete(ingName);
    else nextChecked.add(ingName);
    return updateList({ checked_ingredients: Array.from(nextChecked) });
  };

  const clearList = async () => {
    return updateList({ recipe_ids: [], extra_items: [], checked_ingredients: [] });
  };

  return {
    list: currentList,
    loading: isLoading,
    addRecipeToList,
    removeRecipeFromList,
    toggleRecipeInList,
    addExtraItem,
    toggleExtraItem,
    removeExtraItem,
    toggleIngredientChecked,
    clearList
  };
}
