import React, { useState, useEffect } from 'react';
import { Modal, ModalContent, Button, Checkbox } from '@apron/ui';
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
    <Modal 
      size="5xl" 
      isOpen={isOpen} 
      onClose={onClose}
      backdrop="blur"
      hideCloseButton={true}
      classNames={{ closeButton: "hidden" }}
    >
      <ModalContent>
        {(onCloseModal) => (
          <div className="flex flex-col h-[80vh] bg-background">
             <div className="flex items-center justify-between p-4 border-b border-default-200 bg-white">
               <div className="flex items-center gap-3">
                 <Button isIconOnly variant="light" onPress={onCloseModal}><X className="w-6 h-6"/></Button>
                 <div className="font-bold text-lg">{recipe.title}</div>
               </div>
               <div className="text-sm font-semibold text-primary">
                 {currentCookingStep === -1 
                   ? 'Chuẩn bị nguyên liệu' 
                   : `Bước ${currentCookingStep + 1} / ${allSteps.length}`}
               </div>
             </div>
             
             <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col items-center bg-default-50">
               {currentCookingStep === -1 ? (
                 <div className="max-w-4xl w-full flex flex-col gap-6">
                   <h3 className="text-2xl font-bold flex items-center gap-2">
                     <Carrot className="w-6 h-6 text-primary" />
                     Nguyên liệu cần chuẩn bị
                   </h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                     {recipe.ingredients?.map((ing: any, idx: number) => (
                       <div 
                         key={idx} 
                         className={`flex items-center justify-between p-4 rounded-xl transition-all cursor-pointer bg-white shadow-sm ${
                           checkedIngredients.has(idx) 
                             ? 'opacity-60 bg-default-100' 
                             : 'hover:shadow-md'
                         }`}
                         onClick={() => toggleIngredient(idx)}
                       >
                         <div className="flex items-center gap-4">
                           <Checkbox 
                             isSelected={checkedIngredients.has(idx)}
                             onValueChange={() => toggleIngredient(idx)}
                             size="lg"
                           />
                           <span className={`text-lg ${checkedIngredients.has(idx) ? 'line-through text-default-400' : 'text-foreground'}`}>
                             {ing.name}
                           </span>
                         </div>
                         <div className={`font-medium text-lg ${checkedIngredients.has(idx) ? 'text-default-400' : 'text-primary'}`}>
                           {scaleQuantity(ing.quantity)} {ing.unit}
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>
               ) : allSteps.length > 0 && currentCookingStep >= 0 && currentCookingStep < allSteps.length ? (
                 <div className="max-w-4xl w-full flex flex-col items-center text-center gap-4 md:gap-8 pb-8">
                   {((allSteps[currentCookingStep].images && allSteps[currentCookingStep].images.length > 0) || allSteps[currentCookingStep].image_url) && (
                     <div className="w-full h-64 md:h-96 bg-default-100 flex-shrink-0 relative rounded-3xl overflow-hidden shadow-sm">
                       {allSteps[currentCookingStep].images && allSteps[currentCookingStep].images.length > 1 ? (
                         <>
                           <img 
                             src={ImageManager.getAssetUrl(allSteps[currentCookingStep].images[currentImageIndex])} 
                             alt={`Step ${currentCookingStep + 1} visualization ${currentImageIndex + 1}`} 
                             className="w-full h-full object-cover"
                           />
                           
                           {/* Navigation Arrows */}
                           <div className="absolute inset-0 flex items-center justify-between p-4 pointer-events-none">
                              <Button 
                                isIconOnly 
                                size="sm" 
                                className="rounded-full pointer-events-auto bg-black/50 text-white backdrop-blur-md border-none z-10"
                                onPress={() => setCurrentImageIndex(Math.max(0, currentImageIndex - 1))}
                                isDisabled={currentImageIndex === 0}
                              >
                                <ChevronLeft className="w-5 h-5" />
                              </Button>
                              <Button 
                                isIconOnly 
                                size="sm" 
                                className="rounded-full pointer-events-auto bg-black/50 text-white backdrop-blur-md border-none z-10"
                                onPress={() => setCurrentImageIndex(Math.min(allSteps[currentCookingStep].images.length - 1, currentImageIndex + 1))}
                                isDisabled={currentImageIndex === allSteps[currentCookingStep].images.length - 1}
                              >
                                <ChevronRight className="w-5 h-5" />
                              </Button>
                           </div>

                           {/* Pagination Dots */}
                           <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 z-10">
                              {allSteps[currentCookingStep].images.map((_: any, idx: number) => (
                                <div 
                                  key={idx} 
                                  className={`h-2 rounded-full transition-all ${idx === currentImageIndex ? 'bg-white w-4' : 'bg-white/50 w-2'}`} 
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
                   <div className="w-full flex flex-col gap-4 pt-4 px-4 md:px-0">
                     <div className="w-full text-left">
                       <h4 className="text-primary font-bold text-xl md:text-2xl uppercase tracking-wide">
                         {allSteps[currentCookingStep].group || 'Các bước thực hiện'}
                       </h4>
                     </div>
                     <div className="w-full flex gap-4 md:gap-6 items-start text-left">
                       <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-primary/10 text-primary text-xl md:text-2xl font-bold flex items-center justify-center shrink-0 mt-1">
                         {currentCookingStep + 1}
                       </div>
                       <div 
                         className="text-xl md:text-3xl font-medium text-foreground leading-relaxed flex-1 whitespace-pre-wrap prose prose-lg prose-primary max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-p:leading-relaxed"
                         dangerouslySetInnerHTML={{ __html: allSteps[currentCookingStep].instruction }}
                       />
                     </div>
                   </div>
                  </div>
                ) : null}
              </div>
              
              <div className="p-4 md:p-6 border-t border-default-200 bg-white flex justify-between items-center">
                 <Button 
                   size="lg" 
                   variant="flat" 
                   onPress={() => setCurrentCookingStep(Math.max(-1, currentCookingStep - 1))}
                   isDisabled={currentCookingStep === -1}
                   startContent={<ChevronLeft className="w-5 h-5"/>}
                 >
                   Quay lại
                 </Button>
                  
                  <Button 
                    size="lg" 
                    color="primary" 
                    onPress={() => {
                      if (currentCookingStep < allSteps.length - 1) {
                        setCurrentCookingStep(currentCookingStep + 1);
                      } else {
                        onCloseModal();
                        onFinish();
                      }
                    }}
                    endContent={currentCookingStep < allSteps.length - 1 ? <ChevronRight className="w-5 h-5"/> : <Check className="w-5 h-5"/>}
                  >
                    {currentCookingStep === -1 ? 'Bắt đầu làm' : (currentCookingStep < allSteps.length - 1 ? 'Tiếp theo' : 'Hoàn thành')}
                  </Button>
               </div>
          </div>
        )}
      </ModalContent>
    </Modal>
  );
}
