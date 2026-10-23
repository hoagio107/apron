import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Recipe } from '@apron/core';
import { RecipeRepository } from '@apron/core';
import { Clock, Star, Flame, Image as ImageIcon, MoreVertical, Heart, Trash2, CalendarDays, Edit2 } from 'lucide-react';
import { Checkbox, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Button } from '@/ui';
import { ImageManager } from '../../../lib/image-manager';
import { useRecipeStore } from '../../../store/useRecipeStore';
import { DROPDOWN_CLOSE_DELAY_MS } from '../../../constants';

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

export function RecipeCard({ 
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
  const navigate = useNavigate();
  
  const handleSelectClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectChange?.(!isSelected);
  };

  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [recipe.image_url]);

  const totalTime = recipe.prep_time + recipe.cook_time;
  
  // Format thời gian nấu (vd: 1h30m hoặc 45m)
  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h${m}m` : `${h}h`;
  };

  // Tính điểm đánh giá trung bình
  const getAverageRating = () => {
    if (!recipe.cooking_history || recipe.cooking_history.length === 0) return 0;
    const sum = recipe.cooking_history.reduce((acc: number, curr: { rating: number }) => acc + curr.rating, 0);
    return Number((sum / recipe.cooking_history.length).toFixed(1));
  };
  
  const averageRating = getAverageRating();

  // Grid views
  const isPortrait = viewType === 'grid-portrait';

  const handleMenuAction = (key: React.Key) => {
    const actionKey = String(key);
    // Trì hoãn 80ms để Dropdown đóng hoàn tất trước khi kích hoạt update state gây re-render
    setTimeout(async () => {
      if (onAction) {
        onAction(actionKey, recipe);
        return;
      }
      
      // Fallback xử lý trực tiếp nếu component cha không truyền onAction
      switch (actionKey) {
        case 'favorite':
          try {
            await RecipeRepository.save({ ...recipe, is_favorite: !recipe.is_favorite });
            useRecipeStore.getState().fetchRecipes();
          } catch (e) {
            console.error('Failed to update favorite status:', e);
          }
          break;
        case 'edit':
          navigate(`/recipes/${recipe.id}/edit`);
          break;
        case 'meal_plan':
          navigate('/meal-planner');
          break;
        case 'delete':
          if (window.confirm(`Bạn có chắc muốn xoá công thức "${recipe.title}"?`)) {
            try {
              await RecipeRepository.delete(recipe.id);
              useRecipeStore.getState().fetchRecipes();
            } catch (e) {
              console.error('Failed to delete recipe:', e);
            }
          }
          break;
      }
    }, DROPDOWN_CLOSE_DELAY_MS);
  };

  const menuProps = {
    trigger: (
      <Button 
        isIconOnly 
        variant="light" 
        size="sm" 
        disableAnimation
        className="min-w-0 w-8 h-8 p-0 bg-transparent hover:bg-transparent active:bg-transparent text-white drop-shadow-md border-none shadow-none rounded-full flex items-center justify-center"
      >
        <MoreVertical className="w-5 h-5 drop-shadow-md" />
      </Button>
    ),
    dropdown: (
      <DropdownMenu 
        aria-label="Recipe actions"
        onAction={handleMenuAction}
      >
        <DropdownItem key="meal_plan" startContent={<CalendarDays className="w-4 h-4 text-primary" />}>
          Thêm vào thực đơn
        </DropdownItem>
        <DropdownItem key="favorite" startContent={<Heart className={`w-4 h-4 ${recipe.is_favorite ? 'fill-danger text-danger' : 'text-default-500'}`} />}>
          {recipe.is_favorite ? 'Bỏ yêu thích' : 'Yêu thích'}
        </DropdownItem>
        <DropdownItem key="edit" startContent={<Edit2 className="w-4 h-4 text-default-500" />}>
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
        className={`group w-full aspect-3/4 sm:aspect-4/5 relative overflow-hidden shadow-lg rounded-2xl cursor-pointer ${isSelected ? 'ring-4 ring-primary' : ''}`}
      >
        {/* Background Image */}
        {recipe.image_url && !imgError ? (
          <img 
            src={ImageManager.getAssetUrl(recipe.image_url)} 
            alt={recipe.title} 
            className="absolute inset-0 w-full h-full object-cover z-0"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="absolute inset-0 w-full h-full bg-default-200 flex items-center justify-center z-0">
            <ImageIcon className="w-16 h-16 text-default-500" />
          </div>
        )}

        {/* Additional dark gradient for text readability */}
        <div className="absolute inset-0 z-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none rounded-2xl" />

        {/* Top Actions */}
        <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5 flex-wrap">
          {selectable && (
            <div onClick={handleSelectClick}>
              <Checkbox isSelected={isSelected} onValueChange={(val) => onSelectChange?.(val)} />
            </div>
          )}
          {variantCount > 0 && (
            <div className="bg-black/60 backdrop-blur-sm text-white text-xs font-semibold px-2 py-0.5 rounded-full">
              +{variantCount} biến thể
            </div>
          )}
        </div>

        {/* Context Menu (flush to top-right, transparent background) */}
        <div 
          className="absolute top-1.5 right-0.5 z-20"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          {!hideMenu ? (
            <Dropdown placement="bottom-end" shouldBlockScroll={false} disableAnimation>
              <DropdownTrigger>{menuProps.trigger}</DropdownTrigger>
              {menuProps.dropdown}
            </Dropdown>
          ) : actionIcon && onActionClick ? (
            <Button
              isIconOnly 
              variant="light" 
              size="sm" 
              disableAnimation
              className="min-w-0 w-8 h-8 p-0 bg-transparent hover:bg-transparent active:bg-transparent text-white drop-shadow-md border-none shadow-none rounded-full flex items-center justify-center"
              onClick={(e) => { e.stopPropagation(); onActionClick(e, recipe); }}
            >
              {actionIcon}
            </Button>
          ) : null}
        </div>

        {/* Content Area */}
        <div className="relative z-10 flex flex-col justify-end h-full p-3 text-white">
          <h3 className="font-bold text-sm line-clamp-2 leading-snug mb-1.5 drop-shadow-md">
            {recipe.title}
          </h3>
          
          <div className="flex items-center gap-x-2 text-xs font-medium text-white/90 whitespace-nowrap overflow-hidden">
            <div className="flex items-center gap-1 shrink-0">
              <Clock className="w-3 h-3 text-white/80" />
              <span>{formatTime(totalTime)}</span>
            </div>
            
            <div className="flex items-center gap-0.5 shrink-0">
              <Star className="w-3 h-3 text-warning fill-warning" />
              <span>{averageRating > 0 ? averageRating : '0'}</span>
            </div>

            {recipe.calories > 0 && (
              <div className="flex items-center gap-0.5 shrink-0">
                <Flame className="w-3 h-3 text-danger" />
                <span>{recipe.calories} kcal</span>
              </div>
            )}
          </div>
          
          {/* Favorite Icon (Bottom Right) */}
          {recipe.is_favorite && (
            <div className="absolute bottom-3 right-3 z-20 pointer-events-none">
              <Heart className="w-4 h-4 text-danger" fill="currentColor" />
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
      <div className={`relative rounded-xl overflow-hidden bg-primary-50 ${viewType === 'grid-landscape' ? 'w-full aspect-4/3' : viewType === 'grid-portrait-out' ? 'w-full aspect-3/4' : 'w-full aspect-square'}`}>
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 flex-wrap">
          {selectable && (
            <div onClick={handleSelectClick}>
              <Checkbox isSelected={isSelected} onValueChange={(val) => onSelectChange?.(val)} />
            </div>
          )}
          {variantCount > 0 && (
            <div className="bg-black/60 backdrop-blur-sm text-white text-xs font-semibold px-2 py-0.5 rounded-full">
              +{variantCount} biến thể
            </div>
          )}
        </div>
        
        {/* Context Menu or Custom Action */}
        <div 
          className="absolute top-1.5 right-0.5 z-20"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          {!hideMenu ? (
            <Dropdown placement="bottom-end" shouldBlockScroll={false} disableAnimation>
              <DropdownTrigger>{menuProps.trigger}</DropdownTrigger>
              {menuProps.dropdown}
            </Dropdown>
          ) : actionIcon && onActionClick ? (
            <Button
              isIconOnly 
              variant="light" 
              size="sm" 
              disableAnimation
              className="min-w-0 w-8 h-8 p-0 bg-transparent hover:bg-transparent active:bg-transparent text-white drop-shadow-md border-none shadow-none rounded-full flex items-center justify-center"
              onClick={(e) => { e.stopPropagation(); onActionClick(e, recipe); }}
            >
              {actionIcon}
            </Button>
          ) : null}
        </div>

        {recipe.image_url && !imgError ? (
          <img 
            src={ImageManager.getAssetUrl(recipe.image_url)} 
            alt={recipe.title} 
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full bg-default-200 flex items-center justify-center">
            <ImageIcon className="w-12 h-12 text-default-500" />
          </div>
        )}

        {/* Favorite Icon (Bottom Right of Image) */}
        {recipe.is_favorite && (
          <div className="absolute bottom-2 right-2 z-20 bg-black/40 backdrop-blur-md rounded-full p-1.5 text-white">
            <Heart className="w-4 h-4 text-danger" fill="currentColor" />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <h3 className="font-semibold text-sm line-clamp-2 leading-snug group-hover:text-primary transition-colors">
          {recipe.title}
        </h3>
        
        <div className="flex items-center gap-x-2 whitespace-nowrap overflow-hidden mt-0.5 text-xs text-default-500">
          <div className="flex items-center gap-1 shrink-0">
            <Clock className="w-3 h-3" />
            <span>{formatTime(totalTime)}</span>
          </div>
          
          <div className="flex items-center gap-0.5 shrink-0">
            <Star className="w-3 h-3 text-warning fill-warning" />
            <span>{averageRating > 0 ? averageRating : '0'}</span>
          </div>

          {recipe.calories > 0 && (
            <div className="flex items-center gap-0.5 shrink-0">
              <Flame className="w-3 h-3 text-danger" />
              <span>{recipe.calories} kcal</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
