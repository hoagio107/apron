import { useState, useEffect } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerBody, DrawerFooter, Button, SectionTitle } from '@/ui';
import { X, Carrot, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { ImageManager } from '../../lib/image-manager';

interface CookingModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipe: any;
  allSteps: any[];
  checkedIngredients: Set<number>;
  toggleIngredient: (index: number) => void;
  scaleQuantity: (q: any) => any;
  onFinish: () => void;
}

export function CookingModeModal({
  isOpen,
  onClose,
  recipe,
  allSteps,
  checkedIngredients,
  toggleIngredient,
  scaleQuantity,
  onFinish
}: CookingModeModalProps) {
  const [currentCookingStep, setCurrentCookingStep] = useState(-1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setCurrentCookingStep(-1);
    }
  }, [isOpen]);

  useEffect(() => {
    setCurrentImageIndex(0);
  }, [currentCookingStep]);

  return (
    <Drawer 
      size="full" 
      isOpen={isOpen} 
      onClose={onClose}
      placement="bottom"
      backdrop="blur"
      hideCloseButton
      classNames={{
        base: "max-h-[94vh] rounded-t-3xl bg-content1 shadow-2xl flex flex-col overflow-hidden",
        header: "border-b border-divider p-4 bg-content1 shrink-0",
        body: "p-4 sm:p-6 overflow-y-auto bg-background flex flex-col",
        footer: "border-t border-divider p-4 bg-content1 shrink-0 pb-safe",
      }}
    >
      <DrawerContent>
        {(onCloseModal) => (
          <div className="flex flex-col h-full overflow-hidden">
            {/* Header */}
            <DrawerHeader className="flex flex-col gap-2 p-3.5 border-b border-divider bg-content1 shrink-0">
              <div className="w-10 h-1 bg-default-300 dark:bg-default-600 rounded-full mx-auto -mt-1 mb-1" />
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-3">
                  <Button 
                    isIconOnly 
                    variant="light" 
                    size="sm" 
                    className="w-8 h-8 rounded-full shrink-0 text-default-600 hover:text-foreground" 
                    onPress={onCloseModal}
                    aria-label="Đóng chế độ nấu"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                  <h2 className="font-bold text-sm sm:text-base text-foreground truncate">
                    {recipe.title}
                  </h2>
                </div>
                <div className="text-xs font-semibold px-2.5 py-1 bg-primary/15 text-primary rounded-full shrink-0 whitespace-nowrap">
                  {currentCookingStep === -1 
                    ? 'Chuẩn bị nguyên liệu' 
                    : `Bước ${currentCookingStep + 1} / ${allSteps.length}`}
                </div>
              </div>
            </DrawerHeader>
            
            {/* Body */}
            <DrawerBody className="flex-1 overflow-y-auto p-4 sm:p-6 bg-background space-y-4">
              {currentCookingStep === -1 ? (
                <div className="w-full flex flex-col gap-4">
                  <SectionTitle 
                    title="Nguyên liệu cần chuẩn bị" 
                    icon={<Carrot className="w-5 h-5 text-success" />} 
                    action={
                      <span className="text-xs font-semibold text-default-500 bg-default-100 dark:bg-default-100/70 px-2.5 py-1 rounded-full">
                        {checkedIngredients.size}/{recipe.ingredients?.length || 0} đã chọn
                      </span>
                    }
                  />

                  <div className="flex flex-col gap-2 w-full">
                    {recipe.ingredients?.map((ing: any, idx: number) => {
                      const isChecked = checkedIngredients.has(idx);
                      return (
                        <div 
                          key={idx} 
                          className={`flex items-center justify-between py-2.5 px-3.5 rounded-xl transition-all cursor-pointer border ${
                            isChecked 
                              ? 'bg-default-100/40 dark:bg-content2/30 border-divider/40 opacity-60' 
                              : 'bg-content1 dark:bg-content2/60 border-divider/60 shadow-2xs hover:border-primary/40'
                          }`}
                          onClick={() => toggleIngredient(idx)}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
                            <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                              isChecked 
                                ? 'bg-primary border-primary text-white' 
                                : 'border-default-300 dark:border-default-600'
                            }`}>
                              {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </div>
                            <span className={`text-sm font-medium truncate ${isChecked ? 'line-through text-default-400' : 'text-foreground'}`}>
                              {ing.name}
                            </span>
                          </div>
                          <div className={`text-sm font-semibold shrink-0 ${isChecked ? 'text-default-400' : 'text-primary'}`}>
                            {scaleQuantity(ing.quantity)} {ing.unit}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : allSteps.length > 0 && currentCookingStep >= 0 && currentCookingStep < allSteps.length ? (
                <div className="w-full flex flex-col gap-4">
                  {/* Step Image */}
                  {((allSteps[currentCookingStep].images && allSteps[currentCookingStep].images.length > 0) || allSteps[currentCookingStep].image_url) && (
                    <div className="w-full aspect-video sm:h-64 bg-default-100 shrink-0 relative rounded-2xl overflow-hidden shadow-xs border border-divider/40">
                      {allSteps[currentCookingStep].images && allSteps[currentCookingStep].images.length > 1 ? (
                        <>
                          <img 
                            src={ImageManager.getAssetUrl(allSteps[currentCookingStep].images[currentImageIndex])} 
                            alt={`Step ${currentCookingStep + 1} visualization ${currentImageIndex + 1}`} 
                            className="w-full h-full object-cover"
                          />
                          
                          {/* Navigation Arrows */}
                          <div className="absolute inset-0 flex items-center justify-between p-3 pointer-events-none">
                            <Button 
                              isIconOnly 
                              size="sm" 
                              className="rounded-full pointer-events-auto bg-black/60 text-white backdrop-blur-md border-none z-10 w-8 h-8 min-w-0"
                              onPress={() => setCurrentImageIndex(Math.max(0, currentImageIndex - 1))}
                              isDisabled={currentImageIndex === 0}
                              aria-label="Ảnh trước"
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <Button 
                              isIconOnly 
                              size="sm" 
                              className="rounded-full pointer-events-auto bg-black/60 text-white backdrop-blur-md border-none z-10 w-8 h-8 min-w-0"
                              onPress={() => setCurrentImageIndex(Math.min(allSteps[currentCookingStep].images.length - 1, currentImageIndex + 1))}
                              isDisabled={currentImageIndex === allSteps[currentCookingStep].images.length - 1}
                              aria-label="Ảnh tiếp"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </Button>
                          </div>

                          {/* Pagination Dots */}
                          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-10">
                            {allSteps[currentCookingStep].images.map((_: any, idx: number) => (
                              <div 
                                key={idx} 
                                className={`h-1.5 rounded-full transition-all ${idx === currentImageIndex ? 'bg-white w-4' : 'bg-white/50 w-1.5'}`} 
                              />
                            ))}
                          </div>
                        </>
                      ) : (
                        <img 
                          src={ImageManager.getAssetUrl(allSteps[currentCookingStep].images && allSteps[currentCookingStep].images.length === 1 ? allSteps[currentCookingStep].images[0] : allSteps[currentCookingStep].image_url)} 
                          alt={`Step ${currentCookingStep + 1} visualization`} 
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                  )}

                  {/* Step Header: Number badge + Group Title */}
                  <div className="flex items-center gap-3 mt-1">
                    <div className="w-8 h-8 rounded-full bg-primary/15 dark:bg-primary/25 text-primary dark:text-primary-300 border border-primary/20 font-bold flex items-center justify-center shrink-0 text-sm shadow-2xs">
                      {currentCookingStep + 1}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-semibold text-primary uppercase tracking-wider">
                        Bước {currentCookingStep + 1}
                      </span>
                      <h3 className="text-base font-bold text-foreground">
                        {allSteps[currentCookingStep].group && allSteps[currentCookingStep].group !== 'Các bước thực hiện'
                          ? allSteps[currentCookingStep].group
                          : `Bước thực hiện ${currentCookingStep + 1}`}
                      </h3>
                    </div>
                  </div>

                  {/* Step Instruction Content */}
                  <div className="p-4 bg-default-100/50 dark:bg-content2/50 rounded-2xl border border-divider/40">
                    <div 
                      className="text-sm sm:text-base font-normal text-foreground leading-relaxed whitespace-pre-wrap prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1"
                      dangerouslySetInnerHTML={{ __html: allSteps[currentCookingStep].instruction }}
                    />
                  </div>
                </div>
              ) : null}
            </DrawerBody>
            
            {/* Footer */}
            <DrawerFooter className="p-4 border-t border-divider bg-content1 flex justify-between items-center pb-safe shrink-0">
              <Button 
                size="md" 
                variant="flat" 
                className="rounded-full font-semibold px-4"
                onPress={() => setCurrentCookingStep(Math.max(-1, currentCookingStep - 1))}
                isDisabled={currentCookingStep === -1}
                startContent={<ChevronLeft className="w-4 h-4"/>}
              >
                Quay lại
              </Button>
              
              <Button 
                size="md" 
                color="primary" 
                className="rounded-full font-semibold px-6 shadow-md shadow-primary/20"
                onPress={() => {
                  if (currentCookingStep < allSteps.length - 1) {
                    setCurrentCookingStep(currentCookingStep + 1);
                  } else {
                    onCloseModal();
                    onFinish();
                  }
                }}
                endContent={currentCookingStep < allSteps.length - 1 ? <ChevronRight className="w-4 h-4"/> : <Check className="w-4 h-4 stroke-[2.5]"/>}
              >
                {currentCookingStep === -1 ? 'Bắt đầu làm' : (currentCookingStep < allSteps.length - 1 ? 'Tiếp theo' : 'Hoàn thành')}
              </Button>
            </DrawerFooter>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}
