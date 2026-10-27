import React, { useState, useEffect } from 'react';
import { Button } from '@/ui';
import { Save } from 'lucide-react';
import { TAP_COOLDOWN_DELAY_MS } from '../../constants';

interface BottomActionStepperProps {
  canGoBack: boolean;
  onBack: () => void;
  isLastStep: boolean;
  onNext: () => void;
  onSubmit?: () => void;
  submitText?: string;
  isSaving?: boolean;
  extraAction?: React.ReactNode;
  className?: string;
}

export function BottomActionStepper({
  canGoBack,
  onBack,
  isLastStep,
  onNext,
  onSubmit,
  submitText = "Lưu",
  isSaving = false,
  extraAction,
  className = ""
}: BottomActionStepperProps) {
  // Chống click-bleed / tap-through khi nút "Tiếp tục" chuyển thành nút "Lưu"
  const [isSubmitReady, setIsSubmitReady] = useState(false);

  useEffect(() => {
    if (isLastStep) {
      const timer = setTimeout(() => {
        setIsSubmitReady(true);
      }, TAP_COOLDOWN_DELAY_MS);
      return () => clearTimeout(timer);
    } else {
      setIsSubmitReady(false);
    }
  }, [isLastStep]);

  const handleSubmitPress = (e?: any) => {
    if (!isSubmitReady) {
      return;
    }
    if (onSubmit) {
      onSubmit();
    } else {
      const form = (e?.target as HTMLElement)?.closest('form');
      form?.requestSubmit();
    }
  };

  return (
    <div className={`fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-md border-t border-divider flex justify-between gap-3 z-50 ${className}`}>
      {extraAction}
      <Button 
        key="stepper-btn-back"
        size="lg"
        variant="flat" 
        type="button"
        onPress={onBack}
        isDisabled={!canGoBack}
        className="flex-1 font-semibold"
      >
        Quay lại
      </Button>

      {!isLastStep ? (
        <Button 
          key="stepper-btn-next"
          size="lg"
          type="button"
          color="primary"
          onPress={onNext}
          className="flex-1 font-semibold"
        >
          Tiếp tục
        </Button>
      ) : (
        <Button 
          key="stepper-btn-submit"
          size="lg"
          type="button"
          color="primary"
          onPress={handleSubmitPress}
          isLoading={isSaving}
          startContent={!isSaving && <Save className="w-5 h-5" />}
          className="flex-1 font-semibold"
        >
          {submitText}
        </Button>
      )}
    </div>
  );
}
