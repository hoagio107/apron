import { useRef } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerBody, SectionTitle } from '@/ui';
import { Carrot, ChefHat, Timer, Flame, Star, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import { ImageManager } from '../../lib/image-manager';

interface RecipeSnapshotModalProps {
  isOpen: boolean;
  onClose: () => void;
  snapshot: any;
  date: string;
  rating?: number;
  notes?: string;
}

const StepImageCarousel = ({ step }: { step: any }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  const images = step.images?.length > 0 ? step.images : (step.image_url ? [step.image_url] : []);
  if (images.length === 0) return null;

  return (
    <div className="relative group mt-2">
      <div 
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto pb-1 scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] snap-x snap-mandatory"
      >
        {images.map((img: string, i: number) => (
          <img 
            key={i} 
            src={ImageManager.getAssetUrl(img)} 
            className="h-28 sm:h-32 w-44 sm:w-48 object-cover rounded-xl shrink-0 snap-start border border-divider/40" 
            alt={`Ảnh bước làm ${i + 1}`}
          />
        ))}
      </div>
      
      {images.length > 1 && (
        <>
          <button 
            type="button"
            onClick={(e) => { e.stopPropagation(); scroll('left'); }}
            className="absolute left-1.5 top-1/2 -translate-y-1/2 bg-black/60 text-white p-1 rounded-full opacity-80 hover:opacity-100 transition-opacity z-10"
            aria-label="Ảnh trước"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button 
            type="button"
            onClick={(e) => { e.stopPropagation(); scroll('right'); }}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-black/60 text-white p-1 rounded-full opacity-80 hover:opacity-100 transition-opacity z-10"
            aria-label="Ảnh tiếp"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </>
      )}
    </div>
  );
};

