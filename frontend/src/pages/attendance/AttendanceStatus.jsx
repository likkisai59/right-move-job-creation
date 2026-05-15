import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

const STATUS_CONFIG = {
  P:  { label: 'Present',  short: 'P', bg: 'bg-emerald-50',  text: 'text-emerald-700', border: 'border-emerald-200' },
  A:  { label: 'Absent',   short: 'A', bg: 'bg-red-50',      text: 'text-red-700',     border: 'border-red-200'     },
  L:  { label: 'Leave',    short: 'L', bg: 'bg-amber-50',    text: 'text-amber-700',   border: 'border-amber-200'   },
  H:  { label: 'Holiday',  short: 'H', bg: 'bg-blue-50',     text: 'text-blue-700',    border: 'border-blue-200'    },
  WO: { label: 'Weekend',  short: '—', bg: 'bg-gray-50',     text: 'text-gray-300',    border: 'border-gray-100'    },
  FT: { label: 'Future',   short: '',  bg: 'bg-white',       text: 'text-gray-200',    border: 'border-gray-100'    },
};

const AttendanceStatus = () => {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const employee = JSON.parse(localStorage.getItem('employee_data') || '{}');

  // Dummy data for personal history - in real app fetch from /api/attendance/history/{id}
  const attendanceData = {
    1: 'P', 2: 'P', 3: 'P', 4: 'WO', 5: 'WO', 6: 'P', 7: 'L', 8: 'P', 9: 'P', 10: 'P'
  };

  const totalDays = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const goToPrev = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const goToNext = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const days = [];
  // Padding for first week
  for (let i = 0; i < firstDay; i++) days.push(null);
  // Actual days
  for (let d = 1; d <= totalDays; d++) days.push(d);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Attendance History</h1>
        
        <div className="flex items-center bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <button onClick={goToPrev} className="p-2 hover:bg-slate-50 transition-colors border-r border-slate-100">
            <ChevronLeft size={18} />
          </button>
          <span className="px-6 py-2 text-sm font-bold text-slate-700 min-w-[150px] text-center">
            {MONTHS[month]} {year}
          </span>
          <button onClick={goToNext} className="p-2 hover:bg-slate-50 transition-colors border-l border-slate-100">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Calendar Header */}
        <div className="grid grid-cols-7 border-b border-slate-50 bg-slate-50/50">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7">
          {days.map((day, idx) => {
            if (!day) return <div key={`empty-${idx}`} className="h-24 md:h-32 border-r border-b border-slate-50 bg-slate-50/20" />;
            
            const isToday = now.getDate() === day && now.getMonth() === month && now.getFullYear() === year;
            const date = new Date(year, month, day);
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            const isFuture = date > now;
            
            let status = 'P'; // default
            if (isWeekend) status = 'WO';
            else if (isFuture) status = 'FT';
            else status = attendanceData[day] || 'P';

            const config = STATUS_CONFIG[status];

            return (
              <div 
                key={day} 
                className={`h-24 md:h-32 border-r border-b border-slate-50 p-3 flex flex-col justify-between transition-all hover:bg-slate-50/50 ${isToday ? 'bg-blue-50/30' : ''}`}
              >
                <span className={`text-sm font-black ${isToday ? 'text-blue-600' : isWeekend ? 'text-slate-300' : 'text-slate-500'}`}>
                  {day}
                </span>

                {!isFuture && (
                  <div className={`mt-auto px-2 py-1 rounded-lg border text-[10px] font-bold text-center ${config.bg} ${config.text} ${config.border}`}>
                    {config.label}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-6 pt-4">
        {Object.entries(STATUS_CONFIG).filter(([k]) => k !== 'FT').map(([key, cfg]) => (
          <div key={key} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${cfg.bg} border ${cfg.border}`} />
            <span className="text-xs font-bold text-slate-500">{cfg.label}</span>
          </div>
        ))}
      </div>

    </div>
  );
};

export default AttendanceStatus;
