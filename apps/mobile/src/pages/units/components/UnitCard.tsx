import { Button } from '@/ui';
import { Trash2, Edit3, Scale, Droplet, Hash, Package, UtensilsCrossed } from 'lucide-react';
import type { Unit } from '@apron/core';

export interface UnitCardProps {
  unit: Unit;
  category: string;
  usageCount: number;
  onEdit: (unit: Unit) => void;
  onDelete: (unit: Unit) => void;
}

export function getUnitTheme(category: string) {
  switch (category) {
    case 'Khối lượng':
      return {
        icon: Scale,
        bg: 'bg-emerald-50 dark:bg-emerald-500/20',
        text: 'text-emerald-600 dark:text-emerald-400',
        border: 'border-emerald-200/50 dark:border-emerald-800/50'
      };
    case 'Thể tích':
      return {
        icon: Droplet,
        bg: 'bg-sky-50 dark:bg-sky-500/20',
        text: 'text-sky-600 dark:text-sky-400',
        border: 'border-sky-200/50 dark:border-sky-800/50'
      };
    case 'Số lượng / Đếm':
      return {
        icon: Hash,
        bg: 'bg-amber-50 dark:bg-amber-500/20',
        text: 'text-amber-600 dark:text-amber-400',
        border: 'border-amber-200/50 dark:border-amber-800/50'
      };
    default:
      return {
        icon: Package,
        bg: 'bg-purple-50 dark:bg-purple-500/20',
        text: 'text-purple-600 dark:text-purple-400',
        border: 'border-purple-200/50 dark:border-purple-800/50'
      };
  }
}

export function UnitCard({
  unit,
  category,
  usageCount,
  onEdit,
  onDelete
}: UnitCardProps) {
  const theme = getUnitTheme(category);
  const Icon = theme.icon;

  return (
    <div
      onClick={() => onEdit(unit)}
      className="group relative flex items-center justify-between p-3.5 bg-content1 dark:bg-default-50/20 rounded-2xl border border-divider/60 hover:border-primary/50 cursor-pointer transition-all active:scale-[0.99] select-none shadow-none"
    >
      {/* Left: Icon & Info */}
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${theme.bg}`}>
          <Icon className={`w-5 h-5 ${theme.text}`} />
        </div>

        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-base text-foreground group-hover:text-primary transition-colors truncate">
              {unit.name}
            </span>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${theme.bg} ${theme.text}`}>
              {category}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-default-500 mt-1">
            {unit.conversion_rate && unit.base_unit ? (
              <span className="text-[11px] font-medium text-default-600 truncate">
                1 {unit.name} = {unit.conversion_rate} {unit.base_unit}
              </span>
            ) : null}

            {usageCount > 0 ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary bg-primary-50 dark:bg-primary-950/40 px-1.5 py-0.5 rounded-md">
                <UtensilsCrossed className="w-2.5 h-2.5" />
                <span>{usageCount} món</span>
              </span>
            ) : (
              <span className="text-[10px] text-default-400 bg-default-100 dark:bg-default-100/40 px-1.5 py-0.5 rounded-md">
                Chưa dùng
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1 shrink-0 ml-2">
        <Button
          isIconOnly
          size="sm"
          variant="light"
          className="h-8 w-8 rounded-lg text-default-400 hover:text-primary"
          onPress={() => onEdit(unit)}
          aria-label="Chỉnh sửa đơn vị"
        >
          <Edit3 className="w-4 h-4" />
        </Button>
        <Button
          isIconOnly
          size="sm"
          variant="light"
          color="danger"
          className="h-8 w-8 rounded-lg text-default-400 hover:text-danger"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(unit);
          }}
          aria-label="Xoá đơn vị"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
