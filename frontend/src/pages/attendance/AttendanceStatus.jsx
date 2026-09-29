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

import { getCurrentEmployee } from '../../api/authApi';

const AttendanceStatus = () => {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [holidaysList, setHolidaysList] = useState([]);
  const [loading, setLoading] = useState(true);

  const employee = getCurrentEmployee();

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

      {/* Attendance calendar hidden — attendance is marked via company biometric system */}
      {/*
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        Calendar Grid (commented out — biometric handles attendance marking)
      </div>
      */}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
        <CalendarDays size={40} className="mx-auto text-blue-200 mb-3" />
        <p className="text-gray-700 font-bold">Attendance is recorded via Biometric</p>
        <p className="text-gray-400 text-sm mt-1">
          Your attendance for {MONTHS[month]} {year} is automatically tracked through the company biometric system.
        </p>
      </div>

    </div>
  );
};

export default AttendanceStatus;
