import { Button } from '@/ui';
import { Trash2, Edit3, UtensilsCrossed } from 'lucide-react';
import type { IngredientMeta } from '../../../store/useIngredientCatalogStore';
import { CATEGORIES, autoCategorizeIngredient } from '@apron/core';
import { getCategoryTheme } from '../../../lib/categoryTheme';

interface IngredientCardProps {
  item: IngredientMeta;
  usageCount: number;
  onEdit: (item: IngredientMeta) => void;
  onDelete: (item: IngredientMeta) => void;
}

export function IngredientCard({
  item,
  usageCount,
  onEdit,
  onDelete
}: IngredientCardProps) {
  const category = item.default_category || autoCategorizeIngredient(item.name);
  const theme = getCategoryTheme(category);
  const CategoryIcon = theme.icon;

  return (
    <div
      onClick={() => onEdit(item)}
      className="group relative flex flex-col bg-content1 dark:bg-default-50/20 rounded-2xl border border-divider/60 hover:border-primary/50 p-2.5 sm:p-3 cursor-pointer transition-all active:scale-[0.98] select-none shadow-none"
    >
      {/* Media: Image or Category Icon */}
      <div className="relative w-full aspect-square rounded-xl overflow-hidden mb-2 bg-default-100 flex items-center justify-center shrink-0">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
          />
        ) : (
          <div className={`w-full h-full flex flex-col items-center justify-center gap-1 ${theme.bg}`}>
            <CategoryIcon className={`w-8 h-8 sm:w-10 sm:h-10 ${theme.text}`} />
            <span className="text-[11px] font-bold text-default-400/80 uppercase tracking-wider">
              {item.name.charAt(0)}
            </span>
          </div>
        )}

        {/* Category Pill (Top Left) */}
        <div className="absolute top-1.5 left-1.5 z-10">
          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-lg shadow-xs backdrop-blur-md ${theme.bg} ${theme.text} border border-white/20 dark:border-black/20`}>
            <CategoryIcon className="w-2.5 h-2.5 shrink-0" />
            <span className="truncate max-w-[80px]">{category}</span>
          </span>
        </div>

        {/* Delete button (Top Right) */}
        <div className="absolute top-1.5 right-1.5 z-10">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(item);
            }}
            aria-label="Xoá nguyên liệu"
            className="w-7 h-7 rounded-lg bg-black/40 hover:bg-danger text-white flex items-center justify-center backdrop-blur-sm transition-colors opacity-90 sm:opacity-0 sm:group-hover:opacity-100"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-col flex-1 justify-between gap-1.5">
        <div>
          <h3
            className="font-bold text-xs sm:text-sm text-foreground line-clamp-1 group-hover:text-primary transition-colors"
            title={item.name}
          >
            {item.name}
          </h3>
          <div className="flex items-center gap-1 text-[11px] text-default-500 mt-0.5">
            <span className="truncate">
              ĐV: <span className="font-medium text-default-700">{item.default_unit || 'g'}</span>
            </span>
          </div>
        </div>

        {/* Bottom Usage Badge */}
        <div className="pt-1 border-t border-divider/40 flex items-center justify-between text-[10px]">
          {usageCount > 0 ? (
            <span className="inline-flex items-center gap-1 font-semibold text-primary bg-primary-50 dark:bg-primary-950/40 px-1.5 py-0.5 rounded-md">
              <UtensilsCrossed className="w-2.5 h-2.5" />
              <span>{usageCount} món</span>
            </span>
          ) : (
            <span className="text-default-400 bg-default-100 dark:bg-default-100/40 px-1.5 py-0.5 rounded-md font-medium">
              Chưa dùng
            </span>
          )}

          <span className="text-default-400 group-hover:text-primary transition-colors flex items-center gap-0.5 text-[10px]">
            <Edit3 className="w-2.5 h-2.5" /> Sửa
          </span>
        </div>
      </div>
    </div>
  );
}
