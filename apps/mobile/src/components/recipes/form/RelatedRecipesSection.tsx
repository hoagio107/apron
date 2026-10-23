import { useState, useMemo } from 'react';
import { useFormContext } from 'react-hook-form';
import { useSearchParams } from 'react-router-dom';
import { Button, Avatar, Drawer, DrawerContent, DrawerHeader, DrawerBody, useDisclosure, Input } from '@/ui';
import { Link, Star, Flame, ChefHat, X, Search, Check, ChevronDown, ChevronUp, Lightbulb, LayoutGrid, List } from 'lucide-react';
import { FormField } from '../../shared/form';
import type { FormValues } from './schema';
import { ImageManager } from '../../../lib/image-manager';
import { RecipeCard } from '../list/RecipeCard';

import { useRecipeStore } from '../../../store/useRecipeStore';
import { useTipStore } from '../../../store/useTipStore';

export function RelatedRecipesSection() {
  const { watch, setValue } = useFormContext<FormValues>();
  const { recipes } = useRecipeStore();
  const { tips } = useTipStore();
  const relatedRecipes = watch('related_recipes') || [];
  const linkedTips = watch('linked_tips') || [];

  const [searchValue, setSearchValue] = useState("");
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [isListExpanded, setIsListExpanded] = useState(true);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  
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
      if (linkedTips.some(tid => tid === id)) {
        setValue('linked_tips', linkedTips.filter(tid => tid !== id), { shouldValidate: true, shouldDirty: true });
      } else {
        const item = tips.find(t => t.id === id);
        if (!item) return;
        setValue('linked_tips', [...linkedTips, item.id], { shouldValidate: true, shouldDirty: true });
      }
    } else {
      if (relatedRecipes.some(r => r.id === id)) {
        setValue('related_recipes', relatedRecipes.filter(r => r.id !== id), { shouldValidate: true, shouldDirty: true });
      } else {
        const item = recipes.find(r => r.id === id);
        if (!item) return;
        setValue('related_recipes', [...relatedRecipes, {
          id: item.id,
          title: item.title,
          slug: item.slug,
          image_url: item.image_url
        }], { shouldValidate: true, shouldDirty: true });
      }
    }
  };

  const handleRemoveRecipe = (id: string) => {
    setValue('related_recipes', relatedRecipes.filter(r => r.id !== id), { shouldValidate: true, shouldDirty: true });
  };

  const handleRemoveTip = (id: string) => {
    setValue('linked_tips', linkedTips.filter(tid => tid !== id), { shouldValidate: true, shouldDirty: true });
  };

  const totalSelectedCount = relatedRecipes.length + linkedTips.length;

  return (
    <FormField label="Công thức và mẹo liên kết" icon={Link}>
      <div className="flex flex-col gap-4">
        <Button
          variant="flat"
          className="w-full justify-start bg-default-100 hover:bg-default-200 text-default-500 text-left font-normal px-3"
          onPress={onOpen}
          startContent={<Search className="w-4 h-4 text-default-400 shrink-0" />}
          endContent={
            totalSelectedCount > 0 ? (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setIsListExpanded(!isListExpanded);
                }}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors text-primary shrink-0 ml-auto"
              >
                <span className="text-xs font-semibold">{totalSelectedCount}</span>
                {isListExpanded
                  ? <ChevronUp className="w-3.5 h-3.5" />
                  : <ChevronDown className="w-3.5 h-3.5" />
                }
              </div>
            ) : undefined
          }
        >
          Tìm kiếm công thức hoặc mẹo...
        </Button>
        <Drawer isOpen={isOpen} onOpenChange={onOpenChange} placement="bottom" size="full">
          <DrawerContent>
            {(onClose) => (
              <>
                <DrawerHeader className="flex flex-col gap-1 px-4 py-3 border-b border-divider z-10">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold">Thêm liên kết</span>
                    <Button isIconOnly variant="light" size="md" onPress={onClose} className="bg-default-100 w-8 h-8 rounded-full">
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </DrawerHeader>
                <DrawerBody className="p-4 pt-6 bg-default-50/50">
                  <div className="flex gap-2 items-center mb-6">
                    <Input
                      autoFocus
                      placeholder="Tìm kiếm công thức hoặc mẹo..."
                      value={searchValue}
                      onValueChange={setSearchValue}
                      startContent={<Search className="w-4 h-4 text-default-400" />}
                      variant="flat"
                      className="flex-1"
                      classNames={{
                        inputWrapper: "bg-default-100 h-12 shadow-none border-none"
                      }}
                      isClearable
                      onClear={() => setSearchValue("")}
                    />
                    <Button 
                      isIconOnly 
                      variant="flat" 
                      className="h-12 w-12 bg-default-100 shadow-none border-none"
                      onPress={() => setViewMode(m => m === 'grid' ? 'list' : 'grid')}
                    >
                      {viewMode === 'grid' ? <List className="w-5 h-5 text-default-500" /> : <LayoutGrid className="w-5 h-5 text-default-500" />}
                    </Button>
                  </div>

                  <div className="flex-1 overflow-y-auto pb-8">
                    {viewMode === 'list' ? (
                      <div className="flex flex-col gap-2">
                        {filteredItems.map((item) => {
                          const key = item.is_tip ? `tip:${item.id}` : `recipe:${item.id}`;
                          return (
                            <div
                              key={key}
                              className="flex items-center justify-between w-full p-3 hover:bg-default-100 rounded-xl cursor-pointer transition-colors"
                              onClick={() => {
                                handleSelect(key);
                              }}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                {item.is_tip ? (
                                  <div className="w-24 h-24 rounded-xl bg-warning/20 flex items-center justify-center shrink-0">
                                    <Lightbulb className="w-5 h-5 text-warning" />
                                  </div>
                                ) : (
                                  <Avatar src={ImageManager.getAssetUrl(item.image_url || '')} radius="lg" className="w-24 h-24 shrink-0 text-large" fallback={item.title.charAt(0)} />
                                )}
                                <div className="flex flex-col min-w-0 flex-1">
                                  <span className="font-medium text-sm line-clamp-1">{item.title}</span>
                                  <div className="flex items-center gap-3 text-xs text-default-400 mt-0.5">
                                    {item.is_tip ? (
                                      <span className="text-warning-600">Mẹo nhà bếp</span>
                                    ) : (
                                      <>
                                        {(item as any).taste_score ? (
                                          <span className="flex items-center gap-1"><Star className="w-3 h-3 text-warning" />{(item as any).taste_score}</span>
                                        ) : null}
                                        {(item as any).calories ? (
                                          <span className="flex items-center gap-1"><Flame className="w-3 h-3 text-danger" />{(item as any).calories} kcal</span>
                                        ) : null}
                                        {(item as any).difficulty ? (
                                          <span className="flex items-center gap-1"><ChefHat className="w-3 h-3 text-primary" />{(item as any).difficulty}</span>
                                        ) : null}
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                              {item.isSelected && <Check className="w-5 h-5 text-success shrink-0 ml-2" />}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        {filteredItems.map((item) => {
                          const key = item.is_tip ? `tip:${item.id}` : `recipe:${item.id}`;
                          
                          if (item.is_tip) {
                            // Render a simple tip card to match grid
                            return (
                              <div 
                                key={key}
                                onClick={() => handleSelect(key)}
                                className={`group flex flex-col cursor-pointer relative gap-3`}
                              >
                                <div className="relative rounded-xl overflow-hidden bg-warning/20 w-full aspect-[3/4] flex items-center justify-center">
                                  <Lightbulb className="w-12 h-12 text-warning" />
                                  {item.isSelected && (
                                    <div className="absolute top-3 right-3 z-20">
                                      <div className="bg-primary text-white rounded-full p-1">
                                        <Check className="w-3 h-3" />
                                      </div>
                                    </div>
                                  )}
                                  <div className="absolute inset-0 z-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none"></div>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                  <h3 className="font-semibold line-clamp-2 leading-tight text-base">
                                    {item.title}
                                  </h3>
                                  <span className="text-xs text-warning-600 font-medium">Mẹo nhà bếp</span>
                                </div>
                              </div>
                            );
                          }

                          // Render a RecipeCard for recipes
                          return (
                            <RecipeCard 
                              key={key}
                              recipe={item as any}
                              viewType="grid-portrait-out"
                              selectable
                              isSelected={item.isSelected}
                              onSelectChange={() => handleSelect(key)}
                              hideMenu
                            />
                          );
                        })}
                      </div>
                    )}
                    
                    {filteredItems.length === 0 && (
                      <div className="text-center text-default-500 py-8">
                        Không tìm thấy kết quả nào
                      </div>
                    )}
                  </div>
                  <div className="p-4 border-t border-divider mt-auto shrink-0 bg-default-50 -mx-4 -mb-4">
                    <Button color="primary" className="w-full h-14 text-base font-medium rounded-xl" onPress={onClose}>Xong ({totalSelectedCount})</Button>
                  </div>
                </DrawerBody>
              </>
            )}
          </DrawerContent>
        </Drawer>

        {totalSelectedCount > 0 && isListExpanded && (
          <div className="flex flex-col gap-0 border border-divider rounded-xl overflow-hidden -mt-2">
            <div className="flex flex-col divide-y divide-divider">
              {relatedRecipes.map(recipe => {
                const extra = recipes.find(r => r.id === recipe.id);
                return (
                  <div key={`recipe-${recipe.id}`} className="flex gap-3 p-2 hover:bg-default-50 transition-colors group relative">
                    <Avatar src={ImageManager.getAssetUrl(recipe.image_url || '')} radius="sm" className="w-10 h-10 shrink-0 text-small" fallback={recipe.title.charAt(0)} />
                    <div className="flex flex-col justify-center flex-1 gap-0.5">
                      <h4 className="font-medium text-sm line-clamp-1 pr-6">{recipe.title}</h4>
                      <div className="flex items-center gap-2 text-[10px] text-default-500">
                        {extra?.taste_score ? (
                          <span className="flex items-center gap-0.5" title="Đánh giá"><Star className="w-3 h-3 text-warning" />{extra.taste_score}</span>
                        ) : null}
                        {extra?.calories ? (
                          <span className="flex items-center gap-0.5" title="Calories"><Flame className="w-3 h-3 text-danger" />{extra.calories} kcal</span>
                        ) : null}
                        {extra?.difficulty ? (
                          <span className="flex items-center gap-0.5" title="Độ khó"><ChefHat className="w-3 h-3 text-primary" />{extra.difficulty}</span>
                        ) : null}
                      </div>
                    </div>
                    <button 
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center bg-default-200/50 hover:bg-danger/20 text-default-500 hover:text-danger w-7 h-7 min-w-7 z-10 rounded-full cursor-pointer transition-colors"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleRemoveRecipe(recipe.id);
                      }}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
              {linkedTips.map(tipId => {
                const tip = tips.find(t => t.id === tipId);
                if (!tip) return null;
                return (
                  <div key={`tip-${tip.id}`} className="flex gap-3 p-2 hover:bg-default-50 transition-colors group relative">
                    <div className="w-10 h-10 rounded bg-warning/20 flex items-center justify-center shrink-0">
                      <Lightbulb className="w-4 h-4 text-warning" />
                    </div>
                    <div className="flex flex-col justify-center flex-1 gap-0.5">
                      <h4 className="font-medium text-sm line-clamp-1 pr-6">{tip.title}</h4>
                      <div className="flex items-center gap-2 text-[10px] text-warning-600">
                        Mẹo nhà bếp
                      </div>
                    </div>
                    <button 
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center bg-default-200/50 hover:bg-danger/20 text-default-500 hover:text-danger w-7 h-7 min-w-7 z-10 rounded-full cursor-pointer transition-colors"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleRemoveTip(tip.id);
                      }}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
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

