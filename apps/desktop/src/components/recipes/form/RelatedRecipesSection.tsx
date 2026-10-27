import { useState, useMemo, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { useSearchParams } from 'react-router-dom';
import { 
  Button, Avatar, Input, Chip,
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, 
  useDisclosure, Tabs, Tab 
} from '@/ui';
import { 
  Link, Star, Flame, ChefHat, X, Search, Check, 
  ChevronDown, ChevronUp, Lightbulb, LayoutGrid, List 
} from 'lucide-react';
import { FormField } from '../../shared/form';
import type { FormValues } from './schema';
import { ImageManager } from '../../../lib/image-manager';
import { RecipeCard } from '../list/RecipeCard';
import { useRecipeStore } from '../../../store/useRecipeStore';
import { useTipStore } from '../../../store/useTipStore';

export function RelatedRecipesSection() {
  const { watch, setValue } = useFormContext<FormValues>();
  const { recipes, fetchRecipes } = useRecipeStore();
  const { tips, fetchTips } = useTipStore();
  const relatedRecipes = watch('related_recipes') || [];
  const linkedTips = watch('linked_tips') || [];

  const [searchValue, setSearchValue] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'recipes' | 'tips'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [isListExpanded, setIsListExpanded] = useState(true);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');

  // Load recipes and tips on mount so they are available immediately
  useEffect(() => {
    fetchRecipes();
    fetchTips();
  }, [fetchRecipes, fetchTips]);

  const filteredItems = useMemo(() => {
    const q = searchValue.trim().toLowerCase();

    const matchedRecipes = recipes
      .filter(item => item.id !== editId && (!q || item.title.toLowerCase().includes(q)))
      .map(item => ({
        ...item,
        is_tip: false as const,
        isSelected: relatedRecipes.some(r => r.id === item.id)
      }));

    const matchedTips = tips
      .filter(item => (!q || item.title.toLowerCase().includes(q) || (item.content && item.content.toLowerCase().includes(q))))
      .map(item => ({
        id: item.id,
        title: item.title,
        content: item.content,
        image_url: item.image_url,
        category: (item as any).category,
        is_tip: true as const,
        isSelected: linkedTips.some(tid => tid === item.id)
      }));

    if (categoryFilter === 'recipes') return matchedRecipes;
    if (categoryFilter === 'tips') return matchedTips;
    return [...matchedRecipes, ...matchedTips];
  }, [recipes, tips, searchValue, editId, relatedRecipes, linkedTips, categoryFilter]);

  const counts = useMemo(() => {
    const q = searchValue.trim().toLowerCase();
    const rCount = recipes.filter(item => item.id !== editId && (!q || item.title.toLowerCase().includes(q))).length;
    const tCount = tips.filter(item => (!q || item.title.toLowerCase().includes(q) || (item.content && item.content.toLowerCase().includes(q)))).length;
    return { all: rCount + tCount, recipes: rCount, tips: tCount };
  }, [recipes, tips, searchValue, editId]);

  const handleToggle = (keyStr: string) => {
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
      <div className="flex flex-col gap-3">
        {/* Trigger Button styled like input */}
        <Button
          variant="flat"
          className="w-full justify-between bg-default-100 hover:bg-default-200 text-default-500 font-normal px-3 h-10 shadow-none border-none rounded-xl"
          onPress={onOpen}
          startContent={<Search className="w-4 h-4 text-default-400 shrink-0" />}
          endContent={
            totalSelectedCount > 0 ? (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setIsListExpanded(!isListExpanded);
                }}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors text-primary shrink-0"
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

        {/* Modal Picker with rounded bottom corners */}
        <Modal 
          isOpen={isOpen} 
          onOpenChange={onOpenChange} 
          size="3xl"
          scrollBehavior="inside"
          radius="2xl"
          classNames={{
            base: "rounded-2xl overflow-hidden border border-divider/40 shadow-2xl",
            backdrop: "bg-black/60 backdrop-blur-sm"
          }}
        >
          <ModalContent className="rounded-2xl overflow-hidden">
            {(onClose) => (
              <>
                <ModalHeader className="flex items-center justify-between px-6 py-4 border-b border-divider/40 shrink-0 bg-content1 rounded-t-2xl">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Link className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-foreground">Liên kết công thức & mẹo</h3>
                      <p className="text-xs text-default-500 font-normal">Chọn các công thức nấu ăn hoặc mẹo vặt liên quan đến món này</p>
                    </div>
                  </div>
                  {totalSelectedCount > 0 && (
                    <Chip color="primary" variant="flat" size="sm" className="font-semibold">
                      {totalSelectedCount} đã chọn
                    </Chip>
                  )}
                </ModalHeader>

                <ModalBody className="p-6 bg-default-50/30">
                  {/* Search and Filters Bar */}
                  <div className="flex flex-col gap-3 mb-4 shrink-0">
                    <div className="flex items-center gap-2">
                      <Input
                        autoFocus
                        placeholder="Tìm theo tên công thức hoặc mẹo..."
                        value={searchValue}
                        onValueChange={setSearchValue}
                        startContent={<Search className="w-4 h-4 text-default-400" />}
                        variant="flat"
                        className="flex-1"
                        classNames={{
                          inputWrapper: "bg-default-100 hover:bg-default-200 h-10 shadow-none border-none rounded-xl"
                        }}
                        isClearable
                        onClear={() => setSearchValue("")}
                      />
                      <div className="flex items-center bg-default-100 rounded-xl p-1 shrink-0 gap-1">
                        <Button
                          isIconOnly
                          size="sm"
                          variant={viewMode === 'list' ? 'solid' : 'light'}
                          color={viewMode === 'list' ? 'primary' : 'default'}
                          className="w-8 h-8 min-w-8 rounded-lg"
                          onPress={() => setViewMode('list')}
                          title="Xem danh sách"
                        >
                          <List className="w-4 h-4" />
                        </Button>
                        <Button
                          isIconOnly
                          size="sm"
                          variant={viewMode === 'grid' ? 'solid' : 'light'}
                          color={viewMode === 'grid' ? 'primary' : 'default'}
                          className="w-8 h-8 min-w-8 rounded-lg"
                          onPress={() => setViewMode('grid')}
                          title="Xem lưới"
                        >
                          <LayoutGrid className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <Tabs 
                      selectedKey={categoryFilter} 
                      onSelectionChange={(key) => setCategoryFilter(key as any)}
                      variant="underlined"
                      classNames={{
                        tabList: "gap-4 border-b border-divider/40 p-0",
                        cursor: "w-full bg-primary",
                        tab: "max-w-fit px-0 h-9",
                        tabContent: "group-data-[selected=true]:text-primary font-medium text-xs"
                      }}
                    >
                      <Tab key="all" title={`Tất cả (${counts.all})`} />
                      <Tab key="recipes" title={`Công thức (${counts.recipes})`} />
                      <Tab key="tips" title={`Mẹo vặt (${counts.tips})`} />
                    </Tabs>
                  </div>

                  {/* Items List / Grid */}
                  <div className="flex-1 overflow-y-auto max-h-[440px] pr-1">
                    {viewMode === 'list' ? (
                      <div className="flex flex-col gap-2">
                        {filteredItems.map((item) => {
                          const key = item.is_tip ? `tip:${item.id}` : `recipe:${item.id}`;
                          return (
                            <div
                              key={key}
                              className={`flex items-center justify-between w-full p-2.5 rounded-xl cursor-pointer transition-all border ${
                                item.isSelected 
                                  ? 'bg-primary/5 border-primary/30 dark:bg-primary/10' 
                                  : 'bg-content1 hover:bg-default-100 border-transparent shadow-none'
                              }`}
                              onClick={() => handleToggle(key)}
                            >
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                {item.is_tip ? (
                                  item.image_url ? (
                                    <Avatar 
                                      src={ImageManager.getAssetUrl(item.image_url)} 
                                      radius="sm" 
                                      className="w-10 h-10 shrink-0 text-small" 
                                      fallback={<Lightbulb className="w-4 h-4 text-warning" />} 
                                    />
                                  ) : (
                                    <div className="w-10 h-10 rounded-lg bg-warning/15 text-warning flex items-center justify-center shrink-0 border border-warning/20">
                                      <Lightbulb className="w-5 h-5" />
                                    </div>
                                  )
                                ) : (
                                  <Avatar 
                                    src={ImageManager.getAssetUrl(item.image_url || '')} 
                                    radius="sm" 
                                    className="w-10 h-10 shrink-0 text-small" 
                                    fallback={item.title.charAt(0)} 
                                  />
                                )}
                                <div className="flex flex-col min-w-0 flex-1">
                                  <span className="font-medium text-sm text-foreground line-clamp-1">{item.title}</span>
                                  <div className="flex items-center gap-2 text-xs text-default-400 mt-0.5">
                                    {item.is_tip ? (
                                      <span className="flex items-center gap-1 text-warning-600 dark:text-warning-400 font-medium">
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
                              <div className="shrink-0 ml-3">
                                {item.isSelected ? (
                                  <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center shadow-sm">
                                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                                  </div>
                                ) : (
                                  <div className="w-6 h-6 rounded-full border border-default-300 hover:border-default-400 transition-colors" />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {filteredItems.map((item) => {
                          const key = item.is_tip ? `tip:${item.id}` : `recipe:${item.id}`;
                          
                          if (item.is_tip) {
                            return (
                              <div 
                                key={key}
                                onClick={() => handleToggle(key)}
                                className={`group flex flex-col cursor-pointer relative p-3 rounded-xl border transition-all ${
                                  item.isSelected 
                                    ? 'bg-primary/5 border-primary shadow-sm' 
                                    : 'bg-content1 hover:bg-default-100 border-default-200/60 shadow-none'
                                }`}
                              >
                                <div className="rounded-lg bg-warning/15 w-full aspect-video flex items-center justify-center relative mb-2 overflow-hidden border border-warning/20">
                                  {item.image_url ? (
                                    <img 
                                      src={ImageManager.getAssetUrl(item.image_url)} 
                                      alt={item.title} 
                                      className="w-full h-full object-cover" 
                                    />
                                  ) : (
                                    <Lightbulb className="w-8 h-8 text-warning" />
                                  )}
                                  {item.isSelected && (
                                    <div className="absolute top-2 right-2 bg-primary text-white rounded-full p-1 shadow-sm z-10">
                                      <Check className="w-3 h-3 stroke-[3]" />
                                    </div>
                                  )}
                                </div>
                                <h4 className="font-semibold text-sm line-clamp-2 leading-snug mb-1 text-foreground">
                                  {item.title}
                                </h4>
                                <span className="text-[11px] text-warning-600 dark:text-warning-400 font-medium flex items-center gap-1">
                                  <Lightbulb className="w-3 h-3 text-warning" />
                                  Mẹo nhà bếp
                                </span>
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
                              onSelectChange={() => handleToggle(key)}
                              hideMenu
                              size="sm"
                            />
                          );
                        })}
                      </div>
                    )}

                    {filteredItems.length === 0 && (
                      <div className="flex flex-col items-center justify-center text-default-400 py-12 gap-2 text-center">
                        <Search className="w-8 h-8 stroke-1 text-default-300" />
                        <p className="text-sm">Không tìm thấy công thức hoặc mẹo nào phù hợp</p>
                      </div>
                    )}
                  </div>
                </ModalBody>

                <ModalFooter className="px-6 py-3.5 border-t border-divider/40 flex items-center justify-between gap-3 bg-content1 shrink-0 rounded-b-2xl">
                  <span className="text-xs text-default-500">
                    {totalSelectedCount > 0 
                      ? `Đã chọn: ${relatedRecipes.length} công thức, ${linkedTips.length} mẹo` 
                      : "Chưa chọn mục nào"}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button variant="flat" onPress={onClose}>
                      Đóng
                    </Button>
                    <Button color="primary" onPress={onClose}>
                      Hoàn tất ({totalSelectedCount})
                    </Button>
                  </div>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>

        {/* Selected Items List below trigger */}
        {totalSelectedCount > 0 && isListExpanded && (
          <div className="flex flex-col rounded-xl overflow-hidden bg-default-50/50 border border-divider/50 divide-y divide-divider/50">
            {relatedRecipes.map(recipe => {
              const extra = recipes.find(r => r.id === recipe.id);
              return (
                <div key={`recipe-${recipe.id}`} className="flex gap-2.5 sm:gap-3 p-2 hover:bg-default-100/60 transition-colors group relative items-center">
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
                        <span className="flex items-center gap-0.5"><Star className="w-2.5 h-2.5 text-warning" />{extra.taste_score}</span>
                      ) : null}
                      {extra?.calories ? (
                        <span className="flex items-center gap-0.5"><Flame className="w-2.5 h-2.5 text-danger" />{extra.calories} kcal</span>
                      ) : null}
                      {extra?.difficulty ? (
                        <span className="flex items-center gap-0.5"><ChefHat className="w-2.5 h-2.5 text-primary" />{extra.difficulty}</span>
                      ) : null}
                    </div>
                  </div>
                  <Button 
                    isIconOnly 
                    size="sm" 
                    color="danger" 
                    variant="light" 
                    className="absolute right-2 top-1/2 -translate-y-1/2 opacity-70 group-hover:opacity-100 hover:bg-danger/20 text-default-500 hover:text-danger w-7 h-7 min-w-7 rounded-full cursor-pointer transition-all"
                    onPress={() => handleRemoveRecipe(recipe.id)}
                    title="Bỏ liên kết"
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              );
            })}

            {linkedTips.map(tipId => {
              const tip = tips.find(t => t.id === tipId);
              if (!tip) return null;
              return (
                <div key={`tip-${tip.id}`} className="flex gap-2.5 sm:gap-3 p-2 hover:bg-default-100/60 transition-colors group relative items-center">
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
                      {tip.category && (
                        <>
                          <span className="text-default-300">•</span>
                          <span className="text-default-400">{tip.category}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <Button 
                    isIconOnly 
                    size="sm" 
                    color="danger" 
                    variant="light" 
                    className="absolute right-2 top-1/2 -translate-y-1/2 opacity-70 group-hover:opacity-100 hover:bg-danger/20 text-default-500 hover:text-danger w-7 h-7 min-w-7 rounded-full cursor-pointer transition-all"
                    onPress={() => handleRemoveTip(tip.id)}
                    title="Bỏ liên kết"
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </FormField>
  );
}
