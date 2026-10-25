import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sunrise, Sun, Moon, Clock, Flame, Utensils, Plus } from 'lucide-react';
import type { Recipe, MealPlan } from '@apron/core';
import { AppCard } from '@/ui';
import { ImageManager } from '../../lib/image-manager';

interface HorizontalMealSlotsProps {
  mealPlan: MealPlan;
  recipes: Recipe[];
}

interface SlotConfig {
  type: 'breakfast' | 'lunch' | 'dinner';
  label: string;
  icon: ReactNode;
}

const SLOTS: SlotConfig[] = [
  {
    type: 'breakfast',
    label: 'Sáng',
    icon: <Sunrise className="w-3.5 h-3.5 text-amber-500 shrink-0" />,
  },
  {
    type: 'lunch',
    label: 'Trưa',
    icon: <Sun className="w-3.5 h-3.5 text-emerald-500 shrink-0" />,
  },
  {
    type: 'dinner',
    label: 'Tối',
    icon: <Moon className="w-3.5 h-3.5 text-indigo-500 shrink-0" />,
  },
];

/**
 * HorizontalMealSlots — Hiển thị 3 bữa ăn trong ngày (Sáng, Trưa, Tối) trong 1 khung bao duy nhất,
 * ngăn cách bằng đường kẻ dọc có khoảng đệm (padding) với top/bottom, badge không viền/nền và badge thời gian đặt trên ảnh đại diện.
 */
export function HorizontalMealSlots({ mealPlan, recipes }: HorizontalMealSlotsProps) {
  const navigate = useNavigate();

  return (
    <AppCard className="p-0 overflow-hidden shadow-none border border-divider/60 bg-content1">
      <div className="grid grid-cols-3">
        {SLOTS.map((slot, index) => {
          const slotEntries = mealPlan.meals.filter((m) => m.meal_type === slot.type);
          const primaryEntry = slotEntries[0];
          const recipe = primaryEntry?.recipe_id
            ? recipes.find((r) => r.id === primaryEntry.recipe_id)
            : null;

          const isLastSlot = index === SLOTS.length - 1;

          // Đường kẻ dọc ngăn cách giữa các bữa ăn (có padding top & bottom)
          const verticalDivider = !isLastSlot ? (
            <div
              className="absolute right-0 top-3.5 bottom-3.5 w-[1px] bg-divider/50 pointer-events-none"
              aria-hidden="true"
            />
          ) : null;

          // Trường hợp 1: Có công thức món ăn
          if (recipe) {
            const totalTime = recipe.prep_time + recipe.cook_time;
            const formatTime = (minutes: number) => {
              if (minutes < 60) return `${minutes}m`;
              const h = Math.floor(minutes / 60);
              const m = minutes % 60;
              return m > 0 ? `${h}h${m}m` : `${h}h`;
            };

            return (
              <div
                key={slot.type}
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/recipes/${recipe.id}`)}
                onKeyDown={(e) => e.key === 'Enter' && navigate(`/recipes/${recipe.id}`)}
                className="relative p-2.5 sm:p-3 flex flex-col justify-between group active:scale-[0.98] transition-all text-left hover:bg-default-100/30 dark:hover:bg-default-50/5 cursor-pointer select-none"
              >
                <div>
                  {/* Slot Header: Clean Text & Icon, No background, No border */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                      {slot.icon}
                      <span>{slot.label}</span>
                    </div>
                    {slotEntries.length > 1 && (
                      <span className="text-[10px] font-bold text-primary px-1 rounded bg-primary/10">
                        +{slotEntries.length - 1}
                      </span>
                    )}
                  </div>

                  {/* Recipe Image with Time Badge Overlay */}
                  <div className="w-full aspect-4/3 rounded-lg overflow-hidden relative bg-default-100 mb-2 shadow-2xs">
                    <img
                      src={ImageManager.getAssetUrl(recipe.image_url)}
                      alt={recipe.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLElement).classList.add('hidden');
                      }}
                    />
                    {totalTime > 0 && (
                      <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded-md bg-black/65 backdrop-blur-xs text-white text-[10px] font-semibold flex items-center gap-0.5 shadow-xs">
                        <Clock className="w-2.5 h-2.5" />
                        <span>{formatTime(totalTime)}</span>
                      </div>
                    )}
                  </div>

                  {/* Recipe Title */}
                  <h4 className="font-bold text-xs sm:text-sm text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors text-left mb-1">
                    {recipe.title}
                  </h4>
                </div>

                {/* Meta Info (Calo) */}
                {recipe.nutrition?.calories ? (
                  <div className="flex items-center gap-0.5 text-[10px] sm:text-[11px] text-default-400 font-medium pt-1">
                    <Flame className="w-2.5 h-2.5 text-danger shrink-0" />
                    <span>{recipe.nutrition.calories} kcal</span>
                  </div>
                ) : null}

                {verticalDivider}
              </div>
            );
          }

          // Trường hợp 2: Có ghi chú món nhưng không có recipe_id
          if (primaryEntry) {
            return (
              <div
                key={slot.type}
                role="button"
                tabIndex={0}
                onClick={() => navigate('/meal-planner')}
                onKeyDown={(e) => e.key === 'Enter' && navigate('/meal-planner')}
                className="relative p-2.5 sm:p-3 flex flex-col justify-between group active:scale-[0.98] transition-all text-left hover:bg-default-100/30 dark:hover:bg-default-50/5 cursor-pointer select-none"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                      {slot.icon}
                      <span>{slot.label}</span>
                    </div>
                  </div>

                  <div className="w-full aspect-4/3 rounded-lg bg-default-100 flex items-center justify-center text-default-400 mb-2">
                    <Utensils className="w-5 h-5 opacity-40" />
                  </div>

                  <h4 className="font-bold text-xs sm:text-sm text-foreground line-clamp-2 leading-snug text-left mb-1">
                    {primaryEntry.notes || 'Món tự chọn'}
                  </h4>
                </div>

                <div className="text-[10px] sm:text-xs text-default-400 italic pt-1">
                  Ghi chú món
                </div>

                {verticalDivider}
              </div>
            );
          }

          // Trường hợp 3: Chưa có món cho bữa này (Empty Slot)
          return (
            <div
              key={slot.type}
              role="button"
              tabIndex={0}
              onClick={() => navigate('/meal-planner')}
              onKeyDown={(e) => e.key === 'Enter' && navigate('/meal-planner')}
              className="relative p-2.5 sm:p-3 flex flex-col justify-between group active:scale-[0.98] transition-all text-left hover:bg-default-100/30 dark:hover:bg-default-50/5 cursor-pointer select-none"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                    {slot.icon}
                    <span>{slot.label}</span>
                  </div>
                </div>

                <div className="w-full aspect-4/3 rounded-lg border border-dashed border-divider/80 bg-default-50/50 dark:bg-default-50/5 flex flex-col items-center justify-center text-default-400 group-hover:text-primary group-hover:border-primary/50 transition-colors mb-2">
                  <Plus className="w-4 h-4 mb-0.5" />
                  <span className="text-[10px] sm:text-[11px] font-medium">Thêm món</span>
                </div>

                <h4 className="text-xs text-default-400 italic line-clamp-1 text-left mb-1">
                  Chưa lên món
                </h4>
              </div>

              <div className="text-[11px] text-primary font-medium pt-1 flex items-center gap-0.5">
                Lên món &rarr;
              </div>

              {verticalDivider}
            </div>
          );
        })}
      </div>
    </AppCard>
  );
}
