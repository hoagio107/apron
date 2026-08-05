
"use client";

import React, { memo } from 'react';
import Link from 'next/link';
import { Recipe } from '@/lib/recipe-types';
import { Card } from '@/components/ui/card';
import { Clock, Star, Flame, ChefHat, Heart, Check, ShoppingCart } from 'lucide-react';
import { useRecipes } from '@/hooks/use-recipes';
import { useShoppingList } from '@/hooks/use-shopping-list';
import { cn } from '@/lib/utils';

interface RecipeCardProps {
  recipe: Recipe;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelection?: (id: string) => void;
}

/**
 * Tối ưu hóa hiệu năng bằng React.memo. 
 * Thẻ món ăn chỉ render lại khi các props thực sự thay đổi.
 */
export const RecipeCard = memo(function RecipeCard({ recipe, isSelectionMode, isSelected, onToggleSelection }: RecipeCardProps) {
  const { toggleFavorite } = useRecipes();
  const { list, toggleRecipeInList } = useShoppingList();
  
  const totalTime = recipe.prep_time + recipe.cook_time;
  const isInShoppingList = list.recipe_ids.includes(recipe.id);
  
  const difficultyTextColor = {
    'Dễ': 'text-green-400',
    'Vừa': 'text-orange-400',
    'Khó': 'text-red-400'
  }[recipe.difficulty] || 'text-white';

  const handleToggleFav = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(recipe.id, !!recipe.is_favorite);
  };

  const handleToggleShopping = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleRecipeInList(recipe.id);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isSelectionMode && onToggleSelection) {
      e.preventDefault();
      e.stopPropagation();
      onToggleSelection(recipe.id);
    }
  };

  return (
    <div className="relative group h-full" onClick={handleClick}>
      <Link href={isSelectionMode ? "#" : `/recipes/${recipe.id}`} className="block h-full">
        <Card className={cn(
          "overflow-hidden transition-all duration-500 border bg-white dark:bg-gray-800 rounded-xl md:rounded-3xl h-full border-gray-100 dark:border-gray-700 shadow-none",
          "p-1.5 md:p-2.5",
          isSelectionMode && isSelected ? "border-orange-500 ring-4 ring-orange-500/10" : "hover:border-orange-200"
        )}>
          <div className="relative aspect-square overflow-hidden rounded-xl md:rounded-2xl bg-gray-50">
            <img 
              src={recipe.image_url || "https://picsum.photos/seed/recipe/600/400"} 
              alt={recipe.title}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            
            {isSelectionMode && (
              <div className={cn(
                "absolute inset-0 z-20 flex items-start justify-end p-2 transition-all duration-300",
                isSelected ? "bg-orange-500/10" : "bg-black/5"
              )}>
                <div className={cn(
                  "w-6 h-6 md:w-7 md:h-7 rounded-full border-2 flex items-center justify-center transition-all shadow-lg",
                  isSelected ? "bg-orange-500 border-orange-500 scale-110" : "bg-white/80 border-white"
                )}>
                  {isSelected && <Check className="text-white w-3 h-3 md:w-4 md:h-4 stroke-[4px]" />}
                </div>
              </div>
            )}

            {!isSelectionMode && (
              <>
                <div className="absolute top-2 left-2 md:top-3 md:left-3 z-10">
                  <button 
                    onClick={handleToggleShopping}
                    className={cn(
                      "p-2 md:p-2.5 rounded-full backdrop-blur-md transition-all border border-white/10",
                      isInShoppingList ? "bg-green-600 text-white" : "bg-black/20 text-white hover:bg-black/40"
                    )}
                  >
                    <ShoppingCart className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  </button>
                </div>

                <div className="absolute top-2 right-2 md:top-3 md:right-3 z-10">
                  <button 
                    onClick={handleToggleFav}
                    className={cn(
                      "p-2 md:p-2.5 rounded-full backdrop-blur-md transition-all border border-white/10",
                      recipe.is_favorite ? "bg-white text-red-500" : "bg-black/20 text-white hover:bg-black/40"
                    )}
                  >
                    <Heart className={cn("w-3.5 h-3.5 md:w-4 md:h-4", recipe.is_favorite && "fill-current")} />
                  </button>
                </div>
              </>
            )}

            {!isSelectionMode && (
              <>
                <div className={cn("absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg text-[10px] md:text-xs font-bold shadow-sm flex items-center border border-transparent", difficultyTextColor)}>
                  <ChefHat className="w-3 h-3 md:w-3.5 md:h-3.5 mr-1 md:mr-1.5" />
                  {recipe.difficulty}
                </div>

                <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg text-[10px] md:text-xs font-bold text-white shadow-sm flex items-center border border-transparent">
                  <Clock className="w-3 h-3 md:w-3.5 md:h-3.5 mr-1 md:mr-1.5" />
                  {totalTime}'
                </div>
              </>
            )}
          </div>

          <div className="pt-2 md:pt-4 px-1 pb-1 flex flex-col flex-grow">
            <h3 className="text-[11px] md:text-lg font-bold text-gray-800 dark:text-white line-clamp-2 min-h-[1.75rem] md:min-h-[3rem] leading-tight group-hover:text-orange-600 transition-colors font-body">
              {recipe.title}
            </h3>

            <div className="flex items-center justify-between text-[10px] md:text-[11px] font-bold text-gray-400 pt-2 md:pt-3 border-t border-gray-100 dark:border-gray-700 mt-2 md:mt-4 uppercase tracking-normal md:tracking-widest flex-nowrap gap-1">
              <div className="flex items-center shrink-0">
                <Flame className="w-3 h-3 md:w-3.5 md:h-3.5 mr-1 text-red-500" />
                <span>{recipe.calories} Kcal</span>
              </div>
              <div className="flex items-center font-bold text-yellow-600 bg-yellow-50 px-1.5 py-0.5 rounded-lg border border-yellow-100 shadow-none shrink-0">
                <Star className="w-2.5 h-2.5 md:w-3 md:h-3 mr-1 fill-current" />
                <span>{recipe.taste_score}</span>
              </div>
            </div>
          </div>
        </Card>
      </Link>
    </div>
  );
});
