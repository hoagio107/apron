import { RecipeForm } from '../../components/recipes/form';
import type { Recipe } from '@apron/core';
import { RecipeRepository } from '@apron/core';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { useRecipeStore } from '../../store/useRecipeStore';
import { useEffect, useState } from 'react';
import { Spinner } from '@/ui';

export function NewRecipePage() {
  const navigate = useNavigate();
  const { id: paramId } = useParams();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit') || paramId;
  const { addRecipe, addBulkRecipes, updateRecipe, recipes, fetchRecipes } = useRecipeStore();
  
  const [editRecipe, setEditRecipe] = useState<Recipe | undefined>();
  const [isLoading, setIsLoading] = useState(Boolean(editId));

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  useEffect(() => {
    if (editId) {
      const existing = recipes.find(r => r.id === editId);
      if (existing) {
        setEditRecipe(existing);
        setIsLoading(false);
      } else {
        setIsLoading(true);
        RecipeRepository.getById(editId).then(r => {
          if (r) {
            setEditRecipe(r);
          }
          setIsLoading(false);
        }).catch(() => {
          setIsLoading(false);
        });
      }
    } else {
      setIsLoading(false);
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

  if (editId && isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] h-full w-full gap-3">
        <Spinner size="lg" color="primary" />
        <span className="text-xs text-default-400 font-medium">Đang tải dữ liệu công thức...</span>
      </div>
    );
  }

  return (
    <div className="min-h-full flex flex-col pt-6 pb-14">
      <RecipeForm initialData={editRecipe} onSubmit={handleSubmit} />
    </div>
  );
}
