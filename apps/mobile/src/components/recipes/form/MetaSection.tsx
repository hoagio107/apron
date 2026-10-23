import { useState, useMemo } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { Input, Avatar, Checkbox, Button, Drawer, DrawerContent, DrawerHeader, DrawerBody, useDisclosure } from '@/ui';
import { Youtube, Link as LinkIcon, GitFork, Search, Star, Flame, ChefHat, X, LayoutGrid, List } from 'lucide-react';
import type { FormValues } from './schema';
import { FormField } from '../../shared/form';
import { HierarchicalTagSelect } from './HierarchicalTagSelect';
import { RelatedRecipesSection } from './RelatedRecipesSection';
import type { Tag } from '@apron/core';
import { useRecipeStore } from '../../../store/useRecipeStore';
import { ImageManager } from '../../../lib/image-manager';
import { RecipeCard } from '../list/RecipeCard';

interface MetaSectionProps {
  dynamicTags?: Tag[];
  currentRecipeId?: string;
}

export function MetaSection({ dynamicTags, currentRecipeId }: MetaSectionProps) {
  const { control, watch, setValue } = useFormContext<FormValues>();
  const { recipes } = useRecipeStore();
  
  const parentId = watch('parent_id');
  const isVariant = parentId !== null;

  const [searchValue, setSearchValue] = useState("");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  const filteredRecipes = useMemo(() => {
    return recipes
      .filter(item => item.id !== currentRecipeId && item.title.toLowerCase().includes(searchValue.toLowerCase()));
  }, [recipes, searchValue, currentRecipeId]);

  const handleParentSelect = (key: React.Key | null) => {
    if (!key) {
      return;
    }
    setValue('parent_id', key.toString());
    setTimeout(() => setSearchValue(""), 0);
  };

  const parentRecipe = useMemo(() => {
    if (!parentId) return null;
    return recipes.find(r => r.id === parentId) || null;
  }, [recipes, parentId]);

  return (
    <div className="flex flex-col gap-6">
      <Controller
        name="tags"
        control={control}
        render={({ field, fieldState }) => (
          <HierarchicalTagSelect 
            selectedIds={field.value || []}
            onChange={field.onChange}
            error={fieldState.error?.message}
            dynamicTags={dynamicTags}
          />
        )}
      />

      <div className="flex flex-col gap-4">
        <Controller
          name="video_url"
          control={control}
          render={({ field, fieldState }) => (
            <FormField label="Video URL (YouTube/Tiktok)" icon={Youtube} error={fieldState.error?.message} className="flex-1">
              <Input
                {...field}
                value={field.value || ''}
                placeholder="https://..."
                variant="flat"
                classNames={{
                  inputWrapper: "bg-default-100 hover:bg-default-200 border-none shadow-none"
                }}
                isInvalid={!!fieldState.error}
              />
            </FormField>
          )}
        />
        <Controller
          name="source"
          control={control}
          render={({ field, fieldState }) => (
            <FormField label="Nguồn tham khảo" icon={LinkIcon} error={fieldState.error?.message} className="flex-1">
              <Input
                {...field}
                value={field.value || ''}
                placeholder="Tên tác giả, trang web..."
                variant="flat"
                classNames={{
                  inputWrapper: "bg-default-100 hover:bg-default-200 border-none shadow-none"
                }}
                isInvalid={!!fieldState.error}
              />
            </FormField>
          )}
        />
      </div>

      <div className="flex flex-col gap-4">
        <Controller
          name="parent_id"
          control={control}
          render={({ fieldState }) => (
            <FormField 
              label={
                <div className="flex items-center justify-between w-full">
                  <span>Biến thể?</span>
                  <Checkbox 
                    isSelected={isVariant} 
                    onValueChange={(checked) => {
                      if (!checked) {
                        setValue('parent_id', null);
                      } else {
                        // Just set to some empty state or leave it null until selected
                        // We will allow combobox to be active
                        // But since isVariant derives from parent_id !== null, 
                        // we need to set it to something or use a separate state.
                        // Actually, using parent_id = '' to indicate it's active but empty.
                        setValue('parent_id', '');
                      }
                    }}
                    classNames={{ wrapper: "mr-0" }}
                  />
                </div>
              }
              icon={GitFork}
              error={fieldState.error?.message}
            >
              {/* The Drawer acts as a full screen search modal now, if no parent is selected */}
              {!parentRecipe && (
                <>
                  <Button
                    variant="flat"
                    className="w-full justify-start bg-default-100 hover:bg-default-200 text-default-500 text-left font-normal px-3"
                    onPress={onOpen}
                    isDisabled={!isVariant}
                    startContent={<Search className="w-4 h-4 text-default-400 shrink-0" />}
                  >
                    Tìm kiếm công thức gốc...
                  </Button>
                  <Drawer 
                    isOpen={isOpen} 
                    onOpenChange={onOpenChange} 
                    placement="bottom" 
                    size="full"
                    hideCloseButton
                    classNames={{
                      base: "h-[90vh]",
                    }}
                  >
                    <DrawerContent>
                      {(onClose) => (
                        <>
                          <DrawerHeader className="flex flex-col gap-1 px-4 py-3 border-b border-divider z-10">
                            <div className="flex items-center justify-between">
                              <span className="text-lg font-bold">Chọn công thức gốc</span>
                              <Button isIconOnly variant="light" size="md" onPress={onClose} className="bg-default-100 w-8 h-8 rounded-full">
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </DrawerHeader>
                          <DrawerBody className="p-4 pt-6 bg-default-50/50">
                            <div className="flex gap-2 mb-6">
                              <Input
                                autoFocus
                                placeholder="Tìm kiếm công thức gốc..."
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

                            {viewMode === 'grid' ? (
                              <div className="grid grid-cols-2 gap-4 overflow-y-auto pb-8">
                                {filteredRecipes.map((item) => (
                                  <RecipeCard
                                    key={item.id}
                                    recipe={item}
                                    viewType="grid-portrait-out"
                                    size="sm"
                                    hideMenu
                                    onClick={() => {
                                      handleParentSelect(item.id!);
                                      onClose();
                                    }}
                                  />
                                ))}
                                {filteredRecipes.length === 0 && (
                                  <div className="col-span-2 text-center text-default-500 py-12">
                                    Không tìm thấy công thức nào
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="flex flex-col gap-3 overflow-y-auto pb-8">
                                {filteredRecipes.map((item) => (
                                  <div
                                    key={item.id}
                                    className="flex items-center justify-between w-full p-3 hover:bg-default-100 rounded-xl cursor-pointer transition-colors bg-transparent border-none shadow-none"
                                    onClick={() => {
                                      handleParentSelect(item.id!);
                                      onClose();
                                    }}
                                  >
                                    <div className="flex items-center gap-3 min-w-0">
                                      <Avatar src={ImageManager.getAssetUrl(item.image_url || '')} radius="lg" className="w-24 h-24 shrink-0 text-large" fallback={item.title.charAt(0)} />
                                      <div className="flex flex-col min-w-0 flex-1">
                                        <span className="font-medium text-sm">{item.title}</span>
                                        <div className="flex items-center gap-3 text-xs text-default-400 mt-1">
                                          {item.taste_score ? (
                                            <span className="flex items-center gap-1"><Star className="w-3 h-3 text-warning" />{item.taste_score}</span>
                                          ) : null}
                                          {item.calories ? (
                                            <span className="flex items-center gap-1"><Flame className="w-3 h-3 text-danger" />{item.calories} kcal</span>
                                          ) : null}
                                          {item.difficulty ? (
                                            <span className="flex items-center gap-1"><ChefHat className="w-3 h-3 text-primary" />{item.difficulty}</span>
                                          ) : null}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                                {filteredRecipes.length === 0 && (
                                  <div className="text-center text-default-500 py-12">
                                    Không tìm thấy công thức nào
                                  </div>
                                )}
                              </div>
                            )}
                          </DrawerBody>
                        </>
                      )}
                    </DrawerContent>
                  </Drawer>
                </>
              )}

              {/* Render selected parent as a card */}
              {parentRecipe && (
                <div className="flex flex-col gap-0 border border-divider rounded-xl overflow-hidden mt-2">
                  <div className="flex gap-3 p-2 hover:bg-default-50 transition-colors group relative bg-default-50/50">
                    <Avatar src={ImageManager.getAssetUrl(parentRecipe.image_url || '')} radius="sm" className="w-10 h-10 shrink-0 text-small" fallback={parentRecipe.title.charAt(0)} />
                    <div className="flex flex-col justify-center flex-1 gap-0.5">
                      <h4 className="font-medium text-sm line-clamp-1 pr-6">{parentRecipe.title}</h4>
                      <div className="flex items-center gap-2 text-[10px] text-default-500">
                        {parentRecipe.taste_score ? (
                          <span className="flex items-center gap-0.5" title="Đánh giá"><Star className="w-3 h-3 text-warning" />{parentRecipe.taste_score}</span>
                        ) : null}
                        {parentRecipe.calories ? (
                          <span className="flex items-center gap-0.5" title="Calories"><Flame className="w-3 h-3 text-danger" />{parentRecipe.calories} kcal</span>
                        ) : null}
                        {parentRecipe.difficulty ? (
                          <span className="flex items-center gap-0.5" title="Độ khó"><ChefHat className="w-3 h-3 text-primary" />{parentRecipe.difficulty}</span>
                        ) : null}
                      </div>
                    </div>
                    <button 
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center bg-default-200/50 hover:bg-danger/20 text-default-500 hover:text-danger w-7 h-7 min-w-7 z-10 rounded-full cursor-pointer transition-colors"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setValue('parent_id', null, { shouldValidate: true, shouldDirty: true });
                      }}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </FormField>
          )}
        />
      </div>

      <RelatedRecipesSection />
    </div>
  );
}
