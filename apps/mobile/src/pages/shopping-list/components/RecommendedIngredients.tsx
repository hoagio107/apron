import { useRef, useState, useEffect } from 'react';
import { Button } from '@/ui';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { SectionTitle } from '../../../components/shared/SectionTitle';
import { useShoppingListStore } from '../../../store/useShoppingListStore';
import { CATEGORIES } from '@apron/core';
import { useIngredientCatalogStore } from '../../../store/useIngredientCatalogStore';
import { Avatar } from '@/ui';
import { ImageManager } from '../../../lib/image-manager';
import { getCategoryTheme } from '../../../lib/categoryTheme';

// We will derive suggestions dynamically from the ingredient catalog

export function RecommendedIngredients() {
  const { addItem, items } = useShoppingListStore();
  const { getAllIngredients } = useIngredientCatalogStore();
  const catalog = getAllIngredients();

  // Find items in catalog that are not currently in the shopping list (active items)
  const suggestions = catalog.filter(catItem => 
    !items.some(i => i.name.toLowerCase() === catItem.name.toLowerCase() && !i.checked)
  ).slice(0, 8); // show max 8 suggestions



  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(Math.ceil(scrollLeft) < scrollWidth - clientWidth);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [suggestions]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollAmount = clientWidth * 0.75;
      scrollRef.current.scrollTo({
        left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (suggestions.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <SectionTitle title="Gợi ý" />

      <div className="relative group -mx-2 px-2">
        {canScrollLeft && (
          <Button
            isIconOnly
            size="md"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-background/80 backdrop-blur-md shadow-md rounded-full text-foreground -mt-2"
            onPress={() => scroll('left')}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
        )}
        
        {canScrollRight && suggestions.length > 3 && (
          <Button
            isIconOnly
            size="md"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-background/80 backdrop-blur-md shadow-md rounded-full text-foreground -mt-2"
            onPress={() => scroll('right')}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        )}

        <div 
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex gap-4 overflow-x-auto pb-4 snap-x [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
        {suggestions.map((item, idx) => {
          const imageUrl = item.image_url;
          
          return (
            <div 
              key={item.id || idx} 
              className="w-32 h-36 flex-shrink-0 app-card p-3 flex flex-col justify-between items-center relative snap-start"
            >
              <Button 
                isIconOnly 
                size="md" 
                variant="flat"
                color="default"
                className="absolute top-2 right-2 w-6 h-6 min-w-6 rounded-full z-10"
                onPress={() => addItem(item.name, undefined, item.default_unit, item.default_category)}
              >
                <Plus className="w-3 h-3" />
              </Button>
              
              {(() => {
                const theme = getCategoryTheme(item.default_category || CATEGORIES.OTHERS);
                const Icon = theme.icon;
                
                return imageUrl ? (
                  <Avatar 
                    src={ImageManager.getAssetUrl(imageUrl)} 
                    className="w-16 h-16 flex-shrink-0 bg-default-100 text-large mt-2" 
                    showFallback
                    fallback={<Icon className="w-8 h-8 text-default-400" />}
                  />
                ) : (
                  <div className={`w-16 h-16 rounded-full flex-shrink-0 flex items-center justify-center mt-2 ${theme.bg} ${theme.text}`}>
                    <Icon className="w-8 h-8" />
                  </div>
                );
              })()}
              
              <span className="font-semibold text-sm text-center mt-2 truncate w-full">{item.name}</span>
            </div>
          );
        })}
        </div>
      </div>
    </div>
  );
}
