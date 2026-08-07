import { RecipeForm } from '../../components/recipes/form';
import type { Recipe } from '@apron/core';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useRecipeStore } from '../../store/useRecipeStore';
import { useEffect, useState } from 'react';

export function NewRecipePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const { addRecipe, addBulkRecipes, updateRecipe, recipes } = useRecipeStore();
  
  const [editRecipe, setEditRecipe] = useState<Recipe | undefined>();

  useEffect(() => {
    if (editId) {
      const existing = recipes.find(r => r.id === editId);
      if (existing) {
        setEditRecipe(existing);
      }
    }
  }, [editId, recipes]);

  const handleSubmit = async (data: any) => {
    if (Array.isArray(data)) {
      await addBulkRecipes(data);
    } else {
      if (editId && editRecipe) {
        await updateRecipe({ ...editRecipe, ...data, id: editId });
      } else {
        await addRecipe(data);
      }
    }

    navigate('/recipes');
  };

  // Nếu đang edit mà chưa load xong recipe (ví dụ reload trang), có thể render loading
  if (editId && !editRecipe && recipes.length > 0) {
    return null; // Hoặc loading spinner
  }

  return (
    <div className="h-full">
      <RecipeForm initialData={editRecipe} onSubmit={handleSubmit} />
    </div>
  );
}
