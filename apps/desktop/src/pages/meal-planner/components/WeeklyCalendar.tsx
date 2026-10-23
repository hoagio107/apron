import { useState, useRef } from 'react';
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChefHat, X, ChevronLeft, ChevronRight, ShoppingCart, Plus, BookOpen, Clock, Flame, Check } from 'lucide-react';
import { Button } from '@/ui';
import { ImageManager } from '../../../lib/image-manager';
import type { MealPlan, MealPlanEntry } from '@apron/core';
import { useRecipeStore } from '../../../store/useRecipeStore';
import { useMealPlanStore } from '../../../store/useMealPlanStore';
import { useSettingsStore } from '../../../store/useSettingsStore';

interface MealSlotProps {
  date: string;
  mealType: string;
  label: string;
  entries: MealPlanEntry[];
  onRemoveEntry: (entryId: string) => void;
  viewMode?: 'list' | 'card';
}

function MealSlot({ date, mealType, label, entries, onRemoveEntry, viewMode = 'list' }: MealSlotProps) {
  const { setNodeRef, isOver, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: `slot-${date}-${mealType}`,
    data: {
      type: 'meal-slot',
      date,
      mealType,
    },
  });

  const { recipes } = useRecipeStore();
  const removeMealSlot = useMealPlanStore(state => state.removeMealSlot);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isEmpty = entries.length === 0;

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className={`group/slot min-h-[100px] py-2 px-2 relative flex flex-col gap-2 rounded-2xl border transition-colors ${
        isOver ? 'bg-primary-50 ring-2 ring-primary border-primary' : 'bg-white border-default-100 shadow-none'
      }`}
    >
      {/* Drag handle */}
      <div 
        {...attributes} 
        {...listeners} 
        className="absolute left-0.5 top-1/2 -translate-y-1/2 w-[3px] h-12 bg-default-200 hover:bg-default-300 rounded-r-full opacity-0 group-hover/slot:opacity-100 transition-all cursor-grab active:cursor-grabbing"
      />

      <div className="flex items-center justify-between px-1 h-6">
        <span className="text-xs font-semibold text-default-500 uppercase tracking-wider pl-1">
          {label}
        </span>
        <div className="flex items-center gap-1 opacity-0 group-hover/slot:opacity-100 transition-opacity">
          {isEmpty && (
            <button onClick={() => removeMealSlot(date, mealType)} className="p-1 text-default-400 hover:bg-danger-50 hover:text-danger rounded" title="Xoá bữa này">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button className="p-1 text-primary hover:bg-primary-50 rounded" title="Đi chợ cho bữa này">
            <ShoppingCart className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-2">
        {entries.map(entry => {
          const recipe = recipes.find(r => r.id === entry.recipe_id);
          if (!recipe) return null;

          return (
            <div key={entry.id} className={`group relative flex ${viewMode === 'card' ? 'flex-col items-stretch' : 'items-center'} gap-2 p-2 bg-default-50 rounded-lg hover:bg-default-100 transition-colors`}>
              <div className={`relative ${viewMode === 'card' ? 'w-full aspect-[4/3] rounded-md' : 'w-10 h-10 rounded-md'} bg-default-200 flex-shrink-0 overflow-hidden flex items-center justify-center`}>
                {recipe.image_url ? (
                  <img src={ImageManager.getAssetUrl(recipe.image_url)} alt={recipe.title} className="w-full h-full object-cover" />
                ) : (
                  <ChefHat className={`${viewMode === 'card' ? 'w-8 h-8' : 'w-4 h-4'} text-default-400`} />
                )}
                {viewMode === 'card' && (
                  <div className="absolute right-1 bottom-1 flex items-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <button className="p-1 text-primary hover:text-primary-600 transition-colors drop-shadow-md" title="Thêm vào giỏ đi chợ">
                      <ShoppingCart className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-medium truncate ${viewMode === 'card' ? 'text-center mb-1' : ''}`} title={recipe.title}>{recipe.title}</p>
                
                {viewMode === 'list' && (
                  <p className="text-[10px] text-default-500">{recipe.cook_time}m • {recipe.difficulty}</p>
                )}
                
                {viewMode === 'card' && (
                  <div className="flex items-center justify-center gap-2 text-[10px] text-default-500 mt-1">
                    <div className="flex items-center gap-0.5" title="Thời gian">
                      <Clock className="w-2.5 h-2.5 text-blue-500" />
                      <span>{recipe.prep_time + recipe.cook_time}m</span>
                    </div>
                    <div className="flex items-center gap-0.5" title="Độ khó">
                      <ChefHat className="w-2.5 h-2.5 text-green-500" />
                      <span>{recipe.difficulty.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="flex items-center gap-0.5" title="Lượng Calories">
                      <Flame className="w-2.5 h-2.5 text-orange-500" />
                      <span>{recipe.calories || '?'}</span>
                    </div>
                  </div>
                )}
              </div>
              {viewMode === 'list' && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <button className="p-1.5 text-primary hover:bg-primary-50 rounded-md transition-colors" title="Thêm vào giỏ đi chợ">
                    <ShoppingCart className="w-4 h-4" />
                  </button>
                </div>
              )}
              
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveEntry(entry.id!);
                }}
                className="absolute -top-1.5 -right-1.5 p-0.5 bg-background border border-default-200 text-default-400 hover:text-danger hover:border-danger rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-sm z-20" 
                title="Xoá"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}
        {entries.length === 0 && (
          <div className="flex-1 flex items-center justify-center opacity-0 group-hover:opacity-100">
            <span className="text-xs text-default-400">Kéo thả vào đây</span>
          </div>
        )}
      </div>
    </div>
  );
}

interface WeeklyCalendarProps {
  days: Date[];
  mealPlans: MealPlan[];
  onRemoveEntry: (date: string, entryId: string) => void;
  viewMode?: 'list' | 'card';
  showDailyAggregates?: boolean;
}

export function WeeklyCalendar({ days, mealPlans, onRemoveEntry, viewMode = 'list', showDailyAggregates = true }: WeeklyCalendarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const addMealSlot = useMealPlanStore(state => state.addMealSlot);
  const { defaultSlots } = useSettingsStore();
  const [addingSlotDate, setAddingSlotDate] = useState<string | null>(null);
  const [newSlotName, setNewSlotName] = useState('');

  const handleAddSlot = async (date: string) => {
    if (newSlotName.trim()) {
      await addMealSlot(date, newSlotName.trim());
    }
    setAddingSlotDate(null);
    setNewSlotName('');
  };

  const scrollLeft = () => {
    scrollRef.current?.scrollBy({ left: -400, behavior: 'smooth' });
  };
  
  const scrollRight = () => {
    scrollRef.current?.scrollBy({ left: 400, behavior: 'smooth' });
  };
  

  
  const formatDateString = (d: Date) => d.toISOString().split('T')[0];

  return (
    <div className="relative flex-1 min-w-0 flex flex-col h-full">
      {/* Scroll Left Button */}
      <div 
        className="absolute left-0 top-0 bottom-0 w-16 z-10 flex items-center justify-start pl-2 opacity-0 hover:opacity-100 transition-opacity cursor-pointer" 
        onClick={scrollLeft}
      >
        <Button isIconOnly variant="shadow" size="sm" className="bg-background/80 backdrop-blur-md rounded-full shadow-lg border border-default-200 pointer-events-none">
          <ChevronLeft className="w-4 h-4" />
        </Button>
      </div>
      
      {/* Scroll Right Button */}
      <div 
        className="absolute right-0 top-0 bottom-0 w-16 z-10 flex items-center justify-end pr-2 opacity-0 hover:opacity-100 transition-opacity cursor-pointer" 
        onClick={scrollRight}
      >
        <Button isIconOnly variant="shadow" size="sm" className="bg-background/80 backdrop-blur-md rounded-full shadow-lg border border-default-200 pointer-events-none">
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-x-auto pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        <div className={`${viewMode === 'card' ? 'min-w-[1200px] xl:min-w-[1400px]' : 'min-w-[1600px] xl:min-w-[1800px]'} h-full flex flex-col px-4 transition-all duration-300`}>
        {/* Header Row */}
        <div className="grid grid-cols-7 gap-4 mb-4">
          {days.map((day, i) => {
            const isToday = new Date().toDateString() === day.toDateString();
            const dateStr = formatDateString(day);
            const plan = mealPlans.find(p => p.date === dateStr);
            
            // Tính toán tổng kết ngày
            const numMeals = plan?.meals.length || 0;
            const totalCals = plan?.meals.reduce((sum, meal) => {
              const recipe = useRecipeStore.getState().recipes.find(r => r.id === meal.recipe_id);
              return sum + (recipe?.calories || 0);
            }, 0) || 0;
            
            let maxDifficulty = 'Dễ';
            if (numMeals > 0) {
              const difficulties = plan?.meals.map(m => {
                const recipe = useRecipeStore.getState().recipes.find(r => r.id === m.recipe_id);
                return recipe?.difficulty;
              }).filter(Boolean);
              if (difficulties?.includes('Khó')) maxDifficulty = 'Khó';
              else if (difficulties?.includes('Vừa')) maxDifficulty = 'Vừa';
              else if (difficulties?.length) maxDifficulty = difficulties[0] as string;
            }

            return (
              <div key={i} className={`group/day relative text-center py-2 px-1 rounded-xl flex flex-col items-center justify-center min-h-[80px] ${isToday ? 'bg-primary text-primary-foreground' : 'bg-content1'}`}>
                <div className="text-sm font-semibold">
                  {day.toLocaleDateString('vi-VN', { weekday: 'short' })}
                </div>
                <div className="text-2xl font-bold mt-1 mb-1">
                  {day.getDate()}
                </div>
                
                {showDailyAggregates && numMeals > 0 && (
                  <div className={`flex items-center justify-center gap-1.5 mt-1 text-[10px] ${isToday ? 'text-primary-foreground/90' : 'text-default-500'}`}>
                    <div className="flex items-center gap-0.5">
                      <BookOpen className={`w-3 h-3 ${isToday ? '' : 'text-green-600'}`} />
                      <span>{numMeals} món</span>
                    </div>
                    <span className="text-default-300">|</span>
                    <div className="flex items-center gap-0.5">
                      <Flame className={`w-3 h-3 ${isToday ? '' : 'text-orange-500'}`} />
                      <span>{totalCals}</span>
                    </div>
                    <span className="text-default-300">|</span>
                    <div className="flex items-center gap-0.5">
                      <ChefHat className={`w-3 h-3 ${isToday ? '' : 'text-blue-500'}`} />
                      <span>{maxDifficulty}</span>
                    </div>
                  </div>
                )}
                
                <button className={`absolute top-2 right-2 p-1.5 rounded-md opacity-0 group-hover/day:opacity-100 transition-opacity ${isToday ? 'text-primary-foreground hover:bg-white/20' : 'text-primary hover:bg-primary-50'}`} title="Đi chợ cho ngày này">
                  <ShoppingCart className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Grid Body */}
        <div className="flex-1 grid grid-cols-7 gap-4">
          {days.map((day, colIdx) => {
            const dateStr = formatDateString(day);
            const plan = mealPlans.find(p => p.date === dateStr);
            const slots = plan?.slots || defaultSlots;
            const isAddingSlot = addingSlotDate === dateStr;
            
            return (
              <div key={colIdx} className="flex flex-col gap-4">
                <SortableContext items={slots.map(s => `slot-${dateStr}-${s.id}`)} strategy={verticalListSortingStrategy}>
                  {slots.map(slot => {
                    const entries = plan?.meals.filter(m => m.meal_type === slot.id) || [];
                    return (
                      <MealSlot 
                        key={`${dateStr}-${slot.id}`}
                        date={dateStr}
                        mealType={slot.id}
                        label={slot.name}
                        entries={entries}
                        onRemoveEntry={(entryId) => onRemoveEntry(dateStr, entryId)}
                        viewMode={viewMode}
                      />
                    );
                  })}
                </SortableContext>
                {isAddingSlot ? (
                  <div className="h-10 mt-2 px-2 rounded-xl border border-primary flex items-center gap-1 bg-primary-50 shrink-0">
                    <input 
                      type="text" 
                      autoFocus
                      className="flex-1 min-w-0 bg-transparent text-sm font-medium outline-none text-foreground placeholder:text-primary-300"
                      placeholder="Tên bữa..."
                      value={newSlotName}
                      onChange={(e) => setNewSlotName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddSlot(dateStr);
                        if (e.key === 'Escape') setAddingSlotDate(null);
                      }}
                    />
                    <button onClick={() => handleAddSlot(dateStr)} className="p-1 text-primary hover:bg-primary-100 rounded-md">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => setAddingSlotDate(null)} className="p-1 text-default-400 hover:text-danger hover:bg-danger-50 rounded-md">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setAddingSlotDate(dateStr)}
                    className="h-10 mt-2 rounded-xl border-2 border-dashed border-default-200 flex items-center justify-center text-default-400 hover:text-default-600 hover:border-default-300 hover:bg-default-50 transition-colors shrink-0" 
                    title="Thêm bữa ăn tuỳ chọn"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                )}
                
              </div>
            );
          })}
        </div>
        </div>
      </div>
    </div>
  );
}
