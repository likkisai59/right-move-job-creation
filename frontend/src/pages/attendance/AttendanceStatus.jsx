import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { getAttendanceHistory, getLeaveConfig } from '../../api/attendanceApi';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

const STATUS_CONFIG = {
  P:  { label: 'Present',  short: 'P', bg: 'bg-emerald-50',  text: 'text-emerald-700', border: 'border-emerald-200' },
  A:  { label: 'Absent',   short: 'A', bg: 'bg-red-50',      text: 'text-red-700',     border: 'border-red-200'     },
  L:  { label: 'Leave',    short: 'L', bg: 'bg-amber-50',    text: 'text-amber-700',   border: 'border-amber-200'   },
  H:  { label: 'Holiday',  short: 'H', bg: 'bg-rose-50',     text: 'text-rose-700',    border: 'border-rose-200'    },
  WO: { label: 'Weekend',  short: '—', bg: 'bg-gray-50',     text: 'text-gray-300',    border: 'border-gray-100'    },
  FT: { label: 'Future',   short: '',  bg: 'bg-white',       text: 'text-gray-200',    border: 'border-gray-100'    },
};

const AttendanceStatus = () => {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [holidaysList, setHolidaysList] = useState([]);
  const [loading, setLoading] = useState(true);

  const employee = JSON.parse(localStorage.getItem('employee_data') || '{}');

  useEffect(() => {
    const fetchHistory = async () => {
      if (!employee.id) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const [historyData, configData] = await Promise.all([
          getAttendanceHistory(employee.id),
          getLeaveConfig(employee.id).catch(err => {
            console.error("Failed to load leave config/holidays", err);
            return { holidays: [] };
          })
        ]);
        setAttendanceRecords(historyData || []);
        setHolidaysList(configData?.holidays || []);
      } catch (err) {
        console.error("Error fetching attendance data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [employee.id]);

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

  // Map to speed up lookup by date key (YYYY-MM-DD)
  const recordsMap = {};
  attendanceRecords.forEach(rec => {
    if (rec.attendance_date) {
      recordsMap[rec.attendance_date] = rec;
    }
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Attendance History</h1>
        
        <div className="flex items-center bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <button onClick={goToPrev} className="p-2 hover:bg-gray-50 transition-colors border-r border-gray-100">
            <ChevronLeft size={18} />
          </button>
          <span className="px-6 py-2 text-sm font-bold text-gray-700 min-w-[150px] text-center">
            {MONTHS[month]} {year}
          </span>
          <button onClick={goToNext} className="p-2 hover:bg-gray-50 transition-colors border-l border-gray-100">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Calendar Header */}
        <div className="grid grid-cols-7 border-b border-gray-50 bg-gray-50/50">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="py-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7">
          {days.map((day, idx) => {
            if (!day) return <div key={`empty-${idx}`} className="h-24 md:h-32 border-r border-b border-gray-50 bg-gray-50/20" />;
            
            const isToday = now.getDate() === day && now.getMonth() === month && now.getFullYear() === year;
            const date = new Date(year, month, day);
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            const isFuture = date > now;
            
            const dayStr = String(day).padStart(2, '0');
            const monthStr = String(month + 1).padStart(2, '0');
            const dateKey = `${year}-${monthStr}-${dayStr}`;
            const record = recordsMap[dateKey];
            const holidayObj = holidaysList.find(h => h.date === dateKey);

            let fhStatus = '';
            let shStatus = '';
            let hasRecord = false;
            let status = 'P';

            if (holidayObj) {
              if (record) {
                hasRecord = true;
                fhStatus = record.first_half_status;
                shStatus = record.second_half_status;
              } else {
                status = 'H';
              }
            } else if (isFuture) {
              status = 'FT';
            } else if (record) {
              hasRecord = true;
              fhStatus = record.first_half_status;
              shStatus = record.second_half_status;
            } else if (isWeekend) {
              status = 'WO';
            } else {
              status = 'A';
            }

            const hasDifferentStatuses = hasRecord && fhStatus !== shStatus;
            const config = STATUS_CONFIG[status];
            const fhConfig = STATUS_CONFIG[fhStatus] || STATUS_CONFIG['P'];
            const shConfig = STATUS_CONFIG[shStatus] || STATUS_CONFIG['P'];
            const displayConfig = hasRecord ? fhConfig : config;

            return (
              <div 
                key={day} 
                className={`h-24 md:h-32 border-r border-b border-gray-50 p-3 flex flex-col justify-between transition-all hover:bg-gray-50/50 ${isToday ? 'bg-blue-50/30' : ''} ${holidayObj ? 'bg-rose-50/20' : ''}`}
              >
                <span className={`text-sm font-black ${isToday ? 'text-blue-600' : isWeekend ? 'text-gray-300' : 'text-gray-500'}`}>
                  {day}
                </span>

                <div className="space-y-1 mt-auto w-full">
                  {/* Always show Holiday Name if it is a holiday */}
                  {holidayObj && (
                    <div 
                      className={`px-2 py-0.5 rounded border text-[9px] font-black text-center truncate ${STATUS_CONFIG.H.bg} ${STATUS_CONFIG.H.text} ${STATUS_CONFIG.H.border}`}
                      title={holidayObj.name}
                    >
                      {holidayObj.name}
                    </div>
                  )}

                  {/* Show Attendance Status if record exists */}
                  {hasRecord ? (
                    hasDifferentStatuses ? (
                      <div className="grid grid-cols-1 gap-1">
                        <div className={`px-1.5 py-0.5 rounded border text-[9px] font-bold text-center leading-tight ${fhConfig.bg} ${fhConfig.text} ${fhConfig.border}`}>
                          FH: {fhConfig.label}
                        </div>
                        <div className={`px-1.5 py-0.5 rounded border text-[9px] font-bold text-center leading-tight ${shConfig.bg} ${shConfig.text} ${shConfig.border}`}>
                          SH: {shConfig.label}
                        </div>
                      </div>
                    ) : (
                      <div className={`px-2 py-0.5 rounded border text-[9px] font-bold text-center ${displayConfig.bg} ${displayConfig.text} ${displayConfig.border}`}>
                        {displayConfig.label}
                      </div>
                    )
                  ) : (
                    /* Show Weekend/Absent if not a holiday and not future */
                    !holidayObj && !isFuture && (
                      <div className={`px-2 py-1 rounded-lg border text-[10px] font-bold text-center ${displayConfig.bg} ${displayConfig.text} ${displayConfig.border}`}>
                        {displayConfig.label}
                      </div>
                    )
                  )}
                </div>
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
            <span className="text-xs font-bold text-gray-500">{cfg.label}</span>
          </div>
        ))}
      </div>

    </div>
  );
};

export default AttendanceStatus;
