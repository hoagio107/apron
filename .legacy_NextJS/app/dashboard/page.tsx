
"use client";

import { useState, useMemo } from 'react';
import { useRecipes } from '@/hooks/use-recipes';
import { RecipeCard } from '@/components/recipes/RecipeCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ChefHat, Search, SlidersHorizontal, Plus, Loader2, X } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { recipes, loading } = useRecipes();
  const [search, setSearch] = useState('');
  const [sortOption, setSortOption] = useState<'date' | 'name'>('date');

  const filteredRecipes = useMemo(() => {
    // Chỉ hiển thị các công thức gốc (không phải biến thể phụ)
    let list = recipes.filter(r => !r.parent_id);

    if (search) {
      const term = search.toLowerCase().trim();
      list = list.filter(r => 
        r.title.toLowerCase().includes(term) || 
        r.tags?.some(t => t.toLowerCase().includes(term))
      );
    }

    if (sortOption === 'name') {
      list.sort((a, b) => a.title.localeCompare(b.title));
    } else {
      list.sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      });
    }

    return list;
  }, [recipes, search, sortOption]);

  return (
    <div className="min-h-screen p-4 md:p-8 pb-24 bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center">
            <ChefHat className="w-8 h-8 mr-3 text-orange-500" />
            Công thức nấu ăn
          </h1>
          <p className="text-gray-500 mt-1">Danh sách {filteredRecipes.length} món ăn của bạn</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-grow md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Tìm món ăn, nguyên liệu..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-10 h-11 bg-white"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>

          <select 
            value={sortOption} 
            onChange={(e) => setSortOption(e.target.value as any)}
            className="h-11 px-4 bg-white border rounded-xl text-sm font-bold outline-none"
          >
            <option value="date">Mới nhất</option>
            <option value="name">Tên A-Z</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="bg-white rounded-2xl p-3 animate-pulse h-64">
              <div className="aspect-square bg-gray-200 rounded-xl mb-3" />
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredRecipes.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {filteredRecipes.map(recipe => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Search className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-700">Không tìm thấy kết quả</h3>
          <p className="text-gray-500 mt-2 text-sm max-w-xs">Thử thay đổi từ khóa tìm kiếm của bạn.</p>
        </div>
      )}
    </div>
  );
}
