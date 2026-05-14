import React from 'react';

const LEGEND_ITEMS = [
  { code: 'P', label: 'Present',  bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  { code: 'A', label: 'Absent',   bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200'     },
  { code: 'L', label: 'Leave',    bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200'   },
  { code: 'H', label: 'Holiday',  bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200'    },
  { code: '—', label: 'Weekend',  bg: 'bg-gray-50',    text: 'text-gray-400',    border: 'border-gray-200'    },
];

const AttendanceLegend = () => {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      {LEGEND_ITEMS.map(({ code, label, bg, text, border }) => (
        <div key={code} className="flex items-center gap-1.5">
          <span
            className={`inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold border ${bg} ${text} ${border}`}
          >
            {code}
          </span>
          <span className="text-xs text-gray-500">{label}</span>
        </div>
      ))}
    </div>
  );
};

export default AttendanceLegend;
