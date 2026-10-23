import type { ReactNode } from 'react';
import type { Recipe, MealPlanEntry } from '@apron/core';
import { useNavigate } from 'react-router-dom';
import { RecipeCard } from '../recipes/list/RecipeCard';

interface MealSlotRowProps {
  /** Icon element for the meal slot (e.g., <Sunrise />) */
  icon: ReactNode;
  /** Label text (e.g., "Sáng", "Trưa", "Tối") */
  label: string;
  /** Color class for the icon and label (e.g., "text-warning-500") */
  colorClass: string;
  /** Meal type key to filter entries (e.g., "breakfast", "lunch", "dinner") */
  mealType: string;
  /** Border color class for text-only meal entries (e.g., "border-primary") */
  borderColorClass: string;
  /** Meal plan entries for the current day */
  entries: MealPlanEntry[];
  /** All available recipes (for looking up by ID) */
  recipes: Recipe[];
}

/**
 * MealSlotRow — A single meal time slot row in the Today's Plan card.
 *
 * Renders the slot label (icon + text) and a responsive grid of either
 * RecipeCards or text notes for each meal entry.
 *
 * Usage:
 *   <MealSlotRow
 *     icon={<Sunrise className="w-4 h-4" />}
 *     label="Sáng"
 *     colorClass="text-warning-500"
 *     mealType="breakfast"
 *     borderColorClass="border-primary"
 *     entries={todayMealPlan.meals}
 *     recipes={recipes}
 *   />
 */
export function MealSlotRow({
  icon,
  label,
  colorClass,
  mealType,
  borderColorClass,
  entries,
  recipes,
}: MealSlotRowProps) {
  const navigate = useNavigate();
  const slotEntries = entries.filter((m) => m.meal_type === mealType);

  return (
    <div className="flex flex-col gap-2">
      <div className={`flex items-center gap-1.5 ${colorClass}`}>
        {icon}
        <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
      </div>
      <div className="grid grid-cols-3 gap-3 mt-1">
        {slotEntries.length > 0 ? (
          slotEntries.map((m, i) => {
            const recipe = recipes.find((r) => r.id === m.recipe_id);
            if (recipe) {
              return (
                <RecipeCard
                  key={i}
                  recipe={recipe}
                  viewType="grid-landscape"
                  size="sm"
                  onClick={() => navigate(`/recipes/${recipe.id}`)}
                />
              );
            }
            return (
              <div
                key={i}
                className={`text-sm font-medium py-1 border-l-2 ${borderColorClass} pl-3 col-span-full`}
              >
                {m.notes ?? 'Món ăn'}
              </div>
            );
          })
        ) : (
          <span className="text-sm text-default-400 italic col-span-full">Chưa lên món</span>
        )}
      </div>
    </div>
  );
}
