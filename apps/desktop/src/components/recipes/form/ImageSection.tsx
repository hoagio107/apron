import { useState, useRef, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { Button } from '@/ui';
import { ImagePlus, Star, ChevronLeft, ChevronRight, Trash2, PlayCircle } from 'lucide-react';
import type { FormValues } from './schema';
import { ImagePickerModal } from './ImagePickerModal';
import { ImageManager } from '../../../lib/image-manager';

const isVideo = (url?: string | null) => {
  if (!url) return false;
  return /\.(mp4|webm|mov|ogg)$/i.test(url) || url.endsWith('#video');
};

export function ImageSection() {
  const { watch, setValue } = useFormContext<FormValues>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const thumbnailsRef = useRef<HTMLDivElement>(null);
  
  const mainImage = watch('image_url');
  const otherImages = watch('images') || [];
  const videos = watch('videos') || [];
  
  // All media combined for display
  const allMedia = [...(mainImage ? [mainImage] : []), ...otherImages, ...videos];

  useEffect(() => {
    if (thumbnailsRef.current) {
      const container = thumbnailsRef.current;
      const activeElement = container.children[selectedIndex] as HTMLElement;
      if (activeElement) {
        const scrollTop = activeElement.offsetTop - container.offsetTop - container.offsetHeight / 2 + activeElement.offsetHeight / 2;
        container.scrollTo({ top: scrollTop, behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  const handleSelectMedia = (newImages: string[], newVideos: string[]) => {
    if (newImages.length === 0 && newVideos.length === 0) return;
    
    let nextMain = mainImage;
    const nextImages = [...otherImages];
    const nextVideos = [...videos];

    if (!nextMain) {
       if (newImages.length > 0) {
          nextMain = newImages[0];
          nextImages.push(...newImages.slice(1));
          nextVideos.push(...newVideos);
       } else {
          nextMain = newVideos[0];
          nextVideos.push(...newVideos.slice(1));
       }
    } else {
       nextImages.push(...newImages);
       nextVideos.push(...newVideos);
    }
    
    setValue('image_url', nextMain, { shouldValidate: true, shouldDirty: true });
    setValue('images', nextImages, { shouldValidate: true, shouldDirty: true });
    setValue('videos', nextVideos, { shouldValidate: true, shouldDirty: true });
    
    if (allMedia.length === 0) setSelectedIndex(0);
  };

  const handleRemoveMedia = (index: number) => {
    let nextMain = mainImage;
    const nextImages = [...otherImages];
    const nextVideos = [...videos];
    let removedUrl: string | undefined;

    if (index === 0 && nextMain) {
       removedUrl = nextMain;
       nextMain = '';
       if (nextImages.length > 0) {
         nextMain = nextImages[0];
         nextImages.splice(0, 1);
       } else if (nextVideos.length > 0) {
         nextMain = nextVideos[0];
         nextVideos.splice(0, 1);
       }
    } else {
       const otherIdx = index - (nextMain ? 1 : 0);
       if (otherIdx < nextImages.length) {
          removedUrl = nextImages[otherIdx];
          nextImages.splice(otherIdx, 1);
       } else {
          const vIdx = otherIdx - nextImages.length;
          removedUrl = nextVideos[vIdx];
          nextVideos.splice(vIdx, 1);
       }
    }

    if (removedUrl) {
       const deleted = watch('deleted_images') || [];
       setValue('deleted_images', [...deleted, removedUrl]);
    }

    setValue('image_url', nextMain, { shouldValidate: true, shouldDirty: true });
    setValue('images', nextImages, { shouldValidate: true, shouldDirty: true });
    setValue('videos', nextVideos, { shouldValidate: true, shouldDirty: true });

    if (selectedIndex >= allMedia.length - 1) {
      setSelectedIndex(Math.max(0, allMedia.length - 2));
    }
  };

  const handleSetMain = (index: number) => {
    if (index === 0) return;
    
    let nextMain = mainImage;
    const nextImages = [...otherImages];
    const nextVideos = [...videos];

    const targetUrl = allMedia[index];
    const otherIdx = index - (nextMain ? 1 : 0);

    if (otherIdx < nextImages.length) {
      nextImages.splice(otherIdx, 1);
    } else {
      nextVideos.splice(otherIdx - nextImages.length, 1);
    }

    if (nextMain) {
       if (isVideo(nextMain)) nextVideos.unshift(nextMain);
       else nextImages.unshift(nextMain);
    }

    nextMain = targetUrl;

    setValue('image_url', nextMain, { shouldValidate: true, shouldDirty: true });
    setValue('images', nextImages, { shouldValidate: true, shouldDirty: true });
    setValue('videos', nextVideos, { shouldValidate: true, shouldDirty: true });
    
    setSelectedIndex(0);
  };

  return (
    <div className="flex flex-col gap-2 w-full h-full">
      {/* Header Info */}
      <div className="flex items-center justify-between px-0.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">Ảnh đại diện & Thư viện ảnh</span>
          {allMedia.length > 0 && (
            <span className="text-xs text-default-500 font-medium">({allMedia.length} ảnh)</span>
          )}
        </div>
        {allMedia.length > 0 && (
          <Button
            size="sm"
            variant="flat"
            color="primary"
            onPress={() => setIsModalOpen(true)}
            startContent={<ImagePlus className="w-3.5 h-3.5" />}
            className="font-medium text-xs h-7 px-2.5 rounded-lg"
          >
            Thêm ảnh
          </Button>
        )}
      </div>

      {/* Main Container: Left Large Preview (1:1) + Right Multi-Avatar Column */}
      <div className="flex items-stretch gap-3 w-full">
        {/* Left Side: Main Preview or Dropzone strictly 1:1 */}
        {allMedia.length === 0 ? (
          <div 
            onClick={() => setIsModalOpen(true)}
            className="flex-1 aspect-square min-w-0 border-2 border-dashed border-primary/40 rounded-2xl flex flex-col items-center justify-center bg-primary-50/40 dark:bg-primary-950/20 text-primary-600 hover:bg-primary-50/60 hover:border-primary transition-all cursor-pointer p-4 group"
          >
            <div className="w-14 h-14 bg-primary-100 dark:bg-primary-900/40 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <ImagePlus className="w-7 h-7 text-primary" />
            </div>
            <p className="font-bold text-base mb-1 text-center text-foreground">Tải ảnh đại diện</p>
            <p className="text-xs text-default-500 text-center">Kéo thả file hoặc bấm để chọn ảnh/video</p>
          </div>
        ) : (
          <div className="flex-1 aspect-square min-w-0 bg-default-100 dark:bg-default-50/40 rounded-2xl relative group overflow-hidden flex items-center justify-center shadow-inner border border-divider/60">
            {allMedia[selectedIndex] && (
              isVideo(allMedia[selectedIndex]) ? (
                <video 
                  src={allMedia[selectedIndex]} 
                  className="w-full h-full object-cover"
                  autoPlay
                  loop
                  muted
                  controls
                />
              ) : (
                <img 
                  src={ImageManager.getAssetUrl(allMedia[selectedIndex])} 
                  alt="Ảnh đang chọn" 
                  className="w-full h-full object-cover"
                />
              )
            )}

            {/* Nav Arrows */}
            {selectedIndex > 0 && (
              <Button 
                isIconOnly 
                variant="flat" 
                size="sm"
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 backdrop-blur-md shadow-sm z-10 h-8 w-8 text-foreground" 
                onPress={() => setSelectedIndex(selectedIndex - 1)}
                aria-label="Ảnh trước"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
            )}
            {selectedIndex < allMedia.length - 1 && (
              <Button 
                isIconOnly 
                variant="flat" 
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 backdrop-blur-md shadow-sm z-10 h-8 w-8 text-foreground" 
                onPress={() => setSelectedIndex(selectedIndex + 1)}
                aria-label="Ảnh sau"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}

            {/* Top-Left Badge */}
            <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1">
              {selectedIndex === 0 ? (
                <div className="bg-primary text-white text-xs px-2.5 py-1 rounded-lg font-semibold shadow-sm flex items-center gap-1.5 backdrop-blur-sm">
                  <Star className="w-3.5 h-3.5 fill-current" /> Ảnh đại diện chính
                </div>
              ) : (
                <div className="bg-black/60 text-white text-xs px-2 py-1 rounded-lg font-medium shadow-sm backdrop-blur-sm">
                  Ảnh phụ ({selectedIndex + 1}/{allMedia.length})
                </div>
              )}
            </div>

            {/* Top-Right Actions */}
            <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10">
              {selectedIndex !== 0 && (
                <Button 
                  size="sm" 
                  color="primary" 
                  variant="flat" 
                  className="bg-background/90 backdrop-blur-md shadow-sm text-xs font-semibold h-8 px-2.5 rounded-lg" 
                  onPress={() => handleSetMain(selectedIndex)}
                  startContent={<Star className="w-3.5 h-3.5" />}
                  title="Đặt làm ảnh đại diện chính"
                >
                  Đặt làm chính
                </Button>
              )}
              <Button 
                size="sm" 
                isIconOnly 
                color="danger" 
                variant="flat" 
                className="bg-background/90 backdrop-blur-md shadow-sm h-8 w-8 rounded-lg" 
                onPress={() => handleRemoveMedia(selectedIndex)}
                title="Xóa ảnh này"
                aria-label="Xóa ảnh"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Right Side: Multi-Avatar Column (Cột thể hiện nhiều ảnh đại diện) */}
        <div className="w-20 sm:w-24 md:w-28 flex flex-col shrink-0 min-h-0">
          <div 
            ref={thumbnailsRef}
            className="flex-1 min-h-0 w-full flex flex-col gap-2 overflow-y-auto pr-0.5 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-default-300 [&::-webkit-scrollbar-thumb]:rounded-full scroll-smooth"
          >
            {allMedia.map((mediaUrl, i) => {
              const isMain = i === 0;
              const isSelected = i === selectedIndex;
              return (
                <div 
                  key={`${mediaUrl}-${i}`}
                  data-index={i}
                  data-testid="media-thumbnail"
                  onClick={() => setSelectedIndex(i)}
                  className={`
                    relative cursor-pointer rounded-xl overflow-hidden border-2 transition-all shrink-0 aspect-square w-full bg-default-100 group
                    ${isSelected ? 'border-primary ring-2 ring-primary/30 shadow-sm' : 'border-divider/60 opacity-70 hover:opacity-100'}
                  `}
                  title={isMain ? "Ảnh đại diện chính" : `Ảnh ${i + 1}`}
                >
                  {isVideo(mediaUrl) ? (
                    <>
                      <video src={mediaUrl} className="w-full h-full object-cover" muted />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <PlayCircle className="w-5 h-5 text-white opacity-90" />
                      </div>
                    </>
                  ) : (
                    <img 
                      src={ImageManager.getAssetUrl(mediaUrl)} 
                      alt={`Ảnh ${i + 1}`} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" 
                    />
                  )}
                  
                  {/* Primary avatar star indicator */}
                  {isMain && (
                    <div 
                      className="absolute top-1 left-1 bg-primary text-white p-1 rounded-md shadow-xs z-10 flex items-center justify-center"
                      title="Ảnh đại diện chính"
                    >
                      <Star className="w-3 h-3 fill-current" />
                    </div>
                  )}

                  {/* Set main quick button */}
                  {!isMain && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSetMain(i);
                      }}
                      className="absolute top-1 left-1 bg-black/60 hover:bg-primary text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity z-10"
                      title="Đặt làm ảnh chính"
                      aria-label="Đặt làm ảnh chính"
                    >
                      <Star className="w-3 h-3" />
                    </button>
                  )}

                  {/* Quick delete button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveMedia(i);
                    }}
                    className="absolute top-1 right-1 bg-black/60 hover:bg-danger text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    title="Xóa ảnh"
                    aria-label="Xóa ảnh"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              );
            })}

            {/* Empty placeholder slots when no media */}
            {allMedia.length === 0 && (
              <>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="aspect-square w-full rounded-xl border-2 border-dashed border-default-300 dark:border-default-200/50 bg-default-50/50 dark:bg-default-100/30 text-default-400 hover:text-primary hover:border-primary hover:bg-primary-50/30 transition-all flex items-center justify-center cursor-pointer group shrink-0"
                  title="Thêm ảnh"
                  aria-label="Thêm ảnh"
                >
                  <ImagePlus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="aspect-square w-full rounded-xl border-2 border-dashed border-default-200 dark:border-default-200/30 bg-default-50/30 dark:bg-default-100/20 text-default-400 hover:text-primary hover:border-primary hover:bg-primary-50/30 transition-all flex items-center justify-center cursor-pointer group shrink-0"
                  title="Thêm ảnh"
                  aria-label="Thêm ảnh"
                >
                  <ImagePlus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </button>
              </>
            )}
            
            {/* Add More slot button in the right column */}
            <button 
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="cursor-pointer rounded-xl border-2 border-dashed border-default-300 dark:border-default-200/50 bg-default-50/50 dark:bg-default-100/30 text-default-500 hover:text-primary hover:border-primary hover:bg-primary-50/30 transition-all flex flex-col items-center justify-center shrink-0 aspect-square w-full group py-2"
              title="Thêm ảnh mới"
              aria-label="Thêm ảnh mới"
            >
              <ImagePlus className="w-5 h-5 group-hover:scale-110 transition-transform mb-0.5 text-default-400 group-hover:text-primary" />
              <span className="text-xs font-semibold text-default-500 group-hover:text-primary">Thêm</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal Picker */}
      <ImagePickerModal 
        isOpen={isModalOpen} 
        onOpenChange={setIsModalOpen}
        onSelectMedia={handleSelectMedia}
      />
    </div>
  );
}
