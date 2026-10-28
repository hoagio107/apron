import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, ModalContent, Button, Textarea } from '@/ui';
import { Check, Star, Edit3, PartyPopper } from 'lucide-react';
import confetti from 'canvas-confetti';

interface CookingRatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (rating: number, notes: string, action: 'done' | 'edit') => void;
}

export function CookingRatingModal({ isOpen, onClose, onComplete }: CookingRatingModalProps) {
  const { t } = useTranslation();
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState('');
  const [step, setStep] = useState<'rating' | 'confirm'>('rating');

  useEffect(() => {
    if (isOpen) {
      setRating(0);
      setNotes('');
      setStep('rating');
      
      // Fire confetti
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({
          ...defaults, particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        });
        confetti({
          ...defaults, particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [isOpen]);

  return (
    <Modal 
      size="2xl" 
      isOpen={isOpen} 
      onClose={onClose}
      backdrop="blur"
      hideCloseButton={true}
    >
      <ModalContent>
        {() => (
          <div className="bg-content1 p-8 md:p-12 rounded-3xl text-center">
            {step === 'rating' ? (
              <div className="flex flex-col gap-8 animate-appearance-in">
                <div className="flex flex-col gap-2 items-center">
                  <div className="w-16 h-16 bg-warning-100 text-warning-600 rounded-full flex items-center justify-center mb-2">
                    <PartyPopper className="w-8 h-8" />
                  </div>
                  <h3 className="text-3xl font-bold text-foreground">{t('recipes.cooking.congratsTitle')}</h3>
                  <p className="text-default-500 text-lg">{t('recipes.cooking.congratsSubtitle')}</p>
                </div>
                
                <div className="flex flex-col items-center gap-4">
                  <div className="flex gap-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Button
                        key={star}
                        isIconOnly
                        variant="light"
                        className="w-14 h-14 rounded-full"
                        onPress={() => setRating(star)}
                      >
                        <Star 
                          className={`w-10 h-10 ${rating >= star ? 'fill-warning text-warning scale-110 transition-transform' : 'text-default-300'}`} 
                        />
                      </Button>
                    ))}
                  </div>
                  
                  <Textarea
                    placeholder={t('recipes.cooking.ratingNotesPlaceholder')}
                    value={notes}
                    onValueChange={setNotes}
                    minRows={3}
                    variant="bordered"
                    classNames={{
                      inputWrapper: "bg-content1 data-[focus=true]:!border-primary data-[focus=true]:!border-2"
                    }}
                    className="w-full mt-4 max-w-lg"
                  />
                </div>
                
                <div className="flex justify-center mt-2">
                  <Button 
                    size="lg" 
                    color="primary" 
                    className="px-12 font-bold"
                    onPress={() => setStep('confirm')}
                  >
                    Gửi đánh giá
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-8 animate-appearance-in py-4">
                <div className="flex flex-col gap-3 items-center">
                  <h3 className="text-2xl font-bold text-foreground">{t('recipes.cooking.editPromptTitle')}</h3>
                  <p className="text-default-500">{t('recipes.cooking.editPromptDesc')}</p>
                </div>
                
                <div className="flex justify-center gap-4 mt-4">
                  <Button 
                    size="lg" 
                    variant="flat" 
                    color="default"
                    startContent={<Check className="w-5 h-5"/>}
                    onPress={() => onComplete(rating, notes, 'done')}
                    className="font-semibold"
                  >
                    Không, hoàn tất
                  </Button>
                  <Button 
                    size="lg" 
                    color="primary" 
                    className="px-8 font-semibold"
                    startContent={<Edit3 className="w-5 h-5"/>}
                    onPress={() => onComplete(rating, notes, 'edit')}
                  >
                    Có, sửa công thức
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </ModalContent>
    </Modal>
  );
}
