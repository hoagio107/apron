import { Checkbox, Button } from '@/ui';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { getCategoryTheme } from '../../../lib/categoryTheme';
import { SwipeableRow, type SwipeAction } from '../../../components/shared/SwipeableRow';
import type { ShoppingListItem } from '@apron/core';

interface ShoppingListItemCardProps {
  item: ShoppingListItem;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onUpdateQuantity?: (id: string, newQuantity: number) => void;
  onUpdateUnit?: (id: string, newUnit: string) => void;
}

export function ShoppingListItemCard({
  item,
  onToggle,
  onRemove,
  onUpdateQuantity
}: ShoppingListItemCardProps) {
  const currentQty = typeof item.quantity === 'number'
    ? item.quantity
    : parseInt(item.quantity?.toString() ?? '1', 10) || 1;

  const handleIncrement = () => {
    onUpdateQuantity?.(item.id, currentQty + 1);
  };

  const handleDecrement = () => {
    if (currentQty > 1) {
      onUpdateQuantity?.(item.id, currentQty - 1);
    } else {
      onRemove(item.id);
    }
  };

  const theme = getCategoryTheme(item.group);
  const Icon = theme.icon;

  const actions: SwipeAction[] = [
    {
      key: 'delete',
      icon: <Trash2 className="w-4 h-4" />,
      label: `Xóa ${item.name}`,
      color: 'danger',
      onClick: () => onRemove(item.id),
    },
  ];

  return (
    <SwipeableRow
      id={`shopping-item-${item.id}`}
      actions={actions}
      contentClassName="bg-background"
    >
      <div
        className={`flex items-center gap-3 py-2.5 px-1 transition-all ${
          item.checked ? 'opacity-50' : 'opacity-100'
        }`}
      >
        {/* Checkbox */}
        <Checkbox
          isSelected={item.checked}
          onValueChange={() => onToggle(item.id)}
          size="md"
          color="success"
          radius="full"
          aria-label={`Đánh dấu ${item.name}`}
        />

        {/* Category Icon */}
        <div
          className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center ${theme.bg} ${theme.text}`}
        >
          <Icon className="w-5 h-5" />
        </div>

        {/* Title & Group */}
        <div className="flex-1 min-w-0">
          <h3
            className={`text-sm font-bold text-foreground truncate transition-all ${
              item.checked ? 'line-through text-default-400 font-medium' : ''
            }`}
          >
            {item.name || 'Nguyên liệu'}
          </h3>
          <p className="text-[11px] text-default-400 truncate">
            {item.group || 'Khác'}
          </p>
        </div>

        {/* Quantity Stepper & Unit */}
        <div className="flex items-center gap-1 shrink-0 bg-default-100/50 dark:bg-default-50/10 rounded-xl p-0.5">
          <Button
            isIconOnly
            size="sm"
            variant="light"
            className="text-default-500 w-6 h-6 min-w-6 rounded-lg active:scale-90 transition-transform"
            onPress={handleDecrement}
            aria-label="Giảm số lượng"
          >
            <Minus className="w-3 h-3" />
          </Button>

          <span className="text-xs font-bold text-foreground min-w-[32px] text-center">
            {currentQty} {item.unit || ''}
          </span>

          <Button
            isIconOnly
            size="sm"
            variant="light"
            className="text-primary w-6 h-6 min-w-6 rounded-lg active:scale-90 transition-transform"
            onPress={handleIncrement}
            aria-label="Tăng số lượng"
          >
            <Plus className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </SwipeableRow>
  );
}
