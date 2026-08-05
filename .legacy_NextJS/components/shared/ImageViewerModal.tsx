
"use client";

import { useEffect } from 'react';
import { useImageViewer } from '@/lib/services';
import { X, ZoomIn, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function ImageViewerModal() {
  const { isOpen, url, close, open } = useImageViewer();

  // Đóng bằng phím ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [close]);

  // Ngăn cuộn trang khi đang mở modal
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen]);

  // Global listener for images in markdown content
  useEffect(() => {
    const handleGlobalImageClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Nếu là thẻ img và nằm trong div có class markdown-content
      if (target.tagName === 'IMG' && target.closest('.markdown-content')) {
        e.preventDefault();
        e.stopPropagation();
        const imgUrl = (target as HTMLImageElement).src;
        if (imgUrl) open(imgUrl);
      }
    };

    document.addEventListener('click', handleGlobalImageClick);
    return () => document.removeEventListener('click', handleGlobalImageClick);
  }, [open]);

  if (!isOpen || !url) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-md animate-in fade-in duration-300">
      <div className="absolute top-0 left-0 right-0 h-20 px-6 flex items-center justify-between pointer-events-none">
        <div className={cn(
          "flex items-center gap-2 transition-all",
          "bg-transparent border-none p-0 backdrop-blur-none", // Mobile
          "md:bg-black/20 md:backdrop-blur-md md:px-4 md:py-2 md:rounded-full md:border md:border-white/10" // Desktop
        )}>
          <ZoomIn className="w-4 h-4 text-white/60" />
          <span className="text-white font-bold text-xs uppercase tracking-widest">Chế độ xem ảnh</span>
        </div>
        
        <div className="flex items-center gap-0 md:gap-3 pointer-events-auto">
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full text-white h-10 w-10 md:h-12 md:w-12 md:bg-white/10 md:hover:bg-white/20 md:border md:border-white/10 transition-colors"
            onClick={() => window.open(url, '_blank')}
          >
            <Download className="w-5 h-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full text-white h-10 w-10 md:h-12 md:w-12 md:bg-white/10 md:hover:bg-white/20 md:border md:border-white/10 transition-colors"
            onClick={close}
          >
            <X className="w-6 h-6" />
          </Button>
        </div>
      </div>

      <div 
        className="w-full h-full p-4 md:p-12 flex items-center justify-center cursor-zoom-out"
        onClick={close}
      >
        <img 
          src={url} 
          alt="Full size" 
          className="max-w-full max-h-full object-contain shadow-2xl rounded-sm animate-in zoom-in-95 duration-300"
          onClick={(e) => e.stopPropagation()} // Ngăn chặn đóng khi bấm vào chính bức ảnh
        />
      </div>
    </div>
  );
}
