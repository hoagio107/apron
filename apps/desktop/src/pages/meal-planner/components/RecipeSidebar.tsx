import { Search, BookOpen, LayoutList, LayoutGrid } from 'lucide-react';
import { useRecipeStore } from '../../../store/useRecipeStore';
import { useEffect, useState } from 'react';
import { Input } from '@/ui';
import { useTranslation } from 'react-i18next';

import { DraggableRecipe } from './DraggableRecipe';
import { RecipeGroup } from './RecipeGroup';

export function RecipeSidebar() {
  const { t } = useTranslation();
  const { recipes, fetchRecipes } = useRecipeStore();
  const [search, setSearch] = useState('');

  const [viewMode, setViewMode] = useState<'list' | 'card'>('list');

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  const filteredRecipes = recipes.filter(r => {
    const matchesSearch = r.title.toLowerCase().includes(search.toLowerCase());
    if (viewMode === 'card') return matchesSearch;
    return !r.parent_id && matchesSearch;
  });

  return (
    <div className="w-80 bg-transparent flex flex-col h-full shrink-0">
      <div className="p-4 bg-content1">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            {t('nav.recipes')}
          </h2>
          <div className="flex items-center bg-default-100 p-0.5 rounded-lg">
            <button 
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-content1 text-foreground' : 'text-default-400 hover:text-foreground'}`}
              title={t('planner.listLayout')}
            >
              <LayoutList className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('card')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'card' ? 'bg-content1 text-foreground' : 'text-default-400 hover:text-foreground'}`}
              title={t('planner.cardLayoutDesc')}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="relative">
          <Input 
            type="text"
            placeholder={t('recipes.searchPlaceholder')}
            variant="flat"
            value={search}
            onValueChange={setSearch}
            startContent={<Search className="w-4 h-4 text-default-400" />}
            className="w-full"
          />
        </div>
      </div>
      <div className={`flex-1 overflow-y-auto p-4 flex ${viewMode === 'card' ? 'flex-row flex-wrap items-start content-start' : 'flex-col'} gap-3 custom-scrollbar bg-content1 rounded-b-2xl`}>
        {filteredRecipes.length === 0 ? (
          <div className="text-center text-default-500 mt-10 w-full">
            <p className="text-sm">{t('recipes.empty.title')}</p>
          </div>
        ) : (
          filteredRecipes.map((recipe) => {
            if (viewMode === 'card') {
              return (
                <div key={recipe.id!} className="w-[calc(50%-6px)]">
                  <DraggableRecipe recipe={recipe} viewMode="card" />
                </div>
              );
            }

            const variants = recipes.filter(child => child.parent_id === recipe.id);
            return (
              <div key={recipe.id!} className="w-full">
                <RecipeGroup 
                  recipe={recipe} 
                  variants={variants}
                  viewMode={viewMode}
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
