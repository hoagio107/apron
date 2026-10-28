import { useState, useMemo, useEffect } from 'react';
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

const EMPTY_RELATED: NonNullable<FormValues['related_recipes']> = [];
const EMPTY_TIPS: NonNullable<FormValues['linked_tips']> = [];

export function RelatedRecipesSection() {
  const { watch, setValue } = useFormContext<FormValues>();
  const { recipes, fetchRecipes } = useRecipeStore();
  const { tips, fetchTips } = useTipStore();
  const relatedRecipes = watch('related_recipes') ?? EMPTY_RELATED;
  const linkedTips = watch('linked_tips') ?? EMPTY_TIPS;

  const [searchValue, setSearchValue] = useState("");
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [isListExpanded, setIsListExpanded] = useState(true);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');

  useEffect(() => {
    fetchRecipes();
    fetchTips();
  }, [fetchRecipes, fetchTips]);

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
        category: (item as any).category,
        is_tip: true,
        isSelected: linkedTips.some(tid => tid === item.id)
      }));

    return [...matchedRecipes, ...matchedTips];
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
          className="w-full justify-start bg-default-100 hover:bg-default-200 text-default-500 text-left font-normal px-3 h-11 rounded-xl shadow-none border-none"
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
          <span className="truncate text-left flex-1 text-sm text-default-400">
            {totalSelectedCount > 0 
              ? `Đã chọn ${totalSelectedCount} mục liên kết (${relatedRecipes.length} công thức, ${linkedTips.length} mẹo)` 
              : "Tìm kiếm công thức hoặc mẹo..."}
          </span>
        </Button>
        <Drawer 
          isOpen={isOpen} 
          onOpenChange={onOpenChange} 
          placement="bottom" 
          size="2xl"
          classNames={{
            base: "max-h-[calc(100dvh-var(--sat,0px)-20px)] rounded-t-3xl overflow-hidden shadow-2xl mt-auto",
            backdrop: "bg-black/60 backdrop-blur-sm"
          }}
        >
          <DrawerContent className="rounded-t-3xl overflow-hidden">
            {(onClose) => (
              <>
                <DrawerHeader className="flex flex-col gap-1.5 px-4 pt-3 pb-3 border-b border-divider z-10 bg-content1 rounded-t-3xl">
                  <div className="w-10 h-1 rounded-full bg-default-300 dark:bg-default-600 mx-auto -mt-0.5 mb-1" />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Link className="w-4 h-4 text-primary" />
                      <span className="text-base font-bold text-foreground">Liên kết công thức & mẹo</span>
                    </div>
                    <Button isIconOnly variant="light" size="sm" onPress={onClose} className="bg-default-100 w-8 h-8 rounded-full">
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </DrawerHeader>
                <DrawerBody className="p-4 pt-4 bg-default-50/50">
                  <div className="flex gap-2 items-center mb-4">
                    <Input
                      autoFocus
                      placeholder="Tìm kiếm công thức hoặc mẹo..."
                      value={searchValue}
                      onValueChange={setSearchValue}
                      startContent={<Search className="w-4 h-4 text-default-400" />}
                      variant="flat"
                      className="flex-1"
                      classNames={{
                        inputWrapper: "bg-default-100 h-11 shadow-none border-none rounded-xl"
                      }}
                      isClearable
                      onClear={() => setSearchValue("")}
                    />
                    <Button 
                      isIconOnly 
                      variant="flat" 
                      className="h-11 w-11 bg-default-100 shadow-none border-none rounded-xl"
                      onPress={() => setViewMode(m => m === 'grid' ? 'list' : 'grid')}
                    >
                      {viewMode === 'grid' ? <List className="w-4 h-4 text-default-500" /> : <LayoutGrid className="w-4 h-4 text-default-500" />}
                    </Button>
                  </div>

                  <div className="flex-1 overflow-y-auto pb-6">
                    {viewMode === 'list' ? (
                      <div className="flex flex-col gap-2">
                        {filteredItems.map((item) => {
                          const key = item.is_tip ? `tip:${item.id}` : `recipe:${item.id}`;
                          return (
                            <div
                              key={key}
                              className={`flex items-center justify-between w-full p-2.5 rounded-xl cursor-pointer transition-colors border ${
                                item.isSelected 
                                  ? 'bg-primary/5 border-primary/30 dark:bg-primary/10' 
                                  : 'bg-content1 hover:bg-default-100 border-transparent shadow-none'
                              }`}
                              onClick={() => {
                                handleSelect(key);
                              }}
                            >
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                {item.is_tip ? (
                                  item.image_url ? (
                                    <Avatar 
                                      src={ImageManager.getAssetUrl(item.image_url)} 
                                      radius="sm" 
                                      className="w-12 h-12 shrink-0 text-small" 
                                      fallback={<Lightbulb className="w-5 h-5 text-warning" />} 
                                    />
                                  ) : (
                                    <div className="w-12 h-12 rounded-lg bg-warning/15 text-warning flex items-center justify-center shrink-0 border border-warning/20">
                                      <Lightbulb className="w-5 h-5" />
                                    </div>
                                  )
                                ) : (
                                  <Avatar 
                                    src={ImageManager.getAssetUrl(item.image_url || '')} 
                                    radius="sm" 
                                    className="w-12 h-12 shrink-0 text-large" 
                                    fallback={item.title.charAt(0)} 
                                  />
                                )}
                                <div className="flex flex-col min-w-0 flex-1">
                                  <span className="font-medium text-sm text-foreground line-clamp-1">{item.title}</span>
                                  <div className="flex items-center gap-2 text-xs text-default-400 mt-0.5">
                                    {item.is_tip ? (
                                      <span className="text-warning-600 dark:text-warning-400 font-medium flex items-center gap-1">
                                        <Lightbulb className="w-3 h-3 text-warning" />
                                        Mẹo nhà bếp
                                      </span>
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
                              <div className="shrink-0 ml-2">
                                {item.isSelected ? (
                                  <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center shadow-sm">
                                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                                  </div>
                                ) : (
                                  <div className="w-6 h-6 rounded-full border border-default-300" />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        {filteredItems.map((item) => {
                          const key = item.is_tip ? `tip:${item.id}` : `recipe:${item.id}`;
                          
                          if (item.is_tip) {
                            return (
                              <div 
                                key={key}
                                onClick={() => handleSelect(key)}
                                className={`group flex flex-col cursor-pointer relative p-3 rounded-xl border transition-all ${
                                  item.isSelected 
                                    ? 'bg-primary/5 border-primary shadow-sm' 
                                    : 'bg-content1 hover:bg-default-100 border-default-200/60 shadow-none'
                                }`}
                              >
                                <div className="relative rounded-lg overflow-hidden bg-warning/15 w-full aspect-[4/3] flex items-center justify-center mb-2 border border-warning/20">
                                  {item.image_url ? (
                                    <img 
                                      src={ImageManager.getAssetUrl(item.image_url)} 
                                      alt={item.title} 
                                      className="w-full h-full object-cover" 
                                    />
                                  ) : (
                                    <Lightbulb className="w-10 h-10 text-warning" />
                                  )}
                                  {item.isSelected && (
                                    <div className="absolute top-2 right-2 z-20">
                                      <div className="bg-primary text-white rounded-full p-1 shadow-sm">
                                        <Check className="w-3 h-3 stroke-[3]" />
                                      </div>
                                    </div>
                                  )}
                                </div>
                                <div className="flex flex-col gap-1">
                                  <h3 className="font-semibold line-clamp-2 leading-tight text-sm text-foreground">
                                    {item.title}
                                  </h3>
                                  <span className="text-[11px] text-warning-600 dark:text-warning-400 font-medium flex items-center gap-1">
                                    <Lightbulb className="w-3 h-3 text-warning" />
                                    Mẹo nhà bếp
                                  </span>
                                </div>
                              </div>
                            );
                          }

                          return (
                            <RecipeCard 
                              key={key}
                              recipe={item as any}
                              viewType="grid-portrait-out"
                              selectable
                              isSelected={item.isSelected}
                              onSelectChange={() => handleSelect(key)}
                              hideMenu
                              size="sm"
                            />
                          );
                        })}
                      </div>
                    )}
                    
                    {filteredItems.length === 0 && (
                      <div className="text-center text-default-400 py-12 text-sm">
                        Không tìm thấy kết quả nào
                      </div>
                    )}
                  </div>
                  <div className="p-3 border-t border-divider mt-auto shrink-0 bg-content1 -mx-4 -mb-4">
                    <Button color="primary" className="w-full h-12 text-base font-medium rounded-xl" onPress={onClose}>
                      Hoàn tất ({totalSelectedCount})
                    </Button>
                  </div>
                </DrawerBody>
              </>
            )}
          </DrawerContent>
        </Drawer>

        {/* Selected Items List below trigger */}
        {totalSelectedCount > 0 && isListExpanded && (
          <div className="flex flex-col rounded-xl overflow-hidden bg-default-50/50 border border-divider/50 divide-y divide-divider/50 -mt-2">
            {relatedRecipes.map(recipe => {
              const extra = recipes.find(r => r.id === recipe.id);
              return (
                <div key={`recipe-${recipe.id}`} className="flex gap-2.5 p-2 hover:bg-default-100/60 transition-colors group relative items-center">
                  <Avatar 
                    src={ImageManager.getAssetUrl(recipe.image_url || '')} 
                    radius="sm" 
                    className="w-10 h-10 shrink-0 text-small" 
                    fallback={recipe.title.charAt(0)} 
                  />
                  <div className="flex flex-col justify-center flex-1 min-w-0 pr-8">
                    <h4 className="font-medium text-sm text-foreground truncate">{recipe.title}</h4>
                    <div className="flex items-center gap-2 text-[10px] text-default-500 mt-0.5">
                      {extra?.taste_score ? (
                        <span className="flex items-center gap-0.5" title="Đánh giá"><Star className="w-2.5 h-2.5 text-warning" />{extra.taste_score}</span>
                      ) : null}
                      {extra?.calories ? (
                        <span className="flex items-center gap-0.5" title="Calories"><Flame className="w-2.5 h-2.5 text-danger" />{extra.calories} kcal</span>
                      ) : null}
                      {extra?.difficulty ? (
                        <span className="flex items-center gap-0.5" title="Độ khó"><ChefHat className="w-2.5 h-2.5 text-primary" />{extra.difficulty}</span>
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
                    title="Bỏ liên kết"
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
                <div key={`tip-${tip.id}`} className="flex gap-2.5 p-2 hover:bg-default-100/60 transition-colors group relative items-center">
                  {tip.image_url ? (
                    <Avatar 
                      src={ImageManager.getAssetUrl(tip.image_url)} 
                      radius="sm" 
                      className="w-10 h-10 shrink-0 text-small" 
                      fallback={<Lightbulb className="w-4 h-4 text-warning" />} 
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-warning/15 text-warning flex items-center justify-center shrink-0 border border-warning/20">
                      <Lightbulb className="w-5 h-5" />
                    </div>
                  )}
                  <div className="flex flex-col justify-center flex-1 min-w-0 pr-8">
                    <h4 className="font-medium text-sm text-foreground truncate">{tip.title}</h4>
                    <div className="flex items-center gap-2 text-[10px] text-default-500 mt-0.5">
                      <span className="flex items-center gap-1 text-warning-600 dark:text-warning-400 font-medium">
                        <Lightbulb className="w-3 h-3 text-warning" />
                        Mẹo nhà bếp
                      </span>
                      {(tip as any).category && (
                        <>
                          <span className="text-default-300">•</span>
                          <span className="text-default-400">{(tip as any).category}</span>
                        </>
                      )}
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
                    title="Bỏ liên kết"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </FormField>
  );
}
