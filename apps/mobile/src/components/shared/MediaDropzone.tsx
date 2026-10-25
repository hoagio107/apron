import React from 'react';
import { ImagePlus } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

interface MediaDropzoneProps {
  onPress: () => void;
  title?: string;
  description?: string;
  className?: string;
}

export function MediaDropzone({
  onPress,
  title = "Tải lên hoặc chọn ảnh/video",
  description = "Kéo thả file hoặc nhập URL",
  className
}: MediaDropzoneProps) {
  return (
    <div className={twMerge("w-full aspect-[4/3] flex items-center justify-center", className)}>
      <div 
        onClick={onPress}
        className="w-full h-full border-2 border-dashed border-primary/50 rounded-2xl flex flex-col items-center justify-center bg-primary/10 dark:bg-primary/15 text-primary hover:bg-primary/20 hover:border-primary transition-all cursor-pointer group"
      >
        <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
          <ImagePlus className="w-8 h-8 text-primary" />
        </div>
        <p className="font-bold text-xl mb-1 text-center">{title}</p>
        <p className="text-sm text-primary-500/80 text-center px-4">{description}</p>
      </div>
    </div>
  );
}
