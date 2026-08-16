import React from 'react';

export const LedgerRowSkeleton: React.FC = () => {
  return (
    <div className="p-4 bg-white border-b border-slate-100 animate-pulse space-y-3">
      <div className="flex items-center justify-between">
        <div className="h-4 bg-slate-100 rounded-md w-1/4" />
        <div className="h-5 bg-slate-100 rounded-full w-20" />
      </div>
      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-6 h-4 bg-slate-100 rounded w-3/4" />
        <div className="col-span-3 h-4 bg-slate-100 rounded w-1/2" />
        <div className="col-span-3 h-4 bg-slate-100 rounded w-1/3" />
      </div>
    </div>
  );
};

export const ConversationThreadSkeleton: React.FC = () => {
  return (
    <div className="p-3 bg-white border-b border-slate-100 animate-pulse flex items-center space-x-3">
      <div className="w-9 h-9 rounded-full bg-slate-100 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="flex justify-between">
          <div className="h-3.5 bg-slate-100 rounded w-1/3" />
          <div className="h-3 bg-slate-100 rounded w-1/6" />
        </div>
        <div className="h-3 bg-slate-100 rounded w-2/3" />
      </div>
    </div>
  );
};

export const FormSkeleton: React.FC = () => {
  return (
    <div className="p-6 bg-white border border-slate-200 rounded-xl animate-pulse space-y-6">
      <div className="h-6 bg-slate-100 rounded w-1/3" />
      <div className="space-y-3">
        <div className="h-4 bg-slate-100 rounded w-1/4" />
        <div className="h-10 bg-slate-100 rounded-lg w-full" />
      </div>
      <div className="space-y-3">
        <div className="h-4 bg-slate-100 rounded w-1/4" />
        <div className="h-10 bg-slate-100 rounded-lg w-full" />
      </div>
    </div>
  );
};
