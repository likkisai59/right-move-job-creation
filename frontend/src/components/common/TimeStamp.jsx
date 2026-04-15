import React from 'react';
import { Clock, RotateCcw } from 'lucide-react';
import { formatFullDateTime, formatRelativeTime } from '../../utils/formatters';

/**
 * Reusable TimeStamp component to display creation and update times.
 * Supports tooltips and relative time formatting with a premium feel.
 */
const TimeStamp = ({ created, updated, className = "" }) => {
  if (!created && !updated) return null;

  return (
    <div className={`flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500 mt-2 ${className}`}>
      {created && (
        <div 
          className="flex items-center gap-1.5 group cursor-help" 
          title={formatFullDateTime(created)}
        >
          <Clock size={12} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
          <span className="font-medium whitespace-nowrap">
            Created: <span className="text-slate-600 font-semibold">{formatRelativeTime(created)}</span>
          </span>
        </div>
      )}
      
      {updated && updated !== created && (
        <div 
          className="flex items-center gap-1.5 group cursor-help border-l border-slate-200 pl-4" 
          title={formatFullDateTime(updated)}
        >
          <RotateCcw size={12} className="text-slate-400 group-hover:text-emerald-500 transition-colors" />
          <span className="font-medium whitespace-nowrap">
            Updated: <span className="text-slate-600 font-semibold">{formatRelativeTime(updated)}</span>
          </span>
        </div>
      )}
    </div>
  );
};

export default TimeStamp;
