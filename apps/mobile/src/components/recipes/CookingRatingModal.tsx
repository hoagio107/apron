import { useState, useEffect } from 'react';
import { Drawer, DrawerContent, DrawerBody, Button, Textarea } from '@/ui';
import { Check, Star, Edit3, PartyPopper } from 'lucide-react';
import confetti from 'canvas-confetti';

interface CookingRatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (rating: number, notes: string, action: 'done' | 'edit') => void;
}

export function CookingRatingModal({ isOpen, onClose, onComplete }: CookingRatingModalProps) {
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState('');
  const [step, setStep] = useState<'rating' | 'confirm'>('rating');

  useEffect(() => {
    if (isOpen) {
      setRating(0);
      setNotes('');
      setStep('rating');
      
      // Fire confetti
      const duration = 2.5 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 40 * (timeLeft / duration);
        confetti({
          ...defaults, particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        });
        confetti({
          ...defaults, particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        });
      }, 250);
    }
  }, [isOpen]);

  return (
    <Drawer 
      size="lg" 
      isOpen={isOpen} 
      onClose={onClose}
      placement="bottom"
      backdrop="blur"
      hideCloseButton
      classNames={{
        base: "max-h-[calc(100dvh-var(--sat,0px)-20px)] rounded-t-3xl bg-content1 shadow-2xl overflow-hidden mt-auto",
        backdrop: "bg-black/60 backdrop-blur-sm"
      }}
    >
      <DrawerContent className="rounded-t-3xl overflow-hidden">
        {() => (
          <DrawerBody className="p-6 sm:p-8 bg-content1 text-center">
            {/* Grab handle */}
            <div className="w-10 h-1 bg-default-300 dark:bg-default-600 rounded-full mx-auto -mt-2 mb-4" />

            {step === 'rating' ? (
              <div className="flex flex-col gap-6 animate-appearance-in">
                <div className="flex flex-col gap-1.5 items-center">
                  <div className="w-12 h-12 bg-warning-100 dark:bg-warning-500/20 text-warning-600 dark:text-warning-400 rounded-2xl flex items-center justify-center mb-1">
                    <PartyPopper className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">Tuyệt vời!</h3>
                  <p className="text-default-500 text-sm">Bạn đã hoàn thành món ăn. Hãy đánh giá thành quả nhé!</p>
                </div>
                
                <div className="flex flex-col items-center gap-3">
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Button
                        key={star}
                        isIconOnly
                        variant="light"
                        className="w-11 h-11 rounded-full"
                        onPress={() => setRating(star)}
                      >
                        <Star 
                          className={`w-7 h-7 ${rating >= star ? 'fill-warning text-warning scale-110 transition-transform' : 'text-default-300 dark:text-default-600'}`} 
                        />
                      </Button>
                    ))}
                  </div>
                  
                  <Textarea
                    placeholder="Ghi chú cho lần nấu này (VD: Lần sau nên cho ít muối hơn...)"
                    value={notes}
                    onValueChange={setNotes}
                    minRows={2}
                    variant="bordered"
                    classNames={{
                      inputWrapper: "bg-default-100/60 dark:bg-content2/60 border-divider data-[focus=true]:!border-primary",
                      input: "text-sm"
                    }}
                    className="w-full mt-2 max-w-md"
                  />
                </div>
                
                <div className="flex justify-center mt-1">
                  <Button 
                    size="md" 
                    color="primary" 
                    className="px-10 font-bold rounded-full shadow-md shadow-primary/20"
                    onPress={() => setStep('confirm')}
                  >
                    Gửi đánh giá
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-6 animate-appearance-in py-2">
                <div className="flex flex-col gap-2 items-center">
                  <h3 className="text-lg font-bold text-foreground">Bạn có muốn sửa lại công thức không?</h3>
                  <p className="text-default-500 text-sm max-w-sm">Dựa vào ghi chú vừa rồi, bạn có thể điều chỉnh lại định lượng hoặc cách làm để món ăn ngon hơn trong lần tới.</p>
                </div>
                
                <div className="flex justify-center gap-3 mt-2">
                  <Button 
                    size="md" 
                    variant="flat" 
                    color="default"
                    startContent={<Check className="w-4 h-4"/>}
                    onPress={() => onComplete(rating, notes, 'done')}
                    className="font-semibold rounded-full px-5"
                  >
                    Không, hoàn tất
                  </Button>
                  <Button 
                    size="md" 
                    color="primary" 
                    className="px-6 font-semibold rounded-full shadow-md shadow-primary/20"
                    startContent={<Edit3 className="w-4 h-4"/>}
                    onPress={() => onComplete(rating, notes, 'edit')}
                  >
                    Có, sửa công thức
                  </Button>
                </div>
              </div>
            )}
          </DrawerBody>
        )}
      </DrawerContent>
    </Drawer>
  );
}
