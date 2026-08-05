
"use client";

import { useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Image as ImageIcon, ImagePlus, Loader2, Link as LinkIcon, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { uploadImageToDrive } from '@/lib/google-drive';
import { useToast } from '@/hooks/use-toast';

interface ImageUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  className?: string;
}

export function ImageUploader({ value, onChange, label = "Ảnh", className }: ImageUploaderProps) {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const url = await uploadImageToDrive(file);
      onChange(url);
      toast({ title: "Tải ảnh thành công" });
    } catch (error) {
      console.error('Upload failed', error);
      toast({ 
        variant: "destructive", 
        title: "Lỗi tải ảnh", 
        description: error instanceof Error ? error.message : "Đã có lỗi xảy ra khi tải ảnh lên Google Drive." 
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    toast({ title: "Đã gỡ liên kết ảnh" });
  };

  const isMinimal = className?.includes('border-none');

  return (
    <div className={cn(
      "bg-white dark:bg-gray-800 rounded-2xl md:rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-700", 
      className
    )}>
      {/* Header */}
      {!isMinimal && (
        <div className="px-5 py-3 md:p-6 md:pb-4 flex justify-between items-center">
          <h2 className="font-bold text-gray-800 dark:text-white text-sm uppercase tracking-wider flex items-center">
            <ImageIcon className="w-4 h-4 mr-2 text-orange-500" /> {label}
          </h2>
        </div>
      )}

      <div className={cn(
        "px-5 pb-5 md:px-6 md:pb-6 space-y-4",
        isMinimal && "px-0 pb-0"
      )}>
        {/* Main Interaction Area: Click to Upload */}
        <div 
          className="relative group w-full aspect-[4/3] bg-gray-50/50 dark:bg-gray-900 border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center text-center overflow-hidden hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors hover:border-orange-400 cursor-pointer shadow-none rounded-xl md:rounded-2xl"
          onClick={() => fileInputRef.current?.click()}
        >
          {isUploading && (
            <div className="absolute inset-0 z-10 bg-white/90 dark:bg-gray-900/90 flex flex-col items-center justify-center backdrop-blur-sm">
              <Loader2 className="animate-spin h-8 w-8 text-orange-500 mb-3" />
              <span className="text-sm font-bold text-orange-600">Đang tải lên...</span>
            </div>
          )}

          {value ? (
            <>
              <img src={value} className="absolute inset-0 w-full h-full object-cover" alt="Preview" />
              {/* Overlay on Hover */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 p-6">
                <div className="w-full max-w-[180px] h-11 text-white font-bold text-xs flex items-center justify-center bg-blue-600 rounded-xl backdrop-blur-md hover:bg-blue-700 transition-all shadow-none border-none">
                  <ImagePlus className="w-4 h-4 mr-2" /> Đổi ảnh khác
                </div>
                <button 
                  onClick={removeImage}
                  type="button"
                  className="w-full max-w-[180px] h-11 bg-red-500/80 hover:bg-red-600 text-white rounded-xl backdrop-blur-md transition-all flex items-center justify-center font-bold text-xs gap-2 shadow-none border-none"
                >
                  <Trash2 className="w-4 h-4" /> Xóa ảnh hiện tại
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="mb-1 group-hover:scale-110 transition-transform duration-300">
                <ImagePlus className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">
                Nhấn để tải ảnh từ máy
              </p>
            </div>
          )}

          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden" 
          />
        </div>

        {/* Link Input: Always visible below */}
        <div className="relative group/link">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400 group-focus-within/link:text-orange-500 transition-colors">
            <LinkIcon className="w-3.5 h-3.5" />
          </div>
          <Input 
            type="url" 
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Hoặc dán đường dẫn ảnh trực tiếp..." 
            className="h-11 pl-9 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-none focus-visible:ring-1 focus-visible:ring-orange-200 font-bold text-[10px] md:text-xs"
          />
        </div>
      </div>
    </div>
  );
}
