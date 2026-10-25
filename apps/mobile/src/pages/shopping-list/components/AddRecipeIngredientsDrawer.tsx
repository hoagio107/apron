import { useState, useMemo, useEffect } from 'react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  Button,
  Checkbox
} from '@/ui';
import { Search, ChefHat, X, ShoppingCart, ChevronRight, ArrowLeft } from 'lucide-react';
import type { Recipe } from '@apron/core';
import { useRecipeStore } from '../../../store/useRecipeStore';
import { ImageManager } from '../../../lib/image-manager';

interface AddRecipeIngredientsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onAddIngredients: (
    items: { name: string; quantity?: number; unit?: string; group?: string }[]
  ) => void;
}

export function AddRecipeIngredientsDrawer({
  isOpen,
  onClose,
  onAddIngredients
}: AddRecipeIngredientsDrawerProps) {
  const { recipes, fetchRecipes } = useRecipeStore();
  const [search, setSearch] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [selectedIngredients, setSelectedIngredients] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (recipes.length === 0) {
      fetchRecipes();
    }
  }, [recipes.length, fetchRecipes]);

  // Filter recipes
  const filteredRecipes = useMemo(() => {
    return recipes.filter((r) =>
      r.title.toLowerCase().includes(search.toLowerCase())
    );
  }, [recipes, search]);

  // When a recipe is selected, select all its ingredients by default
  const handleSelectRecipe = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    const allIndices = new Set<number>();
    if (recipe.ingredients) {
      recipe.ingredients.forEach((_, idx) => allIndices.add(idx));
    }
    setSelectedIngredients(allIndices);
  };

  const toggleIngredient = (idx: number) => {
    const updated = new Set(selectedIngredients);
    if (updated.has(idx)) {
      updated.delete(idx);
    } else {
      updated.add(idx);
    }
    setSelectedIngredients(updated);
  };

  const handleConfirmAdd = () => {
    if (!selectedRecipe?.ingredients) return;

    const itemsToAdd = selectedRecipe.ingredients
      .filter((_, idx) => selectedIngredients.has(idx))
      .map((ing) => ({
        name: ing.name,
        quantity: typeof ing.quantity === 'number' ? ing.quantity : undefined,
        unit: ing.unit,
        group: ing.group
      }));

    if (itemsToAdd.length > 0) {
      onAddIngredients(itemsToAdd);
    }
    handleClose();
  };

  const handleClose = () => {
    setSelectedRecipe(null);
    setSearch('');
    setSelectedIngredients(new Set());
    onClose();
  };

  return (
    <Drawer
      isOpen={isOpen}
      onOpenChange={(open) => !open && handleClose()}
      placement="bottom"
      size="2xl"
      radius="lg"
      hideCloseButton
      classNames={{
        base: 'max-h-[85vh] rounded-t-3xl bg-content1 text-foreground flex flex-col',
        body: 'p-4 flex-1 overflow-y-auto',
      }}
    >
      <DrawerContent hideCloseButton>
        {/* Header */}
        <DrawerHeader className="flex flex-col gap-1 border-b border-divider/40 px-4 pt-3 pb-3 shrink-0">
          <div className="w-10 h-1 rounded-full bg-default-300 mx-auto mb-2" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {selectedRecipe && (
                <button
                  type="button"
                  onClick={() => setSelectedRecipe(null)}
                  className="p-1.5 -ml-1 rounded-lg text-default-500 hover:text-foreground hover:bg-default-100 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <div>
                <h3 className="text-base sm:text-lg font-bold text-foreground">
                  {selectedRecipe ? selectedRecipe.title : 'Thêm từ công thức'}
                </h3>
                <p className="text-xs text-default-400 font-medium">
                  {selectedRecipe
                    ? `Chọn nguyên liệu cần mua (${selectedIngredients.size}/${selectedRecipe.ingredients?.length || 0})`
                    : 'Chọn công thức để thêm nguyên liệu vào giỏ đi chợ'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="p-2 rounded-full text-default-400 hover:text-foreground hover:bg-default-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </DrawerHeader>

        <DrawerBody>
          {!selectedRecipe ? (
            /* STEP 1: DANH SÁCH CÔNG THỨC */
            <div className="flex flex-col gap-3">
              {/* Search Bar */}
              <div className="relative w-full">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-default-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm công thức nấu ăn..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-default-100 dark:bg-default-50/20 text-foreground placeholder:text-default-400 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/40 font-medium transition-all"
                />
              </div>

              {/* Recipe List */}
              <div className="flex flex-col divide-y divide-divider/30 -mx-4 px-4 max-h-[50vh] overflow-y-auto">
                {filteredRecipes.length === 0 ? (
                  <div className="py-12 text-center text-default-400">
                    <ChefHat className="w-10 h-10 opacity-30 mx-auto mb-2" />
                    <p className="text-sm font-medium">Không tìm thấy công thức nào</p>
                  </div>
                ) : (
                  filteredRecipes.map((r) => {
                    const ingCount = r.ingredients?.length || 0;
                    return (
                      <div
                        key={r.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => handleSelectRecipe(r)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSelectRecipe(r);
                        }}
                        className="py-3 flex items-center justify-between gap-3 active:bg-default-100/50 hover:bg-default-100/30 transition-colors cursor-pointer select-none group"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-12 h-12 rounded-xl bg-default-100 overflow-hidden shrink-0 relative">
                            {r.image_url ? (
                              <img
                                src={ImageManager.getAssetUrl(r.image_url)}
                                alt={r.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                onError={(e) => {
                                  (e.target as HTMLElement).classList.add('hidden');
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-default-400">
                                <ChefHat className="w-5 h-5 opacity-40" />
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors truncate">
                              {r.title}
                            </h4>
                            <p className="text-xs text-default-400 mt-0.5">
                              {ingCount} nguyên liệu • {r.category || 'Món ăn'}
                            </p>
                          </div>
                        </div>

                        <ChevronRight className="w-4 h-4 text-default-400 group-hover:text-primary transition-colors shrink-0" />
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            /* STEP 2: CHỌN NGUYÊN LIỆU TRONG CÔNG THỨC */
            <div className="flex flex-col gap-3">
              {/* Select all toggle */}
              <div className="flex items-center justify-between px-1 pb-2 border-b border-divider/40">
                <span className="text-xs font-semibold text-default-500">
                  Tất cả nguyên liệu ({selectedRecipe.ingredients?.length || 0})
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedIngredients.size === (selectedRecipe.ingredients?.length || 0)) {
                      setSelectedIngredients(new Set());
                    } else {
                      const all = new Set<number>();
                      selectedRecipe.ingredients?.forEach((_, i) => all.add(i));
                      setSelectedIngredients(all);
                    }
                  }}
                  className="text-xs font-bold text-primary hover:underline"
                >
                  {selectedIngredients.size === (selectedRecipe.ingredients?.length || 0)
                    ? 'Bỏ chọn tất cả'
                    : 'Chọn tất cả'}
                </button>
              </div>

              {/* Ingredients List */}
              <div className="flex flex-col gap-1.5 max-h-[45vh] overflow-y-auto">
                {selectedRecipe.ingredients?.map((ing, idx) => {
                  const isChecked = selectedIngredients.has(idx);
                  return (
                    <div
                      key={idx}
                      role="button"
                      tabIndex={0}
                      onClick={() => toggleIngredient(idx)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') toggleIngredient(idx);
                      }}
                      className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 transition-colors cursor-pointer select-none ${
                        isChecked
                          ? 'bg-primary/10 border-primary/40'
                          : 'bg-default-50/40 dark:bg-default-50/10 border-divider/40 opacity-70'
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Checkbox
                          isSelected={isChecked}
                          onValueChange={() => toggleIngredient(idx)}
                          size="sm"
                          color="primary"
                          radius="full"
                          aria-label={ing.name}
                        />
                        <span className="text-sm font-semibold text-foreground truncate">
                          {ing.name}
                        </span>
                      </div>

                      <span className="text-xs font-bold text-default-500 shrink-0">
                        {ing.quantity ? `${ing.quantity} ` : ''}
                        {ing.unit || ''}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Submit Button */}
              <Button
                color="primary"
                className="w-full rounded-xl font-bold h-11 mt-2"
                startContent={<ShoppingCart className="w-4 h-4" />}
                disabled={selectedIngredients.size === 0}
                onClick={handleConfirmAdd}
              >
                Thêm {selectedIngredients.size} nguyên liệu vào giỏ
              </Button>
            </div>
          )}
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
