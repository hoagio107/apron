import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Tabs, Tab, EmptyState, Pagination, Input } from '@/ui';
import { Plus, ArrowDownUp, Share2, ListTodo, ShoppingCart, Search } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { useTranslation } from 'react-i18next';
import { useShoppingListStore } from '../../store/useShoppingListStore';
import { CATEGORIES } from '@apron/core';
import { useRecipeStore } from '../../store/useRecipeStore';
import { ShoppingListItemCard } from './components/ShoppingListItemCard';
import { RecommendedIngredients } from './components/RecommendedIngredients';
import { ShoppingListOmnibox } from './components/ShoppingListOmnibox';
import { RecipeCard } from '../../components/recipes/list/RecipeCard';

export function ShoppingListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { items, fetchItems, addItems, toggleItem, removeItems, updateItem } = useShoppingListStore();
  const { recipes, fetchRecipes } = useRecipeStore();
  
  const [activeTab, setActiveTab] = useState('pending');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [recipePage, setRecipePage] = useState(1);
  const [recipeSearch, setRecipeSearch] = useState('');

  const filteredRecipes = useMemo(() => {
    if (!recipeSearch.trim()) return recipes;
    const q = recipeSearch.toLowerCase().trim();
    return recipes.filter(r => r.title.toLowerCase().includes(q));
  }, [recipes, recipeSearch]);

  const RECIPES_PER_PAGE = 6;
  const totalRecipePages = Math.max(1, Math.ceil(filteredRecipes.length / RECIPES_PER_PAGE));
  const paginatedRecipes = useMemo(() => {
    const start = (recipePage - 1) * RECIPES_PER_PAGE;
    return filteredRecipes.slice(start, start + RECIPES_PER_PAGE);
  }, [filteredRecipes, recipePage]);

  const handleRecipeSearchChange = (val: string) => {
    setRecipeSearch(val);
    setRecipePage(1);
  };

  useEffect(() => {
    fetchItems();
    if (recipes.length === 0) {
      fetchRecipes();
    }
  }, [fetchItems, fetchRecipes, recipes.length]);

  const handleUpdateQuantity = (id: string, newQuantity: number) => {
    updateItem(id, { quantity: newQuantity });
  };

  const handleUpdateUnit = (id: string, newUnit: string) => {
    updateItem(id, { unit: newUnit });
  };

  const handleRemoveItem = (id: string) => {
    removeItems([id]);
  };

  const baseActiveItems = items.filter(item => !item.checked);
  const baseCompletedItems = items.filter(item => item.checked);

  let displayedActiveItems = baseActiveItems;
  let displayedCompletedItems = baseCompletedItems;

  if (activeTab === 'pending') {
    displayedCompletedItems = [];
  } else if (activeTab === 'done') {
    displayedActiveItems = [];
  } else if (activeTab === 'supplies') {
    displayedActiveItems = baseActiveItems.filter(item => item.group === CATEGORIES.OTHERS);
    displayedCompletedItems = baseCompletedItems.filter(item => item.group === CATEGORIES.OTHERS);
  } else if (activeTab === 'archived') {
    displayedActiveItems = [];
    displayedCompletedItems = [];
  }

  const sortedActiveItems = [...displayedActiveItems].sort((a, b) => {
    const nameA = a.name || a.title || a.ingredient_name || '';
    const nameB = b.name || b.title || b.ingredient_name || '';
    if (sortOrder === 'asc') return nameA.localeCompare(nameB);
    return nameB.localeCompare(nameA);
  });

  return (
    <div className="h-full flex flex-col pt-6">
      <div className="grid grid-cols-1 md:grid-cols-[60%_40%] gap-8 flex-1 min-h-0">
        
        {/* Left Column: Main List */}
        <div className="flex flex-col min-h-0">
          <PageHeader 
            title={
              <div className="flex items-center gap-2">
                <ListTodo className="w-6 h-6 text-primary" />
                <span>{t('shopping.title')}</span>
              </div>
            }
            showBackButton={false}
            className="mb-4 px-2 pt-0"
            actions={
              <div className="flex gap-2 items-center">
                <Button 
                  isIconOnly 
                  variant="flat" 
                  color="default"
                  onPress={() => navigator.clipboard.writeText(window.location.href).then(() => alert(t('shopping.copiedListSuccess')))}
                >
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            }
          />

          <div className="px-2 flex items-center justify-between mb-4 border-b border-default-200">
            <Tabs 
              selectedKey={activeTab}
              onSelectionChange={(k) => setActiveTab(k.toString())}
              variant="underlined" 
              color="primary"
              classNames={{
                cursor: "w-full bg-primary",
                tabList: "relative rounded-none p-0 border-none bg-transparent",
                tab: "px-4 h-12",
                tabContent: "text-default-500 group-data-[selected=true]:text-foreground font-medium"
              }}
            >
              <Tab key="all" title={t('shopping.filterAll', { count: items.length })} />
              <Tab key="pending" title={t('shopping.filterPending', { count: baseActiveItems.length })} />
              <Tab key="done" title={t('shopping.filterDone', { count: baseCompletedItems.length })} />
              <Tab key="supplies" title={t('shopping.supplies', { defaultValue: 'Đồ dùng' })} />
            </Tabs>
            
            <div className="flex items-center gap-2 mb-2">
              <ShoppingListOmnibox />
              
              <Button 
                isIconOnly 
                variant="flat" 
                color="default"
                onPress={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              >
                <ArrowDownUp className={`w-4 h-4 transition-transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
              </Button>
            </div>
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto px-2 pb-8 custom-scrollbar">
            {items.length === 0 ? (
              <EmptyState
                icon={<ShoppingCart className="w-10 h-10" />}
                title={t('shopping.empty.title')}
                description={t('shopping.empty.description')}
              />
            ) : (
              <div className="flex flex-col gap-3">
                {/* Active Items */}
                {sortedActiveItems.map(item => (
                  <ShoppingListItemCard 
                    key={item.id}
                    item={item}
                    onToggle={toggleItem}
                    onRemove={handleRemoveItem}
                    onUpdateQuantity={handleUpdateQuantity}
                    onUpdateUnit={handleUpdateUnit}
                  />
                ))}

                {/* Completed Items */}
                {displayedCompletedItems.length > 0 && (
                  <div className="flex flex-col gap-3 mt-4">
                    <h3 className="text-sm font-bold text-default-500 uppercase tracking-wider ml-1">{t('shopping.bought')}</h3>
                    {displayedCompletedItems.map(item => (
                      <ShoppingListItemCard 
                        key={item.id}
                        item={item}
                        onToggle={toggleItem}
                        onRemove={handleRemoveItem}
                        onUpdateQuantity={handleUpdateQuantity}
                        onUpdateUnit={handleUpdateUnit}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Discover */}
        <div className="hidden md:flex flex-col min-h-0 bg-default-50/50 rounded-l-3xl p-6 border-l border-divider">
          <RecommendedIngredients />

          <div className="mt-8 flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">{t('recipes.title')}</h3>
                <span className="text-xs text-default-400 font-medium">({filteredRecipes.length})</span>
              </div>
              <Button 
                variant="light" 
                size="sm" 
                className="text-primary font-medium hover:underline px-2 h-7"
                onPress={() => navigate('/recipes')}
              >
                {t('common.actions.more')} →
              </Button>
            </div>

            {/* Quick Search */}
            <div className="mb-3">
              <Input
                size="sm"
                variant="flat"
                placeholder={t('recipes.searchPlaceholder')}
                value={recipeSearch}
                onValueChange={handleRecipeSearchChange}
                startContent={<Search className="w-3.5 h-3.5 text-default-400" />}
                isClearable
                onClear={() => handleRecipeSearchChange('')}
                classNames={{
                  inputWrapper: "h-8 bg-content1/80 border-none shadow-none text-xs"
                }}
              />
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
              {filteredRecipes.length === 0 ? (
                <div className="text-center py-8 text-xs text-default-400">
                  {recipeSearch ? t('recipes.empty.title') : t('recipes.empty.description')}
                </div>
              ) : (
                <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
                  {paginatedRecipes.map(recipe => (
                    <div key={recipe.id} className="w-full">
                      <RecipeCard 
                        recipe={recipe} 
                        viewType="grid-landscape" 
                        size="sm" 
                        hideMenu={true}
                        actionIcon={<Plus className="w-5 h-5 text-white" />}
                        onActionClick={(e, recipe) => {
                          e.stopPropagation();
                          if (recipe.ingredients && recipe.ingredients.length > 0) {
                            const newItems = recipe.ingredients.map((ing: any) => ({
                              name: ing.name,
                              quantity: typeof ing.quantity === 'number' ? ing.quantity : 1,
                              unit: ing.unit || 'đơn vị',
                              group: ing.group
                            }));
                            addItems(newItems);
                          }
                        }}
                        onClick={() => navigate(`/recipes/${recipe.id}`)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {totalRecipePages > 1 && (
              <div className="flex justify-center pt-3 pb-1 border-t border-divider/30 mt-2 shrink-0">
                <Pagination 
                  total={totalRecipePages} 
                  page={recipePage} 
                  onChange={setRecipePage} 
                  size="sm" 
                  color="primary"
                  variant="flat"
                  showControls
                  classNames={{
                    wrapper: "gap-1 shadow-none",
                    item: "bg-transparent text-default-600 font-medium text-xs min-w-7 w-7 h-7",
                    cursor: "font-bold text-white shadow-none min-w-7 w-7 h-7",
                    prev: "min-w-7 w-7 h-7",
                    next: "min-w-7 w-7 h-7"
                  }}
                />
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
