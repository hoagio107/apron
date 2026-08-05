
"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SlidersHorizontal, Search, X, Check } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MAIN_INGREDIENTS, COOKING_METHODS, DISH_TYPES } from '@/lib/recipe-types';
import { cn } from '@/lib/utils';

interface FilterState {
  search: string;
  ingredients: Set<string>;
  methods: Set<string>;
  dishTypes: Set<string>;
}

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  sortOption?: 'date' | 'name';
  onSortChange?: (sort: 'date' | 'name') => void;
}

export function FilterDrawer({ 
  isOpen, 
  onClose, 
  filters, 
  onFilterChange,
  sortOption,
  onSortChange
}: FilterDrawerProps) {
  const toggleSet = (key: keyof FilterState, value: string) => {
    const currentSet = filters[key] as Set<string>;
    const nextSet = new Set(currentSet);
    if (nextSet.has(value)) nextSet.delete(value);
    else nextSet.add(value);
    onFilterChange({ ...filters, [key]: nextSet });
  };

  const resetFilters = () => {
    onFilterChange({
      search: '',
      ingredients: new Set(),
      methods: new Set(),
      dishTypes: new Set()
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onClose();
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full max-w-sm p-0 flex flex-col rounded-none border-none shadow-none">
        <SheetHeader className="p-6 border-b bg-gray-50/50">
          <SheetTitle className="flex items-center gap-2 text-xl font-bold">
            <SlidersHorizontal className="w-5 h-5 text-orange-500" /> Tìm kiếm & Lọc
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1 p-6">
          <div className="space-y-8">
            {/* Sort (Added for mobile optimization) */}
            {onSortChange && (
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sắp xếp theo</label>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => onSortChange('date')}
                    className={cn(
                      "flex-1 rounded-xl h-11 text-xs font-bold transition-all shadow-none border-gray-100",
                      sortOption === 'date' ? "bg-orange-50 border-orange-200 text-orange-600" : "bg-white"
                    )}
                  >
                    Mới nhất
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => onSortChange('name')}
                    className={cn(
                      "flex-1 rounded-xl h-11 text-xs font-bold transition-all shadow-none border-gray-100",
                      sortOption === 'name' ? "bg-orange-50 border-orange-200 text-orange-600" : "bg-white"
                    )}
                  >
                    Tên A-Z
                  </Button>
                </div>
              </div>
            )}

            {/* Search */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Từ khóa</label>
              <div className="relative px-0.5">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input 
                  value={filters.search}
                  onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
                  onKeyDown={handleKeyDown}
                  placeholder="Tên món, mô tả..." 
                  className="pl-10 pr-4 h-12 bg-white border border-gray-200 rounded-xl shadow-none"
                />
              </div>
            </div>

            {/* Ingredients */}
            <div className="space-y-4">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Nguyên liệu chính</label>
              {MAIN_INGREDIENTS.map(group => (
                <div key={group.group} className="space-y-2">
                  <h4 className="text-[10px] font-bold text-gray-300 uppercase ml-1">{group.group}</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {group.items.map(item => (
                      <button
                        key={item.id}
                        onClick={() => toggleSet('ingredients', item.id)}
                        className={cn(
                          "px-3 py-2 text-xs font-bold rounded-xl border transition-all text-left flex items-center justify-between shadow-none",
                          filters.ingredients.has(item.id) 
                            ? "bg-orange-50 border-orange-200 text-orange-600" 
                            : "bg-white border-gray-100 text-gray-500 hover:border-orange-100"
                        )}
                      >
                        {item.name}
                        {filters.ingredients.has(item.id) && <Check className="w-3 h-3" />}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Methods */}
            <div className="space-y-4">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Cách chế biến</label>
              <div className="grid grid-cols-2 gap-2">
                {COOKING_METHODS.flatMap(g => g.items).map(item => (
                  <button
                    key={item.id}
                    onClick={() => toggleSet('methods', item.id)}
                    className={cn(
                      "px-3 py-2 text-xs font-bold rounded-xl border transition-all text-left flex items-center justify-between shadow-none",
                      filters.methods.has(item.id) 
                        ? "bg-blue-50 border-blue-200 text-blue-600" 
                        : "bg-white border-gray-100 text-gray-500 hover:border-blue-100"
                    )}
                  >
                    {item.name}
                    {filters.methods.has(item.id) && <Check className="w-3 h-3" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="p-6 border-t bg-gray-50/50 flex gap-3">
          <Button variant="outline" onClick={resetFilters} className="flex-1 rounded-xl font-bold h-12 shadow-none">Xóa lọc</Button>
          <Button onClick={onClose} className="flex-1 bg-orange-600 hover:bg-orange-700 rounded-xl font-bold h-12 shadow-none">Xem kết quả</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
