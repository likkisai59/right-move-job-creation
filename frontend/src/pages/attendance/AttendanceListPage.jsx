import React, { useState, useMemo } from 'react';
import {
  ChevronLeft, ChevronRight, CalendarDays,
  UserCheck, UserX, Umbrella, Palmtree,
  Clock, History, ClipboardList,
} from 'lucide-react';

// ── Months ─────────────────────────────────────────────────────
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

// ── Logged-in employee (dummy — replace with auth context later) ─
const CURRENT_EMPLOYEE = {
  id: 1,
  name: 'Ravi Kumar',
  designation: 'Senior Recruiter',
  employeeId: 'EMP-001',
  department: 'Talent Acquisition',
  location: 'Hyderabad',
  attendance: {
    // May 2026
    1: 'H', 2: 'P', 3: 'P', 4: 'P', 5: 'P',
    6: 'P', 7: 'P', 8: 'P', 9: 'P', 10: 'P',
    11: 'P', 12: 'A', 13: 'P', 14: 'P', 15: 'H',
    16: 'P', 17: 'P', 18: 'P', 19: 'P', 20: 'P',
    21: 'P', 22: 'P', 23: 'L', 24: 'L', 25: 'P',
    26: 'P', 27: 'P', 28: 'P', 29: 'P', 30: 'P',
    31: 'P',
  },
};

