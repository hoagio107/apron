import React from 'react';
import { Button } from '@/ui';
import { Save } from 'lucide-react';

interface BottomActionStepperProps {
  canGoBack: boolean;
  onBack: () => void;
  isLastStep: boolean;
  onNext: () => void;
  onSubmit?: () => void;
  submitText?: string;
  isSaving?: boolean;
  extraAction?: React.ReactNode;
}

export function BottomActionStepper({
  canGoBack,
  onBack,
  isLastStep,
  onNext,
  onSubmit,
  submitText = "Lưu",
  isSaving = false,
  extraAction
}: BottomActionStepperProps) {
  return (
    <div className="fixed bottom-0 left-0 lg:left-64 right-0 p-4 bg-background/85 backdrop-blur-md border-t border-divider flex justify-between gap-3 z-50">
      {extraAction}
      <Button 
        size="lg"
        variant="flat" 
        onPress={onBack}
        isDisabled={!canGoBack}
        className="flex-1 font-semibold"
      >
        Quay lại
      </Button>

      {!isLastStep ? (
        <Button 
          size="lg"
          color="primary"
          onPress={onNext}
          className="flex-1 font-semibold"
        >
          Tiếp tục
        </Button>
      ) : (
        <Button 
          size="lg"
          type="submit"
          color="primary"
          onPress={onSubmit}
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
