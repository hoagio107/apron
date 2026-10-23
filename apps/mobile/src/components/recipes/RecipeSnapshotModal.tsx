import { useRef } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody } from '@/ui';
import { Carrot, ChefHat, Timer, Flame, Star, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react';
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
        className="flex gap-2 overflow-x-auto pb-2 scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] snap-x snap-mandatory"
      >
        {images.map((img: string, i: number) => (
          <img 
            key={i} 
            src={ImageManager.getAssetUrl(img)} 
            className="h-32 w-48 object-cover rounded-xl shrink-0 snap-start" 
          />
        ))}
      </div>
      
      {images.length > 1 && (
        <>
          <button 
            onClick={(e) => { e.stopPropagation(); scroll('left'); }}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70 z-10"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); scroll('right'); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70 z-10"
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

  return (
    <Modal 
      size="3xl" 
      isOpen={isOpen} 
      onClose={onClose}
      backdrop="blur"
      scrollBehavior="inside"
    >
      <ModalContent className="overflow-hidden">
        {() => (
          <>
            <ModalHeader className="flex flex-col sm:flex-row gap-6 border-b border-divider bg-content1 p-6 pr-12 items-start">
              {(() => {
                const mainImage = snapshot.images?.[0] || snapshot.image_url;
                return mainImage ? (
                  <img 
                    src={ImageManager.getAssetUrl(mainImage)} 
                    className="w-32 h-32 sm:w-40 sm:h-40 object-cover rounded-2xl shrink-0" 
                  />
                ) : null;
              })()}
              <div className="flex flex-col flex-1 min-w-0">
                <h2 className="text-2xl font-bold mb-1">{snapshot.title}</h2>
                <p className="text-sm text-default-500 font-normal mb-4">
                  Bản lưu của lần nấu ngày {new Date(date).toLocaleDateString('vi-VN', {
                    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                  })}
                </p>
                
                <div className="flex flex-col gap-2 mt-auto">
                  {rating ? (
                    <div className="flex items-center gap-1 text-warning-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-5 h-5 ${i < rating ? 'fill-current' : 'text-default-300'}`} />
                      ))}
                    </div>
                  ) : null}
                  <p className={`whitespace-pre-wrap text-sm sm:text-base ${notes ? 'text-default-700' : 'text-default-400 italic'}`}>
                    {notes || "Không có nhận xét"}
                  </p>
                </div>
              </div>
            </ModalHeader>
            <ModalBody className="p-6 bg-default-50 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <div className="flex flex-col gap-8">
                
                {/* Stats */}
                <div className="app-card grid grid-cols-2 md:flex md:flex-wrap md:justify-between gap-6 md:gap-0 p-4 md:p-6 md:divide-x divide-divider">
                  <div className="flex items-center gap-3 md:px-6 md:first:pl-0 md:last:pr-0 flex-1 justify-center md:justify-start">
                    <div className="p-2 bg-primary/10 rounded-xl hidden sm:block">
                      <Timer className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-xs text-default-500 font-medium">Chuẩn bị</div>
                      <div className="font-bold text-sm sm:text-base">{snapshot.prep_time || 0} phút</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 md:px-6 flex-1 justify-center md:justify-start">
                    <div className="p-2 bg-primary/10 rounded-xl hidden sm:block">
                      <ChefHat className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-xs text-default-500 font-medium">Nấu</div>
                      <div className="font-bold text-sm sm:text-base">{snapshot.cook_time || 0} phút</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 md:px-6 flex-1 justify-center md:justify-start">
                    <div className="p-2 bg-warning/10 rounded-xl hidden sm:block">
                      <Star className="w-5 h-5 text-warning" />
                    </div>
                    <div>
                      <div className="text-xs text-default-500 font-medium">Độ khó</div>
                      <div className="font-bold text-sm sm:text-base">{snapshot.difficulty || '--'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 md:px-6 md:last:pr-0 flex-1 justify-center md:justify-start">
                    <div className="p-2 bg-danger/10 rounded-xl hidden sm:block">
                      <Flame className="w-5 h-5 text-danger" />
                    </div>
                    <div>
                      <div className="text-xs text-default-500 font-medium">Calories</div>
                      <div className="font-bold text-sm sm:text-base">{snapshot.calories || '--'} kcal</div>
                    </div>
                  </div>
                </div>

                {/* Ingredients */}
                <div className="app-card p-6">
                  <h3 className="text-xl font-bold flex items-center gap-2 mb-4 text-foreground">
                    <Carrot className="w-6 h-6 text-primary" />
                    Nguyên liệu ({snapshot.servings} phần)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {snapshot.ingredients?.map((ing: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-default-50 rounded-xl">
                        <span className="font-medium text-foreground">{ing.name}</span>
                        <span className="text-primary font-bold">{ing.quantity} {ing.unit}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Steps */}
                <div className="app-card p-6">
                  <h3 className="text-xl font-bold flex items-center gap-2 mb-6">
                    <ChefHat className="w-6 h-6 text-primary" />
                    Các bước thực hiện
                  </h3>
                  <div className="flex flex-col gap-6">
                    {snapshot.steps?.map((step: any, idx: number) => (
                      <div key={idx} className="flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </div>
                        <div className="flex flex-col gap-3 flex-1 pt-2 min-w-0">
                          <div 
                            className="text-foreground leading-relaxed break-words whitespace-pre-wrap prose prose-sm prose-primary max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1"
                            dangerouslySetInnerHTML={{ __html: step.instruction }}
                          />
                          
                          <StepImageCarousel step={step} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recipe Notes */}
                {snapshot.notes && (
                  <div className="bg-warning-50 p-6 rounded-2xl border border-warning-100">
                    <h3 className="text-xl font-bold flex items-center gap-2 mb-4 text-warning-600">
                      <MessageSquare className="w-6 h-6" />
                      Ghi chú món ăn
                    </h3>
                    <div 
                      className="text-default-700 leading-relaxed whitespace-pre-wrap prose prose-sm prose-warning max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1"
                      dangerouslySetInnerHTML={{ __html: snapshot.notes }}
                    />
                  </div>
                )}

              </div>
            </ModalBody>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
