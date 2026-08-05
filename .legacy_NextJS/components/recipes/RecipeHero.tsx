
"use client";

import { Recipe } from '@/lib/recipe-types';
import { ChefHat, ZoomIn } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useImageViewer } from '@/lib/services';

export function RecipeHero({ recipe }: { recipe: Recipe }) {
  const { open } = useImageViewer();
  
  const difficultyColor = {
    'Dễ': 'text-green-600 bg-green-50 border-green-100',
    'Vừa': 'text-orange-600 bg-orange-50 border-orange-100',
    'Khó': 'text-red-600 bg-red-50 border-red-100'
  }[recipe.difficulty] || 'text-gray-600';

  const imageUrl = recipe.image_url || "https://picsum.photos/seed/recipe/1200/800";

  return (
    <div 
      className="relative aspect-[4/3] rounded-3xl overflow-hidden border border-gray-100 bg-gray-50 group shadow-none cursor-zoom-in"
      onClick={() => open(imageUrl)}
    >
      <img 
        src={imageUrl} 
        alt={recipe.title}
        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
      />
      
      <div className="absolute top-4 left-4 z-10">
        <div className={cn(
          "px-4 py-2 rounded-xl backdrop-blur-md border flex items-center gap-2 font-bold text-xs uppercase tracking-wider shadow-none",
          difficultyColor
        )}>
          <ChefHat className="w-4 h-4" />
          {recipe.difficulty}
        </div>
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
        <div className="bg-white/20 backdrop-blur-md p-4 rounded-full border border-white/30 transform scale-90 group-hover:scale-100 transition-transform duration-300">
          <ZoomIn className="w-8 h-8 text-white" />
        </div>
      </div>
    </div>
  );
}
