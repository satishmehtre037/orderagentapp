import React from 'react';
import { Check } from 'lucide-react';

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
  return (
    <div className="w-full bg-slate-50/80 border-b border-slate-200/80 p-2.5 sm:p-4 rounded-t-xl">
      <div className="flex items-center justify-between overflow-x-auto gap-2 no-scrollbar">
        {STEPS.map((step) => {
          const isCurrent = step.id === currentStep;
          const isCompleted = step.id < currentStep;

          return (
            <button
              key={step.id}
              type="button"
              disabled={step.id > currentStep}
              onClick={() => onStepClick && onStepClick(step.id)}
              className={`flex-1 min-w-[130px] p-2.5 rounded-lg border text-left transition-all ${
                isCurrent
                  ? 'bg-white border-slate-900 text-slate-900 shadow-sm ring-1 ring-slate-900/10'
                  : isCompleted
                  ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900 hover:bg-emerald-50'
                  : 'bg-slate-100/60 border-slate-200/60 text-slate-400 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-0.5">
                <span>{step.stepNum}</span>
                {isCompleted && (
                  <span className="w-3.5 h-3.5 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                    <Check className="w-2.5 h-2.5" />
                  </span>
                )}
              </div>
              <div className="text-xs font-semibold truncate">
                {step.label}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
