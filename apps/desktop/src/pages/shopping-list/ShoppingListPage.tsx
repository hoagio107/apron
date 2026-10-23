import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Tabs, Tab, EmptyState } from '@/ui';
import { Plus, Search, ArrowDownUp, Share2, ListTodo, ShoppingCart } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { useShoppingListStore } from '../../store/useShoppingListStore';
import { CATEGORIES } from '@apron/core';
import { useRecipeStore } from '../../store/useRecipeStore';
import { ShoppingListItemCard } from './components/ShoppingListItemCard';
import { RecommendedIngredients } from './components/RecommendedIngredients';
import { ShoppingListOmnibox } from './components/ShoppingListOmnibox';
import { RecipeCard } from '../../components/recipes/list/RecipeCard';

export function ShoppingListPage() {
  const navigate = useNavigate();
  const { items, fetchItems, addItem, toggleItem, removeItems, updateItem } = useShoppingListStore();
  const { recipes, fetchRecipes } = useRecipeStore();
  
  const [activeTab, setActiveTab] = useState('pending');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

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
                <span>Danh sách đi chợ</span>
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
                  onPress={() => navigator.clipboard.writeText(window.location.href).then(() => alert('Đã sao chép liên kết vào bộ nhớ tạm!'))}
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
              <Tab key="all" title={`Tất cả (${items.length})`} />
              <Tab key="pending" title={`Chưa mua (${baseActiveItems.length})`} />
              <Tab key="done" title={`Đã mua (${baseCompletedItems.length})`} />
              <Tab key="supplies" title="Đồ dùng" />
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
                title="Danh sách trống"
                description="Bạn chưa có nguyên liệu nào cần mua. Hãy thêm vào danh sách để chuẩn bị cho bữa ăn của mình nhé."
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
                    <h3 className="text-sm font-bold text-default-500 uppercase tracking-wider ml-1">Đã mua</h3>
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
        <div className="hidden md:flex flex-col min-h-0 bg-default-50/50 rounded-l-3xl p-6 border-l border-default-100">
          <RecommendedIngredients />

          <div className="mt-8 flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Tất cả công thức</h3>
              <Button variant="light" size="sm" className="text-primary font-medium">Xem thêm →</Button>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-3 gap-3">
                {recipes.slice(0, 6).map(recipe => (
                  <div key={recipe.id} className="w-full">
                    <RecipeCard 
                      recipe={recipe} 
                      viewType="grid-landscape" 
                      size="sm" 
                      hideMenu={true}
                      actionIcon={<Plus className="w-5 h-5 text-white" />}
                      onActionClick={(e, recipe) => {
                        e.stopPropagation();
                        // TODO: Implement adding recipe ingredients to shopping list
                        console.log('Add recipe to shopping list', recipe.title);
                      }}
                      onClick={() => navigate(`/recipes/${recipe.id}`)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
