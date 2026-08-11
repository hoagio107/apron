import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { Recipe } from '@apron/core';
import { DraggableRecipe } from './DraggableRecipe';

export function RecipeGroup({ recipe, variants, viewMode }: { recipe: Recipe; variants: Recipe[]; viewMode: 'list' | 'card' }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <DraggableRecipe 
        recipe={recipe} 
        variantCount={0} // Managed by actionNode now
        viewMode={viewMode}
        actionNode={
          variants.length > 0 ? (
            <div className="flex flex-col items-end justify-between self-stretch py-0.5">
              <span className="text-default-400 text-[10px] font-medium whitespace-nowrap mr-[2px]" title={`+${variants.length} biến thể`}>+{variants.length}</span>
              <button 
                onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                className="p-1 rounded-md hover:bg-transparent transition-colors text-default-400 hover:text-foreground mt-auto -mr-1"
                title={isExpanded ? "Thu gọn biến thể" : "Xem biến thể"}
              >
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          ) : null
        }
      />
      {isExpanded && variants.length > 0 && (
        <div className={`flex flex-col gap-2 border-l-2 border-default-200 ml-4 pl-4 py-1`}>
          {variants.map(child => (
            <DraggableRecipe key={child.id!} recipe={child} viewMode={viewMode} />
          ))}
        </div>
      )}
    </div>
  );
}
