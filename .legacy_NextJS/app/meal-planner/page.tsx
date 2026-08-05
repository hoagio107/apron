
"use client";

import { useState, useMemo } from 'react';
import { useRecipes } from '@/hooks/use-recipes';
import { useMealPlan } from '@/hooks/use-meal-plan';
import { Button } from '@/components/ui/button';
import { 
  CalendarDays, Plus, Trash2, ChevronLeft, 
  ChevronRight, Loader2, ArrowLeft,
  Utensils, Clock, Flame, X, Check,
  Search, Calendar as CalendarIcon
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { format, addDays, startOfWeek, addWeeks, subWeeks, isSameDay } from 'date-fns';
import { vi } from 'date-fns/locale';
import { MEAL_TYPE_LABELS, MealType, Recipe } from '@/lib/recipe-types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';

export default function MealPlannerPage() {
  const isMobile = useIsMobile();
  const router = useRouter();
  const { recipes, loading: recipesLoading } = useRecipes();
  const { plans, loading: plansLoading, addMealToPlan, removeMealFromPlan } = useMealPlan();
  
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedMealType, setSelectedMealType] = useState<MealType>('lunch');
  const [recipeSearch, setRecipeSearch] = useState('');

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
  }, [currentWeekStart]);

  const filteredRecipes = useMemo(() => {
    const term = recipeSearch.toLowerCase().trim();
    if (!term) return recipes.slice(0, 10);
    return recipes.filter(r => r.title.toLowerCase().includes(term)).slice(0, 10);
  }, [recipes, recipeSearch]);

  const handleAddMeal = (date: Date) => {
    setSelectedDate(date);
    setIsAddModalOpen(true);
  };

  const onSelectRecipe = async (recipe: Recipe) => {
    if (!selectedDate) return;
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    await addMealToPlan(dateStr, recipe.id, selectedMealType);
    setIsAddModalOpen(false);
    setRecipeSearch('');
  };

  const navbarContent = (
    <div className="flex items-center justify-between w-full gap-1">
      <div className="flex items-center gap-1 md:gap-4 min-w-0">
        <Button variant="ghost" size="icon" onClick={() => router.push('/')} className="rounded-full shadow-none text-gray-600 shrink-0">
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <div className="flex items-center gap-2 min-w-0">
          {!isMobile && <CalendarDays className="w-5 h-5 text-purple-600 shrink-0" />}
          <h1 className={cn("font-bold truncate font-headline", isMobile ? "text-sm" : "text-xl")}>
            {isMobile ? "Kế hoạch" : "Kế hoạch bữa ăn"}
          </h1>
        </div>
      </div>
      <div className="flex items-center gap-0 md:gap-2 shrink-0">
        <Button variant="ghost" size="icon" onClick={() => setCurrentWeekStart(subWeeks(currentWeekStart, 1))} className="h-9 w-9 md:h-10 md:w-10 rounded-xl"><ChevronLeft className="w-4 h-4 md:w-5 md:h-5" /></Button>
        <span className="text-[10px] md:text-xs font-bold whitespace-nowrap bg-purple-50 text-purple-700 px-2.5 py-1.5 rounded-xl border border-purple-100">
          {isMobile ? format(currentWeekStart, 'MM/yyyy') : `Tháng ${format(currentWeekStart, 'MM/yyyy')}`}
        </span>
        <Button variant="ghost" size="icon" onClick={() => setCurrentWeekStart(addWeeks(currentWeekStart, 1))} className="h-9 w-9 md:h-10 md:w-10 rounded-xl"><ChevronRight className="w-4 h-4 md:w-5 md:h-5" /></Button>
      </div>
    </div>
  );

  if (recipesLoading || plansLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-purple-600" /></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <header className={cn(
        "fixed top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 flex items-center px-4",
        isMobile ? "left-0 right-0 h-14" : "left-64 right-0 h-16 md:px-8"
      )}>
        {navbarContent}
      </header>

      <main className={cn("max-w-full mx-auto p-4 md:p-8 pt-20 md:pt-24 pb-32")}>
        {isMobile ? (
          <div className="space-y-6">
            {weekDays.map((day) => (
              <MobileDayCard 
                key={day.toISOString()} 
                day={day} 
                plans={plans} 
                recipes={recipes} 
                onAdd={() => handleAddMeal(day)}
                onRemove={removeMealFromPlan}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-4 items-start">
            {weekDays.map((day) => (
              <DesktopDayColumn 
                key={day.toISOString()} 
                day={day} 
                plans={plans} 
                recipes={recipes} 
                onAdd={() => handleAddMeal(day)}
                onRemove={removeMealFromPlan}
              />
            ))}
          </div>
        )}
      </main>

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-md rounded-[2rem] p-0 overflow-hidden border-none shadow-none">
          <DialogHeader className="p-6 bg-gray-50/50 border-b">
            <DialogTitle className="font-headline font-bold">Lên lịch cho {selectedDate && format(selectedDate, 'dd/MM')}</DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Bữa ăn</label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(MEAL_TYPE_LABELS) as MealType[]).map(type => (
                  <button
                    key={type}
                    onClick={() => setSelectedMealType(type)}
                    className={cn(
                      "px-4 py-2.5 rounded-xl text-xs font-bold transition-all border",
                      selectedMealType === type 
                        ? "bg-purple-50 border-purple-200 text-purple-600" 
                        : "bg-white border-gray-100 text-gray-500 hover:border-purple-100"
                    )}
                  >
                    {MEAL_TYPE_LABELS[type].label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Chọn món ăn</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input 
                  placeholder="Tìm món..." 
                  value={recipeSearch}
                  onChange={(e) => setRecipeSearch(e.target.value)}
                  className="pl-10 h-11 bg-gray-50 border-none rounded-xl font-bold shadow-none"
                />
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1 no-scrollbar">
                {filteredRecipes.map(recipe => (
                  <button
                    key={recipe.id}
                    onClick={() => onSelectRecipe(recipe)}
                    className="w-full flex items-center gap-3 p-2 bg-white hover:bg-purple-50 rounded-xl transition-all border border-transparent hover:border-purple-100"
                  >
                    <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0">
                      <img src={recipe.image_url || 'https://picsum.photos/50'} className="w-full h-full object-cover" />
                    </div>
                    <span className="text-sm font-bold text-gray-800 text-left line-clamp-1">{recipe.title}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="p-4 border-t bg-gray-50/50">
            <Button variant="ghost" onClick={() => setIsAddModalOpen(false)} className="rounded-xl font-bold">Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MobileDayCard({ day, plans, recipes, onAdd, onRemove }: any) {
  const isToday = isSameDay(day, new Date());
  const dateStr = format(day, 'yyyy-MM-dd');
  const plan = plans.find((p: any) => p.date === dateStr);

  return (
    <div className={cn(
      "rounded-2xl p-5 space-y-4",
      isToday ? "bg-purple-50 border-purple-100" : "bg-white border border-gray-100 shadow-none"
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-xl flex flex-col items-center justify-center font-black",
            isToday ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-400"
          )}>
            <span className="text-[10px] uppercase leading-none">{format(day, 'EEE', { locale: vi })}</span>
            <span className="text-sm leading-tight">{format(day, 'dd')}</span>
          </div>
          <h3 className="font-bold text-gray-800 dark:text-white capitalize">
            {format(day, 'EEEE, dd MMMM', { locale: vi })}
          </h3>
        </div>
        <Button variant="ghost" size="icon" onClick={onAdd} className="rounded-xl text-purple-600 bg-purple-100 hover:bg-purple-200">
          <Plus className="w-5 h-5" />
        </Button>
      </div>

      <div className="space-y-3">
        {plan?.meals && plan.meals.length > 0 ? plan.meals.map((meal: any) => {
          const recipe = recipes.find((r: any) => r.id === meal.recipe_id);
          if (!recipe) return null;
          return (
            <div key={meal.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl group animate-in fade-in zoom-in-95 duration-200">
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-200 shrink-0">
                <img src={recipe.image_url || 'https://picsum.photos/100'} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={cn("text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md", MEAL_TYPE_LABELS[meal.meal_type as MealType].color)}>
                    {MEAL_TYPE_LABELS[meal.meal_type as MealType].label}
                  </span>
                </div>
                <p className="text-sm font-bold text-gray-800 line-clamp-1">{recipe.title}</p>
              </div>
              <button onClick={() => onRemove(dateStr, meal.id)} className="p-2 text-gray-300 hover:text-red-500 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        }) : (
          <p className="text-xs text-gray-400 font-medium italic py-2">Chưa có kế hoạch cho ngày này.</p>
        )}
      </div>
    </div>
  );
}

function DesktopDayColumn({ day, plans, recipes, onAdd, onRemove }: any) {
  const isToday = isSameDay(day, new Date());
  const dateStr = format(day, 'yyyy-MM-dd');
  const plan = plans.find((p: any) => p.date === dateStr);

  return (
    <div className="flex flex-col gap-4">
      <div className={cn(
        "p-4 rounded-3xl text-center space-y-1 transition-all duration-300",
        isToday ? "bg-purple-600 text-white shadow-none scale-105" : "bg-white text-gray-400 border border-gray-100 shadow-none"
      )}>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">{format(day, 'EEE', { locale: vi })}</p>
        <p className="text-2xl font-black font-headline">{format(day, 'dd')}</p>
      </div>

      <div className="space-y-3">
        {plan?.meals?.map((meal: any) => {
          const recipe = recipes.find((r: any) => r.id === meal.recipe_id);
          if (!recipe) return null;
          return (
            <div key={meal.id} className="relative group bg-white dark:bg-gray-800 p-2 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-none hover:shadow-none transition-all duration-500 animate-in fade-in slide-in-from-top-2">
              <div className="aspect-square rounded-xl overflow-hidden mb-3">
                <img src={recipe.image_url || 'https://picsum.photos/200'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              </div>
              <div className="px-1 pb-1">
                <span className={cn("text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md mb-2 inline-block", MEAL_TYPE_LABELS[meal.meal_type as MealType].color)}>
                  {MEAL_TYPE_LABELS[meal.meal_type as MealType].label}
                </span>
                <p className="text-xs font-bold text-gray-800 dark:text-white line-clamp-2 leading-snug">{recipe.title}</p>
              </div>
              <button 
                onClick={() => onRemove(dateStr, meal.id)}
                className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-white dark:bg-gray-700 text-red-500 shadow-none flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}

        <Button 
          variant="outline" 
          onClick={onAdd}
          className="w-full aspect-square md:h-auto md:aspect-auto md:py-6 rounded-2xl border-2 border-dashed border-gray-200 text-gray-300 hover:border-purple-300 hover:text-purple-500 hover:bg-purple-50 transition-all shadow-none"
        >
          <div className="flex flex-col items-center gap-1">
            <Plus className="w-6 h-6" />
            <span className="text-[10px] font-black uppercase tracking-widest hidden md:block">Thêm món</span>
          </div>
        </Button>
      </div>
    </div>
  );
}
