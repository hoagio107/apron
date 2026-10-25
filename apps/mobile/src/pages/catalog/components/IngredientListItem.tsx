import { Trash2, Edit3 } from 'lucide-react';
import type { IngredientMeta } from '../../../store/useIngredientCatalogStore';
import { autoCategorizeIngredient } from '@apron/core';
import { getCategoryTheme } from '../../../lib/categoryTheme';
import { SwipeableRow, type SwipeAction } from '../../../components/shared/SwipeableRow';

interface IngredientListItemProps {
  item: IngredientMeta;
  onEdit: (item: IngredientMeta) => void;
  onDelete: (item: IngredientMeta) => void;
}

export function IngredientListItem({
  item,
  onEdit,
  onDelete
}: IngredientListItemProps) {
  const category = item.default_category || autoCategorizeIngredient(item.name);
  const theme = getCategoryTheme(category);
  const CategoryIcon = theme.icon;

  const actions: SwipeAction[] = [
    {
      key: 'edit',
      label: 'Sửa',
      color: 'primary',
      icon: <Edit3 className="w-4 h-4" />,
      onClick: () => onEdit(item),
    },
    {
      key: 'delete',
      label: 'Xoá',
      color: 'danger',
      icon: <Trash2 className="w-4 h-4" />,
      onClick: () => onDelete(item),
    },
  ];

  return (
    <SwipeableRow
      id={`catalog-ingredient-${item.id}`}
      actions={actions}
      contentClassName="bg-content1"
    >
      <div
        onClick={() => onEdit(item)}
        className="flex items-center gap-3 px-3.5 py-3 cursor-pointer hover:bg-default-100/50 active:bg-default-100/80 transition-colors select-none"
      >
        {/* Media Thumbnail */}
        <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-default-100 flex items-center justify-center shrink-0">
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className={`w-full h-full flex items-center justify-center ${theme.bg}`}>
              <CategoryIcon className={`w-5 h-5 ${theme.text}`} />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm text-foreground truncate" title={item.name}>
            {item.name}
          </h3>
          <div className="flex items-center gap-1.5 text-xs mt-0.5 text-default-400">
            <span className="inline-flex items-center gap-1 shrink-0">
              <CategoryIcon className="w-3 h-3 text-default-400 shrink-0" />
              <span>{category}</span>
            </span>
            <span className="text-default-300 dark:text-default-700">•</span>
            <span>
              Đơn vị: <span className="font-medium text-default-600 dark:text-default-300">{item.default_unit || 'g'}</span>
            </span>
          </div>
        </div>
      </div>
    </SwipeableRow>
  );
}
