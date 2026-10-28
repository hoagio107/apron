import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Key } from 'react';
import { Autocomplete, AutocompleteItem, Tabs, Tab, Avatar, toast } from '@/ui';
import { Search, Plus, BookOpen } from 'lucide-react';
import { useShoppingListStore } from '../../../store/useShoppingListStore';
import { useRecipeStore } from '../../../store/useRecipeStore';
import type { ShoppingListItem, Recipe } from '@apron/core';
import { getCategoryTheme } from '../../../lib/categoryTheme';
import { ImageManager } from '../../../lib/image-manager';

export function ShoppingListOmnibox() {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState('');
  const [searchTab, setSearchTab] = useState('all');
  
  const { items: listItems, addItem, addItems } = useShoppingListStore();
  const recipes = useRecipeStore(s => s.recipes);

  const normalizedInput = inputValue.toLowerCase().trim();

  // Filter List Items
  const filteredListItems = useMemo(() => {
    if (!normalizedInput) return [];
    return listItems.filter((i: ShoppingListItem) => (i.name || '').toLowerCase().includes(normalizedInput)).slice(0, 5);
  }, [listItems, normalizedInput]);

  // Filter Recipes
  const filteredRecipes = useMemo(() => {
    if (!normalizedInput) return [];
    return recipes.filter((r: Recipe) => (r.title || '').toLowerCase().includes(normalizedInput)).slice(0, 5);
  }, [recipes, normalizedInput]);

  const onSelectionChange = (key: Key | null) => {
    if (!key) return;
    const strKey = key.toString();
    
    if (strKey.startsWith('custom_')) {
      const name = strKey.replace('custom_', '');
      addItem(name, 1, 'phần');
      setInputValue('');
      toast.success(t('shopping.addIngredientsSuccess', { count: 1 }));
    } else if (strKey.startsWith('recipe_')) {
      const id = strKey.replace('recipe_', '');
      const recipe = recipes.find((r: Recipe) => r.id === id);
      if (recipe?.ingredients) {
        if (window.confirm(`Thêm tất cả nguyên liệu của món "${recipe.title}" vào danh sách?`)) {
          const newItems = recipe.ingredients.map((ing: any) => ({
            name: ing.name,
            quantity: typeof ing.quantity === 'number' ? ing.quantity : 1,
            unit: ing.unit,
            group: ing.group
          }));
          addItems(newItems);
          setInputValue('');
          toast.success(`Đã thêm nguyên liệu của ${recipe.title}`);
        }
      }
    } else if (strKey.startsWith('list_')) {
      setInputValue('');
    }
  };

  return (
    <div className="w-full lg:w-[320px]">
      <Autocomplete
        aria-label={t('shopping.omniboxPlaceholder')}
        placeholder={t('shopping.omniboxPlaceholder')}
        startContent={<Search className="w-4 h-4 text-default-400" />}
        inputValue={inputValue}
        onInputChange={setInputValue}
        onSelectionChange={onSelectionChange}
        menuTrigger="input"
        classNames={{
          base: "w-full",
          listboxWrapper: "max-h-[400px]",
          selectorButton: "hidden"
        }}
        listboxProps={{
          itemClasses: {
            base: "data-[hover=true]:bg-default-100/40 transition-colors"
          },
          topContent: (
            <div className="sticky top-0 z-20 bg-content1 pb-2 pt-1 px-1">
              <Tabs 
                size="sm" 
                selectedKey={searchTab} 
                onSelectionChange={(k) => setSearchTab(k.toString())}
                classNames={{
                  tabList: "w-full",
                }}
              >
                <Tab key="all" title={t('shopping.tabAll')} />
                <Tab key="recipes" title={t('shopping.tabRecipes')} />
                <Tab key="in_list" title={t('shopping.tabInList')} />
              </Tabs>
            </div>
          )
        }}
      >
        {filteredListItems.length > 0 || filteredRecipes.length > 0 || normalizedInput ? (
          [
            // 1. Trong danh sách đi chợ (Active Items)
            ...(searchTab === 'all' || searchTab === 'in_list') ? filteredListItems.map((item: ShoppingListItem) => {
              const theme = getCategoryTheme(item.group);
              const Icon = theme.icon;
              return (
                <AutocompleteItem key={`list_${item.id}`} textValue={item.name} className="py-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-md flex-shrink-0 flex items-center justify-center ${theme.bg} ${theme.text}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{item.name}</span>
                      <span className="text-xs text-default-400">{t('shopping.alreadyInList', { qty: item.quantity, unit: item.unit })}</span>
                    </div>
                  </div>
                </AutocompleteItem>
              );
            }) : [],

            // 2. Công thức nấu ăn (Recipes)
            ...(searchTab === 'all' || searchTab === 'recipes') ? filteredRecipes.map((recipe: Recipe) => (
              <AutocompleteItem key={`recipe_${recipe.id}`} textValue={recipe.title} className="py-2">
                <div className="flex items-center gap-3">
                  {recipe.image_url ? (
                    <Avatar 
                      src={ImageManager.getAssetUrl(recipe.image_url)} 
                      radius="md" 
                      showFallback
                      className="w-10 h-10 flex-shrink-0 bg-default-100" 
                      fallback={<BookOpen className="w-5 h-5 text-default-400" />}
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-md flex-shrink-0 bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary-600">
                      <BookOpen className="w-5 h-5" />
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{recipe.title}</span>
                    <span className="text-xs text-default-400">
                      {recipe.prep_time + recipe.cook_time} phút • {recipe.difficulty || 'Dễ'}
                    </span>
                  </div>
                </div>
              </AutocompleteItem>
            )) : [],

            // 3. Custom Add
            (searchTab === 'all') && normalizedInput ? (
              <AutocompleteItem key={`custom_${normalizedInput}`} textValue={inputValue} className="py-2">
                <div className="flex items-center gap-3 text-secondary">
                  <div className="w-10 h-10 rounded-md flex-shrink-0 bg-secondary/10 flex items-center justify-center">
                    <Plus className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-medium">{t('shopping.addItemPrompt', { name: inputValue })}</span>
                </div>
              </AutocompleteItem>
            ) : null
          ].flat().filter(Boolean) as any
        ) : (
          <AutocompleteItem key="empty" className="hidden">{t('shopping.noData')}</AutocompleteItem>
        )}
      </Autocomplete>
    </div>
  );
}
