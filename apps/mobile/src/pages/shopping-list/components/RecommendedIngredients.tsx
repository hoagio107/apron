import { useRef, useState, useEffect, useMemo } from 'react';
import { Button } from '@/ui';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { SectionTitle } from '../../../components/shared/SectionTitle';
import { useShoppingListStore } from '../../../store/useShoppingListStore';
import { useRecipeStore } from '../../../store/useRecipeStore';
import { CATEGORIES } from '@apron/core';
import { getCategoryTheme } from '../../../lib/categoryTheme';

export function RecommendedIngredients() {
  const { addItem, items } = useShoppingListStore();
  const recipes = useRecipeStore(s => s.recipes);

  // Derive unique ingredients from recipes
  const suggestions = useMemo(() => {
    const map = new Map<string, { name: string; unit: string; group?: string }>();
    for (const recipe of recipes) {
      for (const ing of (recipe.ingredients || [])) {
        if (ing.name && !map.has(ing.name.toLowerCase().trim())) {
          map.set(ing.name.toLowerCase().trim(), {
            name: ing.name.trim(),
            unit: ing.unit || 'phần',
            group: ing.group
          });
        }
      }
    }
    // Filter items already in the shopping list (unchecked)
    return Array.from(map.values()).filter(cand =>
      !items.some(i => i.name.toLowerCase() === cand.name.toLowerCase() && !i.checked)
    ).slice(0, 8);
  }, [recipes, items]);

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
      <SectionTitle title="Gợi ý từ công thức" />

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
          const theme = getCategoryTheme(item.group || CATEGORIES.OTHERS);
          const Icon = theme.icon;
          
          return (
            <div 
              key={idx} 
              className="w-32 h-36 flex-shrink-0 app-card p-3 flex flex-col justify-between items-center relative snap-start"
            >
              <Button 
                isIconOnly 
                size="md" 
                variant="flat"
                color="default"
                className="absolute top-2 right-2 w-6 h-6 min-w-6 rounded-full z-10"
                onPress={() => addItem(item.name, 1, item.unit, item.group)}
              >
                <Plus className="w-3 h-3" />
              </Button>
              
              <div className={`w-16 h-16 rounded-full flex-shrink-0 flex items-center justify-center mt-2 ${theme.bg} ${theme.text}`}>
                <Icon className="w-8 h-8" />
              </div>
              
              <span className="font-semibold text-sm text-center mt-2 truncate w-full">{item.name}</span>
            </div>
          );
        })}
        </div>
      </div>
    </div>
  );
}
