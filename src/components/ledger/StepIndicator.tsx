'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { useDragScroll } from '../../hooks/useDragScroll';
import { cn } from '@/lib/utils';

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
    <div className="w-full bg-surface-subtle/50 border-b border-line p-3 sm:p-4 select-none">
      <div
        ref={ref}
        {...dragProps}
        className={cn(
          'flex items-center justify-between overflow-x-auto gap-2.5 no-scrollbar overscroll-x-contain touch-pan-x cursor-grab active:cursor-grabbing',
          isDragging && 'select-none'
        )}
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {STEPS.map((step, idx) => {
          const isCurrent = step.id === currentStep;
          const isCompleted = step.id < currentStep;

          return (
            <button
              key={step.id}
              type="button"
              disabled={step.id > currentStep}
              onClick={() => onStepClick && onStepClick(step.id)}
              className={cn(
                'group relative flex-1 min-w-[130px] p-3 rounded-xl border text-left transition-all shrink-0',
                isCurrent
                  ? 'bg-surface border-accent text-fg shadow-xs ring-1 ring-accent/20'
                  : isCompleted
                  ? 'bg-success-subtle/50 border-success-border text-fg hover:bg-success-subtle'
                  : 'bg-surface/30 border-line/50 text-fg-subtle cursor-not-allowed opacity-60'
              )}
            >
              <div className="flex items-center justify-between text-[10px] font-medium uppercase tracking-wider mb-1 pointer-events-none">
                <span className={cn(isCurrent ? 'text-accent font-semibold' : isCompleted ? 'text-success font-semibold' : 'text-fg-subtle')}>
                  {step.stepNum}
                </span>
                {isCompleted ? (
                  <span className="w-4 h-4 rounded-full bg-success text-accent-fg flex items-center justify-center shadow-xs">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </span>
                ) : isCurrent ? (
                  <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                ) : null}
              </div>
              <div className={cn('text-xs font-semibold truncate pointer-events-none', isCurrent ? 'text-fg' : isCompleted ? 'text-fg' : 'text-fg-subtle')}>
                {step.label}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

