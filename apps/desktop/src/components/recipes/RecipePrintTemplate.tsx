import React from 'react';
import type { Recipe } from '@apron/core';
import { ChefHat, Clock, Flame, Users, Gauge, Zap, Carrot, Sparkles } from 'lucide-react';
import { ImageManager } from '../../lib/image-manager';

export interface RecipePrintTemplateProps {
  recipe: Recipe;
  scaledServings?: number;
  id?: string;
  className?: string;
}

export const RecipePrintTemplate: React.FC<RecipePrintTemplateProps> = ({
  recipe,
  scaledServings,
  id = 'recipe-print-template',
  className = '',
}) => {
  const currentServings = scaledServings && scaledServings > 0 ? scaledServings : (recipe.servings || 1);
  const heroImage = recipe.image_url || (recipe.images && recipe.images.length > 0 ? recipe.images[0] : null);

  const formatQuantity = (quantity: any) => {
    if (quantity === undefined || quantity === null || quantity === '') return '';
    const num = typeof quantity === 'number' ? quantity : parseFloat(quantity);
    if (isNaN(num)) return quantity;
    if (!recipe.servings || recipe.servings === 0) return num;
    const ratio = currentServings / recipe.servings;
    const scaled = num * ratio;
    return Math.round(scaled * 100) / 100;
  };

  // Group ingredients by group field if available
  const ingredientGroups = React.useMemo(() => {
    const groups: Record<string, typeof recipe.ingredients> = {};
    if (!recipe.ingredients) return groups;
    recipe.ingredients.forEach((ing) => {
      const g = ing.group || 'Nguyên liệu chính';
      if (!groups[g]) groups[g] = [];
      groups[g].push(ing);
    });
    return groups;
  }, [recipe.ingredients]);

  const groupKeys = Object.keys(ingredientGroups);
  const hasMultipleGroups = groupKeys.length > 1;

  return (
    <div
      id={id}
      className={`recipe-print-document font-sans p-8 md:p-10 w-[800px] min-h-[1130px] mx-auto box-border shadow-none border border-slate-200/60 print:border-none print:p-0 print:m-0 print:w-full ${className}`}
      
    >
      {/* 1. Header & Brand Bar */}
      <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
            <ChefHat className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-xs font-black tracking-widest text-emerald-800 uppercase leading-none">
              APRON COOKBOOK
            </div>
            <div className="text-[10px] text-slate-400 font-medium tracking-tight mt-0.5">
              Sổ tay công thức gia đình
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[11px] font-bold text-slate-700">
            {recipe.dish_type || recipe.category || 'Món ăn gia đình'}
            {recipe.cuisine ? ` • ${recipe.cuisine}` : ''}
          </div>
          <div className="text-[10px] text-slate-400">
            Ngày in: {new Date().toLocaleDateString('vi-VN')}
          </div>
        </div>
      </div>

      {/* 2. Recipe Title & Description */}
      <div className="mb-4">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-snug">
          {recipe.title}
        </h1>
        {recipe.description && (
          <p className="text-xs text-slate-600 leading-relaxed italic mt-1.5 pl-3 border-l-2 border-emerald-500">
            {recipe.description}
          </p>
        )}
      </div>

      {/* 3. Hero Image (if available) */}
      {heroImage && (
        <div className="w-full h-60 rounded-xl overflow-hidden mb-5 border border-slate-200 bg-slate-100 print-avoid-break">
          <img
            src={ImageManager.getAssetUrl(heroImage)}
            alt={recipe.title}
            crossOrigin="anonymous"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* 4. Quick Meta Info Bar */}
      <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 bg-slate-50 border border-slate-200 rounded-xl p-2.5 mb-6 text-center print-avoid-break">
        <div className="flex flex-col items-center justify-center p-1">
          <span className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
            <Clock className="w-3 h-3 text-emerald-600" /> Chuẩn bị
          </span>
          <span className="text-xs font-bold text-slate-800 mt-0.5">
            {recipe.prep_time ? `${recipe.prep_time}p` : '-'}
          </span>
        </div>
        <div className="flex flex-col items-center justify-center p-1 border-l border-slate-200">
          <span className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
            <Flame className="w-3 h-3 text-orange-500" /> Nấu
          </span>
          <span className="text-xs font-bold text-slate-800 mt-0.5">
            {recipe.cook_time ? `${recipe.cook_time}p` : '-'}
          </span>
        </div>
        <div className="flex flex-col items-center justify-center p-1 border-l border-slate-200">
          <span className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
            <Users className="w-3 h-3 text-blue-500" /> Khẩu phần
          </span>
          <span className="text-xs font-bold text-slate-800 mt-0.5">
            {currentServings} phần
          </span>
        </div>
        <div className="flex flex-col items-center justify-center p-1 border-l border-slate-200">
          <span className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
            <Gauge className="w-3 h-3 text-purple-500" /> Độ khó
          </span>
          <span className="text-xs font-bold text-slate-800 mt-0.5">
            {recipe.difficulty || 'Dễ'}
          </span>
        </div>
        <div className="hidden sm:flex flex-col items-center justify-center p-1 border-l border-slate-200">
          <span className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-500" /> Calo
          </span>
          <span className="text-xs font-bold text-slate-800 mt-0.5">
            {recipe.calories ? `${recipe.calories} kcal` : '-'}
          </span>
        </div>
      </div>

      {/* 5. Main Content: Ingredients (Left) & Steps (Right) */}
      <div className="grid grid-cols-12 gap-6 mb-6 items-start">
        {/* Left Column: Ingredients */}
        <div className="col-span-5 bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 print-avoid-break">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <Carrot className="w-3.5 h-3.5 text-emerald-600" /> Nguyên liệu
            </h2>
            <span className="text-[10px] text-slate-500 font-medium">
              {currentServings} khẩu phần
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {groupKeys.map((groupName) => {
              const items = ingredientGroups[groupName] || [];
              return (
                <div key={groupName} className="flex flex-col gap-1.5">
                  {hasMultipleGroups && (
                    <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wide border-b border-slate-200/60 pb-1 mt-1">
                      {groupName}
                    </div>
                  )}
                  <ul className="space-y-2">
                    {items.map((ing, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs leading-snug">
                        <span className="w-3.5 h-3.5 rounded border border-slate-300 bg-background mt-0.5 shrink-0 block" />
                        <div className="flex-1">
                          <span className="font-bold text-slate-900">
                            {formatQuantity(ing.quantity)} {ing.unit}{' '}
                          </span>
                          <span className="text-slate-700">{ing.name}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Instructions / Steps */}
        <div className="col-span-7 flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <ChefHat className="w-3.5 h-3.5 text-emerald-600" /> Các bước thực hiện
            </h2>
            <span className="text-[10px] text-slate-500 font-medium">
              {recipe.steps?.length || 0} bước
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {recipe.steps && recipe.steps.length > 0 ? (
              recipe.steps.map((step, idx) => (
                <div
                  key={idx}
                  className="flex gap-2.5 print-avoid-break pb-3 border-b border-slate-100 last:border-0"
                >
                  <div className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5 shadow-2xs">
                    {idx + 1}
                  </div>
                  <div className="flex-1 text-xs">
                    <div className="text-slate-700 leading-relaxed whitespace-pre-line">
                      {step.instruction}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-400 italic py-2">Chưa có hướng dẫn chi tiết.</div>
            )}
          </div>
        </div>
      </div>

      {/* 6. Notes & Tips (if any) */}
      {recipe.notes && (
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3.5 mb-5 print-avoid-break">
          <div className="text-[11px] font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5 mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Ghi chú & Mẹo nấu ngon
          </div>
          <div
            className="text-xs text-slate-700 leading-relaxed prose prose-xs max-w-none"
            dangerouslySetInnerHTML={{ __html: recipe.notes }}
          />
        </div>
      )}

      {/* 7. Document Footer */}
      <div className="border-t border-slate-200 pt-3 mt-4 flex items-center justify-between text-[10px] text-slate-400">
        <span>APRON • Ứng dụng quản lý công thức & Sổ tay ẩm thực thông minh</span>
        <span>https://apron.app</span>
      </div>
    </div>
  );
};
