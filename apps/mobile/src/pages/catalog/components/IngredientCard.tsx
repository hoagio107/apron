import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@/ui';
import { Trash2, Edit3, MoreVertical } from 'lucide-react';
import type { IngredientMeta } from '../../../store/useIngredientCatalogStore';
import { autoCategorizeIngredient } from '@apron/core';
import { getCategoryTheme } from '../../../lib/categoryTheme';

interface IngredientCardProps {
  item: IngredientMeta;
  onEdit: (item: IngredientMeta) => void;
  onDelete: (item: IngredientMeta) => void;
}

export function IngredientCard({
  item,
  onEdit,
  onDelete
}: IngredientCardProps) {
  const category = item.default_category || autoCategorizeIngredient(item.name);
  const theme = getCategoryTheme(category);
  const CategoryIcon = theme.icon;

  return (
    <div
      onClick={() => onEdit(item)}
      className="group relative flex flex-col bg-content1 dark:bg-default-50/20 rounded-2xl border-none p-2.5 sm:p-3 cursor-pointer transition-all active:scale-[0.98] select-none shadow-none"
    >
      {/* Media: Image or Category Icon */}
      <div className="relative w-full aspect-square rounded-xl overflow-hidden mb-2.5 bg-default-100 flex items-center justify-center shrink-0">
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

        {/* Action Menu (Top Right) - Single 3-dot button */}
        <div className="absolute top-1.5 right-1.5 z-10">
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <button
                type="button"
                onClick={(e) => e.stopPropagation()}
                aria-label="Thao tác"
                className="w-7 h-7 rounded-lg bg-black/40 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-sm transition-colors opacity-90 sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>
            </DropdownTrigger>
            <DropdownMenu
              aria-label="Thao tác nguyên liệu"
              onAction={(key) => {
                if (key === 'edit') onEdit(item);
                if (key === 'delete') onDelete(item);
              }}
            >
              <DropdownItem key="edit" startContent={<Edit3 className="w-4 h-4" />}>
                Chỉnh sửa
              </DropdownItem>
              <DropdownItem key="delete" color="danger" className="text-danger" startContent={<Trash2 className="w-4 h-4" />}>
                Xoá nguyên liệu
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-col flex-1 justify-between gap-1">
        <h3
          className="font-bold text-xs sm:text-sm text-foreground line-clamp-1 group-hover:text-primary transition-colors"
          title={item.name}
        >
          {item.name}
        </h3>
        <div className="flex items-center justify-between text-[11px] text-default-500 pt-1 border-t border-divider/40">
          <span className="truncate">
            Đơn vị: <span className="font-semibold text-default-700">{item.default_unit || 'g'}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
