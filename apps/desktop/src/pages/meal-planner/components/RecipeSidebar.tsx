import { useDraggable } from '@dnd-kit/core';
import { Search, ChefHat, Clock, Flame, BookOpen, Star, ChevronDown, ChevronUp } from 'lucide-react';
import type { Recipe } from '@apron/core';
import { useRecipeStore } from '../../../store/useRecipeStore';
import { useEffect, useState } from 'react';
import { ImageManager } from '../../../lib/image-manager';

interface DraggableRecipeProps {
  recipe: Recipe;
  variantCount?: number;
  actionNode?: React.ReactNode;
}

function DraggableRecipe({ recipe, variantCount = 0, actionNode }: DraggableRecipeProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `recipe-${recipe.id}`,
    data: {
      type: 'recipe',
      recipe,
    },
  });

  const totalTime = recipe.prep_time + recipe.cook_time;

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h${m}m` : `${h}h`;
  };

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`flex gap-2.5 p-2 rounded-xl border cursor-grab hover:shadow-md transition-all ${
        isDragging ? 'opacity-50 border-primary bg-primary-50 z-50' : 'border-default-200 bg-content1'
      }`}
    >
      <div className="w-12 h-12 rounded-lg bg-default-100 flex-shrink-0 overflow-hidden flex items-center justify-center self-center relative">
        {recipe.image_url ? (
          <img src={ImageManager.getAssetUrl(recipe.image_url)} alt={recipe.title} className="w-full h-full object-cover" />
        ) : (
          <ChefHat className="w-5 h-5 text-default-400" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-tight truncate mb-1">{recipe.title}</p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[10px] text-default-500">
          <div className="flex items-center gap-1" title="Thời gian">
            <Clock className="w-3 h-3 text-blue-500" />
            <span>{recipe.prep_time + recipe.cook_time}m</span>
          </div>
          {recipe.rating && (
            <div className="flex items-center gap-1" title="Đánh giá">
              <Star className="w-3 h-3 text-yellow-500" />
              <span>{recipe.rating}</span>
            </div>
          )}
          <div className="flex items-center gap-1" title="Độ khó">
            <ChefHat className="w-3 h-3 text-green-500" />
            <span>{recipe.difficulty}</span>
          </div>
          {recipe.calories && (
            <div className="flex items-center gap-1" title="Lượng Calories">
              <Flame className="w-3 h-3 text-orange-500" />
              <span>{recipe.calories} kcal</span>
            </div>
          )}
        </div>
      </div>
      {actionNode && (
        <div className="shrink-0 flex items-center justify-center -mr-1" onPointerDown={(e) => e.stopPropagation()}>
          {actionNode}
        </div>
      )}
    </div>
  );
}

function RecipeGroup({ recipe, variants }: { recipe: Recipe; variants: Recipe[] }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <DraggableRecipe 
        recipe={recipe} 
        variantCount={0} // Managed by actionNode now
        actionNode={
          variants.length > 0 ? (
            <div className="flex flex-col items-end justify-between self-stretch py-0.5">
              <span className="text-primary text-[10px] font-medium whitespace-nowrap mr-[2px]">+{variants.length} biến thể</span>
              <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1 rounded-md hover:bg-default-100 transition-colors text-default-500 mt-auto -mr-1"
                title={isExpanded ? "Thu gọn biến thể" : "Xem biến thể"}
              >
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          ) : null
        }
      />
      {isExpanded && variants.length > 0 && (
        <div className="pl-4 flex flex-col gap-2 border-l-2 border-default-100 ml-4 py-1">
          {variants.map(child => (
            <DraggableRecipe key={child.id!} recipe={child} />
          ))}
        </div>
      )}
    </div>
  );
}

export function RecipeSidebar() {
  const { recipes, fetchRecipes } = useRecipeStore();
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  const filteredRecipes = recipes.filter(r => 
    !r.parent_id && r.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-80 bg-transparent flex flex-col h-full shrink-0">
      <div className="p-4 bg-content1">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          Công thức của bạn
        </h2>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-default-400" />
          <input 
            type="text"
            placeholder="Tìm kiếm..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-default-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar bg-content1 rounded-b-2xl">
        {filteredRecipes.length === 0 ? (
          <div className="text-center text-default-500 mt-10">
            <p className="text-sm">Không tìm thấy công thức nào</p>
          </div>
        ) : (
          filteredRecipes.map((recipe) => {
            const variants = recipes.filter(child => child.parent_id === recipe.id);
            return (
              <RecipeGroup 
                key={recipe.id!} 
                recipe={recipe} 
                variants={variants}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