// ── Status Config ───────────────────────────────────────────────
const STATUS = {
  P:  { label: 'Present', short: 'P', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', pill: 'bg-emerald-100 text-emerald-700' },
  A:  { label: 'Absent',  short: 'A', bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200',     pill: 'bg-red-100 text-red-700'         },
  L:  { label: 'Leave',   short: 'L', bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   pill: 'bg-amber-100 text-amber-700'     },
  H:  { label: 'Holiday', short: 'H', bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200',    pill: 'bg-blue-100 text-blue-700'       },
  WO: { label: 'Weekend', short: '—', bg: 'bg-gray-50',    text: 'text-gray-300',    border: 'border-gray-100',    pill: 'bg-gray-100 text-gray-400'       },
  FT: { label: 'Future',  short: '',  bg: 'bg-white',      text: 'text-gray-200',    border: 'border-gray-100',    pill: ''                                 },
};

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const isWeekend = (year, month, day) => {
  const d = new Date(year, month, day).getDay();
  return d === 0 || d === 6;
};

// ── Compute summary ─────────────────────────────────────────────
const getSummary = (attendance, year, month) => {
  const today = new Date();
  const totalDays = new Date(year, month + 1, 0).getDate();
  let P = 0, A = 0, L = 0, H = 0;
  for (let d = 1; d <= totalDays; d++) {
    const date = new Date(year, month, d);
    if (date > today) continue;
    if (isWeekend(year, month, d)) continue;
    const s = attendance[d];
    if (s === 'P') P++;
    else if (s === 'A') A++;
    else if (s === 'L') L++;
    else if (s === 'H') H++;
  }
  return { P, A, L, H };
};

// ── Tab IDs ─────────────────────────────────────────────────────
const TABS = [
  { id: 'attendance', label: 'Attendance',    icon: CalendarDays   },
  { id: 'history',   label: 'History',        icon: History        },
  { id: 'leave',     label: 'Leave Summary',  icon: ClipboardList  },
];

// ════════════════════════════════════════════════════════════════
// ── ATTENDANCE CALENDAR (personal) ──────────────────────────────
// ════════════════════════════════════════════════════════════════
const PersonalCalendar = ({ attendance, year, month }) => {
  const today = new Date();
  const totalDays = new Date(year, month + 1, 0).getDate();

  // Build calendar grid rows (weeks)
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0=Sun
  const cells = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null); // padding
  for (let d = 1; d <= totalDays; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const rows = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Day-of-week header */}
      <div className="grid grid-cols-7 border-b border-gray-100">
        {DAY_NAMES.map((d) => (
          <div
            key={d}
            className={`py-3 text-center text-xs font-bold uppercase tracking-wider ${
              d === 'Sun' || d === 'Sat' ? 'text-gray-400 bg-gray-50' : 'text-gray-500'
            }`}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      {rows.map((row, ri) => (
        <div key={ri} className="grid grid-cols-7 border-b border-gray-50 last:border-b-0">
          {row.map((day, ci) => {
            if (!day) return <div key={ci} className="min-h-[84px] bg-gray-50/30" />;

            const date = new Date(year, month, day);
            const weekend = isWeekend(year, month, day);
            const isFuture = date > today;
            const isToday =
              today.getFullYear() === year &&
              today.getMonth() === month &&
              today.getDate() === day;

            let statusKey;
            if (weekend) statusKey = 'WO';
            else if (isFuture) statusKey = 'FT';
            else statusKey = attendance[day] || 'A';

            const cfg = STATUS[statusKey];

            return (
              <div
                key={day}
                className={`min-h-[84px] p-2 flex flex-col border-r border-gray-50 last:border-r-0 transition-colors ${
                  weekend ? 'bg-gray-50/50' : ''
                } ${isToday ? 'bg-blue-50/40' : ''} ${
                  !weekend && !isFuture ? 'hover:bg-gray-50 cursor-pointer' : ''
                }`}
              >
                {/* Date number */}
                <span
                  className={`self-start w-7 h-7 flex items-center justify-center rounded-full text-sm font-semibold mb-2 ${
                    isToday
                      ? 'bg-blue-600 text-white'
                      : weekend
                      ? 'text-gray-400'
                      : 'text-gray-700'
                  }`}
                >
                  {day}
                </span>

                {/* Status badge */}
                {!isFuture && (
                  <span
                    className={`inline-flex items-center justify-center px-2 py-1 rounded text-xs font-bold border self-start ${cfg.bg} ${cfg.text} ${cfg.border}`}
                  >
                    {cfg.label}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

// ════════════════════════════════════════════════════════════════
// ── HISTORY TAB ─────────────────────────────────────────────────
// ════════════════════════════════════════════════════════════════
const HistoryTab = ({ attendance }) => {
  // Show last 6 months
  const now = new Date();
  const pastMonths = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  return (
    <div className="flex flex-col gap-3">
      {pastMonths.map(({ year, month }) => {
        const s = getSummary(attendance, year, month);
        const totalWorking = s.P + s.A + s.L;
        const attendancePct = totalWorking > 0 ? Math.round((s.P / totalWorking) * 100) : 0;

        return (
          <div key={`${year}-${month}`} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900">{MONTHS[month]} {year}</h3>
                <p className="text-xs text-gray-400 mt-0.5">Monthly attendance record</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">{attendancePct}%</p>
                <p className="text-xs text-gray-400">Attendance rate</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-4">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${attendancePct}%` }}
              />
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[
                { key: 'P', label: 'Present', val: s.P, bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
                { key: 'A', label: 'Absent',  val: s.A, bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200'     },
                { key: 'L', label: 'Leave',   val: s.L, bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200'   },
                { key: 'H', label: 'Holiday', val: s.H, bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200'    },
              ].map(({ key, label, val, bg, text, border }) => (
                <div key={key} className={`rounded-lg border p-2.5 text-center ${bg} ${border}`}>
                  <p className={`text-xl font-bold ${text}`}>{val}</p>
                  <p className={`text-xs ${text} opacity-70`}>{label}</p>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ════════════════════════════════════════════════════════════════
// ── LEAVE SUMMARY TAB ───────────────────────────────────────────
// ════════════════════════════════════════════════════════════════
const LeaveSummaryTab = () => {
  const leaveTypes = [
    { label: 'Annual Leave',    total: 18, used: 5,  pending: 2, color: 'bg-blue-500'   },
    { label: 'Sick Leave',      total: 10, used: 2,  pending: 0, color: 'bg-red-500'    },
    { label: 'Casual Leave',    total: 6,  used: 1,  pending: 1, color: 'bg-amber-500'  },
    { label: 'Comp Off',        total: 3,  used: 0,  pending: 0, color: 'bg-violet-500' },
  ];

  return (
    <div className="flex flex-col gap-4">
      {leaveTypes.map(({ label, total, used, pending, color }) => {
        const available = total - used - pending;
        const usedPct = Math.round((used / total) * 100);

        return (
          <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className={`w-3 h-3 rounded-full ${color}`} />
                <span className="text-sm font-semibold text-gray-800">{label}</span>
              </div>
              <span className="text-xs text-gray-400">{available} days remaining</span>
            </div>

            <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
              <div className={`h-full rounded-full ${color}`} style={{ width: `${usedPct}%` }} />
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { label: 'Total',     val: total,   color: 'text-gray-700'    },
                { label: 'Used',      val: used,    color: 'text-red-600'     },
                { label: 'Available', val: available, color: 'text-emerald-600' },
              ].map(({ label: l, val, color: c }) => (
                <div key={l} className="bg-gray-50 rounded-lg py-2">
                  <p className={`text-lg font-bold ${c}`}>{val}</p>
                  <p className="text-xs text-gray-400">{l}</p>
                </div>
              ))}
            </div>

            {pending > 0 && (
              <div className="mt-3 flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                <Clock size={12} />
                <span>{pending} day{pending > 1 ? 's' : ''} pending approval</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ════════════════════════════════════════════════════════════════
// ── MAIN PAGE ───────────────────────────────────────────────────
// ════════════════════════════════════════════════════════════════
const AttendanceListPage = () => {
  const now = new Date();
  const [year, setYear]   = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [activeTab, setActiveTab] = useState('attendance');

  const emp = CURRENT_EMPLOYEE;

  const goToPrev = () => {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };
  const goToNext = () => {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };
  const goToToday = () => { setYear(now.getFullYear()); setMonth(now.getMonth()); };

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();

  const summary = useMemo(
    () => getSummary(emp.attendance, year, month),
    [year, month]
  );

  const getInitials = (name) =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50">

      {/* ── EMPLOYEE HEADER CARD ── */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shrink-0">
        <div className="flex items-center justify-between flex-wrap gap-4">

          {/* Left: avatar + info */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-lg">
              {getInitials(emp.name)}
            </div>
            <div>
              <p className="text-base font-bold text-gray-900">{emp.name}</p>
              <p className="text-sm text-gray-500">{emp.designation} · {emp.department} · {emp.location}</p>
              <p className="text-xs text-gray-400 font-mono mt-0.5">{emp.employeeId}</p>
            </div>
          </div>

          {/* Right: this month quick stats */}
          <div className="flex items-center gap-3 flex-wrap">
            {[
              { label: 'Present',  val: summary.P, bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
              { label: 'Absent',   val: summary.A, bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200'     },
              { label: 'Leave',    val: summary.L, bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200'   },
              { label: 'Holiday',  val: summary.H, bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200'    },
            ].map(({ label, val, bg, text, border }) => (
              <div key={label} className={`flex flex-col items-center px-4 py-2 rounded-xl border ${bg} ${border} min-w-[70px]`}>
                <span className={`text-xl font-bold ${text}`}>{val}</span>
                <span className={`text-[11px] font-medium ${text} opacity-70`}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── TABS ── */}
        <div className="flex gap-1 mt-4 border-b border-gray-100 -mb-px">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-lg border-b-2 transition-all ${
                activeTab === id
                  ? 'text-blue-600 border-blue-600 bg-blue-50/50'
                  : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── SCROLLABLE CONTENT ── */}
      <div className="flex-1 overflow-y-auto p-6">

        {/* Month navigator (only for Attendance tab) */}
        {activeTab === 'attendance' && (
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <h2 className="text-base font-bold text-gray-800">
              {MONTHS[month]} {year}
            </h2>
            <div className="flex items-center gap-2">
              {!isCurrentMonth && (
                <button
                  onClick={goToToday}
                  className="flex items-center gap-1.5 h-9 px-3 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-100 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <CalendarDays size={14} />
                  Today
                </button>
              )}
              <div className="flex items-center bg-white border border-gray-200 rounded-lg shadow-sm">
                <button
                  onClick={goToPrev}
                  className="w-9 h-9 flex items-center justify-center text-gray-500 hover:bg-gray-50 rounded-l-lg transition-colors border-r border-gray-200"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="px-4 text-sm font-semibold text-gray-700 min-w-[140px] text-center">
                  {MONTHS[month]} {year}
                </span>
                <button
                  onClick={goToNext}
                  className="w-9 h-9 flex items-center justify-center text-gray-500 hover:bg-gray-50 rounded-r-lg transition-colors border-l border-gray-200"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB CONTENT ── */}
        {activeTab === 'attendance' && (
          <PersonalCalendar attendance={emp.attendance} year={year} month={month} />
        )}
        {activeTab === 'history' && (
          <HistoryTab attendance={emp.attendance} />
        )}
        {activeTab === 'leave' && (
          <LeaveSummaryTab />
        )}
      </div>
    </div>
  );
};

export default AttendanceListPage;
