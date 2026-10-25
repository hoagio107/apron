import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  ShoppingCart,
  Clock,
  Flame,
  Utensils,
  Sunrise,
  Sun,
  Moon,
  Coffee,
  Settings
} from 'lucide-react';
import {
  Button,
  PageHeader,
  AppCard,
  toast
} from '@/ui';
import type { Recipe, MealPlanEntry, MealType } from '@apron/core';
import { useMealPlanStore } from '../../store/useMealPlanStore';
import { useRecipeStore } from '../../store/useRecipeStore';
import { useShoppingListStore } from '../../store/useShoppingListStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { ImageManager } from '../../lib/image-manager';
import { RecipePickerDrawer } from './components/RecipePickerDrawer';
import { MealSlotSettingsDrawer } from './components/MealSlotSettingsDrawer';
import { SwipeableRow, type SwipeAction } from '../../components/shared/SwipeableRow';

// Helper icon cho từng bữa
function getSlotIcon(slotId: string) {
  switch (slotId.toLowerCase()) {
    case 'breakfast':
    case 'sang':
      return <Sunrise className="w-4 h-4 text-amber-500 shrink-0" />;
    case 'lunch':
    case 'trua':
      return <Sun className="w-4 h-4 text-emerald-500 shrink-0" />;
    case 'dinner':
    case 'toi':
      return <Moon className="w-4 h-4 text-indigo-500 shrink-0" />;
    default:
      return <Coffee className="w-4 h-4 text-rose-500 shrink-0" />;
  }
}

