import React, { useState, useMemo } from 'react';
import type { Key } from 'react';
import { Autocomplete, AutocompleteItem, Tabs, Tab, Avatar } from '@/ui';
import { Search, Plus, BookOpen } from 'lucide-react';
import { useShoppingListStore } from '../../../store/useShoppingListStore';
import { useIngredientCatalogStore } from '../../../store/useIngredientCatalogStore';
import { useRecipeStore } from '../../../store/useRecipeStore';
import type { ShoppingListItem, Recipe } from '@apron/core';
import type { IngredientMeta } from '../../../store/useIngredientCatalogStore';
import { getCategoryTheme } from '../../../lib/categoryTheme';
import { ImageManager } from '../../../lib/image-manager';

export function ShoppingListOmnibox() {
  const [inputValue, setInputValue] = useState('');
  const [searchTab, setSearchTab] = useState('all');
  
  const { items: listItems, addItem, addItems } = useShoppingListStore();
  const getAllIngredients = useIngredientCatalogStore(s => s.getAllIngredients);
  const catalogItems = getAllIngredients();
  const recipes = useRecipeStore(s => s.recipes);

  const normalizedInput = inputValue.toLowerCase().trim();

  // Filter List Items
  const filteredListItems = useMemo(() => {
    if (!normalizedInput) return [];
    return listItems.filter((i: ShoppingListItem) => (i.name || '').toLowerCase().includes(normalizedInput)).slice(0, 5);
  }, [listItems, normalizedInput]);

  // Filter Catalog Items
  const filteredCatalogItems = useMemo(() => {
    if (!normalizedInput) return [];
    return catalogItems.filter((i: IngredientMeta) => (i.name || '').toLowerCase().includes(normalizedInput) && !listItems.find((li: ShoppingListItem) => (li.name || '').toLowerCase() === (i.name || '').toLowerCase())).slice(0, 5);
  }, [catalogItems, normalizedInput, listItems]);

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
      addItem(name, 1, 'đơn vị');
      setInputValue('');
      alert(`Đã thêm ${name} vào danh sách`);
    } else if (strKey.startsWith('catalog_')) {
      const id = strKey.replace('catalog_', '');
      const catItem = catalogItems.find((i: IngredientMeta) => i.id === id);
      if (catItem) {
        addItem(catItem.name, 1, catItem.default_unit || 'đơn vị', catItem.default_category);
        setInputValue('');
        alert(`Đã thêm ${catItem.name} vào danh sách`);
      }
    } else if (strKey.startsWith('recipe_')) {
      const id = strKey.replace('recipe_', '');
      const recipe = recipes.find((r: Recipe) => r.id === id);
      if (recipe && recipe.ingredients) {
        if (window.confirm(`Thêm tất cả nguyên liệu của món "${recipe.title}" vào danh sách?`)) {
          const newItems = recipe.ingredients.map((ing: any) => ({
            name: ing.name,
            quantity: typeof ing.quantity === 'number' ? ing.quantity : 1,
            unit: ing.unit,
            group: ing.group
          }));
          addItems(newItems);
          setInputValue('');
          alert(`Đã thêm nguyên liệu của ${recipe.title}`);
        }
      }
    } else if (strKey.startsWith('list_')) {
      setInputValue('');
    }
  };

  return (
    <div className="w-full lg:w-[320px]">
      <Autocomplete
        aria-label="Tìm kiếm đa năng"
        placeholder="Thêm nguyên liệu, công thức..."
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
                <Tab key="all" title="Tất cả" />
                <Tab key="catalog" title="Từ điển" />
                <Tab key="recipes" title="Công thức" />
                <Tab key="in_list" title="Đã có" />
              </Tabs>
            </div>
          )
        }}
      >
        {filteredListItems.length > 0 || filteredCatalogItems.length > 0 || filteredRecipes.length > 0 || normalizedInput ? (
          [
            // 1. Trong danh sách đi chợ (Active Items)
            ...(searchTab === 'all' || searchTab === 'in_list') ? filteredListItems.map((item: ShoppingListItem) => {
              const catalogItem = catalogItems.find((c: IngredientMeta) => (c.name || '').toLowerCase() === (item.name || '').toLowerCase());
              return (
                <AutocompleteItem key={`list_${item.id}`} textValue={item.name} className="py-2">
                  <div className="flex items-center gap-3">
                    {(() => {
                      const group = catalogItem?.default_category || item.group;
                      const theme = getCategoryTheme(group);
                      const Icon = theme.icon;
                      
                      return catalogItem?.image_url ? (
                        <Avatar 
                          src={ImageManager.getAssetUrl(catalogItem.image_url)} 
                          radius="md" 
                          showFallback
                          className="w-10 h-10 flex-shrink-0 bg-default-100" 
                          fallback={<Icon className="w-5 h-5 text-default-400" />}
                        />
                      ) : (
                        <div className={`w-10 h-10 rounded-md flex-shrink-0 flex items-center justify-center ${theme.bg} ${theme.text}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                      );
                    })()}
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{item.name}</span>
                      <span className="text-xs text-default-400">Đã có trong danh sách • {item.quantity} {item.unit}</span>
                    </div>
                  </div>
                </AutocompleteItem>
              );
            }) : [],

            // 2. Từ điển nguyên liệu (Catalog)
            ...(searchTab === 'all' || searchTab === 'catalog') ? filteredCatalogItems.map((item: IngredientMeta) => (
              <AutocompleteItem key={`catalog_${item.id}`} textValue={item.name} className="py-2">
                <div className="flex items-center gap-3">
                  {(() => {
                    const theme = getCategoryTheme(item.default_category);
                    const Icon = theme.icon;
                    return item.image_url ? (
                      <Avatar 
                        src={ImageManager.getAssetUrl(item.image_url)} 
                        radius="md" 
                        showFallback
                        className="w-10 h-10 flex-shrink-0 bg-default-100" 
                        fallback={<Icon className="w-5 h-5 text-default-400" />}
                      />
                    ) : (
                      <div className={`w-10 h-10 rounded-md flex-shrink-0 flex items-center justify-center ${theme.bg} ${theme.text}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                    );
                  })()}
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{item.name}</span>
                    <span className="text-xs text-default-400">Nguyên liệu: {item.default_category || 'Khác'}</span>
                  </div>
                </div>
              </AutocompleteItem>
            )) : [],

            // 3. Công thức nấu ăn (Recipes)
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
                    <div className="w-10 h-10 rounded-md flex-shrink-0 bg-primary-50 flex items-center justify-center text-primary-600">
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

            // 4. Custom Add
            (searchTab === 'all' || searchTab === 'catalog') && normalizedInput && !filteredCatalogItems.find((i: IngredientMeta) => (i.name || '').toLowerCase() === normalizedInput) ? (
              <AutocompleteItem key={`custom_${normalizedInput}`} textValue={inputValue} className="py-2">
                <div className="flex items-center gap-3 text-secondary">
                  <div className="w-10 h-10 rounded-md flex-shrink-0 bg-secondary/10 flex items-center justify-center">
                    <Plus className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-medium">Thêm "{inputValue}"</span>
                </div>
              </AutocompleteItem>
            ) : null
          ].flat().filter(Boolean) as any
        ) : (
          <AutocompleteItem key="empty" className="hidden">Không có dữ liệu</AutocompleteItem>
        )}
      </Autocomplete>
    </div>
  );
}
