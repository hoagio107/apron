
'use client';

import { collection, doc, query } from 'firebase/firestore';
import { 
  useCollection, 
  useFirestore, 
  useUser, 
  useMemoFirebase,
  setDocumentNonBlocking
} from '@/firebase';
import { MealPlan, MealPlanEntry, MealType } from '@/lib/recipe-types';

/**
 * Loại bỏ các trường undefined để tránh lỗi Firestore
 */
function sanitizeData(data: any) {
  const sanitized = { ...data };
  Object.keys(sanitized).forEach(key => {
    if (sanitized[key] === undefined) {
      delete sanitized[key];
    }
  });
  return sanitized;
}

export function useMealPlan() {
  const firestore = useFirestore();
  const { user } = useUser();

  const mealPlansQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(
      collection(firestore, 'users', user.uid, 'meal_plans')
    );
  }, [firestore, user?.uid]);

  const { data: plans, isLoading } = useCollection<MealPlan>(mealPlansQuery);

  const addMealToPlan = async (date: string, recipeId: string, mealType: MealType) => {
    if (!firestore || !user?.uid) return;
    
    // Tìm kế hoạch hiện có cho ngày này
    const existingPlan = plans?.find(p => p.date === date);
    const newMeal: MealPlanEntry = {
      id: Math.random().toString(36).substr(2, 9),
      recipe_id: recipeId,
      meal_type: mealType
    };

    // Sử dụng ngày làm ID tài liệu để dễ dàng quản lý và tránh trùng lặp
    const docId = existingPlan?.id || date;
    const docRef = doc(firestore, 'users', user.uid, 'meal_plans', docId);
    
    const updatedMeals = existingPlan ? [...existingPlan.meals, newMeal] : [newMeal];
    
    const data = sanitizeData({
      id: docId,
      date,
      meals: updatedMeals
    });
    
    return setDocumentNonBlocking(docRef, data, { merge: true });
  };

  const removeMealFromPlan = async (date: string, mealId: string) => {
    if (!firestore || !user?.uid) return;
    
    const existingPlan = plans?.find(p => p.date === date);
    if (!existingPlan) return;

    const docRef = doc(firestore, 'users', user.uid, 'meal_plans', existingPlan.id);
    const updatedMeals = existingPlan.meals.filter(m => m.id !== mealId);
    
    return setDocumentNonBlocking(docRef, {
      meals: updatedMeals
    }, { merge: true });
  };

  return { 
    plans: plans || [], 
    loading: isLoading, 
    addMealToPlan, 
    removeMealFromPlan 
  };
}
