
"use client";

import { useState, useMemo } from 'react';
import { Ingredient } from '@/lib/recipe-types';
import { ShoppingBasket, Minus, Plus, StickyNote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
// @ts-ignore
import { marked } from 'marked';

export function RecipeIngredients({ ingredients = [], servings: originalServings, notes }: { ingredients: Ingredient[], servings: number, notes?: string }) {
  const [multiplier, setMultiplier] = useState(1);
  const [checkedItems, setCheckedIngredients] = useState<Set<string>>(new Set());

  const currentServings = useMemo(() => {
    const res = originalServings * multiplier;
    return parseFloat(res.toFixed(2));
  }, [originalServings, multiplier]);

  const scaledGroups = useMemo(() => {
    const groups: Record<string, Ingredient[]> = {};
    const items = ingredients || [];
    items.forEach(ing => {
      const gName = ing.group || 'Nguyên liệu chính';
      if (!groups[gName]) groups[gName] = [];
      
      const parsedQty = typeof ing.quantity === 'string' ? parseFloat(ing.quantity) : ing.quantity;
      const finalQty = isNaN(parsedQty) ? ing.quantity : parseFloat((parsedQty * multiplier).toFixed(2));

      groups[gName].push({
        ...ing,
        quantity: finalQty
      });
    });
    return Object.entries(groups);
  }, [ingredients, multiplier]);

  const toggleIngredient = (name: string) => {
    const next = new Set(checkedItems);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    setCheckedIngredients(next);
  };

  const handleServingsChange = (value: string) => {
    const val = parseFloat(value);
    if (!isNaN(val) && val > 0) {
      setMultiplier(val / originalServings);
    }
  };

  return (
    <div className="bg-transparent md:bg-white md:dark:bg-gray-800 rounded-none md:rounded-3xl p-0 shadow-none border-none md:border md:border-gray-100 md:dark:border-gray-700">
      <h3 className="text-xl font-bold mb-4 flex items-center gap-3">
        <div className="p-2 bg-orange-100 rounded-lg text-orange-600"><ShoppingBasket className="w-5 h-5" /></div>
        Nguyên liệu
      </h3>

      <div className="flex items-center justify-between py-3 border-b mb-4">
        <span className="text-sm font-bold text-muted-foreground">Khẩu phần</span>
        <div className="flex items-center gap-2">
          <Button 
            variant="secondary" 
            size="icon" 
            className="h-8 w-8 rounded-full shadow-none" 
            onClick={() => setMultiplier(m => Math.max(0.1, m - 0.25))}
          >
            <Minus className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-1">
            <Input 
              type="number"
              step="any"
              value={currentServings}
              onChange={(e) => handleServingsChange(e.target.value)}
              className="w-16 h-8 p-1 text-center font-bold text-lg border-none bg-transparent focus-visible:ring-0 shadow-none"
            />
            <span className="text-sm text-gray-400 font-medium">người</span>
          </div>
          <Button 
            variant="secondary" 
            size="icon" 
            className="h-8 w-8 rounded-full shadow-none" 
            onClick={() => setMultiplier(m => m + 0.25)}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {scaledGroups.map(([groupName, items]) => (
          <div key={groupName}>
            {groupName !== 'Nguyên liệu chính' && <h4 className="text-sm font-bold text-orange-600 uppercase tracking-widest mb-3">{groupName}</h4>}
            <ul className="space-y-2.5">
              {items.map((ing, idx) => (
                <li key={idx} className="flex items-start gap-3 cursor-pointer" onClick={() => toggleIngredient(ing.name)}>
                  <Checkbox checked={checkedItems.has(ing.name)} className="mt-0.5" />
                  <div className={cn("flex-grow transition-all duration-300", checkedItems.has(ing.name) && "opacity-40 line-through")}>
                    <span className="font-bold text-sm md:text-base">{ing.quantity} {ing.unit}</span><span className="text-muted-foreground text-sm md:text-base ml-1">{ing.name}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
        {scaledGroups.length === 0 && (
          <p className="text-sm text-gray-400 italic">Chưa có thông tin nguyên liệu.</p>
        )}
      </div>

      {notes && (
        <div className="mt-6 p-5 bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl border border-yellow-100 shadow-none text-left space-y-3">
          <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300 font-bold text-[10px] uppercase tracking-[0.2em]">
            <StickyNote className="w-4 h-4" />
            <span>Ghi chú</span>
          </div>
          <div 
            className="text-sm text-yellow-800 dark:text-yellow-200 leading-relaxed markdown-content italic" 
            dangerouslySetInnerHTML={{ __html: marked.parse(notes || '', { breaks: true }) }}
          />
        </div>
      )}
    </div>
  );
}
