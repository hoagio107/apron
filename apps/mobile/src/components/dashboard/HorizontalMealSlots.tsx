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
  badgeBg: string;
}

const SLOTS: SlotConfig[] = [
  {
    type: 'breakfast',
    label: 'Sáng',
    icon: <Sunrise className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-500" />,
    badgeBg: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20',
  },
  {
    type: 'lunch',
    label: 'Trưa',
    icon: <Sun className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-500" />,
    badgeBg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
  },
  {
    type: 'dinner',
    label: 'Tối',
    icon: <Moon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-indigo-500" />,
    badgeBg: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20',
  },
];

/**
 * HorizontalMealSlots — Hiển thị 3 bữa ăn trong ngày (Sáng, Trưa, Tối) dàn ngang (3 cột)
 * theo đúng bố cục gọn gàng, trực quan cho trang chủ mobile & desktop.
 */
export function HorizontalMealSlots({ mealPlan, recipes }: HorizontalMealSlotsProps) {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3.5 w-full">
      {SLOTS.map((slot) => {
        const slotEntries = mealPlan.meals.filter((m) => m.meal_type === slot.type);
        const primaryEntry = slotEntries[0];
        const recipe = primaryEntry?.recipe_id
          ? recipes.find((r) => r.id === primaryEntry.recipe_id)
          : null;

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
            <AppCard
              key={slot.type}
              pressable
              className="p-2 sm:p-2.5 flex flex-col justify-between group active:scale-95 transition-all text-left bg-content1 shadow-sm hover:shadow-md border border-divider/60"
              onClick={() => navigate(`/recipes/${recipe.id}`)}
            >
              <div>
                {/* Slot Badge Header */}
                <div className="flex items-center justify-between mb-1.5">
                  <div
                    className={`inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-md text-xs font-bold ${slot.badgeBg}`}
                  >
                    {slot.icon}
                    <span>{slot.label}</span>
                  </div>
                  {slotEntries.length > 1 && (
                    <span className="text-xs font-bold text-primary px-1 rounded bg-primary/10">
                      +{slotEntries.length - 1}
                    </span>
                  )}
                </div>

                {/* Recipe Image */}
                <div className="w-full aspect-4/3 rounded-lg overflow-hidden relative bg-default-100 mb-1.5 shadow-xs">
                  <img
                    src={ImageManager.getAssetUrl(recipe.image_url)}
                    alt={recipe.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLElement).classList.add('hidden');
                    }}
                  />
                </div>

                {/* Recipe Title */}
                <h4 className="font-bold text-sm text-foreground line-clamp-2 leading-tight min-h-10 group-hover:text-primary transition-colors text-left mb-1">
                  {recipe.title}
                </h4>
              </div>

              {/* Meta Info (Time / Calo) */}
              <div className="flex items-center gap-1.5 text-xs text-default-400 font-medium pt-1 border-t border-divider/40">
                {totalTime > 0 ? (
                  <span className="flex items-center gap-0.5 truncate">
                    <Clock className="w-2.5 h-2.5 shrink-0" />
                    {formatTime(totalTime)}
                  </span>
                ) : (
                  <span className="truncate">Món chính</span>
                )}
                {recipe.nutrition?.calories ? (
                  <span className="flex items-center gap-0.5 text-danger-500 font-semibold truncate ml-auto">
                    <Flame className="w-2.5 h-2.5 shrink-0" />
                    {recipe.nutrition.calories}
                  </span>
                ) : null}
              </div>
            </AppCard>
          );
        }

        // Trường hợp 2: Có ghi chú món nhưng không có recipe_id
        if (primaryEntry) {
          return (
            <AppCard
              key={slot.type}
              pressable
              className="p-2 sm:p-2.5 flex flex-col justify-between group active:scale-95 transition-all text-left bg-content1 shadow-sm hover:shadow-md border border-divider/60"
              onClick={() => navigate('/meal-planner')}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div
                    className={`inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-md text-xs font-bold ${slot.badgeBg}`}
                  >
                    {slot.icon}
                    <span>{slot.label}</span>
                  </div>
                </div>

                <div className="w-full aspect-4/3 rounded-lg bg-default-100/70 flex items-center justify-center text-default-400 mb-1.5">
                  <Utensils className="w-5 h-5 opacity-40" />
                </div>

                <h4 className="font-bold text-sm text-foreground line-clamp-2 leading-tight text-left mb-1">
                  {primaryEntry.notes || 'Món ăn tự chọn'}
                </h4>
              </div>

              <div className="text-xs text-default-400 italic pt-1 border-t border-divider/40">
                Ghi chú món
              </div>
            </AppCard>
          );
        }

        // Trường hợp 3: Chưa có món cho bữa này (Empty Slot)
        return (
          <AppCard
            key={slot.type}
            pressable
            className="p-2 sm:p-2.5 flex flex-col justify-between group active:scale-95 transition-all text-left bg-content1/50 border-2 border-dashed border-default-200 dark:border-default-100 hover:border-primary/50 hover:bg-content1"
            onClick={() => navigate('/meal-planner')}
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div
                  className={`inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-md text-xs font-bold ${slot.badgeBg}`}
                >
                  {slot.icon}
                  <span>{slot.label}</span>
                </div>
              </div>

              <div className="w-full aspect-4/3 rounded-lg bg-default-50 dark:bg-default-100/10 flex flex-col items-center justify-center text-default-300 group-hover:text-primary transition-colors mb-1.5">
                <Plus className="w-5 h-5 mb-0.5" />
                <span className="text-xs font-medium">Thêm món</span>
              </div>

              <h4 className="text-xs text-default-400 italic line-clamp-1 text-left mb-1">
                Chưa lên món
              </h4>
            </div>

            <div className="text-xs text-primary font-semibold pt-1 border-t border-divider/40 flex items-center gap-0.5">
              Lên thực đơn &rarr;
            </div>
          </AppCard>
        );
      })}
    </div>
  );
}
