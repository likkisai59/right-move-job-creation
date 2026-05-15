import React from 'react';
import { Clock, Sun, Moon, CalendarDays } from 'lucide-react';

const ShiftManagement = () => {
  // Demo data - in real app, this comes from API
  const shift = {
    name: 'Morning Shift',
    startTime: '09:00 AM',
    endTime: '06:00 PM',
    weeklyOff: 'Sunday',
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Shift Management</h1>
          <p className="text-slate-500 text-sm mt-1">View your assigned schedule and weekly offs.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Current Shift Card */}
        <div className="md:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                <Sun size={20} />
              </div>
              <span className="font-bold text-slate-800">Current Assigned Shift</span>
            </div>
            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-full border border-emerald-100">
              Active
            </span>
          </div>

          <div className="p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-3xl font-black text-slate-800">{shift.name}</h3>
                <p className="text-slate-400 font-medium text-sm mt-1">Full-time Regular Schedule</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Off Day</p>
                <p className="text-lg font-bold text-slate-700">{shift.weeklyOff}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-2 text-slate-400 mb-2">
                  <Clock size={16} />
                  <span className="text-xs font-bold uppercase tracking-wider">Starts At</span>
                </div>
                <p className="text-2xl font-black text-slate-800">{shift.startTime}</p>
              </div>
              
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-2 text-slate-400 mb-2">
                  <Clock size={16} />
                  <span className="text-xs font-bold uppercase tracking-wider">Ends At</span>
                </div>
                <p className="text-2xl font-black text-slate-800">{shift.endTime}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Off Info */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
            <CalendarDays size={32} />
          </div>
          <h3 className="font-bold text-slate-800 mb-2">Weekly Off</h3>
          <p className="text-slate-500 text-sm mb-6">
            You have a fixed weekly off every <span className="font-bold text-slate-800">{shift.weeklyOff}</span>.
          </p>
          <div className="w-full space-y-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
              <div 
                key={day}
                className={`flex items-center justify-between px-4 py-2 rounded-lg text-xs font-bold ${
                  day === shift.weeklyOff.slice(0, 3) 
                    ? 'bg-red-50 text-red-600 border border-red-100' 
                    : 'bg-slate-50 text-slate-400'
                }`}
              >
                <span>{day}</span>
                <span>{day === shift.weeklyOff.slice(0, 3) ? 'OFF' : 'WORKING'}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ShiftManagement;
