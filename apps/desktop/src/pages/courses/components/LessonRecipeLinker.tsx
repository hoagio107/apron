import { useState, useMemo } from 'react';
import { Autocomplete, AutocompleteItem, Button } from '@/ui';
import { Search, Plus, Utensils, Clock, BarChart, Flame, X, ChefHat } from 'lucide-react';
import type { Recipe } from '@apron/core';
import { ImageManager } from '../../../lib/image-manager';

export interface LessonRecipeLinkerProps {
  recipes: Recipe[];
  attachedRecipeIds?: string[];
  onChange: (nextIds: string[]) => void;
  onCreateNewRecipe?: () => void;
  onRecipeClick?: (recipeId: string) => void;
}

export function LessonRecipeLinker({
  recipes,
  attachedRecipeIds = [],
  onChange,
  onCreateNewRecipe,
  onRecipeClick,
}: LessonRecipeLinkerProps) {
  const [recipeSearch, setRecipeSearch] = useState('');

  const availableRecipes = useMemo(() => {
    const q = recipeSearch.trim().toLowerCase();
    return recipes.filter((r) => {
      if (attachedRecipeIds.includes(r.id)) return false;
      if (!q) return true;
      return r.title.toLowerCase().includes(q);
    });
  }, [recipes, attachedRecipeIds, recipeSearch]);

  const getTotalMinutes = (recipe: Recipe): number => {
    if (recipe.total_time_minutes) return recipe.total_time_minutes;
    return (recipe.prep_time || 0) + (recipe.cook_time || 0);
  };

  return (
    <div className="flex flex-col gap-3">
      <Autocomplete
        aria-label="Liên kết công thức thực hành"
        placeholder="Tìm & gắn công thức thực hành..."
        variant="flat"
        size="sm"
        isVirtualized={false}
        selectedKey={null}
        inputValue={recipeSearch}
        onInputChange={setRecipeSearch}
        onSelectionChange={(key) => {
          setRecipeSearch('');
          if (!key) return;
          const id = key.toString();
          if (id === 'NEW_RECIPE') {
            onCreateNewRecipe?.();
          } else if (!attachedRecipeIds.includes(id)) {
            onChange([...attachedRecipeIds, id]);
          }
        }}
        startContent={<Search className="w-4 h-4 text-default-400 shrink-0" />}
        classNames={{
          base: 'w-full',
          listboxWrapper: 'max-h-[320px] overflow-y-auto custom-scrollbar',
        }}
        inputProps={{
          classNames: {
            inputWrapper: 'bg-default-100 hover:bg-default-200/80 rounded-xl h-10 shadow-none',
            input: 'text-sm',
          },
        }}
        popoverProps={{
          classNames: {
            content: 'p-1.5 border border-divider/60 bg-content1 shadow-xl rounded-2xl',
          },
        }}
        listboxProps={{
          emptyContent: 'Không tìm thấy công thức phù hợp',
          itemClasses: {
            base: 'rounded-xl px-2.5 py-2 data-[hover=true]:bg-default-100/80 transition-colors',
          },
        }}
      >
        {[
          ...(onCreateNewRecipe
            ? [
                <AutocompleteItem
                  key="NEW_RECIPE"
                  textValue="Tạo công thức mới"
                  className="text-primary bg-primary/5 data-[hover=true]:bg-primary/15 mb-1"
                >
                  <div className="flex items-center gap-2.5 py-0.5 text-primary font-semibold text-sm">
                    <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                      <Plus className="w-4 h-4" />
                    </div>
                    <span>Tạo công thức mới</span>
                  </div>
                </AutocompleteItem>,
              ]
            : []),
          ...availableRecipes.map((recipe) => {
            const totalMins = getTotalMinutes(recipe);
            const thumb = recipe.thumbnail_url || recipe.image_url;
            return (
              <AutocompleteItem key={recipe.id} textValue={recipe.title}>
                <div className="flex items-center gap-3 py-0.5 w-full">
                  <div className="w-11 h-11 shrink-0 rounded-lg bg-default-100 overflow-hidden border border-divider/40">
                    {thumb ? (
                      <img
                        src={ImageManager.getAssetUrl(thumb)}
                        alt={recipe.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Utensils className="w-4 h-4 text-default-300" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col flex-1 min-w-0 pr-1 text-left justify-center gap-1">
                    <span className="text-sm font-semibold text-foreground line-clamp-1 leading-snug">
                      {recipe.title}
                    </span>
                    <div className="flex items-center flex-wrap gap-2.5 text-[11px] text-default-500 font-medium">
                      {totalMins > 0 ? (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-warning shrink-0" />
                          {totalMins}p
                        </span>
                      ) : null}
                      {recipe.difficulty ? (
                        <span className="flex items-center gap-1">
                          <BarChart className="w-3 h-3 text-primary shrink-0" />
                          {recipe.difficulty}
                        </span>
                      ) : null}
                      {recipe.calories ? (
                        <span className="flex items-center gap-1">
                          <Flame className="w-3 h-3 text-danger shrink-0" />
                          {recipe.calories} kcal
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              </AutocompleteItem>
            );
          }),
        ]}
      </Autocomplete>

      {attachedRecipeIds.length > 0 && (
        <div className="flex flex-col gap-2">
          {attachedRecipeIds.map((rId) => {
            const recipe = recipes.find((r) => r.id === rId);
            if (!recipe) return null;
            const totalMins = getTotalMinutes(recipe);
            const thumb = recipe.thumbnail_url || recipe.image_url;

            return (
              <div
                key={rId}
                onClick={() => onRecipeClick?.(recipe.id)}
                className={`group flex items-center justify-between gap-2.5 p-2 rounded-xl bg-default-100/70 dark:bg-default-50/15 border border-divider/40 transition-all ${
                  onRecipeClick ? 'cursor-pointer hover:border-primary/40 hover:bg-default-100' : ''
                }`}
              >
                <div className="flex items-center gap-3 overflow-hidden flex-1 min-w-0">
                  <div className="w-12 h-12 shrink-0 rounded-lg bg-default-100 overflow-hidden border border-divider/30">
                    {thumb ? (
                      <img
                        src={ImageManager.getAssetUrl(thumb)}
                        alt={recipe.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ChefHat className="w-5 h-5 text-default-300" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col flex-1 min-w-0 pr-1 text-left justify-center gap-1">
                    <span className="font-semibold text-sm text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                      {recipe.title}
                    </span>
                    <div className="flex items-center flex-wrap gap-2 text-[11px] text-default-500 font-medium">
                      {totalMins > 0 ? (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-warning shrink-0" />
                          {totalMins}p
                        </span>
                      ) : null}
                      {recipe.difficulty ? (
                        <span className="flex items-center gap-1">
                          <BarChart className="w-3 h-3 text-primary shrink-0" />
                          {recipe.difficulty}
                        </span>
                      ) : null}
                      {recipe.calories ? (
                        <span className="flex items-center gap-1">
                          <Flame className="w-3 h-3 text-danger shrink-0" />
                          {recipe.calories} kcal
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  color="danger"
                  className="w-7 h-7 min-w-7 rounded-lg opacity-70 group-hover:opacity-100 shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange(attachedRecipeIds.filter((id) => id !== rId));
                  }}
                  aria-label="Gỡ công thức liên kết"
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

