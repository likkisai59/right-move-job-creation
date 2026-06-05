import React, { useState, useEffect } from 'react';
import { CalendarCheck, Info, CheckCircle2, Save, AlertCircle } from 'lucide-react';
import { markAttendance, getAttendanceHistory } from '../../api/attendanceApi';

const AttendanceMarking = () => {
  const formatDate = (date) => {
    if (!date) return '';
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  };

  const employee = JSON.parse(localStorage.getItem('employee_data') || '{}');
  const [weekData, setWeekData] = useState({}); // { '2024-05-10': 'P', ... }
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // ── Status Options ──
  const STATUSES = [
    { id: 'P',   label: 'P',   full: 'Present' },
    { id: 'H',   label: 'H',   full: 'Holiday' },
    { id: 'L',   label: 'L',   full: 'Leave' }
  ];

  // ── Generate Current Week (Sun to Sat) ──
  const getWeekDays = () => {
    const today = new Date();
    const day = today.getDay(); // 0 (Sun) to 6 (Sat)
    
    // Get Sunday of the current week
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - day);
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const nextDay = new Date(sunday);
      nextDay.setDate(sunday.getDate() + i);
      days.push(nextDay);
    }
    return days;
  };

  const weekDays = getWeekDays();
  const todayDay = new Date().getDay();
  const isEndOfWeek = todayDay === 5 || todayDay === 6; // Allow submission on Friday (5) and Saturday (6)

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const history = await getAttendanceHistory(employee.id);
        const dataMap = {};
        history.forEach(rec => {
          dataMap[rec.attendance_date] = {
            first_half: rec.first_half_status || '',
            second_half: rec.second_half_status || ''
          };
        });
        setWeekData(dataMap);

        // Check if all weekDays are already present in the history dataMap
        const alreadySubmitted = weekDays.every(day => {
          const dateStr = day.toISOString().split('T')[0];
          return dataMap[dateStr] && dataMap[dateStr].first_half && dataMap[dateStr].second_half;
        });
        setIsSubmitted(alreadySubmitted);
      } catch (err) {
        console.error("Error fetching attendance history:", err);
      } finally {
        setInitialLoading(false);
      }
    };
    fetchHistory();
  }, [employee.id]);

  const handleStatusChange = (dateStr, half, status) => {
    if (isSubmitted) return;
    setWeekData(prev => {
      const current = prev[dateStr] || { first_half: '', second_half: '' };
      return {
        ...prev,
        [dateStr]: {
          ...current,
          [half]: status
        }
      };
    });
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // In this weekly model, we send each entry to the backend
      // Realistically, backend could have a bulk_create, 
      // but here we loop through current week's changes
      for (const day of weekDays) {
        const dateStr = day.toISOString().split('T')[0];
        const dayData = weekData[dateStr];
        if (dayData && dayData.first_half && dayData.second_half) {
          await markAttendance(employee.id, {
            attendance_date: dateStr,
            first_half_status: dayData.first_half,
            second_half_status: dayData.second_half,
            work_mode: 'Office' // Default
          });
        }
      }
      setSuccess(true);
      setIsSubmitted(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        
        {/* Header */}
        <div className="p-8 border-b border-gray-50 flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <CalendarCheck size={24} />
              </div>
              <h1 className="text-xl font-bold text-gray-800">Weekly Attendance Marking</h1>
            </div>
            <p className="text-gray-500 text-sm">
              Current Week: <span className="font-bold text-gray-700">
                {formatDate(weekDays[0])} — {formatDate(weekDays[6])}
              </span>
            </p>
          </div>

          <div className="flex flex-col items-end gap-3">
            {!isEndOfWeek && (
              <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-xl text-xs font-bold border border-amber-100">
                <Info size={14} />
                Submission available on {formatDate(weekDays[5])} or {formatDate(weekDays[6])}
              </div>
            )}
            
            {/* Status Legend */}
            <div className="flex flex-wrap gap-2 text-[10px] text-gray-500 justify-end">
              <span className="px-2 py-1 bg-gray-50 border border-gray-100 rounded-lg"><strong className="text-gray-700">P</strong> - Present</span>
              <span className="px-2 py-1 bg-gray-50 border border-gray-100 rounded-lg"><strong className="text-gray-700">H</strong> - Holiday</span>
              <span className="px-2 py-1 bg-gray-50 border border-gray-100 rounded-lg"><strong className="text-gray-700">L</strong> - Leave</span>
            </div>
          </div>
        </div>

        {/* Weekly Grid */}
        {isSubmitted && (
          <div className="mx-8 mt-6 p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-3 animate-slide-up">
            <CheckCircle2 className="text-emerald-600 animate-bounce" size={20} />
            <div>
              <p className="text-sm font-bold text-emerald-900">Submitted successfully</p>
              <p className="text-xs text-emerald-700 mt-0.5">
                Your attendance for this week has been recorded and locked.
              </p>
            </div>
          </div>
        )}

        <div className="p-0 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Date & Day</th>
                <th className="px-8 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">First Half</th>
                <th className="px-8 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">Second Half</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {weekDays.map((date) => {
                const dateStr = date.toISOString().split('T')[0];
                const isToday = new Date().toISOString().split('T')[0] === dateStr;
                const dayData = weekData[dateStr] || { first_half: '', second_half: '' };
                
                return (
                  <tr key={dateStr} className={`hover:bg-gray-50/50 transition-colors ${isToday ? 'bg-blue-50/20' : ''}`}>
                    <td className="px-8 py-5">
                      <p className={`font-bold ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
                        {formatDate(date)}
                      </p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">
                        {date.toLocaleDateString('en-US', { weekday: 'long' })}
                      </p>
                    </td>
                    
                    {/* First Half */}
                    <td className="px-8 py-5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {STATUSES.map(s => {
                          const isSelected = dayData.first_half === s.id;
                          return (
                            <label 
                              key={s.id} 
                              className={`relative inline-flex items-center justify-center group ${isSubmitted ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                              <input 
                                type="radio" 
                                name={`first-half-${dateStr}`}
                                checked={isSelected}
                                onChange={() => !isSubmitted && handleStatusChange(dateStr, 'first_half', s.id)}
                                className="peer sr-only"
                                disabled={isSubmitted}
                              />
                              <div className={`
                                w-9 h-9 rounded-xl border-2 flex items-center justify-center font-bold text-xs transition-all
                                ${isSelected 
                                  ? 'bg-blue-600 border-blue-600 text-white shadow-md' 
                                  : 'border-gray-100 text-gray-400 bg-white hover:border-gray-200 hover:text-gray-600'}
                                ${isSubmitted ? 'opacity-50' : ''}
                              `}>
                                {s.label}
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </td>
                    
                    {/* Second Half */}
                    <td className="px-8 py-5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {STATUSES.map(s => {
                          const isSelected = dayData.second_half === s.id;
                          return (
                            <label 
                              key={s.id} 
                              className={`relative inline-flex items-center justify-center group ${isSubmitted ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                              <input 
                                type="radio" 
                                name={`second-half-${dateStr}`}
                                checked={isSelected}
                                onChange={() => !isSubmitted && handleStatusChange(dateStr, 'second_half', s.id)}
                                className="peer sr-only"
                                disabled={isSubmitted}
                              />
                              <div className={`
                                w-9 h-9 rounded-xl border-2 flex items-center justify-center font-bold text-xs transition-all
                                ${isSelected 
                                  ? 'bg-blue-600 border-blue-600 text-white shadow-md' 
                                  : 'border-gray-100 text-gray-400 bg-white hover:border-gray-200 hover:text-gray-600'}
                                ${isSubmitted ? 'opacity-50' : ''}
                              `}>
                                {s.label}
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer / Submit */}
        <div className="p-8 bg-gray-50/50 border-t border-gray-50 flex justify-end gap-6">
          <button
            onClick={handleSubmit}
            disabled={loading || !isEndOfWeek || isSubmitted}
            className={`
              px-8 py-4 rounded-xl font-black uppercase tracking-widest text-xs transition-all flex items-center gap-3
              ${isEndOfWeek && !isSubmitted
                ? 'bg-gray-900 text-white shadow-xl hover:bg-black active:scale-95' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
            `}
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : isSubmitted ? (
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
      {!isEndOfWeek && !isSubmitted && (
        <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-start gap-3">
          <AlertCircle className="text-blue-600 mt-0.5" size={18} />
          <div>
            <p className="text-sm font-bold text-blue-900">Weekly Lock Active</p>
            <p className="text-xs text-blue-700 mt-0.5">
              You can mark your attendance daily, but the final submission for this week will open on **{formatDate(weekDays[5])}** or **{formatDate(weekDays[6])}**.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceMarking;
