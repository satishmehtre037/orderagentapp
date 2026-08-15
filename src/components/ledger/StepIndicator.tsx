import React from 'react';
import { Check } from 'lucide-react';

interface StepIndicatorProps {
  currentStep: number;
  onStepClick?: (step: number) => void;
}

const STEPS = [
  { id: 1, label: 'Business Basics', stub: 'STUB #01' },
  { id: 2, label: 'Services & Menu', stub: 'STUB #02' },
  { id: 3, label: 'WhatsApp Number', stub: 'STUB #03' },
  { id: 4, label: 'Review Ledger', stub: 'STUB #04' },
];

export const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, onStepClick }) => {
  return (
    <div className="w-full bg-warm-card border-b border-warm-border p-3 sm:p-4 rounded-t-lg shadow-ledger">
      <div className="flex items-center justify-between overflow-x-auto gap-2 scrollbar-none pb-1">
        {STEPS.map((step) => {
          const isCurrent = step.id === currentStep;
          const isCompleted = step.id < currentStep;

          return (
            <button
              key={step.id}
              type="button"
              disabled={step.id > currentStep}
              onClick={() => onStepClick && onStepClick(step.id)}
              className={`flex-1 min-w-[130px] p-2.5 rounded-md border text-left transition-all duration-150 ${
                isCurrent
                  ? 'bg-paper border-teal text-teal shadow-sm ring-1 ring-teal/20 font-medium'
                  : isCompleted
                  ? 'bg-sage-light border-sage/40 text-ink cursor-pointer hover:bg-sage/10'
                  : 'bg-warm-stub border-warm-border text-ink-muted cursor-not-allowed opacity-70'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] font-mono tracking-widest text-ink-light uppercase mb-0.5">
                <span>{step.stub}</span>
                {isCompleted && (
                  <span className="w-4 h-4 rounded-full bg-sage text-white flex items-center justify-center">
                    <Check className="w-2.5 h-2.5" />
                  </span>
                )}
              </div>
              <div className="text-xs sm:text-sm font-semibold truncate font-serif">
                {step.label}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
