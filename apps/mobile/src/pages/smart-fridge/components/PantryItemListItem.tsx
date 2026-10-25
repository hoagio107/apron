import { Trash2, Edit3 } from 'lucide-react';
import type { PantryItem } from '@apron/core';
import { useIngredientCatalogStore } from '../../../store/useIngredientCatalogStore';
import { getCategoryTheme } from '../../../lib/categoryTheme';
import { SwipeableRow, type SwipeAction } from '../../../components/shared/SwipeableRow';

interface PantryItemListItemProps {
  item: PantryItem;
  onEdit: (item: PantryItem) => void;
  onRemove: (id: string) => void;
}

const isExpired = (date?: string) => {
  if (!date) return false;
  return new Date(date).getTime() < new Date().getTime();
};

const getDaysUntilExpiry = (date?: string): number | null => {
  if (!date) return null;
  const diffTime = new Date(date).getTime() - new Date().getTime();
  return Math.ceil(diffTime / (1000 * 3600 * 24));
};

export function PantryItemListItem({
  item,
  onEdit,
  onRemove
}: PantryItemListItemProps) {
  const { getIngredientMetaByName } = useIngredientCatalogStore();
  const meta = getIngredientMetaByName(item.name);

  const expired = isExpired(item.expiry_date);
  const daysUntil = getDaysUntilExpiry(item.expiry_date);
  const nearExpiry = !expired && daysUntil !== null && daysUntil <= 3 && daysUntil >= 0;

  const theme = getCategoryTheme(item.group);
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
      onClick: () => onRemove(item.id),
    },
  ];

  return (
    <SwipeableRow
      id={`pantry-item-${item.id}`}
      actions={actions}
      contentClassName="bg-content1"
    >
      <div
        onClick={() => onEdit(item)}
        className="flex items-center gap-3 px-3.5 py-3 cursor-pointer hover:bg-default-100/50 active:bg-default-100/80 transition-colors select-none"
      >
        {/* Media Thumbnail */}
        <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-default-100 flex items-center justify-center shrink-0">
          {meta?.image_url ? (
            <img
              src={meta.image_url}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className={`w-full h-full flex items-center justify-center ${theme.bg}`}>
              <CategoryIcon className={`w-5 h-5 ${theme.text}`} />
            </div>
          )}
        </div>

        {/* Info: Name, Quantity, Category */}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm text-foreground truncate" title={item.name}>
            {item.name}
          </h3>
          <div className="flex items-center gap-1.5 text-xs mt-0.5 text-default-400">
            <span className="font-semibold text-primary">
              {item.quantity} {item.unit}
            </span>
            <span className="text-default-300 dark:text-default-700">•</span>
            <span className="inline-flex items-center gap-1 shrink-0">
              <CategoryIcon className="w-3 h-3 text-default-400 shrink-0" />
              <span className="truncate max-w-[120px]">{item.group || 'Khác'}</span>
            </span>
          </div>
        </div>

        {/* Freshness / Expiry Pill */}
        {item.expiry_date && (
          <div className="shrink-0 flex items-center">
            {expired ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-danger text-white shadow-xs">
                Hết hạn
              </span>
            ) : nearExpiry ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-warning text-white shadow-xs">
                {daysUntil === 0 ? 'Hôm nay' : `Còn ${daysUntil} ngày`}
              </span>
            ) : (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-lg bg-default-100 dark:bg-default-100/50 text-default-500">
                Còn {daysUntil} ngày
              </span>
            )}
          </div>
        )}
      </div>
    </SwipeableRow>
  );
}
