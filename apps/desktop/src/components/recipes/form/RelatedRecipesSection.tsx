import { useState, useMemo } from 'react';
import { useFormContext } from 'react-hook-form';
import { useSearchParams } from 'react-router-dom';
import { Autocomplete, AutocompleteItem, Button, Avatar } from '@/ui';
import { Link, Star, Flame, ChefHat, X, Search, Check, ChevronDown, ChevronUp, Lightbulb } from 'lucide-react';
import { FormField } from '../../shared/form';
import type { FormValues } from './schema';
import { ImageManager } from '../../../lib/image-manager';

import { useRecipeStore } from '../../../store/useRecipeStore';
import { useTipStore } from '../../../store/useTipStore';

export function RelatedRecipesSection() {
  const { watch, setValue } = useFormContext<FormValues>();
  const { recipes } = useRecipeStore();
  const { tips } = useTipStore();
  const relatedRecipes = watch('related_recipes') || [];
  const linkedTips = watch('linked_tips') || [];

  const [searchValue, setSearchValue] = useState("");
  const [isListExpanded, setIsListExpanded] = useState(true);
  
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');

  const filteredItems = useMemo(() => {
    const matchedRecipes = recipes
      .filter(item => item.id !== editId && item.title.toLowerCase().includes(searchValue.toLowerCase()))
      .map(item => ({
        ...item,
        is_tip: false,
        isSelected: relatedRecipes.some(r => r.id === item.id)
      }));

    const matchedTips = tips
      .filter(item => item.title.toLowerCase().includes(searchValue.toLowerCase()))
      .map(item => ({
        id: item.id,
        title: item.title,
        image_url: item.image_url,
        is_tip: true,
        isSelected: linkedTips.some(tid => tid === item.id)
      }));

    return [...matchedRecipes, ...matchedTips];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipes, tips, searchValue, editId, relatedRecipes, linkedTips]);

  const handleSelect = (key: React.Key | null) => {
    if (!key) return;
    const keyStr = key.toString();
    const isTip = keyStr.startsWith('tip:');
    const id = keyStr.replace(/^(recipe:|tip:)/, '');
    
    if (isTip) {
      const item = tips.find(t => t.id === id);
      if (!item) return;
      if (!linkedTips.some(tid => tid === item.id)) {
        setValue('linked_tips', [...linkedTips, item.id]);
      }
    } else {
      const item = recipes.find(r => r.id === id);
      if (!item) return;
      if (!relatedRecipes.some(r => r.id === item.id)) {
        setValue('related_recipes', [...relatedRecipes, {
          id: item.id,
          title: item.title,
          slug: item.slug,
          image_url: item.image_url
        }]);
      }
    }
    
    // Reset search
    setTimeout(() => {
      setSearchValue("");
    }, 0);
  };

  const handleRemove = (id: string) => {
    setValue('related_recipes', relatedRecipes.filter(r => r.id !== id));
  };

  return (
    <FormField label="Công thức và mẹo liên kết" icon={Link}>
      <div className="flex flex-col gap-4">
        <Autocomplete
          aria-label="Tìm kiếm công thức liên kết"
          inputValue={searchValue}
          onInputChange={setSearchValue}
          selectedKey={null}
          placeholder="Tìm kiếm công thức hoặc mẹo..."
          startContent={<Search className="w-4 h-4 text-default-400" />}
          onSelectionChange={handleSelect}
          items={filteredItems}
          variant="flat"
          selectorButtonProps={{ className: 'hidden' }}
          endContent={
            relatedRecipes.length > 0 ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsListExpanded(!isListExpanded);
                }}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors text-primary shrink-0"
              >
                <span className="text-xs font-semibold">{relatedRecipes.length}</span>
                {isListExpanded
                  ? <ChevronUp className="w-3.5 h-3.5" />
                  : <ChevronDown className="w-3.5 h-3.5" />
                }
              </button>
            ) : undefined
          }
        >
          {(item) => {
            const key = item.is_tip ? `tip:${item.id}` : `recipe:${item.id}`;
            return (
              <AutocompleteItem 
                key={key} 
                textValue={item.title}
                className="data-[hover=true]:bg-default-100 data-[hover=true]:text-default-foreground transition-colors"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3 min-w-0">
                    {item.is_tip ? (
                      <div className="w-8 h-8 rounded-md bg-warning/20 flex items-center justify-center shrink-0">
                        <Lightbulb className="w-4 h-4 text-warning" />
                      </div>
                    ) : (
                      <Avatar src={ImageManager.getAssetUrl(item.image_url || '')} radius="sm" className="w-8 h-8 shrink-0 text-tiny" fallback={item.title.charAt(0)} />
                    )}
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="font-medium text-sm line-clamp-1">{item.title}</span>
                      <div className="flex items-center gap-3 text-[10px] text-default-400 mt-0.5">
                        {item.is_tip ? (
                          <span className="text-warning-600">Mẹo nhà bếp</span>
                        ) : (
                          <>
                            {(item as any).taste_score ? (
                              <span className="flex items-center gap-1"><Star className="w-3 h-3 text-warning" />{(item as any).taste_score}</span>
                            ) : null}
                            {(item as any).calories ? (
                              <span className="flex items-center gap-1"><Flame className="w-3 h-3 text-danger" />{(item as any).calories}</span>
                            ) : null}
                            {(item as any).difficulty ? (
                              <span className="flex items-center gap-1"><ChefHat className="w-3 h-3 text-primary" />{(item as any).difficulty}</span>
                            ) : null}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  {item.isSelected && <Check className="w-4 h-4 text-success shrink-0 ml-2" />}
                </div>
              </AutocompleteItem>
            );
          }}
        </Autocomplete>

        {relatedRecipes.length > 0 && isListExpanded && (
          <div className="flex flex-col gap-0 border border-divider rounded-xl overflow-hidden -mt-2">
            <div className="flex flex-col divide-y divide-divider">
              {relatedRecipes.map(recipe => {
                const extra = recipes.find(r => r.id === recipe.id);
                return (
                  <div key={recipe.id} className="flex gap-3 p-2 hover:bg-default-50 transition-colors group relative">
                    <Avatar src={ImageManager.getAssetUrl(recipe.image_url || '')} radius="sm" className="w-10 h-10 shrink-0 text-small" fallback={recipe.title.charAt(0)} />
                    <div className="flex flex-col justify-center flex-1 gap-0.5">
                      <h4 className="font-medium text-sm line-clamp-1 pr-6">{recipe.title}</h4>
                      <div className="flex items-center gap-2 text-[10px] text-default-500">
                        {extra?.taste_score ? (
                          <span className="flex items-center gap-0.5" title="Đánh giá"><Star className="w-3 h-3 text-warning" />{extra.taste_score}</span>
                        ) : null}
                        {extra?.calories ? (
                          <span className="flex items-center gap-0.5" title="Calories"><Flame className="w-3 h-3 text-danger" />{extra.calories}</span>
                        ) : null}
                        {extra?.difficulty ? (
                          <span className="flex items-center gap-0.5" title="Độ khó"><ChefHat className="w-3 h-3 text-primary" />{extra.difficulty}</span>
                        ) : null}
                      </div>
                    </div>
                    <Button 
                      isIconOnly 
                      size="sm" 
                      color="danger" 
                      variant="light" 
                      className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-default-100/50 hover:bg-danger/20 w-6 h-6 min-w-6"
                      onPress={() => handleRemove(recipe.id)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </FormField>
  );
}
