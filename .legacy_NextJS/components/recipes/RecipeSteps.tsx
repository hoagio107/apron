
"use client";

import { useState, useMemo } from 'react';
import { Step } from '@/lib/recipe-types';
import { ChefHat, Play, ZoomIn } from 'lucide-react';
// @ts-ignore
import { marked } from 'marked';
import { useImageViewer } from '@/lib/services';

export function RecipeSteps({ steps = [], videoUrl }: { steps: Step[], videoUrl?: string }) {
  const { open } = useImageViewer();
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Trích xuất ID video từ URL YouTube
  const videoId = useMemo(() => {
    if (!videoUrl) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?"'\s]*).*/;
    const match = videoUrl.match(regExp);
    return (match && match[2].length >= 11) ? match[2] : null;
  }, [videoUrl]);

  const safeUrl = useMemo(() => videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1` : null, [videoId]);

  const groupedSteps = useMemo(() => {
    const groups: Record<string, Step[]> = {};
    const items = steps || [];
    items.forEach(step => {
      const gName = step.group || 'Thực hiện';
      if (!groups[gName]) groups[gName] = [];
      groups[gName].push(step);
    });
    return Object.entries(groups);
  }, [steps]);

  return (
    <div className="space-y-6 md:space-y-8">
      <h3 className="text-2xl font-bold flex items-center gap-3">
        <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
          <ChefHat className="w-6 h-6" />
        </div>
        Cách làm
      </h3>

      {videoUrl && (
        <div className="relative aspect-video rounded-3xl overflow-hidden bg-black group shadow-none mb-6 border border-gray-100 dark:border-gray-800">
          {isPlaying && safeUrl ? (
            <iframe 
              src={safeUrl} 
              className="absolute inset-0 w-full h-full border-none"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen
            />
          ) : (
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Nút Play trung tâm */}
              <button 
                onClick={() => setIsPlaying(true)}
                className="relative z-20 w-20 h-20 rounded-full bg-red-600 flex items-center justify-center text-white shadow-xl shadow-red-900/20 group-hover:scale-110 transition-transform active:scale-95"
              >
                <Play className="w-10 h-10 fill-current ml-1" />
              </button>

              {/* Nhãn hướng dẫn */}
              <div className="absolute bottom-6 left-6 z-20 bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl text-white font-bold text-xs md:text-sm border border-white/10 shadow-none">
                Xem video hướng dẫn trực tiếp
              </div>

              {/* Lớp phủ màu tối */}
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors z-10" />

              {/* Ảnh nền video */}
              {videoId ? (
                <img 
                  src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
                  className="absolute inset-0 w-full h-full object-cover"
                  alt="Video thumbnail"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://picsum.photos/seed/cooking-video/1200/800";
                  }}
                />
              ) : (
                <div className="absolute inset-0 bg-gray-900" />
              )}
            </div>
          )}
        </div>
      )}

      <div className="space-y-6 md:space-y-8">
        {groupedSteps.map(([groupName, items], gIdx) => (
          <div key={groupName} className="relative">
            {groupName !== 'Thực hiện' && (
              <div className="flex items-center gap-4 mb-4 md:mb-6">
                <div className="h-px flex-grow bg-gray-100 dark:bg-gray-800" />
                <h4 className="text-[10px] md:text-xs font-black text-gray-800 dark:text-white px-5 py-2 border border-gray-200 dark:border-gray-700 rounded-full uppercase tracking-[0.2em] bg-white dark:bg-gray-900 shadow-sm">
                  {groupName}
                </h4>
                <div className="h-px flex-grow bg-gray-100 dark:bg-gray-800" />
              </div>
            )}

            <div className="space-y-0">
              {items.map((step, idx) => (
                <div key={idx} className="flex gap-4 md:gap-6 group">
                  <div className="flex flex-col items-center">
                    <div className="w-7 h-7 md:w-10 md:h-10 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-xs md:text-sm shrink-0 z-10 shadow-none">
                      {idx + 1}
                    </div>
                    {idx !== items.length - 1 && (
                      <div className="w-0.5 flex-grow bg-gray-100 my-1 md:my-2 rounded-full min-h-[2rem]" />
                    )}
                  </div>
                  
                  <div className="flex-grow pb-4 md:pb-6">
                    <div 
                      className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed font-medium mb-2 md:mb-4 pt-1 markdown-content"
                      dangerouslySetInnerHTML={{ __html: marked.parse(step.instruction || '', { breaks: true }) }}
                    />
                    
                    {step.images && step.images.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mt-4">
                        {step.images.map((img, i) => (
                          <div 
                            key={i} 
                            className="relative aspect-square rounded-2xl overflow-hidden border border-gray-100 shadow-none cursor-zoom-in group/img"
                            onClick={() => open(img)}
                          >
                            <img src={img} alt={`Bước ${idx + 1} hình ${i + 1}`} className="absolute inset-0 w-full h-full object-cover transition-transform group-hover/img:scale-105" />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 flex items-center justify-center">
                              <ZoomIn className="w-8 h-8 text-white shadow-sm" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {groupedSteps.length === 0 && (
          <p className="text-sm text-gray-400 italic">Chưa có thông tin cách thực hiện.</p>
        )}
      </div>
    </div>
  );
}