export function RecipeSnapshotModal({ isOpen, onClose, snapshot, date, rating, notes }: RecipeSnapshotModalProps) {
  if (!snapshot) return null;

  const mainImage = snapshot.images?.[0] || snapshot.image_url;

  return (
    <Drawer 
      size="full" 
      isOpen={isOpen} 
      onClose={onClose}
      placement="bottom"
      backdrop="blur"
      classNames={{
        base: "max-h-[calc(100dvh-var(--sat,0px)-20px)] rounded-t-3xl bg-content1 shadow-2xl flex flex-col mt-auto overflow-hidden",
        backdrop: "bg-black/60 backdrop-blur-sm",
        header: "border-b border-divider p-4 pr-12 bg-content1 shrink-0 rounded-t-3xl",
        body: "p-4 sm:p-6 overflow-y-auto space-y-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      }}
    >
      <DrawerContent className="rounded-t-3xl overflow-hidden">
        {() => (
          <>
            {/* Header: 2 cột - Cột trái chiếm 1/4 là ảnh đại diện thu gọn, cột phải là tên, ngày tháng, đánh giá, nhận xét */}
            <DrawerHeader className="flex gap-3 sm:gap-4 items-center">
              {/* Cột trái (1/4 width) */}
              <div className="w-1/4 max-w-[84px] min-w-[68px] aspect-square rounded-2xl overflow-hidden shrink-0 bg-default-100 border border-divider/40">
                {mainImage ? (
                  <img 
                    src={ImageManager.getAssetUrl(mainImage)} 
                    className="w-full h-full object-cover" 
                    alt={snapshot.title}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-default-400 bg-default-100">
                    <ChefHat className="w-7 h-7" />
                  </div>
                )}
              </div>

              {/* Cột phải (3/4 width) */}
              <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
                <h2 className="text-base sm:text-lg font-bold text-foreground line-clamp-1 leading-snug">
                  {snapshot.title}
                </h2>
                
                <p className="text-xs text-default-500 font-normal">
                  {new Date(date).toLocaleDateString('vi-VN', {
                    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                  })}
                </p>

                {rating !== undefined && rating !== null && rating > 0 && (
                  <div className="flex items-center gap-0.5 text-warning-400 mt-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`w-3.5 h-3.5 ${i < rating ? 'fill-current text-warning-400' : 'text-default-300 dark:text-default-600'}`} 
                      />
                    ))}
                  </div>
                )}

                {notes ? (
                  <p className="text-xs text-default-600 dark:text-default-300 italic line-clamp-2 bg-default-100/70 dark:bg-default-100/40 px-2 py-1 rounded-lg mt-0.5">
                    "{notes}"
                  </p>
                ) : null}
              </div>
            </DrawerHeader>

            {/* Nội dung chia thành 3 mục rõ ràng với SectionTitle */}
            <DrawerBody className="space-y-6">
              {/* Mục 1: Thông tin chung */}
              <div className="flex flex-col gap-3">
                <SectionTitle 
                  title="Thông tin chung" 
                  icon={<Info className="w-5 h-5 text-primary" />} 
                />
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 bg-default-100/50 dark:bg-content2/50 rounded-2xl border border-divider/40">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-primary/10 rounded-xl shrink-0">
                      <Timer className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <div className="text-[11px] text-default-500 font-medium">Chuẩn bị</div>
                      <div className="font-bold text-xs sm:text-sm text-foreground">{snapshot.prep_time || 0} phút</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-primary/10 rounded-xl shrink-0">
                      <ChefHat className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <div className="text-[11px] text-default-500 font-medium">Nấu</div>
                      <div className="font-bold text-xs sm:text-sm text-foreground">{snapshot.cook_time || 0} phút</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-warning/10 rounded-xl shrink-0">
                      <Star className="w-4 h-4 text-warning" />
                    </div>
                    <div>
                      <div className="text-[11px] text-default-500 font-medium">Độ khó</div>
                      <div className="font-bold text-xs sm:text-sm text-foreground capitalize">{snapshot.difficulty || '--'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-danger/10 rounded-xl shrink-0">
                      <Flame className="w-4 h-4 text-danger" />
                    </div>
                    <div>
                      <div className="text-[11px] text-default-500 font-medium">Calories</div>
                      <div className="font-bold text-xs sm:text-sm text-foreground">{snapshot.calories || '--'} kcal</div>
                    </div>
                  </div>
                </div>

                {/* Recipe Notes nếu bản snapshot có ghi chú */}
                {snapshot.notes && (
                  <div className="mt-1 text-sm leading-relaxed p-3.5 rounded-2xl border bg-amber-500/10 dark:bg-amber-500/15 border-amber-500/30 text-amber-950 dark:text-amber-100 prose prose-sm dark:prose-invert max-w-none prose-p:my-1 [&_*]:text-amber-950 dark:[&_*]:text-amber-100 [&_strong]:text-amber-950 dark:[&_strong]:text-amber-50">
                    <div className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5" /> Ghi chú công thức
                    </div>
                    <div dangerouslySetInnerHTML={{ __html: snapshot.notes }} />
                  </div>
                )}
              </div>

              {/* Mục 2: Nguyên liệu */}
              <div className="flex flex-col gap-3">
                <SectionTitle 
                  title={`Nguyên liệu (${snapshot.servings || 1} phần)`} 
                  icon={<Carrot className="w-5 h-5 text-success" />} 
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {snapshot.ingredients?.map((ing: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center py-2.5 px-3.5 bg-default-100/60 dark:bg-content2/60 rounded-xl border border-divider/30">
                      <span className="font-medium text-sm text-foreground">{ing.name}</span>
                      <span className="text-primary font-bold text-sm shrink-0 ml-2">{ing.quantity} {ing.unit}</span>
                    </div>
                  ))}
                  {(!snapshot.ingredients || snapshot.ingredients.length === 0) && (
                    <div className="text-xs text-default-400 italic py-2">Không có dữ liệu nguyên liệu</div>
                  )}
                </div>
              </div>

              {/* Mục 3: Cách làm */}
              <div className="flex flex-col gap-3">
                <SectionTitle 
                  title="Cách làm" 
                  icon={<ChefHat className="w-5 h-5 text-primary" />} 
                />
                <div className="flex flex-col gap-4">
                  {snapshot.steps?.map((step: any, idx: number) => (
                    <div key={idx} className="flex gap-3">
                      <div className="w-7 h-7 rounded-full bg-primary/15 dark:bg-primary/25 text-primary dark:text-primary-300 border border-primary/20 font-bold flex items-center justify-center shrink-0 text-xs shadow-2xs mt-0.5">
                        {idx + 1}
                      </div>
                      <div className="flex flex-col gap-2 flex-1 min-w-0">
                        <div 
                          className="text-foreground text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none prose-p:my-0.5"
                          dangerouslySetInnerHTML={{ __html: step.instruction }}
                        />
                        <StepImageCarousel step={step} />
                      </div>
                    </div>
                  ))}
                  {(!snapshot.steps || snapshot.steps.length === 0) && (
                    <div className="text-xs text-default-400 italic py-2">Không có dữ liệu các bước thực hiện</div>
                  )}
                </div>
              </div>
            </DrawerBody>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}
