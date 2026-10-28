import { Check } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface Step {
  key: string;
  label: string;
}

interface FormStepperProps {
  steps: Step[];
  currentStep: string;
  onStepChange: (key: string) => void;
  className?: string;
}

export function FormStepper({ steps, currentStep, onStepChange, className }: FormStepperProps) {
  const currentIndex = steps.findIndex(s => s.key === currentStep);

  return (
    <div className={twMerge("flex w-full max-w-[280px] sm:max-w-sm mx-auto items-center justify-between pb-8 pt-2", className)}>
      {steps.map((step, index) => {
        const isActive = index === currentIndex;
        const isCompleted = index < currentIndex;
        const isLast = index === steps.length - 1;

        return (
          <div key={step.key} className={clsx("flex items-center", isLast ? "flex-none" : "flex-1")}>
            <div className="flex flex-col items-center relative group">
              <button
                type="button"
                onClick={() => onStepChange(step.key)}
                className={clsx(
                  "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 z-10 outline-none",
                  {
                    "bg-primary text-white": isCompleted,
                    "bg-background border-2 border-primary text-primary": isActive,
                    "bg-default-200 text-white": !isActive && !isCompleted
                  }
                )}
              >
                {isCompleted ? <Check className="w-4 h-4" strokeWidth={4} /> : (index + 1)}
              </button>
              {isActive && (
                <span className="absolute top-10 left-1/2 -translate-x-1/2 whitespace-nowrap text-sm text-foreground font-semibold transition-colors duration-300">
                  {step.label}
                </span>
              )}
            </div>
            {!isLast && (
              <div className="flex-1 h-[2px] mx-1 bg-default-200 relative overflow-hidden rounded-full">
                <div className={clsx(
                  "absolute inset-y-0 left-0 bg-primary transition-all duration-300",
                  isCompleted ? "w-full" : "w-0"
                )} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
