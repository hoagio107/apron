import type { Recipe } from '@apron/core';
import { Clock, Star, Flame, Target } from 'lucide-react';
import { Checkbox } from '@apron/ui';
import { ImageManager } from '../../../lib/image-manager';

export type RecipeViewType = 'grid-portrait' | 'grid-square' | 'list';

interface RecipeCardProps {
  recipe: Recipe;
  viewType: RecipeViewType;
  selectable?: boolean;
  isSelected?: boolean;
  onSelectChange?: (selected: boolean) => void;
  onClick?: () => void;
}

export function RecipeCard({ 
  recipe, 
  viewType, 
  selectable = false, 
  isSelected = false,
  onSelectChange,
  onClick
}: RecipeCardProps) {
  
  const handleSelectClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectChange?.(!isSelected);
  };

  const totalTime = recipe.prep_time + recipe.cook_time;
  
  // Format thời gian nấu (vd: 1h30m hoặc 45m)
  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h${m}m` : `${h}h`;
  };

  // Tính điểm đánh giá trung bình
  const getAverageRating = () => {
    if (!recipe.cooking_history || recipe.cooking_history.length === 0) return 0;
    const sum = recipe.cooking_history.reduce((acc: number, curr: any) => acc + curr.rating, 0);
    return Number((sum / recipe.cooking_history.length).toFixed(1));
  };
  
  const averageRating = getAverageRating();

  if (viewType === 'list') {
    return (
      <div 
        onClick={onClick}
        className="group flex gap-4 p-3 rounded-xl hover:bg-default-100 transition-colors cursor-pointer border border-transparent hover:border-default-200 relative"
      >
        {selectable && (
          <div className="absolute top-4 left-4 z-10" onClick={handleSelectClick}>
            <Checkbox isSelected={isSelected} onValueChange={(val) => onSelectChange?.(val)} />
          </div>
        )}
        <div className="relative w-28 h-28 shrink-0 rounded-lg overflow-hidden bg-default-100">
          <img 
            src={ImageManager.getAssetUrl(recipe.image_url || '')} 
            alt={recipe.title} 
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />
        </div>
        <div className="flex flex-col justify-center py-1">
          <h3 className="font-semibold text-base line-clamp-2 mb-2 group-hover:text-primary transition-colors">{recipe.title}</h3>
          
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-default-500">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatTime(totalTime)}</span>
            </div>
            
            <div className="flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5" />
              <span>{recipe.difficulty}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-warning" fill="currentColor" />
              <span>{averageRating > 0 ? averageRating : '0'}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-danger" />
              <span>{recipe.calories} kcal</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Grid views
  const isPortrait = viewType === 'grid-portrait';
  
  return (
    <div 
      onClick={onClick}
      className="group flex flex-col gap-3 cursor-pointer relative"
    >
      <div className={`relative w-full rounded-xl overflow-hidden bg-default-100 ${isPortrait ? 'aspect-[3/4]' : 'aspect-square'}`}>
        {selectable && (
          <div className="absolute top-3 left-3 z-10" onClick={handleSelectClick}>
            <Checkbox isSelected={isSelected} onValueChange={(val) => onSelectChange?.(val)} />
          </div>
        )}
        <img 
          src={ImageManager.getAssetUrl(recipe.image_url || '')} 
          alt={recipe.title} 
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {/* Lớp overlay mỏng khi hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors pointer-events-none" />
      </div>

      <div className="flex flex-col gap-1.5">
        <h3 className="font-semibold text-base line-clamp-2 leading-tight group-hover:text-primary transition-colors">
          {recipe.title}
        </h3>
        
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-default-500 mt-0.5">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{formatTime(totalTime)}</span>
          </div>
          
          {!isPortrait && (
            <div className="flex items-center gap-1">
              <Target className="w-3 h-3" />
              <span>{recipe.difficulty}</span>
            </div>
          )}

          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 text-warning" fill="currentColor" />
            <span>{averageRating > 0 ? averageRating : '0'}</span>
          </div>

          <div className="flex items-center gap-1">
            <Flame className="w-3 h-3 text-danger" />
            <span>{recipe.calories} kcal</span>
          </div>
        </div>
      </div>
    </div>
  );
}
