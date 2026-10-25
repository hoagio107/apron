import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@/ui';
import { Trash2, Edit3, MoreVertical } from 'lucide-react';
import type { PantryItem } from '@apron/core';
import { useIngredientCatalogStore } from '../../../store/useIngredientCatalogStore';
import { getCategoryTheme } from '../../../lib/categoryTheme';

interface PantryItemCardProps {
  item: PantryItem;
  onRemove: (id: string) => void;
  onEdit: (item: PantryItem) => void;
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

export function PantryItemCard({ item, onRemove, onEdit }: PantryItemCardProps) {
  const { getIngredientMetaByName } = useIngredientCatalogStore();
  const meta = getIngredientMetaByName(item.name);

  const expired = isExpired(item.expiry_date);
  const daysUntil = getDaysUntilExpiry(item.expiry_date);
  const nearExpiry = !expired && daysUntil !== null && daysUntil <= 3 && daysUntil >= 0;

  const theme = getCategoryTheme(item.group);
  const CategoryIcon = theme.icon;

  return (
    <div
      onClick={() => onEdit(item)}
      className={`group relative flex flex-col bg-content1 dark:bg-default-50/20 rounded-2xl border-none p-3 cursor-pointer transition-all active:scale-[0.98] select-none shadow-none ${
        expired
          ? 'bg-danger/10 dark:bg-danger/15'
          : nearExpiry
          ? 'bg-warning/10 dark:bg-warning/15'
          : ''
      }`}
    >
      {/* Top Media: Image or Category Icon */}
      <div className="relative w-full aspect-square rounded-xl overflow-hidden mb-2.5 bg-default-100 flex items-center justify-center shrink-0">
        {meta?.image_url ? (
          <img
            src={meta.image_url}
            alt={item.name}
            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
          />
        ) : (
          <div className={`w-full h-full flex items-center justify-center ${theme.bg}`}>
            <CategoryIcon className={`w-10 h-10 ${theme.text}`} />
          </div>
        )}

        {/* Freshness Badge (Top Left) */}
        {item.expiry_date && (
          <div className="absolute top-2 left-2 z-10">
            {expired ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-danger text-white shadow-xs flex items-center gap-1">
                Hết hạn
              </span>
            ) : nearExpiry ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-warning text-white shadow-xs flex items-center gap-1">
                {daysUntil === 0 ? 'Hôm nay' : `Còn ${daysUntil} ngày`}
              </span>
            ) : (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-sm text-white shadow-xs flex items-center gap-1">
                {daysUntil} ngày
              </span>
            )}
          </div>
        )}

        {/* Action Menu (Top Right) - Single 3-dot button */}
        <div className="absolute top-2 right-2 z-10">
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
              aria-label="Thao tác nguyên liệu tủ lạnh"
              onAction={(key) => {
                if (key === 'edit') onEdit(item);
                if (key === 'delete') onRemove(item.id);
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

      {/* Info: Name, Quantity & Category */}
      <div className="flex flex-col gap-1 w-full min-w-0 text-left">
        <span className="font-bold text-sm text-foreground truncate" title={item.name}>
          {item.name}
        </span>

        <div className="flex items-center justify-between gap-1 text-xs">
          <span className="font-semibold text-primary">
            {item.quantity} {item.unit}
          </span>
          <span className="text-[10px] text-default-400 font-medium truncate">
            {item.group || 'Khác'}
          </span>
        </div>
      </div>
    </div>
  );
}
