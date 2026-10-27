import { useState, useEffect } from 'react';
import { 
  DndContext, 
  DragOverlay, 
  closestCenter,
  type DragStartEvent,
  type DragEndEvent
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { ChevronLeft, ChevronRight, CalendarDays, ChefHat, Settings, LayoutList, LayoutGrid, Calculator, X, Plus } from 'lucide-react';
import { Button } from '@/ui';
import type { Recipe, MealType } from '@apron/core';

import { useMealPlanStore } from '../../store/useMealPlanStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { WeeklyCalendar } from './components/WeeklyCalendar';
import { RecipeSidebar } from './components/RecipeSidebar';

export function MealPlannerPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeRecipe, setActiveRecipe] = useState<Recipe | null>(null);
  
  // Settings state
  const [showSettings, setShowSettings] = useState(false);
  const [newDefaultSlotName, setNewDefaultSlotName] = useState('');
  const { viewMode, showDailyAggregates, defaultSlots, setViewMode, setShowDailyAggregates, addDefaultSlot, removeDefaultSlot } = useSettingsStore();
  
  const { mealPlans, fetchMealPlans, addMealPlanEntry, removeMealPlanEntry, updateMealSlots } = useMealPlanStore();

  // Lấy ra các ngày trong tuần của currentDate (Monday to Sunday)
  const getDaysOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Điều chỉnh để Thứ 2 là ngày đầu tuần
    const monday = new Date(d.setDate(diff));
    
    return Array.from({ length: 7 }).map((_, i) => {
      const nextDay = new Date(monday);
      nextDay.setDate(monday.getDate() + i);
      return nextDay;
    });
  };

  const days = getDaysOfWeek(currentDate);
  const startDate = days[0].toISOString().split('T')[0];
  const endDate = days[6].toISOString().split('T')[0];

  useEffect(() => {
    fetchMealPlans(startDate, endDate);
  }, [startDate, endDate, fetchMealPlans]);

  const handlePrevWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 7);
    setCurrentDate(d);
  };

  const handleNextWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 7);
    setCurrentDate(d);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    if (active.data.current?.type === 'recipe') {
      setActiveRecipe(active.data.current.recipe);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveRecipe(null);

    if (!over) return;

    if (active.data.current?.type === 'meal-slot' && over.data.current?.type === 'meal-slot') {
      const activeDate = active.data.current.date as string;
      const overDate = over.data.current.date as string;
      
      if (activeDate === overDate) {
        const activeId = active.data.current.mealType as string;
        const overId = over.data.current.mealType as string;

        if (activeId !== overId) {
          const plan = mealPlans.find(p => p.date === activeDate);
          
          const slots = plan?.slots || defaultSlots;
          
          const oldIndex = slots.findIndex(s => s.id === activeId);
          const newIndex = slots.findIndex(s => s.id === overId);
          
          if (oldIndex !== -1 && newIndex !== -1) {
            const newSlots = arrayMove(slots, oldIndex, newIndex);
            await updateMealSlots(activeDate, newSlots);
          }
        }
      }
      return;
    }

    if (active.data.current?.type === 'recipe' && over.data.current?.type === 'meal-slot') {
      const recipe = active.data.current?.recipe as Recipe;
      const date = over.data.current.date as string;
      const mealType = over.data.current.mealType as MealType;
      
      if (recipe && date && mealType) {
        await addMealPlanEntry(date, {
          recipe_id: recipe.id!,
          meal_type: mealType
        });
      }
    }
  };

  return (
    <DndContext 
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col h-full gap-6 w-full pt-6 pb-8 min-w-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-4 shrink-0">
            <div className="w-14 h-14 rounded-2xl shadow-sm bg-primary/10 flex items-center justify-center shrink-0 text-primary">
              <CalendarDays className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground leading-tight">Thực đơn tuần</h1>
              <p className="text-default-500">Kéo thả công thức vào các bữa ăn trong tuần</p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-content1 p-2 rounded-xl relative">
            <Button isIconOnly variant="light" size="sm" onPress={handlePrevWeek}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="text-sm font-semibold min-w-[140px] text-center">
              {days[0].toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })} - {days[6].toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
            </div>
            <Button isIconOnly variant="light" size="sm" onPress={handleNextWeek}>
              <ChevronRight className="w-5 h-5" />
            </Button>
            
            <div className="w-px h-6 bg-default-200 mx-1"></div>
            
            <Button isIconOnly variant="light" size="sm" onPress={() => setShowSettings(!showSettings)} className={showSettings ? "bg-default-100" : ""}>
              <Settings className="w-4 h-4 text-default-600" />
            </Button>
            
            {showSettings && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowSettings(false)}></div>
                <div className="absolute top-full right-0 mt-2 w-72 bg-content1 border border-default-200 rounded-xl shadow-lg z-50 p-3 flex flex-col gap-3">
                  <h3 className="text-sm font-semibold text-foreground px-1 flex items-center gap-1.5">
                    <Settings className="w-4 h-4 text-default-500" />
                    Cài đặt hiển thị
                  </h3>
                
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-default-500 font-medium px-1">Giao diện thẻ</span>
                  <div className="flex bg-default-100 rounded-lg p-1 gap-1">
                    <button 
                      onClick={() => setViewMode('list')}
                      className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-2 rounded-md text-xs font-medium transition-colors ${viewMode === 'list' ? 'bg-background shadow-sm text-foreground' : 'text-default-500 hover:text-default-700'}`}
                    >
                      <LayoutList className="w-3.5 h-3.5" />
                      Danh sách
                    </button>
                    <button 
                      onClick={() => setViewMode('card')}
                      className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-2 rounded-md text-xs font-medium transition-colors ${viewMode === 'card' ? 'bg-background shadow-sm text-foreground' : 'text-default-500 hover:text-default-700'}`}
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                      Dạng Card
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-default-500" />
                    <span className="text-xs font-medium">Thống kê Ngày</span>
                  </div>
                  <button 
                    onClick={() => setShowDailyAggregates(!showDailyAggregates)}
                    className={`w-8 h-4 rounded-full transition-colors relative flex items-center ${showDailyAggregates ? 'bg-primary' : 'bg-default-200'}`}
                  >
                    <div className={`w-3 h-3 rounded-full bg-white transition-transform ${showDailyAggregates ? 'translate-x-[18px]' : 'translate-x-[2px]'}`}></div>
                  </button>
                </div>

                {/* Default slots manager */}
                <div className="flex flex-col gap-2 mt-1 border-t border-default-200 pt-3">
                  <span className="text-xs text-default-500 font-medium px-1">Cấu trúc bữa mẫu (cho ngày trống)</span>
                  <div className="flex flex-col gap-1 max-h-[150px] overflow-y-auto pr-1">
                    {defaultSlots.map(slot => (
                      <div key={slot.id} className="flex items-center justify-between bg-default-50 p-1.5 px-2 rounded-md">
                        <span className="text-xs font-medium text-default-700">{slot.name}</span>
                        {defaultSlots.length > 1 && (
                          <button onClick={() => removeDefaultSlot(slot.id)} className="text-default-400 hover:text-danger p-0.5 rounded-md hover:bg-danger-50">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <input 
                      type="text" 
                      className="flex-1 bg-default-50 text-xs px-2 py-1.5 rounded-md border border-default-200 outline-none focus:border-primary" 
                      placeholder="Tên bữa..."
                      value={newDefaultSlotName}
                      onChange={(e) => setNewDefaultSlotName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newDefaultSlotName.trim()) {
                          addDefaultSlot(newDefaultSlotName.trim());
                          setNewDefaultSlotName('');
                        }
                      }}
                    />
                    <button 
                      onClick={() => {
                        if (newDefaultSlotName.trim()) {
                          addDefaultSlot(newDefaultSlotName.trim());
                          setNewDefaultSlotName('');
                        }
                      }}
                      disabled={!newDefaultSlotName.trim()}
                      className="p-1.5 bg-primary text-white rounded-md disabled:opacity-50"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
              </>
            )}
          </div>
        </div>

        {/* Main Content: Calendar + Sidebar */}
        <div className="flex-1 flex gap-6 min-h-0 min-w-0">
          {/* Calendar Grid */}
          <WeeklyCalendar 
            days={days} 
            mealPlans={mealPlans}
            onRemoveEntry={removeMealPlanEntry}
            viewMode={viewMode}
            showDailyAggregates={showDailyAggregates}
          />
          
          {/* Sidebar */}
          <div className="hidden lg:block w-80 shrink-0 app-card overflow-hidden">
            <RecipeSidebar />
          </div>
        </div>
      </div>

      <DragOverlay>
        {activeRecipe ? (
          <div className="w-64 p-3 rounded-xl border-2 border-primary bg-content1 shadow-2xl flex items-center gap-3 opacity-90 scale-105">
            <div className="w-12 h-12 rounded-lg bg-default-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
              {activeRecipe.image_url ? (
                <img src={activeRecipe.image_url} alt={activeRecipe.title} className="w-full h-full object-cover" />
              ) : (
                <ChefHat className="w-5 h-5 text-default-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{activeRecipe.title}</p>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
