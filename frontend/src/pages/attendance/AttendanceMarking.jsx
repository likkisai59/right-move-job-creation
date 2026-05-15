import React, { useState, useEffect } from 'react';
import { CalendarCheck, Info, CheckCircle2, Save, AlertCircle } from 'lucide-react';
import { markAttendance, getAttendanceHistory } from '../../api/attendanceApi';

const AttendanceMarking = () => {
  const employee = JSON.parse(localStorage.getItem('employee_data') || '{}');
  const [weekData, setWeekData] = useState({}); // { '2024-05-10': 'P', ... }
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // ── Status Options ──
  const STATUSES = [
    { id: 'P',   label: 'P',   full: 'Present' },
    { id: 'LOA', label: 'LOA', full: 'Leave Of Absence' },
    { id: 'H',   label: 'H',   full: 'Holiday' },
    { id: 'L',   label: 'L',   full: 'Leave' }
  ];

  // ── Generate Current Week (Mon to Sun) ──
  const getWeekDays = () => {
    const today = new Date();
    const day = today.getDay(); // 0 (Sun) to 6 (Sat)
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
    const monday = new Date(today.setDate(diff));
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const nextDay = new Date(monday);
      nextDay.setDate(monday.getDate() + i);
      days.push(nextDay);
    }
    return days;
  };

  const weekDays = getWeekDays();
  const lastDayOfWeek = weekDays[6];
  const isEndOfWeek = new Date() >= lastDayOfWeek;

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const history = await getAttendanceHistory(employee.id);
        const dataMap = {};
        history.forEach(rec => {
          dataMap[rec.attendance_date] = rec.status;
        });
        setWeekData(dataMap);
      } catch (err) {
        console.error("Error fetching attendance history:", err);
      } finally {
        setInitialLoading(false);
      }
    };
    fetchHistory();
  }, [employee.id]);

  const handleStatusChange = (dateStr, status) => {
    setWeekData(prev => ({
      ...prev,
      [dateStr]: status
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // In this weekly model, we send each entry to the backend
      // Realistically, backend could have a bulk_create, 
      // but here we loop through current week's changes
      for (const day of weekDays) {
        const dateStr = day.toISOString().split('T')[0];
        if (weekData[dateStr]) {
          await markAttendance(employee.id, {
            attendance_date: dateStr,
            status: weekData[dateStr],
            work_mode: 'Office' // Default
          });
        }
      }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      alert("Failed to submit weekly attendance");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        
        {/* Header */}
        <div className="p-8 border-b border-slate-50 flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <CalendarCheck size={24} />
              </div>
              <h1 className="text-xl font-bold text-slate-800">Weekly Attendance Marking</h1>
            </div>
            <p className="text-slate-500 text-sm">
              Current Week: <span className="font-bold text-slate-700">
                {weekDays[0].toLocaleDateString()} — {weekDays[6].toLocaleDateString()}
              </span>
            </p>
          </div>

          {!isEndOfWeek && (
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-xl text-xs font-bold border border-amber-100">
              <Info size={14} />
              Submission available on {weekDays[6].toLocaleDateString()}
            </div>
          )}
        </div>

        {/* Weekly Grid */}
        <div className="p-0 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Date & Day</th>
                {STATUSES.map(s => (
                  <th key={s.id} className="px-4 py-4 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                    {s.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {weekDays.map((date) => {
                const dateStr = date.toISOString().split('T')[0];
                const isToday = new Date().toISOString().split('T')[0] === dateStr;
                
                return (
                  <tr key={dateStr} className={`hover:bg-slate-50/50 transition-colors ${isToday ? 'bg-blue-50/20' : ''}`}>
                    <td className="px-8 py-5">
                      <p className={`font-bold ${isToday ? 'text-blue-600' : 'text-slate-700'}`}>
                        {date.toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">
                        {date.toLocaleDateString('en-US', { weekday: 'long' })}
                      </p>
                    </td>
                    {STATUSES.map(s => (
                      <td key={s.id} className="px-4 py-5 text-center">
                        <label className="relative inline-flex items-center justify-center cursor-pointer group">
                          <input 
                            type="radio" 
                            name={`status-${dateStr}`}
                            checked={weekData[dateStr] === s.id}
                            onChange={() => handleStatusChange(dateStr, s.id)}
                            className="peer sr-only"
                          />
                          <div className={`
                            w-10 h-10 rounded-xl border-2 flex items-center justify-center font-bold text-xs transition-all
                            ${weekData[dateStr] === s.id 
                              ? 'bg-blue-600 border-blue-600 text-white shadow-md' 
                              : 'border-slate-100 text-slate-300 hover:border-slate-200 group-hover:text-slate-400'}
                          `}>
                            {s.label}
                          </div>
                        </label>
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer / Submit */}
        <div className="p-8 bg-slate-50/50 border-t border-slate-50 flex items-center justify-between flex-wrap gap-6">
          
          {/* Legend */}
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {STATUSES.map(s => (
              <div key={s.id} className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-400">
                  {s.label}
                </span>
                <span className="text-xs font-bold text-slate-500">{s.full}</span>
              </div>
            ))}
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || !isEndOfWeek}
            className={`
              px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center gap-3
              ${isEndOfWeek 
                ? 'bg-slate-900 text-white shadow-xl hover:bg-black active:scale-95' 
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'}
            `}
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : success ? (
              <>
                <CheckCircle2 size={16} />
                Submitted
              </>
            ) : (
              <>
                <Save size={16} />
                Submit Weekly Attendance
              </>
            )}
          </button>
        </div>
      </div>

      {/* Warning if not Sunday */}
      {!isEndOfWeek && (
        <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex items-start gap-3">
          <AlertCircle className="text-blue-600 mt-0.5" size={18} />
          <div>
            <p className="text-sm font-bold text-blue-900">Weekly Lock Active</p>
            <p className="text-xs text-blue-700 mt-0.5">
              You can mark your attendance daily, but the final submission for this week will open on **{weekDays[6].toLocaleDateString('en-US', { dateStyle: 'long' })}**.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceMarking;
