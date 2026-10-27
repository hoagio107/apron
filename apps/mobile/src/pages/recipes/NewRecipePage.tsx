import { RecipeForm } from '../../components/recipes/form';
import type { Recipe } from '@apron/core';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { useRecipeStore } from '../../store/useRecipeStore';
import { useEffect, useState } from 'react';

export function NewRecipePage() {
  const navigate = useNavigate();
  const { id: paramId } = useParams();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit') || paramId;
  const { addRecipe, addBulkRecipes, updateRecipe, recipes, fetchRecipes } = useRecipeStore();
  
  const [editRecipe, setEditRecipe] = useState<Recipe | undefined>();

  useEffect(() => {
    // Luôn fetch recipes để drawer có data
    fetchRecipes();
  }, [fetchRecipes]);

  useEffect(() => {
    if (editId) {
      const existing = recipes.find(r => r.id === editId);
      if (existing) {
        setEditRecipe(existing);
      }
    } else {
      const titleParam = searchParams.get('title');
      const imageParam = searchParams.get('image');
      if (titleParam || imageParam) {
        setEditRecipe({
          id: '',
          title: titleParam || '',
          image_url: imageParam || '',
          servings: 2,
          ingredients: [],
          instructions: []
        } as any);
      }
    }
  }, [editId, searchParams, recipes]);

  const handleSubmit = async (data: any) => {
    if (Array.isArray(data)) {
      await addBulkRecipes(data);
      navigate('/recipes');
    } else {
      let targetId = editId;
      if (editId && editRecipe) {
        await updateRecipe({ ...editRecipe, ...data, id: editId });
      } else {
        const created = await addRecipe(data);
        targetId = created?.id || data.id;
      }

      if (targetId) {
        navigate(`/recipes/${targetId}`);
      } else {
        navigate('/recipes');
      }
    }
  };

  // Nếu đang edit mà chưa load xong recipe (ví dụ reload trang), có thể render loading
  if (editId && !editRecipe && recipes.length > 0) {
    return null; // Hoặc loading spinner
  }

  return (
    <div className="h-full pb-20 bg-background text-foreground">
      <RecipeForm initialData={editRecipe} onSubmit={handleSubmit} />
    </div>
  );
}
