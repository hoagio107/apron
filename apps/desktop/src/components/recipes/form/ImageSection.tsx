import { useState, useRef, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { Button } from '@apron/ui';
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
  
  useEffect(() => {
    if (thumbnailsRef.current) {
      const container = thumbnailsRef.current;
      const activeElement = container.children[selectedIndex] as HTMLElement;
      if (activeElement) {
        const scrollLeft = activeElement.offsetLeft - container.offsetWidth / 2 + activeElement.offsetWidth / 2;
        container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  const scrollThumbnails = (direction: 'left' | 'right') => {
    if (thumbnailsRef.current) {
      const container = thumbnailsRef.current;
      const scrollAmount = container.offsetWidth * 0.8;
      container.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };
  const otherImages = watch('images') || [];
  const videos = watch('videos') || [];
  
  // All media combined for display
  const allMedia = [...(mainImage ? [mainImage] : []), ...otherImages, ...videos];

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
    <div className="flex flex-col h-full min-h-[400px]">
      {allMedia.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div 
            onClick={() => setIsModalOpen(true)}
            className="w-full h-full border-2 border-dashed border-primary/50 rounded-2xl flex flex-col items-center justify-center bg-primary-50/50 text-primary-600 hover:bg-primary-50 hover:border-primary transition-all cursor-pointer group"
          >
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <ImagePlus className="w-8 h-8 text-primary" />
            </div>
            <p className="font-bold text-xl mb-1">Tải lên hoặc chọn ảnh/video</p>
            <p className="text-sm text-primary-500/80 text-center px-4">Kéo thả file hoặc nhập URL</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Main Preview */}
          <div className="h-[400px] md:h-[500px] w-full bg-default-100 rounded-2xl relative group overflow-hidden flex items-center justify-center shadow-inner border border-default-200">
            {allMedia[selectedIndex] && (
              isVideo(allMedia[selectedIndex]) ? (
                <video 
                  src={allMedia[selectedIndex]} 
                  className="max-w-full max-h-full object-contain"
                  autoPlay
                  loop
                  muted
                  controls
                />
              ) : (
                <img 
                  src={ImageManager.getAssetUrl(allMedia[selectedIndex])} 
                  alt="Main preview" 
                  className="max-w-full max-h-full object-contain"
                />
              )
            )}
            
            {/* Nav Arrows */}
            {selectedIndex > 0 && (
              <Button 
                isIconOnly 
                variant="flat" 
                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/70 backdrop-blur-md shadow-sm z-10 opacity-0 group-hover:opacity-100 transition-opacity" 
                onPress={() => setSelectedIndex(selectedIndex - 1)}
              >
                <ChevronLeft className="w-5 h-5 text-default-700" />
              </Button>
            )}
            {selectedIndex < allMedia.length - 1 && (
              <Button 
                isIconOnly 
                variant="flat" 
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/70 backdrop-blur-md shadow-sm z-10 opacity-0 group-hover:opacity-100 transition-opacity" 
                onPress={() => setSelectedIndex(selectedIndex + 1)}
              >
                <ChevronRight className="w-5 h-5 text-default-700" />
              </Button>
            )}

            {/* Badges & Actions */}
            <div className="absolute top-3 left-3 z-10">
              {selectedIndex === 0 && (
                <div className="bg-primary text-white text-xs px-2.5 py-1.5 rounded-lg font-medium shadow-md flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 fill-current" /> Nội dung chính
                </div>
              )}
            </div>

            <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
              {selectedIndex !== 0 && (
                <Button 
                  size="sm" 
                  isIconOnly
                  color="primary" 
                  variant="flat" 
                  className="bg-white/90 backdrop-blur-md shadow-sm" 
                  onPress={() => handleSetMain(selectedIndex)}
                  title="Set as recipe avatar"
                >
                  <Star className="w-4 h-4" />
                </Button>
              )}
              <Button 
                size="sm" 
                isIconOnly 
                color="danger" 
                variant="flat" 
                className="bg-white/90 backdrop-blur-md shadow-sm" 
                onPress={() => handleRemoveMedia(selectedIndex)}
                title="Xóa file"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Thumbnails Row */}
          <div className="relative group/thumbs flex items-center">
            {allMedia.length > 4 && (
              <Button 
                isIconOnly 
                variant="flat" 
                size="sm"
                className="absolute left-1 z-10 opacity-0 group-hover/thumbs:opacity-100 transition-opacity bg-white/90 backdrop-blur-md shadow-sm rounded-full"
                onPress={() => scrollThumbnails('left')}
              >
                <ChevronLeft className="w-4 h-4 text-default-700" />
              </Button>
            )}
            
            <div ref={thumbnailsRef} className="flex gap-3 w-full overflow-x-auto pb-2 px-1 [&::-webkit-scrollbar]:hidden scroll-smooth items-center">
            {allMedia.map((mediaUrl, i) => (
              <div 
                key={`${mediaUrl}-${i}`}
                onClick={() => setSelectedIndex(i)}
                className={`
                  relative cursor-pointer rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 aspect-square w-20 bg-default-100
                  ${i === selectedIndex ? 'border-primary ring-2 ring-primary/20' : 'border-transparent opacity-60 hover:opacity-100'}
                `}
              >
                {isVideo(mediaUrl) ? (
                  <>
                    <video src={mediaUrl} className="w-full h-full object-cover" muted />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <PlayCircle className="w-6 h-6 text-white opacity-80" />
                    </div>
                  </>
                ) : (
                  <img 
                    src={ImageManager.getAssetUrl(mediaUrl)} 
                    alt={`Thumbnail ${i}`} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" 
                  />
                )}
                
                {i === 0 && (
                  <div className="absolute bottom-1 right-1 bg-primary text-white p-0.5 rounded-sm shadow-sm z-10">
                    <Star className="w-3 h-3 fill-current" />
                  </div>
                )}
              </div>
            ))}
            
            {/* Add New Media Box */}
            <div 
              onClick={() => setIsModalOpen(true)}
              className="cursor-pointer rounded-xl border-2 border-dashed border-default-300 bg-default-50 text-default-400 hover:text-primary hover:border-primary hover:bg-primary-50 transition-all flex items-center justify-center flex-shrink-0 aspect-square w-20"
              title="Thêm ảnh/video mới"
            >
              <ImagePlus className="w-6 h-6" />
            </div>
          </div>
          
            {allMedia.length > 4 && (
              <Button 
                isIconOnly 
                variant="flat" 
                size="sm"
                className="absolute right-1 z-10 opacity-0 group-hover/thumbs:opacity-100 transition-opacity bg-white/90 backdrop-blur-md shadow-sm rounded-full"
                onPress={() => scrollThumbnails('right')}
              >
                <ChevronRight className="w-4 h-4 text-default-700" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Modal Picker */}
      <ImagePickerModal 
        isOpen={isModalOpen} 
        onOpenChange={setIsModalOpen}
        onSelectMedia={handleSelectMedia}
      />
    </div>
  );
}
