import React, { useState } from 'react';

// ── Status config ─────────────────────────────────────────────
const STATUS_CONFIG = {
  P:  { label: 'Present',  short: 'P', bg: 'bg-emerald-50',  text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  A:  { label: 'Absent',   short: 'A', bg: 'bg-red-50',      text: 'text-red-700',     border: 'border-red-200',     dot: 'bg-red-500'     },
  L:  { label: 'Leave',    short: 'L', bg: 'bg-amber-50',    text: 'text-amber-700',   border: 'border-amber-200',   dot: 'bg-amber-500'   },
  H:  { label: 'Holiday',  short: 'H', bg: 'bg-blue-50',     text: 'text-blue-700',    border: 'border-blue-200',    dot: 'bg-blue-500'    },
  WO: { label: 'Weekend',  short: '—', bg: 'bg-gray-50',     text: 'text-gray-300',    border: 'border-gray-100',    dot: 'bg-gray-300'    },
  FT: { label: 'Future',   short: '·', bg: 'bg-white',       text: 'text-gray-200',    border: 'border-gray-100',    dot: 'bg-gray-200'    },
};

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const isWeekend = (year, month, day) => {
  const d = new Date(year, month, day).getDay();
  return d === 0 || d === 6;
};

const getSummary = (attendance, totalDays, year, month) => {
  const today = new Date();
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

const getInitials = (name) =>
  name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

const AVATAR_COLORS = [
  'bg-blue-500', 'bg-violet-500', 'bg-emerald-500', 'bg-orange-500', 'bg-pink-500',
];

// ── Group days into weeks ─────────────────────────────────────
const getWeeks = (year, month, totalDays) => {
  const weeks = [];
  let week = [];
  for (let d = 1; d <= totalDays; d++) {
    const dayOfWeek = new Date(year, month, d).getDay(); // 0=Sun
    if (dayOfWeek === 0 && week.length > 0) {
      weeks.push(week);
      week = [];
    }
    week.push(d);
  }
  if (week.length > 0) weeks.push(week);
  return weeks;
};

// ── Status Cell ───────────────────────────────────────────────
const StatusCell = ({ statusKey, isToday }) => {
  const cfg = STATUS_CONFIG[statusKey];
  const isFuture = statusKey === 'FT';
  const isWeekendDay = statusKey === 'WO';

  if (isFuture || isWeekendDay) {
    return (
      <div className="flex items-center justify-center">
        <span className={`text-xs font-medium ${cfg.text}`}>{cfg.short}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center">
      <span
        title={cfg.label}
        className={`
          inline-flex items-center justify-center w-8 h-7 rounded text-xs font-bold border
          ${cfg.bg} ${cfg.text} ${cfg.border}
          ${isToday ? 'ring-2 ring-offset-1 ring-blue-500' : ''}
          select-none transition-all
        `}
      >
        {cfg.short}
      </span>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────
const AttendanceCalendar = ({ employees, year, month }) => {
  const today = new Date();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const days = Array.from({ length: totalDays }, (_, i) => i + 1);
  const weeks = getWeeks(year, month, totalDays);

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse" style={{ minWidth: `${totalDays * 46 + 280}px` }}>

          {/* ── WEEK GROUP HEADER ── */}
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {/* Employee col */}
              <th
                className="sticky left-0 z-20 bg-gray-50 border-r border-gray-200"
                style={{ minWidth: 240 }}
                rowSpan={2}
              >
                <div className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Employee
                </div>
              </th>

              {/* Week group headers */}
              {weeks.map((week, wi) => (
                <th
                  key={wi}
                  colSpan={week.length}
                  className="text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wider py-2 border-r border-gray-200"
                >
                  <span className="px-2 py-0.5 bg-gray-100 rounded text-gray-600">
                    Week {wi + 1}
                  </span>
                </th>
              ))}

              {/* Summary col */}
              <th
                className="sticky right-0 z-20 bg-gray-50 border-l border-gray-200"
                style={{ minWidth: 130 }}
                rowSpan={2}
              >
                <div className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Summary
                </div>
              </th>
            </tr>

            {/* ── DAY HEADER ROW ── */}
            <tr className="bg-gray-50 border-b border-gray-200">
              {days.map((day) => {
                const weekend = isWeekend(year, month, day);
                const isToday =
                  today.getFullYear() === year &&
                  today.getMonth() === month &&
                  today.getDate() === day;
                const dayName = DAY_NAMES[new Date(year, month, day).getDay()];

                return (
                  <th
                    key={day}
                    className={`text-center py-2 w-11 border-r border-gray-100 last:border-r-0 ${
                      weekend ? 'bg-gray-50/80' : ''
                    }`}
                  >
                    <div className="flex flex-col items-center gap-0.5">
                      <span className={`text-[9px] font-semibold uppercase tracking-wide ${weekend ? 'text-gray-400' : 'text-gray-400'}`}>
                        {dayName}
                      </span>
                      <span
                        className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                          isToday
                            ? 'bg-blue-600 text-white'
                            : weekend
                            ? 'text-gray-400'
                            : 'text-gray-700'
                        }`}
                      >
                        {day}
                      </span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* ── TABLE BODY ── */}
          <tbody className="divide-y divide-gray-50">
            {employees.map((emp, idx) => {
              const summary = getSummary(emp.attendance, totalDays, year, month);

              return (
                <tr key={emp.id} className="hover:bg-blue-50/20 transition-colors group">

                  {/* Employee info — sticky left */}
                  <td className="sticky left-0 z-10 bg-white group-hover:bg-blue-50/20 px-4 py-3 border-r border-gray-200 transition-colors">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${
                          AVATAR_COLORS[idx % AVATAR_COLORS.length]
                        }`}
                      >
                        {getInitials(emp.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{emp.name}</p>
                        <p className="text-xs text-gray-400 truncate">{emp.designation}</p>
                      </div>
                    </div>
                  </td>

                  {/* Day status cells */}
                  {days.map((day) => {
                    const date = new Date(year, month, day);
                    const isFuture = date > today;
                    const weekend = isWeekend(year, month, day);
                    const isToday =
                      today.getFullYear() === year &&
                      today.getMonth() === month &&
                      today.getDate() === day;

                    let statusKey;
                    if (weekend) statusKey = 'WO';
                    else if (isFuture) statusKey = 'FT';
                    else statusKey = emp.attendance[day] || 'A';

                    return (
                      <td
                        key={day}
                        className={`text-center px-0.5 py-3 border-r border-gray-100 last:border-r-0 ${
                          weekend ? 'bg-gray-50/40' : ''
                        } ${isToday ? 'bg-blue-50/30' : ''}`}
                      >
                        <StatusCell statusKey={statusKey} isToday={isToday} />
                      </td>
                    );
                  })}

                  {/* Summary — sticky right */}
                  <td className="sticky right-0 z-10 bg-white group-hover:bg-blue-50/20 px-3 py-3 border-l border-gray-200 transition-colors">
                    <div className="flex flex-col gap-1 text-xs">
                      {[
                        { key: 'P', label: 'Present',  val: summary.P, bg: 'bg-emerald-50',  text: 'text-emerald-700', border: 'border-emerald-200' },
                        { key: 'A', label: 'Absent',   val: summary.A, bg: 'bg-red-50',      text: 'text-red-700',     border: 'border-red-200'     },
                        { key: 'L', label: 'Leave',    val: summary.L, bg: 'bg-amber-50',    text: 'text-amber-700',   border: 'border-amber-200'   },
                        { key: 'H', label: 'Holiday',  val: summary.H, bg: 'bg-blue-50',     text: 'text-blue-700',    border: 'border-blue-200'    },
                      ].map(({ key, label, val, bg, text, border }) => (
                        <div key={key} className="flex items-center gap-1.5">
                          <span
                            className={`w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center border ${bg} ${text} ${border}`}
                          >
                            {key}
                          </span>
                          <span className="text-gray-500 font-medium w-5 text-center">{val}</span>
                          <span className="text-gray-400 hidden xl:inline truncate">{label}</span>
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttendanceCalendar;
