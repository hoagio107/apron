import React, { memo } from 'react';
import type { Recipe } from '@apron/core';
import { Clock, Star, Flame, Image as ImageIcon, MoreVertical, Heart, Trash2, CalendarDays, Edit2 } from 'lucide-react';
import { Checkbox, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Button } from '@/ui';
import { ImageManager } from '../../../lib/image-manager';

export type RecipeViewType = 'grid-portrait' | 'grid-square' | 'grid-landscape' | 'grid-portrait-out';

interface RecipeCardProps {
  recipe: Recipe;
  viewType: RecipeViewType;
  selectable?: boolean;
  isSelected?: boolean;
  onSelectChange?: (selected: boolean) => void;
  onClick?: () => void;
  onAction?: (action: string, recipe: Recipe) => void;
  variantCount?: number;
  size?: 'sm' | 'md';
  hideMenu?: boolean;
  actionIcon?: React.ReactNode;
  onActionClick?: (e: React.MouseEvent, recipe: Recipe) => void;
}

function RecipeCardComponent({ 
  recipe, 
  viewType, 
  selectable = false, 
  isSelected = false,
  onSelectChange,
  onClick,
  onAction,
  variantCount = 0,
  size = 'md',
  hideMenu = false,
  actionIcon,
  onActionClick
}: RecipeCardProps) {
  
  const handleSelectClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectChange?.(!isSelected);
  };

  const totalTime = (recipe.prep_time || 0) + (recipe.cook_time || 0);
  
  // Format thời gian nấu (vd: 1h30m hoặc 45m)
  const formatTime = (minutes: number) => {
    if (!minutes || isNaN(minutes) || minutes <= 0) return '0m';
    if (minutes < 60) return `${minutes}m`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h${m}m` : `${h}h`;
  };

  // Tính điểm đánh giá trung bình
  const getAverageRating = () => {
    if (!recipe.cooking_history || recipe.cooking_history.length === 0) return 0;
    const sum = recipe.cooking_history.reduce((acc: number, curr: any) => acc + curr.rating, 0);
    return Number((sum / recipe.cooking_history.length).toFixed(1));
  };
  
  const averageRating = getAverageRating();


  // Grid views
  const isPortrait = viewType === 'grid-portrait';

  const menuProps = {
    trigger: (
      <Button 
        isIconOnly 
        variant="light" 
        size="sm" 
        className={`rounded-full transition-opacity opacity-0 group-hover:opacity-100 ${isPortrait ? 'bg-transparent text-white border-none hover:bg-white/20' : 'bg-black/20 text-white hover:bg-black/40'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <MoreVertical className="w-5 h-5" />
      </Button>
    ),
    dropdown: (
      <DropdownMenu 
        aria-label="Recipe actions"
        onAction={(key) => {
          if (onAction) onAction(key as string, recipe);
        }}
      >
        <DropdownItem key="meal_plan" startContent={<CalendarDays className="w-4 h-4" />}>
          Thêm vào thực đơn
        </DropdownItem>
        <DropdownItem key="favorite" startContent={<Heart className={`w-4 h-4 ${recipe.is_favorite ? 'fill-current' : ''}`} />}>
          {recipe.is_favorite ? 'Bỏ yêu thích' : 'Yêu thích'}
        </DropdownItem>
        <DropdownItem key="edit" startContent={<Edit2 className="w-4 h-4" />}>
          Chỉnh sửa
        </DropdownItem>
        <DropdownItem key="delete" className="text-danger" color="danger" startContent={<Trash2 className="w-4 h-4" />}>
          Xoá công thức
        </DropdownItem>
      </DropdownMenu>
    )
  };

  if (isPortrait) {
    return (
      <div 
        onClick={onClick}
        className={`group w-full aspect-[3/4] sm:aspect-[4/5] relative overflow-hidden transition-all duration-300 rounded-2xl bg-black border-none shadow-none cursor-pointer card-media-root ${isSelected ? 'ring-4 ring-primary' : 'hover:scale-[1.02]'}`}
      >
        {/* Background Image: dừng lại trước 2 góc dưới và fade mask để triệt tiêu hoàn toàn viền trắng subpixel */}
        {recipe.image_url ? (
          <img 
            src={ImageManager.getAssetUrl(recipe.image_url)} 
            alt={recipe.title} 
            loading="lazy"
            decoding="async"
            className="card-media-img absolute inset-x-0 top-0 bottom-7 w-full h-[calc(100%-1.75rem)] object-cover z-0 transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="card-media-img absolute inset-x-0 top-0 bottom-7 w-full h-[calc(100%-1.75rem)] bg-default-200 flex items-center justify-center z-0 transition-transform duration-300 group-hover:scale-105">
            <ImageIcon className="w-16 h-16 text-default-500" />
          </div>
        )}

        {/* Additional dark gradient for text readability */}
        <div 
          className="absolute inset-0 z-0 bg-gradient-to-t from-black via-black/50 via-50% to-transparent pointer-events-none"
        ></div>

        {/* Top Actions */}
        <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
          {selectable && (
            <div onClick={handleSelectClick}>
              <Checkbox isSelected={isSelected} onValueChange={(val) => onSelectChange?.(val)} />
            </div>
          )}
          {variantCount > 0 && (
            <div className="bg-black/60 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
              +{variantCount} biến thể
            </div>
          )}
        </div>
        
        <div className="absolute top-3 right-3 z-20">
          {!hideMenu ? (
            <Dropdown>
              <DropdownTrigger>{menuProps.trigger}</DropdownTrigger>
              {menuProps.dropdown}
            </Dropdown>
          ) : actionIcon && onActionClick ? (
            <Button
              isIconOnly 
              variant="light" 
              size="sm" 
              className={`rounded-full transition-opacity opacity-0 group-hover:opacity-100 ${isPortrait ? 'bg-transparent text-white border-none hover:bg-white/20' : 'bg-black/20 text-white hover:bg-black/40'}`}
              onClick={(e) => { e.stopPropagation(); onActionClick(e, recipe); }}
            >
              {actionIcon}
            </Button>
          ) : null}
        </div>

        {/* Content Area */}
        <div className="relative z-10 flex flex-col justify-end h-full p-4 text-white">
          <h3 className="font-bold text-base line-clamp-2 leading-tight mb-2 drop-shadow-md">
            {recipe.title}
          </h3>
          
          <div className={`flex flex-wrap items-center gap-y-1 font-medium text-white/90 ${size === 'sm' ? 'text-[10px] gap-x-2' : 'text-[11px] gap-x-3'}`}>
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatTime(totalTime)}</span>
            </div>
            
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-warning" fill="currentColor" />
              <span>{averageRating > 0 ? averageRating : '0'}</span>
            </div>

            <div className="flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-danger" />
              <span>{recipe.calories} kcal</span>
            </div>
          </div>
          
          {/* Favorite Icon (Bottom Right) */}
          {recipe.is_favorite && (
            <div className="absolute bottom-4 right-4 z-20">
              <Heart className="w-5 h-5 text-danger" fill="currentColor" />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Original grid-square layout
  return (
    <div 
      onClick={onClick}
      className={`group flex flex-col cursor-pointer relative ${size === 'sm' ? 'gap-1.5' : 'gap-3'}`}
    >
      <div className={`relative rounded-xl overflow-hidden bg-primary-50 ${viewType === 'grid-landscape' ? 'w-full aspect-[4/3]' : 'w-full aspect-square'}`}>
        <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
          {selectable && (
            <div onClick={handleSelectClick}>
              <Checkbox isSelected={isSelected} onValueChange={(val) => onSelectChange?.(val)} />
            </div>
          )}
          {variantCount > 0 && (
            <div className="bg-black/60 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
              +{variantCount} biến thể
            </div>
          )}
        </div>
        
        {/* Context Menu or Custom Action */}
        <div className="absolute top-2 right-2 z-20">
          {!hideMenu ? (
            <Dropdown>
              <DropdownTrigger>{menuProps.trigger}</DropdownTrigger>
              {menuProps.dropdown}
            </Dropdown>
          ) : actionIcon && onActionClick ? (
            <Button
              isIconOnly 
              variant="light" 
              size="sm" 
              className="rounded-full transition-opacity opacity-0 group-hover:opacity-100 bg-black/20 text-white hover:bg-black/40"
              onClick={(e) => { e.stopPropagation(); onActionClick(e, recipe); }}
            >
              {actionIcon}
            </Button>
          ) : null}
        </div>

        {recipe.image_url ? (
          <img 
            src={ImageManager.getAssetUrl(recipe.image_url)} 
            alt={recipe.title} 
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-default-200 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
            <ImageIcon className="w-12 h-12 text-default-500" />
          </div>
        )}
        {/* Lớp overlay mỏng khi hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors pointer-events-none" />

        {/* Favorite Icon (Bottom Right of Image) */}
        {recipe.is_favorite && (
          <div className="absolute bottom-2 right-2 z-20 bg-black/40 backdrop-blur-md rounded-full p-1.5 text-white">
            <Heart className="w-4 h-4 text-danger" fill="currentColor" />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <h3 className={`font-semibold line-clamp-2 leading-tight group-hover:text-primary transition-colors ${size === 'sm' ? 'text-sm' : 'text-base'}`}>
          {recipe.title}
        </h3>
        
        <div className={`flex flex-wrap items-center gap-y-1 mt-0.5 ${size === 'sm' ? 'text-[10px] text-default-400 gap-x-2' : 'text-[11px] text-default-500 gap-x-3'}`}>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{formatTime(totalTime)}</span>
          </div>
          
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 text-warning" fill="currentColor" />
            <span>{averageRating > 0 ? averageRating : '0'}</span>
          </div>

          <div className="flex items-center gap-1">
            <Flame className="w-3 h-3 text-danger" />
            <span>{recipe.calories} kcal</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export const RecipeCard = memo(RecipeCardComponent);
