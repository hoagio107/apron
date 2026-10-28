import { Button } from '@/ui';
import { useTranslation } from 'react-i18next';
import { Trash2, Edit3, UtensilsCrossed } from 'lucide-react';
import type { Unit } from '@apron/core';
import { getUnitTheme } from '../unitTheme';

export interface UnitCardProps {
  unit: Unit;
  category: string;
  usageCount: number;
  onEdit: (unit: Unit) => void;
  onDelete: (unit: Unit) => void;
}

export function UnitCard({
  unit,
  category,
  usageCount,
  onEdit,
  onDelete
}: UnitCardProps) {
  const { t } = useTranslation();
  const theme = getUnitTheme(category);
  const Icon = theme.icon;

  return (
    <div
      onClick={() => onEdit(unit)}
      className="group relative flex items-center justify-between p-3.5 hover:bg-default-100/30 dark:hover:bg-default-50/10 cursor-pointer transition-colors select-none"
    >
      {/* Left: Icon & Info */}
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${theme.bg}`}>
          <Icon className={`w-4 h-4 ${theme.text}`} />
        </div>

        <div className="flex flex-col min-w-0">
          <span className="font-bold text-sm text-foreground group-hover:text-primary transition-colors truncate">
            {unit.name}
          </span>

          <div className="flex items-center gap-2 text-xs mt-0.5">
            {unit.conversion_rate && unit.base_unit ? (
              <>
                <span className="text-[11px] font-medium text-default-400 truncate">
                  1 {unit.name} = {unit.conversion_rate} {unit.base_unit}
                </span>
                <span className="text-default-300 dark:text-default-700">•</span>
              </>
            ) : null}

            {usageCount > 0 ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-primary">
                <UtensilsCrossed className="w-3 h-3" />
                <span>{t('units.usedInRecipes', { count: usageCount })}</span>
              </span>
            ) : (
              <span className="text-[11px] font-medium text-default-400">
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
          aria-label={t('units.editUnit')}
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
          aria-label={t('common.delete')}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
