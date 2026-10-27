import { Button } from '@/ui';
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
    <div 
      onClick={handleClick}
      className={`group w-full aspect-[3/4] sm:aspect-[4/5] relative overflow-hidden transition-all duration-300 rounded-2xl bg-black border-none shadow-none cursor-pointer card-media-root
        ${isSelected ? 'ring-4 ring-primary' : 'hover:scale-[1.02]'}
      `}
    >
      {/* Background Image: dừng lại trước 2 góc dưới và fade mask để triệt tiêu hoàn toàn viền trắng subpixel */}
      {tip.image_url ? (
        <img 
          src={ImageManager.getAssetUrl(tip.image_url)} 
          alt={tip.title}
          className="card-media-img absolute inset-x-0 top-0 bottom-7 w-full h-[calc(100%-1.75rem)] object-cover z-0"
        />
      ) : (
        <div className="card-media-img absolute inset-x-0 top-0 bottom-7 w-full h-[calc(100%-1.75rem)] bg-default-200 flex items-center justify-center z-0">
          <Lightbulb className="w-16 h-16 text-default-500" />
        </div>
      )}

      {/* Additional dark gradient for text readability */}
      <div 
        className="absolute inset-0 z-0 bg-gradient-to-t from-black via-black/50 via-50% to-transparent pointer-events-none"
      ></div>

      {/* Action Buttons (Top Right) */}
      <div className="absolute top-4 right-4 z-20 flex gap-2">
        {selectable ? (
          <div className="bg-black/40 backdrop-blur-md rounded-full p-1 border border-white/20 shadow-sm">
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-primary border-primary text-white' : 'border-white/60 bg-transparent'}`}>
              {isSelected && <span className="w-2.5 h-2.5 bg-white rounded-full"></span>}
            </div>
          </div>
        ) : (
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <Button 
                isIconOnly 
                variant="light" 
                size="sm" 
                className="bg-transparent border-none text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/20"
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
      <div className="relative z-10 flex flex-col justify-end h-full p-5 text-white">
        
        <h3 className="font-bold text-xl text-left line-clamp-2 leading-tight mb-2 drop-shadow-md">
          {tip.title}
        </h3>
        
        {/* WYSIWYG Preview */}
        <div 
          className="text-sm text-white/80 line-clamp-2 text-left mb-4 prose prose-invert prose-sm max-w-none prose-p:my-0 prose-headings:my-0"
          dangerouslySetInnerHTML={{ __html: tip.content }}
        />

        {/* Badges */}
        <div className="flex flex-wrap items-center gap-2 mb-5">
          {category && (
            <span className="text-[10px] font-medium tracking-wide px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-sm border border-white/10 flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${category.color.replace('bg-', 'bg-').replace('text-', 'bg-')}`}></span>
              {category.name}
            </span>
          )}
          
          <span className="text-[10px] font-medium tracking-wide px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-sm border border-white/10">
            {tip.created_at ? formatDistanceToNow(new Date(tip.created_at), { addSuffix: true, locale: vi }) : ''}
          </span>
        </div>
        
        <Button 
          className="w-full bg-white/95 text-black font-semibold rounded-full hover:bg-white"
          size="md"
          onPress={handleClick}
        >
          Xem chi tiết
        </Button>
      </div>
    </div>
  );
}
