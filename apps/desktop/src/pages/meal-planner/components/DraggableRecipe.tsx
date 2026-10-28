import { useDraggable } from '@dnd-kit/core';
import { ChefHat, Clock, Flame, Star } from 'lucide-react';
import type { Recipe } from '@apron/core';
import { useTranslation } from 'react-i18next';
import { ImageManager } from '../../../lib/image-manager';

export interface DraggableRecipeProps {
  recipe: Recipe;
  variantCount?: number;
  actionNode?: React.ReactNode;
  viewMode?: 'list' | 'card';
}

export function DraggableRecipe({ recipe, actionNode, viewMode = 'list' }: DraggableRecipeProps) {
  const { t } = useTranslation();
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `recipe-${recipe.id}`,
    data: {
      type: 'recipe',
      recipe,
    },
  });

  const totalTime = recipe.prep_time + recipe.cook_time;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`relative rounded-xl border cursor-grab hover:shadow-md transition-all group ${
        viewMode === 'card' ? 'flex flex-col items-stretch p-2 gap-2' : 'flex items-center gap-2.5 p-2'
      } ${
        isDragging ? 'opacity-50 border-primary bg-primary/10 dark:bg-primary/20 z-50' : 'border-default-200 bg-content1'
      }`}
    >
      <div className={`relative ${viewMode === 'card' ? 'w-full aspect-[4/3] rounded-lg' : 'w-12 h-12 rounded-lg'} bg-default-100 flex-shrink-0 overflow-hidden flex items-center justify-center self-center`}>
        {recipe.image_url ? (
          <img src={ImageManager.getAssetUrl(recipe.image_url)} alt={recipe.title} className="w-full h-full object-cover" />
        ) : (
          <ChefHat className={`${viewMode === 'card' ? 'w-8 h-8' : 'w-5 h-5'} text-default-400`} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold leading-tight truncate mb-1 ${viewMode === 'card' ? 'text-center' : ''}`}>{recipe.title}</p>
        
        {viewMode === 'list' && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[10px] text-default-500">
            <div className="flex items-center gap-1" title={t('recipes.card.prepTime', { defaultValue: 'Time' })}>
              <Clock className="w-3 h-3 text-blue-500" />
              <span>{totalTime}m</span>
            </div>
            {recipe.taste_score && (
              <div className="flex items-center gap-1" title={t('recipes.cooking.rating', { defaultValue: 'Rating' })}>
                <Star className="w-3 h-3 text-yellow-500" />
                <span>{recipe.taste_score}</span>
              </div>
            )}
            <div className="flex items-center gap-1" title={t('recipes.filter.difficulty')}>
              <ChefHat className="w-3 h-3 text-green-500" />
              <span>{recipe.difficulty}</span>
            </div>
            {recipe.calories && (
              <div className="flex items-center gap-1" title={t('recipes.card.calories')}>
                <Flame className="w-3 h-3 text-orange-500" />
                <span>{recipe.calories} kcal</span>
              </div>
            )}
          </div>
        )}

        {viewMode === 'card' && (
          <div className="flex items-center justify-center gap-3 mt-1 text-[10px] text-default-500">
            <div className="flex items-center gap-1" title={t('recipes.card.prepTime', { defaultValue: 'Time' })}>
              <Clock className="w-2.5 h-2.5 text-blue-500" />
              <span>{totalTime}m</span>
            </div>
            <div className="flex items-center gap-1" title={t('recipes.filter.difficulty')}>
              <ChefHat className="w-2.5 h-2.5 text-green-500" />
              <span>{recipe.difficulty.charAt(0).toUpperCase()}</span>
            </div>
          </div>
        )}
      </div>
      {actionNode && (
        <div className={`shrink-0 flex items-center justify-center ${viewMode === 'card' ? 'absolute top-1 right-1' : '-mr-1'}`} onPointerDown={(e) => e.stopPropagation()}>
          {actionNode}
        </div>
      )}
    </div>
  );
}
