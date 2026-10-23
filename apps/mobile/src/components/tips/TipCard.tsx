import { Card, Button } from '@/ui';
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@/ui';
import { Lightbulb, Edit, Trash2, MoreVertical } from 'lucide-react';
import type { Tip } from '@apron/core';
import { TIP_CATEGORIES } from '@apron/core';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { ImageManager } from '../../lib/image-manager';

interface TipCardProps {
  tip: Tip;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  isSelected?: boolean;
  onSelect?: () => void;
  selectable?: boolean;
}

export function TipCard({ tip, onClick, onEdit, onDelete, isSelected, onSelect, selectable }: TipCardProps) {
  const category = TIP_CATEGORIES.find(c => c.id === tip.category_id);
  
  const handleClick = () => {
    if (selectable && onSelect) {
      onSelect();
    } else if (onClick) {
      onClick();
    }
  };

  // Strip complex HTML tags for preview, keeping it simple, but we will render it as HTML.
  // Actually, since we want a WYSIWYG preview, we can just use dangerouslySetInnerHTML with line-clamp.
  // To avoid breaking layout, we wrap it in a line-clamp-2 container.

  return (
    <Card 
      onClick={handleClick}
      radius="lg"
      className={`group w-full aspect-3/4 sm:aspect-4/5 relative overflow-hidden shadow-lg border-none cursor-pointer
        ${isSelected ? 'ring-4 ring-primary' : ''}
      `}
    >
      {/* Background Image */}
      {tip.image_url ? (
        <img 
          src={ImageManager.getAssetUrl(tip.image_url)} 
          alt={tip.title}
          className="absolute inset-0 w-full h-full object-cover z-0"
        />
      ) : (
        <div className="absolute inset-0 w-full h-full bg-default-200 flex items-center justify-center z-0">
          <Lightbulb className="w-16 h-16 text-default-500" />
        </div>
      )}

      {/* Dark gradient for text readability */}
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />

      {/* Action Buttons (Top Right) */}
      <div 
        className="absolute top-4 right-4 z-20 flex gap-2"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        {selectable ? (
          <div 
            onClick={(e) => {
              e.stopPropagation();
              onSelect?.();
            }}
            className="bg-black/40 backdrop-blur-md rounded-full p-1 border border-white/20 shadow-sm cursor-pointer"
          >
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-primary border-primary text-white' : 'border-white/60 bg-transparent'}`}>
              {isSelected && <span className="w-2.5 h-2.5 bg-white rounded-full" />}
            </div>
          </div>
        ) : (
          <Dropdown placement="bottom-end" shouldBlockScroll={false} disableAnimation>
            <DropdownTrigger>
              <Button 
                isIconOnly 
                variant="light" 
                size="md" 
                disableAnimation
                className="bg-black/30 backdrop-blur-sm border-none text-white rounded-full"
              >
                <MoreVertical className="w-5 h-5" />
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="Tip Actions">
              <DropdownItem 
                key="edit" 
                startContent={<Edit className="w-4 h-4" />}
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
        )}
      </div>

      {/* Content Area */}
      <div className="relative z-10 flex flex-col justify-end h-full p-4 sm:p-5 text-white">
        <h3 className="font-bold text-sm text-left line-clamp-2 leading-snug mb-1 drop-shadow-md">
          {tip.title}
        </h3>
        
        {/* Preview content */}
        {tip.content && (
          <p className="text-xs text-white/80 line-clamp-2 text-left mb-3 leading-relaxed">
            {tip.content.replace(/<[^>]*>?/gm, '').trim()}
          </p>
        )}

        {/* Badges */}
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          {category && (
            <span className="text-xs font-medium tracking-wide px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm border border-white/10 flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${category.color.replace('bg-', 'bg-').replace('text-', 'bg-')}`} />
              {category.name}
            </span>
          )}
          
          <span className="text-xs font-medium tracking-wide px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm border border-white/10">
            {tip.created_at ? formatDistanceToNow(new Date(tip.created_at), { addSuffix: true, locale: vi }) : ''}
          </span>
        </div>
        
        <Button 
          className="w-full bg-white text-black font-semibold rounded-xl text-xs h-8 shadow-sm"
          size="sm"
          onPress={handleClick}
        >
          Xem chi tiết
        </Button>
      </div>
    </Card>
  );
}
