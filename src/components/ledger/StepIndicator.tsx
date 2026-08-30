'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { useDragScroll } from '../../hooks/useDragScroll';

interface StepIndicatorProps {
  currentStep: number;
  onStepClick?: (step: number) => void;
}

const STEPS = [
  { id: 1, label: 'Store Profile', stepNum: 'Step 1' },
  { id: 2, label: 'Menu & Services', stepNum: 'Step 2' },
  { id: 3, label: 'WhatsApp Binding', stepNum: 'Step 3' },
  { id: 4, label: 'Review & Go Live', stepNum: 'Step 4' },
];

export const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, onStepClick }) => {
  const { ref, isDragging, dragProps } = useDragScroll<HTMLDivElement>();

  return (
    <div className="w-full bg-surface-subtle border-b border-line p-2.5 sm:p-4 rounded-t-xl select-none">
      <div
        ref={ref}
        {...dragProps}
        className={`flex items-center justify-between overflow-x-auto gap-2 no-scrollbar overscroll-x-contain touch-pan-x cursor-grab active:cursor-grabbing ${
          isDragging ? 'select-none' : ''
        }`}
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {STEPS.map((step) => {
          const isCurrent = step.id === currentStep;
          const isCompleted = step.id < currentStep;

          return (
            <button
              key={step.id}
              type="button"
              disabled={step.id > currentStep}
              onClick={() => onStepClick && onStepClick(step.id)}
              className={`flex-1 min-w-[130px] p-2.5 rounded-lg border text-left transition-all shrink-0 ${
                isCurrent
                  ? 'bg-surface border-accent text-fg shadow-xs ring-1 ring-accent/20'
                  : isCompleted
                  ? 'bg-success-subtle border-success-border text-success hover:bg-success-subtle/80'
                  : 'bg-surface-subtle/40 border-line/60 text-fg-subtle cursor-not-allowed'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] font-medium text-fg-muted uppercase tracking-wider mb-0.5 pointer-events-none">
                <span>{step.stepNum}</span>
                {isCompleted && (
                  <span className="w-3.5 h-3.5 rounded-full bg-success text-accent-fg flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </span>
                )}
              </div>
              <div className="text-xs font-semibold truncate text-fg pointer-events-none">
                {step.label}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
