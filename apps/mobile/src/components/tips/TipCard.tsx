import { useTranslation } from 'react-i18next';
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@/ui';
import { Lightbulb, Edit, Trash2, MoreVertical, Check, Clock } from 'lucide-react';
import type { Tip } from '@apron/core';
import { TIP_CATEGORIES } from '@apron/core';
import { formatDistanceToNow } from 'date-fns';
import { vi, enUS } from 'date-fns/locale';
import { ImageManager } from '../../lib/image-manager';

interface TipCardProps {
  tip: Tip;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  isSelected?: boolean;
  onSelect?: () => void;
  selectable?: boolean;
  viewMode?: 'grid' | 'single';
}

export function TipCard({ 
  tip, 
  onClick, 
  onEdit, 
  onDelete, 
  isSelected, 
  onSelect, 
  selectable,
  viewMode = 'grid'
}: TipCardProps) {
  const { t, i18n } = useTranslation();
  const isSingle = viewMode === 'single';

  const category = TIP_CATEGORIES.find(c => 
    c.id === tip.category_id || 
    (tip as any).tags?.some((t: string) => t.includes(c.id) || c.name.toLowerCase().includes(t.replace(/mẹo-?/g, '').toLowerCase()))
  );
  const badgeLabel = category ? category.name : ((tip as any).tags?.[0] ? (tip as any).tags[0].replace(/-/g, ' ') : null);
  
  const handleClick = () => {
    if (selectable && onSelect) {
      onSelect();
    } else if (onClick) {
      onClick();
    }
  };

  const cleanContent = tip.content ? tip.content.replace(/<[^>]*>?/gm, '').trim() : '';

  return (
    <div 
      onClick={handleClick}
      className={`group w-full ${isSingle ? 'aspect-4/3' : 'aspect-3/4 sm:aspect-4/5'} relative overflow-hidden rounded-2xl bg-black border-none shadow-none cursor-pointer active:scale-[0.98] transition-all duration-150 select-none card-media-root ${
        isSelected ? 'ring-3 ring-primary shadow-primary/20' : ''
      }`}
    >
      {/* Background Image: dừng lại trước 2 góc dưới và mask mờ dần để triệt tiêu hoàn toàn viền trắng subpixel */}
      {tip.image_url ? (
        <img 
          src={ImageManager.getAssetUrl(tip.image_url)} 
          alt={tip.title}
          className="card-media-img absolute inset-x-0 top-0 bottom-7 w-full h-[calc(100%-1.75rem)] object-cover z-0 group-hover:scale-105 transition-transform duration-300"
        />
      ) : (
        <div className="card-media-img absolute inset-x-0 top-0 bottom-7 w-full h-[calc(100%-1.75rem)] bg-gradient-to-br from-amber-500/20 via-primary/10 to-default-200 flex items-center justify-center z-0">
          <Lightbulb className={isSingle ? "w-16 h-16 text-primary/40" : "w-12 h-12 text-primary/40"} />
        </div>
      )}

      {/* Dual Gradient Scrim for text readability and top action visibility */}
      <div className={`absolute inset-0 z-0 ${
        isSingle 
          ? 'bg-gradient-to-t from-black via-black/55 via-55% to-black/20' 
          : 'bg-gradient-to-t from-black via-black/45 via-50% to-black/25'
      } pointer-events-none`} />

      {/* Top Left: Category Badge or Select Checkbox */}
      <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5">
        {selectable ? (
          <div 
            onClick={(e) => {
              e.stopPropagation();
              onSelect?.();
            }}
            className="w-7 h-7 rounded-full bg-black/50 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-xs cursor-pointer active:scale-90 transition-transform"
          >
            <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
              isSelected ? 'bg-primary text-white' : 'border border-white/60 bg-transparent'
            }`}>
              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
            </div>
          </div>
        ) : badgeLabel ? (
          <span className={`${
            isSingle ? 'text-xs px-2.5 py-1' : 'text-[11px] px-2 py-0.5'
          } font-semibold rounded-full bg-black/50 backdrop-blur-md border border-white/15 text-white flex items-center gap-1.5 shadow-xs capitalize`}>
            {category && <span className={`w-1.5 h-1.5 rounded-full ${category.color.replace('text-', 'bg-')}`} />}
            <span className={isSingle ? "line-clamp-1 max-w-[200px]" : "line-clamp-1 max-w-[90px]"}>{badgeLabel}</span>
          </span>
        ) : null}
      </div>

      {/* Top Right: Context Menu (nút 3 chấm bỏ nền bỏ viền hoàn toàn) */}
      {!selectable && (
        <div 
          className="absolute top-1.5 right-1.5 z-20"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <button 
                type="button"
                className="w-9 h-9 rounded-full bg-transparent hover:bg-white/15 active:bg-white/25 text-white flex items-center justify-center border-none shadow-none outline-none active:scale-90 transition-all cursor-pointer"
                aria-label={t('common.actions')}
              >
                <MoreVertical className="w-5 h-5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)]" />
              </button>
            </DropdownTrigger>
            <DropdownMenu 
              aria-label="Tip Actions"
              className="min-w-[140px]"
            >
              <DropdownItem 
                key="edit" 
                startContent={<Edit className="w-4 h-4 text-default-500" />}
                onPress={onEdit}
              >
                Chỉnh sửa
              </DropdownItem>
              <DropdownItem 
                key="delete" 
                className="text-danger" 
                color="danger"
                startContent={<Trash2 className="w-4 h-4" />}
                onPress={onDelete}
              >
                Xóa
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      )}

      {/* Content Area (flush to bottom, clean typography, whole card taps to open) */}
      <div className={`relative z-10 flex flex-col justify-end h-full ${
        isSingle ? 'p-3.5 sm:p-4' : 'p-3 sm:p-3.5'
      } text-white pointer-events-none`}>
        <h3 className={`font-bold ${
          isSingle ? 'text-base sm:text-lg line-clamp-2' : 'text-sm sm:text-base line-clamp-2'
        } text-left leading-snug drop-shadow-md text-white`}>
          {tip.title}
        </h3>
        
        {/* Preview content snippet */}
        {cleanContent && (
          <p className={`${
            isSingle ? 'text-xs sm:text-sm text-white/85 line-clamp-2 sm:line-clamp-3 mt-1.5' : 'text-xs text-white/75 line-clamp-2 mt-1'
          } text-left leading-relaxed drop-shadow-2xs`}>
            {cleanContent}
          </p>
        )}

        {/* Time footer */}
        <div className={`flex items-center gap-1.5 ${
          isSingle ? 'text-xs text-white/65 mt-2' : 'text-[11px] text-white/60 mt-1.5'
        }`}>
          <Clock className={`${isSingle ? 'w-3.5 h-3.5' : 'w-3 h-3'} shrink-0`} />
          <span>{tip.created_at ? formatDistanceToNow(new Date(tip.created_at), { addSuffix: true, locale: vi }) : ''}</span>
        </div>
      </div>
    </div>
  );
}
