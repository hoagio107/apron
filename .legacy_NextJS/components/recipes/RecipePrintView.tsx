
"use client";

import { Recipe, TIP_CATEGORIES } from '@/lib/recipe-types';
import { Clock, Star, Flame, ChefHat, StickyNote, ShoppingBasket } from 'lucide-react';
// @ts-ignore
import { marked } from 'marked';
import { cn } from '@/lib/utils';

interface RecipePrintViewProps {
  recipe: Recipe;
}

export function RecipePrintView({ recipe }: RecipePrintViewProps) {
  const totalTime = recipe.prep_time + recipe.cook_time;

  // Group ingredients by group name
  const ingredientGroups = (recipe.ingredients || []).reduce((acc, ing) => {
    const group = ing.group || 'Nguyên liệu chính';
    if (!acc[group]) acc[group] = [];
    acc[group].push(ing);
    return acc;
  }, {} as Record<string, typeof recipe.ingredients>);

  // Group steps by group name
  const stepGroups = (recipe.steps || []).reduce((acc, step) => {
    const group = step.group || 'Thực hiện';
    if (!acc[group]) acc[group] = [];
    acc[group].push(step);
    return acc;
  }, {} as Record<string, typeof recipe.steps>);

  return (
    <div className="hidden print:block print-area bg-white text-black p-0 m-0 w-full max-w-full font-body">
      {/* 1. Ảnh món ăn */}
      <div className="w-full aspect-[16/9] mb-8 overflow-hidden rounded-xl border border-gray-100">
        <img 
          src={recipe.image_url || "https://picsum.photos/seed/recipe-print/1200/800"} 
          className="w-full h-full object-cover" 
          alt={recipe.title} 
        />
      </div>

      {/* 2. Tên món ăn */}
      <h1 className="text-4xl font-black mb-4 leading-tight font-headline">{recipe.title}</h1>

      {/* 3. Meta Data */}
      <div className="grid grid-cols-4 gap-4 py-4 mb-8 border-y border-gray-200">
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase text-gray-400">Thời gian</span>
          <span className="font-bold text-lg">{totalTime} phút</span>
        </div>
        <div className="flex flex-col border-l border-gray-100 pl-4">
          <span className="text-[10px] font-black uppercase text-gray-400">Độ khó</span>
          <span className="font-bold text-lg">{recipe.difficulty}</span>
        </div>
        <div className="flex flex-col border-l border-gray-100 pl-4">
          <span className="text-[10px] font-black uppercase text-gray-400">Calories</span>
          <span className="font-bold text-lg">{recipe.calories} Kcal</span>
        </div>
        <div className="flex flex-col border-l border-gray-100 pl-4">
          <span className="text-[10px] font-black uppercase text-gray-400">Đánh giá</span>
          <span className="font-bold text-lg">{recipe.taste_score}/5</span>
        </div>
      </div>

      {/* 4. Nguyên liệu */}
      <div className="mb-10">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 border-b-2 border-gray-100 pb-2">
          <ShoppingBasket className="w-6 h-6 text-orange-500" /> Nguyên liệu cho {recipe.servings} người
        </h2>
        <div className="grid grid-cols-2 gap-x-12 gap-y-6">
          {Object.entries(ingredientGroups).map(([groupName, items]) => (
            <div key={groupName} className="break-inside-avoid">
              <h3 className="text-sm font-black text-orange-600 uppercase tracking-widest mb-3">{groupName}</h3>
              <ul className="space-y-2">
                {items.map((ing, idx) => (
                  <li key={idx} className="flex justify-between items-baseline border-b border-gray-50 pb-1">
                    <span className="text-gray-700 font-medium">{ing.name}</span>
                    <span className="font-black text-sm whitespace-nowrap ml-4">{ing.quantity} {ing.unit}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Cách làm */}
      <div className="mb-10">
        <h2 className="text-2xl font-bold mb-8 flex items-center gap-2 border-b-2 border-gray-100 pb-2">
          <ChefHat className="w-6 h-6 text-orange-500" /> Cách thực hiện
        </h2>
        <div className="space-y-8">
          {Object.entries(stepGroups).map(([groupName, items]) => (
            <div key={groupName}>
              {groupName !== 'Thực hiện' && (
                <h3 className="text-xs font-black bg-gray-50 inline-block px-4 py-1 rounded-full uppercase tracking-[0.2em] mb-6 border border-gray-100">{groupName}</h3>
              )}
              <div className="space-y-8">
                {items.map((step, idx) => (
                  <div key={idx} className="flex gap-6 break-inside-avoid">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold shrink-0">
                        {idx + 1}
                      </div>
                    </div>
                    <div className="flex-grow pt-1">
                      <div 
                        className="text-lg leading-relaxed font-medium mb-4 markdown-content"
                        dangerouslySetInnerHTML={{ __html: marked.parse(step.instruction || '', { breaks: true }) }}
                      />
                      {step.images && step.images.length > 0 && (
                        <div className="grid grid-cols-3 gap-4">
                          {step.images.map((img, i) => (
                            <img key={i} src={img} className="rounded-xl aspect-square object-cover border border-gray-50" alt="" />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. Ghi chú */}
      {recipe.notes && (
        <div className="p-8 bg-gray-50 rounded-3xl border border-gray-100 break-inside-avoid">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-800">
            <StickyNote className="w-5 h-5 text-gray-400" /> Ghi chú từ đầu bếp
          </h2>
          <div 
            className="text-base text-gray-600 leading-relaxed markdown-content italic" 
            dangerouslySetInnerHTML={{ __html: marked.parse(recipe.notes, { breaks: true }) }}
          />
        </div>
      )}

      {/* Footer in */}
      <div className="mt-12 pt-8 border-t border-gray-100 text-center text-gray-300 text-[10px] font-bold uppercase tracking-[0.3em]">
        In từ ứng dụng My Recipe (CookPal)
      </div>
    </div>
  );
}
