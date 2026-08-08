import { useState, useMemo } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { Input, Autocomplete, AutocompleteItem, Avatar, Checkbox, Button } from '@apron/ui';
import { Youtube, Link as LinkIcon, GitFork, Search, Star, Flame, ChefHat, X } from 'lucide-react';
import type { FormValues } from './schema';
import { FormField } from '../../shared/form';
import { HierarchicalTagSelect } from './HierarchicalTagSelect';
import { RelatedRecipesSection } from './RelatedRecipesSection';
import type { Tag } from '@apron/core';
import { useRecipeStore } from '../../../store/useRecipeStore';
import { ImageManager } from '../../../lib/image-manager';

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

      <div className="flex gap-4">
        <Controller
          name="video_url"
          control={control}
          render={({ field, fieldState }) => (
            <FormField label="Video URL (YouTube/Tiktok)" icon={Youtube} error={fieldState.error?.message} className="flex-1">
              <Input
                {...field}
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
              {/* The Autocomplete acts purely as a search bar now, if no parent is selected */}
              {!parentRecipe && (
                <Autocomplete
                  aria-label="Chọn công thức gốc"
                  inputValue={searchValue}
                  onInputChange={setSearchValue}
                  selectedKey={null}
                  onSelectionChange={handleParentSelect}
                  placeholder="Tìm kiếm công thức gốc..."
                  startContent={<Search className="w-4 h-4 text-default-400" />}
                  items={filteredRecipes}
                  variant="flat"
                  isDisabled={!isVariant}
                  defaultItems={recipes.filter(r => r.id !== currentRecipeId)}
                  selectorButtonProps={{ className: 'hidden' }}
                >
                  {(item) => (
                    <AutocompleteItem 
                      key={item.id!} 
                      textValue={item.title}
                      className="data-[hover=true]:bg-default-100 data-[hover=true]:text-default-foreground transition-colors"
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar src={ImageManager.getAssetUrl(item.image_url || '')} radius="sm" className="w-8 h-8 shrink-0 text-tiny" fallback={item.title.charAt(0)} />
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="font-medium text-sm">{item.title}</span>
                            <div className="flex items-center gap-3 text-xs text-default-400 mt-0.5">
                              {item.taste_score ? (
                                <span className="flex items-center gap-1"><Star className="w-3 h-3 text-warning" />{item.taste_score}</span>
                              ) : null}
                              {item.calories ? (
                                <span className="flex items-center gap-1"><Flame className="w-3 h-3 text-danger" />{item.calories}</span>
                              ) : null}
                              {item.difficulty ? (
                                <span className="flex items-center gap-1"><ChefHat className="w-3 h-3 text-primary" />{item.difficulty}</span>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </div>
                    </AutocompleteItem>
                  )}
                </Autocomplete>
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
                          <span className="flex items-center gap-0.5" title="Calories"><Flame className="w-3 h-3 text-danger" />{parentRecipe.calories}</span>
                        ) : null}
                        {parentRecipe.difficulty ? (
                          <span className="flex items-center gap-0.5" title="Độ khó"><ChefHat className="w-3 h-3 text-primary" />{parentRecipe.difficulty}</span>
                        ) : null}
                      </div>
                    </div>
                    <Button 
                      isIconOnly 
                      size="sm" 
                      color="danger" 
                      variant="light" 
                      className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-default-100/50 hover:bg-danger/20 w-6 h-6 min-w-6"
                      onPress={() => setValue('parent_id', null)}
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
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