export function MealPlannerPage() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  
  // Selected date string YYYY-MM-DD
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayStr);

  // Stores
  const { mealPlans, fetchMealPlans, addMealPlanEntry, removeMealPlanEntry } = useMealPlanStore();
  const { recipes, fetchRecipes } = useRecipeStore();
  const { addItems } = useShoppingListStore();
  const { defaultSlots, addDefaultSlot, removeDefaultSlot, setDefaultSlots } = useSettingsStore();

  // Recipe Picker Drawer State
  const [pickerState, setPickerState] = useState<{
    isOpen: boolean;
    slotId: string;
    slotName: string;
  }>({
    isOpen: false,
    slotId: '',
    slotName: ''
  });

  // Settings Drawer State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // 1. Tính toán 7 ngày trong tuần (Thứ 2 -> Chủ Nhật)
  const daysOfWeek = useMemo(() => {
    const d = new Date(currentDate);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Thứ 2 đầu tuần
    const monday = new Date(d.setDate(diff));

    return Array.from({ length: 7 }).map((_, i) => {
      const nextDay = new Date(monday);
      nextDay.setDate(monday.getDate() + i);
      return nextDay;
    });
  }, [currentDate]);

  const startDate = daysOfWeek[0].toISOString().split('T')[0];
  const endDate = daysOfWeek[6].toISOString().split('T')[0];

  // Đảm bảo selectedDateStr luôn nằm trong tuần đang xem
  useEffect(() => {
    const weekDateStrings = daysOfWeek.map((d) => d.toISOString().split('T')[0]);
    if (!weekDateStrings.includes(selectedDateStr)) {
      if (weekDateStrings.includes(todayStr)) {
        setSelectedDateStr(todayStr);
      } else {
        setSelectedDateStr(weekDateStrings[0]);
      }
    }
  }, [daysOfWeek, selectedDateStr, todayStr]);

  // Fetch dữ liệu
  useEffect(() => {
    fetchMealPlans(startDate, endDate);
    fetchRecipes();
  }, [startDate, endDate, fetchMealPlans, fetchRecipes]);

  // Tuần trước / Tuần sau
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

  const handleJumpToToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDateStr(now.toISOString().split('T')[0]);
  };

  // Plan của ngày đang chọn
  const activePlan = useMemo(() => {
    return mealPlans.find((p) => p.date === selectedDateStr);
  }, [mealPlans, selectedDateStr]);

  // Danh sách các bữa ăn được cấu hình cho ngày (theo thứ tự cấu hình mới nhất)
  const activeSlots = useMemo(() => {
    const baseSlots = (activePlan?.slots && activePlan.slots.length > 0)
      ? activePlan.slots
      : defaultSlots;

    const orderMap = new Map(defaultSlots.map((s, idx) => [s.id, idx]));
    return [...baseSlots].sort((a, b) => {
      const orderA = orderMap.get(a.id) ?? 999;
      const orderB = orderMap.get(b.id) ?? 999;
      return orderA - orderB;
    });
  }, [activePlan, defaultSlots]);

  // Chọn công thức từ drawer
  const handleSelectRecipe = async (recipe: Recipe) => {
    if (!pickerState.slotId) return;
    try {
      await addMealPlanEntry(selectedDateStr, {
        recipe_id: recipe.id,
        meal_type: pickerState.slotId as MealType
      });
      toast.success(`Đã thêm "${recipe.title}" vào ${pickerState.slotName}!`);
    } catch {
      toast.error('Không thể thêm món vào thực đơn.');
    }
  };

  // Thêm món tự chọn / ăn ngoài
  const handleAddCustomMeal = async (title: string, note?: string) => {
    if (!pickerState.slotId) return;
    try {
      const fullNote = note ? `${title} (${note})` : title;
      await addMealPlanEntry(selectedDateStr, {
        notes: fullNote,
        meal_type: pickerState.slotId as MealType
      });
      toast.success(`Đã thêm "${title}" vào ${pickerState.slotName}!`);
    } catch {
      toast.error('Không thể thêm món vào thực đơn.');
    }
  };

  // Xóa món khỏi bữa ăn
  const handleRemoveEntry = async (entryId: string, dishTitle: string) => {
    try {
      await removeMealPlanEntry(selectedDateStr, entryId);
      toast.success(`Đã xóa món "${dishTitle}" khỏi bữa ăn.`);
    } catch {
      toast.error('Không thể xóa món.');
    }
  };

  // Thêm nguyên liệu của 1 món vào danh sách Đi chợ
  const handleAddDishToShopping = async (recipe: Recipe) => {
    if (!recipe.ingredients || recipe.ingredients.length === 0) {
      toast.info(`Công thức "${recipe.title}" chưa có danh sách nguyên liệu.`);
      return;
    }

    try {
      const itemsToAdd = recipe.ingredients.map((ing) => ({
        name: ing.name,
        quantity: ing.quantity,
        unit: ing.unit,
      }));
      await addItems(itemsToAdd);
      toast.success(`Đã thêm ${itemsToAdd.length} nguyên liệu của "${recipe.title}" vào Đi chợ!`);
    } catch {
      toast.error('Không thể thêm nguyên liệu vào danh sách Đi chợ.');
    }
  };

  // Thêm toàn bộ nguyên liệu của ngày đang chọn vào Đi chợ
  const handleAddDayToShopping = async () => {
    if (!activePlan || activePlan.meals.length === 0) {
      toast.info('Ngày này chưa có món ăn nào được lên thực đơn.');
      return;
    }

    const itemsToAdd: { name: string; quantity?: number; unit?: string }[] = [];
    activePlan.meals.forEach((entry) => {
      if (entry.recipe_id) {
        const r = recipes.find((rec) => rec.id === entry.recipe_id);
        if (r?.ingredients) {
          r.ingredients.forEach((ing) => {
            itemsToAdd.push({
              name: ing.name,
              quantity: ing.quantity,
              unit: ing.unit,
            });
          });
        }
      }
    });

    if (itemsToAdd.length === 0) {
      toast.info('Các món trong ngày không có nguyên liệu công thức để thêm.');
      return;
    }

    try {
      await addItems(itemsToAdd);
      toast.success(`Đã thêm ${itemsToAdd.length} nguyên liệu của ngày vào danh sách Đi chợ!`);
    } catch {
      toast.error('Có lỗi xảy ra khi thêm vào danh sách Đi chợ.');
    }
  };

  // Thêm toàn bộ nguyên liệu của cả tuần vào Đi chợ
  const handleAddWeekToShopping = async () => {
    const weekItems: { name: string; quantity?: number; unit?: string }[] = [];

    mealPlans.forEach((plan) => {
      plan.meals.forEach((entry) => {
        if (entry.recipe_id) {
          const r = recipes.find((rec) => rec.id === entry.recipe_id);
          if (r?.ingredients) {
            r.ingredients.forEach((ing) => {
              weekItems.push({
                name: ing.name,
                quantity: ing.quantity,
                unit: ing.unit,
              });
            });
          }
        }
      });
    });

    if (weekItems.length === 0) {
      toast.info('Chưa có công thức nào có nguyên liệu trong tuần này.');
      return;
    }

    try {
      await addItems(weekItems);
      toast.success(`Đã chuyển ${weekItems.length} nguyên liệu tuần này vào danh sách Đi chợ!`);
    } catch {
      toast.error('Không thể thêm nguyên liệu tuần.');
    }
  };

  // Tính tổng calo và tổng số món trong ngày đang chọn
  const daySummary = useMemo(() => {
    if (!activePlan) return { totalMeals: 0, totalCalories: 0 };
    let cals = 0;
    activePlan.meals.forEach((m) => {
      if (m.recipe_id) {
        const r = recipes.find((rec) => rec.id === m.recipe_id);
        if (r?.nutrition?.calories) {
          cals += r.nutrition.calories;
        }
      }
    });
    return {
      totalMeals: activePlan.meals.length,
      totalCalories: cals,
    };
  }, [activePlan, recipes]);

  // Tên ngày hiển thị đẹp (Vd: Thứ Ba, 21 tháng 10)
  const activeDateFormatted = useMemo(() => {
    try {
      const d = new Date(selectedDateStr);
      return d.toLocaleDateString('vi-VN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      });
    } catch {
      return selectedDateStr;
    }
  }, [selectedDateStr]);

  const isCurrentWeek = daysOfWeek.some(
    (d) => d.toISOString().split('T')[0] === todayStr
  );

  return (
    <div className="flex flex-col min-h-full gap-6 w-full pt-6 pb-28 px-4 md:px-8">
      {/* 1. Header & Toolbar chuẩn hệ thống */}
      <PageHeader
        title="Thực đơn tuần"
        description="Kế hoạch dinh dưỡng & bữa ăn từng ngày"
        actions={
          <div className="flex items-center gap-2 w-full">
            {/* Thanh chọn tuần kéo dài lấp đầy width */}
            <div className="flex items-center justify-between flex-1 min-w-0 bg-content1/80 border border-divider/50 rounded-xl px-1 h-10">
              <Button
                isIconOnly
                size="sm"
                variant="light"
                className="rounded-lg h-7 w-7 min-w-7 text-default-600 shrink-0"
                onClick={handlePrevWeek}
                aria-label="Tuần trước"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              <div className="flex items-center justify-center gap-1 px-0.5 min-w-0 flex-1 text-center">
                <span className="text-[11px] sm:text-xs font-bold text-foreground whitespace-nowrap">
                  {daysOfWeek[0].toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                  {' - '}
                  {daysOfWeek[6].toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                </span>
                {!isCurrentWeek && (
                  <button
                    type="button"
                    onClick={handleJumpToToday}
                    className="text-[9px] font-bold text-primary bg-primary/10 hover:bg-primary/20 px-1 py-0.5 rounded transition-colors whitespace-nowrap shrink-0"
                  >
                    Nay
                  </button>
                )}
              </div>

              <Button
                isIconOnly
                size="sm"
                variant="light"
                className="rounded-lg h-7 w-7 min-w-7 text-default-600 shrink-0"
                onClick={handleNextWeek}
                aria-label="Tuần sau"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            <Button
              color="primary"
              className="font-semibold h-10 px-3 rounded-xl shrink-0 text-xs sm:text-small"
              startContent={<ShoppingCart className="w-4 h-4" />}
              onClick={handleAddWeekToShopping}
            >
              Đi chợ tuần
            </Button>
            <Button
              isIconOnly
              variant="flat"
              className="rounded-xl h-10 w-10 min-w-10 shrink-0 text-default-600"
              onClick={() => setIsSettingsOpen(true)}
              aria-label="Cài đặt bữa ăn"
            >
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        }
      />

      <div className="flex flex-col gap-6 w-full">

        {/* 3. Dải 7 ngày trong tuần dạng thẻ Pill (Day Strip) */}
        <div className="grid grid-cols-7 gap-1.5 w-full">
          {daysOfWeek.map((dayDate) => {
            const dateStr = dayDate.toISOString().split('T')[0];
            const isSelected = dateStr === selectedDateStr;
            const isToday = dateStr === todayStr;

            // Đếm số món đã lên của ngày này
            const planForDay = mealPlans.find((p) => p.date === dateStr);
            const mealsCount = planForDay?.meals.length ?? 0;

            const dayName = dayDate.toLocaleDateString('vi-VN', { weekday: 'narrow' }); // T2, T3...
            const dayNum = dayDate.getDate();

            return (
              <button
                key={dateStr}
                type="button"
                onClick={() => setSelectedDateStr(dateStr)}
                className={`py-2 px-1 flex flex-col items-center justify-between rounded-2xl transition-all cursor-pointer select-none min-h-[64px] ${
                  isSelected
                    ? 'bg-primary text-white font-bold shadow-md scale-105'
                    : isToday
                    ? 'bg-primary/10 text-primary border border-primary/30 font-semibold'
                    : 'bg-content1/80 border border-divider/40 text-foreground hover:bg-default-100/50'
                }`}
              >
                <span
                  className={`text-[10px] uppercase font-bold tracking-tight ${
                    isSelected ? 'text-white/80' : isToday ? 'text-primary' : 'text-default-400'
                  }`}
                >
                  {dayName}
                </span>

                <span className="text-sm sm:text-base font-extrabold my-0.5">
                  {dayNum}
                </span>

                {/* Dot / meals indicator */}
                <div className="h-2 flex items-center justify-center">
                  {mealsCount > 0 ? (
                    <span
                      className={`text-[9px] font-bold px-1 rounded-full ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-primary/15 text-primary'
                      }`}
                    >
                      {mealsCount}
                    </span>
                  ) : (
                    <div
                      className={`w-1 h-1 rounded-full ${
                        isSelected ? 'bg-white/40' : 'bg-transparent'
                      }`}
                    />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* 4. Thẻ tóm tắt ngày đang chọn */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex flex-col">
            <h2 className="text-base sm:text-lg font-black text-foreground capitalize">
              {activeDateFormatted}
            </h2>
            <div className="flex items-center gap-2 text-xs text-default-400 font-medium">
              <span>{daySummary.totalMeals} món đã lên</span>
              {daySummary.totalCalories > 0 && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-0.5 text-danger font-semibold">
                    <Flame className="w-3 h-3" />
                    {daySummary.totalCalories} kcal
                  </span>
                </>
              )}
            </div>
          </div>

          {daySummary.totalMeals > 0 && (
            <Button
              isIconOnly
              size="sm"
              variant="flat"
              color="primary"
              className="rounded-xl h-8 w-8 min-w-8"
              onClick={handleAddDayToShopping}
              aria-label="Đi chợ ngày này"
              title="Đi chợ ngày này"
            >
              <ShoppingCart className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* 5. Danh sách các bữa ăn trong ngày (Sáng, Trưa, Tối, Ăn nhẹ...) */}
        <div className="flex flex-col gap-3">
          {activeSlots.map((slot) => {
            const slotEntries: MealPlanEntry[] = activePlan?.meals
              ? activePlan.meals.filter((m) => m.meal_type === slot.id)
              : [];

            const slotIcon = getSlotIcon(slot.id);

            return (
              <AppCard
                key={slot.id}
                className="p-3 sm:p-4 rounded-2xl border border-divider/60 bg-content1 shadow-none flex flex-col gap-2.5"
              >
                {/* Header bữa ăn */}
                <div className="flex items-center justify-between pb-1.5 border-b border-divider/30">
                  <div className="flex items-center gap-2">
                    {slotIcon}
                    <h3 className="text-sm font-bold text-foreground">
                      {slot.name}
                    </h3>
                    {slotEntries.length > 0 && (
                      <span className="text-[10px] font-bold text-default-400 bg-default-100 dark:bg-default-50/20 px-1.5 py-0.5 rounded-full">
                        {slotEntries.length} món
                      </span>
                    )}
                  </div>

                  {slotEntries.length > 0 && (
                    <Button
                      size="sm"
                      variant="light"
                      color="primary"
                      className="rounded-xl h-7 px-2 text-xs font-bold"
                      startContent={<Plus className="w-3.5 h-3.5" />}
                      onClick={() =>
                        setPickerState({
                          isOpen: true,
                          slotId: slot.id,
                          slotName: slot.name
                        })
                      }
                    >
                      Thêm món
                    </Button>
                  )}
                </div>

                {/* Danh sách các món của bữa */}
                {slotEntries.length > 0 ? (
                  <div className="flex flex-col divide-y divide-divider/30">
                    {slotEntries.map((entry) => {
                      const recipe = entry.recipe_id
                        ? recipes.find((r) => r.id === entry.recipe_id)
                        : null;

                      const dishTitle = recipe ? recipe.title : entry.notes ?? 'Món tự chọn';
                      const totalTime = recipe
                        ? (recipe.prep_time || 0) + (recipe.cook_time || 0)
                        : 0;

                      const actions: SwipeAction[] = [];
                      if (recipe) {
                        actions.push({
                          key: 'shopping',
                          icon: <ShoppingCart className="w-4 h-4" />,
                          label: 'Thêm vào Đi chợ',
                          color: 'primary',
                          onClick: () => handleAddDishToShopping(recipe),
                        });
                      }
                      actions.push({
                        key: 'delete',
                        icon: <Trash2 className="w-4 h-4" />,
                        label: 'Xóa khỏi bữa ăn',
                        color: 'danger',
                        onClick: () => handleRemoveEntry(entry.id, dishTitle),
                      });

                      return (
                        <SwipeableRow
                          key={entry.id}
                          id={`meal-entry-${entry.id}`}
                          actions={actions}
                          contentClassName="bg-content1"
                        >
                          {/* Ảnh đại diện & Thông tin món */}
                          <div
                            className="py-2.5 flex items-center gap-3 cursor-pointer group"
                            onClick={() => {
                              if (recipe) navigate(`/recipes/${recipe.id}`);
                            }}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && recipe) navigate(`/recipes/${recipe.id}`);
                            }}
                          >
                            <div className="w-12 h-12 rounded-xl bg-default-100 shrink-0 overflow-hidden relative shadow-2xs">
                              {recipe?.image_url ? (
                                <img
                                  src={ImageManager.getAssetUrl(recipe.image_url)}
                                  alt={dishTitle}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                  onError={(e) => {
                                    (e.target as HTMLElement).classList.add('hidden');
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-default-400">
                                  <Utensils className="w-5 h-5 opacity-40" />
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate">
                                {dishTitle}
                              </h4>
                              <div className="flex items-center gap-2 text-xs text-default-400 mt-0.5">
                                {totalTime > 0 && (
                                  <span className="flex items-center gap-0.5">
                                    <Clock className="w-3 h-3" />
                                    {totalTime}m
                                  </span>
                                )}
                                {recipe?.nutrition?.calories ? (
                                  <span className="flex items-center gap-0.5 text-danger font-medium">
                                    <Flame className="w-3 h-3" />
                                    {recipe.nutrition.calories} kcal
                                  </span>
                                ) : null}
                                {!recipe && (
                                  <span className="italic text-[11px]">Món tự chọn</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </SwipeableRow>
                      );
                    })}
                  </div>
                ) : (
                  /* Khung rỗng khi chưa có món */
                  <button
                    type="button"
                    onClick={() =>
                      setPickerState({
                        isOpen: true,
                        slotId: slot.id,
                        slotName: slot.name
                      })
                    }
                    className="w-full py-3.5 px-3 rounded-xl border border-dashed border-divider hover:border-primary/50 bg-default-50/40 dark:bg-default-50/5 hover:bg-default-100/50 transition-all flex items-center justify-center gap-2 text-default-400 hover:text-primary cursor-pointer select-none group"
                  >
                    <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-semibold">
                      Thêm món cho {slot.name}
                    </span>
                  </button>
                )}
              </AppCard>
            );
          })}
        </div>
      </div>

      {/* 6. Bottom Sheet Drawer: Chọn món từ công thức hoặc nhập tự chọn */}
      <RecipePickerDrawer
        isOpen={pickerState.isOpen}
        onClose={() => setPickerState((prev) => ({ ...prev, isOpen: false }))}
        targetDate={selectedDateStr}
        targetSlotName={pickerState.slotName}
        onSelectRecipe={handleSelectRecipe}
        onAddCustomMeal={handleAddCustomMeal}
      />

      {/* 7. Drawer Cài đặt cấu trúc bữa ăn (Settings) */}
      <MealSlotSettingsDrawer
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        defaultSlots={defaultSlots}
        onAddSlot={addDefaultSlot}
        onRemoveSlot={removeDefaultSlot}
        onReorderSlots={setDefaultSlots}
      />
    </div>
  );
}
