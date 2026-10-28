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
  const { addRecipe, addBulkRecipes, updateRecipe, recipes, fetchRecipes, fetchRecipeDetail } = useRecipeStore();
  
  const [editRecipe, setEditRecipe] = useState<Recipe | undefined>();

  useEffect(() => {
    // Luôn fetch recipes để drawer có data
    fetchRecipes();
  }, [fetchRecipes]);

  useEffect(() => {
    if (editId) {
      fetchRecipeDetail(editId).then((r) => {
        if (r) {
          setEditRecipe(r);
        } else {
          const existing = recipes.find(item => item.id === editId);
          if (existing) setEditRecipe(existing);
        }
      });
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
          steps: [],
          slug: '',
          prep_time: 0,
          cook_time: 0,
          difficulty: 'Dễ',
          calories: 0,
          taste_score: 0,
          author_id: 'local',
        });
      }
    }
  }, [editId, searchParams, recipes, fetchRecipeDetail]);

  const handleSubmit = async (data: Recipe | Recipe[]) => {
    if (Array.isArray(data)) {
      await addBulkRecipes(data);
      navigate('/recipes', { replace: true });
    } else {
      let targetId = editId;
      if (editId && editRecipe) {
        await updateRecipe({ ...editRecipe, ...data, id: editId });
      } else {
        const created = await addRecipe(data);
        targetId = created?.id || data.id;
      }

      if (targetId) {
        navigate(`/recipes/${targetId}`, { replace: true, state: { from: '/recipes' } });
      } else {
        navigate('/recipes', { replace: true });
      }
    }
  };

  if (editId && !editRecipe && recipes.length > 0) {
    return null;
  }

  return (
    <div className="h-full pb-20 bg-background text-foreground">
      <RecipeForm initialData={editRecipe} onSubmit={handleSubmit} />
    </div>
  );
}
