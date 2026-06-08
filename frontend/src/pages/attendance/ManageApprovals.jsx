import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, CheckCircle2, XCircle, Calendar, 
  User, Clock, ShieldAlert, Check, X, Plus, Trash2 
} from 'lucide-react';
import { getPendingLeaves, updateLeaveStatus, getTeamAttendance, saveApprovalsConfig } from '../../api/attendanceApi';
import { fetchDesignations } from '../../api/designationsApi';

const ManageApprovals = () => {
  const [activeTab, setActiveTab] = useState('leaves'); // 'leaves', 'attendance', 'config', 'holidays'
  const [leaves, setLeaves] = useState([]);
  const [teamAttendance, setTeamAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Portal config states
  const [configDesignations, setConfigDesignations] = useState([]);
  const [leavesMap, setLeavesMap] = useState({});
  const [holidaysMap, setHolidaysMap] = useState({});
  const [globalHolidays, setGlobalHolidays] = useState([]);
  const [configSubmitting, setConfigSubmitting] = useState(false);

  const employee = JSON.parse(localStorage.getItem('employee_data') || '{}');
  const managerName = employee.name || '';
  const isDirector = employee.name && (
    employee.name.trim().toLowerCase() === 'sunmeet singh' ||
    (employee.designation && employee.designation.trim().toLowerCase() === 'director')
  );

  // Get Monday to Friday dates for the current week
  const getWeekDays = () => {
    const today = new Date();
    const currentDay = today.getDay(); // 0 (Sun) to 6 (Sat)
    const distance = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(today);
    monday.setDate(today.getDate() + distance);

    const days = [];
    for (let i = 0; i < 5; i++) { // Monday to Friday
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const weekDays = getWeekDays();

  const loadData = async () => {
    if (!managerName) return;
    setLoading(true);
    setError('');
    try {
      const [leavesData, attendanceData] = await Promise.all([
        getPendingLeaves(managerName),
        getTeamAttendance(managerName)
      ]);
      setLeaves(leavesData || []);
      setTeamAttendance(attendanceData || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load approval data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadConfigDesignations = async () => {
    try {
      const res = await fetchDesignations({ active_only: true }); // Fetch ONLY active designations
      if (res.success) {
        setConfigDesignations(res.data || []);
        
        // Populate maps
        const lMap = {};
        const hMap = {};
        let commonHolidays = [];
        res.data.forEach(d => {
          lMap[d.id] = d.leaves ?? 30;
          hMap[d.id] = d.holidays || [];
          if (commonHolidays.length === 0 && d.holidays && d.holidays.length > 0) {
            commonHolidays = d.holidays;
          }
        });
        setLeavesMap(lMap);
        setHolidaysMap(hMap);
        setGlobalHolidays(commonHolidays);
      }
    } catch (err) {
      console.error('Failed to load designations for config:', err);
      setError('Failed to load designations list.');
    }
  };

  useEffect(() => {
    loadData();
    if (isDirector) {
      loadConfigDesignations();
    }
  }, [managerName, isDirector]);

  // Save all leaves and holidays configurations to the database
  const handleSaveConfig = async () => {
    setConfigSubmitting(true);
    setError('');
    setSuccessMsg('');
    try {
      const payload = configDesignations.map(d => ({
        id: d.id,
        leaves: (leavesMap[d.id] === '' || leavesMap[d.id] === undefined) ? 30 : Number(leavesMap[d.id]),
        holidays: globalHolidays
      }));
      await saveApprovalsConfig(payload);
      setSuccessMsg('All designation configurations saved successfully!');
      
      // Reload configurations from database
      await loadConfigDesignations();

      setTimeout(() => {
        setSuccessMsg('');
      }, 4000);
    } catch (err) {
      console.error(err);
      setError('Failed to save configurations. Please check values and try again.');
    } finally {
      setConfigSubmitting(false);
    }
  };

  const handleAction = async (leaveId, action) => {
    setError('');
    setSuccessMsg('');
    try {
      await updateLeaveStatus(leaveId, action, managerName);
      setSuccessMsg(`Leave request has been successfully ${action.toLowerCase()}.`);
      loadData();
      
      setTimeout(() => {
        setSuccessMsg('');
      }, 4000);
    } catch (err) {
      console.error(err);
      setError(`Failed to perform action: ${err.response?.data?.detail || err.message}`);
    }
  };

  const formatDateRange = (start, end) => {
    const s = new Date(start);
    const e = new Date(end);
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    
    if (start === end) {
      return s.toLocaleDateString('en-US', options);
    }
    return `${s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${e.toLocaleDateString('en-US', options)}`;
  };

  const calculateDays = (start, end) => {
    const s = new Date(start);
    const e = new Date(end);
    const diff = Math.abs(e - s);
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
  };

  const renderDailyStatus = (emp, dateObj) => {
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;

    const record = emp.attendance?.find(a => a.attendance_date === dateStr);

    if (!record) {
      return (
        <span className="text-gray-400 font-medium text-xs">-</span>
      );
    }

    const fh = record.first_half_status;
    const sh = record.second_half_status;

    if (fh === 'P' && sh === 'P') {
      return (
        <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 uppercase">
          P
        </span>
      );
    }

    if (fh === 'L' || sh === 'L') {
      const isFullLeave = fh === 'L' && sh === 'L';
      return (
        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border uppercase ${
          isFullLeave 
            ? 'bg-rose-50 text-rose-600 border-rose-100' 
            : 'bg-amber-50 text-amber-600 border-amber-100'
        }`}>
          {isFullLeave ? 'L' : 'HL'}
        </span>
      );
    }

    if (fh === 'H' || sh === 'H') {
      return (
        <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100 uppercase">
          H
        </span>
      );
    }

    const isAbsent = fh === 'A' || sh === 'A';
    return (
      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border uppercase ${
        isAbsent ? 'bg-red-50 text-red-600 border-red-100' : 'bg-gray-50 text-gray-500 border-gray-100'
      }`}>
        {fh}
      </span>
    );
  };

  const pendingLeaves = leaves.filter(l => l.status === 'Pending');
  const resolvedLeaves = leaves.filter(l => l.status !== 'Pending');

  const statusColors = {
    'Approved': 'bg-emerald-50 text-emerald-600 border-emerald-100',
    'Pending': 'bg-amber-50 text-amber-600 border-amber-100',
    'Rejected': 'bg-rose-50 text-rose-600 border-rose-100',
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Banners */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center gap-3 animate-slide-down shadow-sm">
          <CheckCircle2 className="text-emerald-500 shrink-0" size={20} />
          <span className="text-sm font-semibold">{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl flex items-center gap-3 animate-slide-down shadow-sm">
          <ShieldAlert className="text-rose-500 shrink-0" size={20} />
          <span className="text-sm font-semibold">{error}</span>
        </div>
      )}

      {/* Header & Sub-tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-2">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <ClipboardList size={22} className="text-blue-600" />
            Manage Approvals
          </h2>
          <p className="text-xs text-gray-400 font-medium">
            Review leave requests, team attendance, and configure leave policies.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('leaves')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'leaves'
                ? 'bg-white text-gray-800 shadow-sm'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            Leave Approvals ({pendingLeaves.length})
          </button>
          <button
            onClick={() => setActiveTab('attendance')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'attendance'
                ? 'bg-white text-gray-800 shadow-sm'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            Team Attendance
          </button>
          {isDirector && (
            <button
              onClick={() => setActiveTab('holidays')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'holidays'
                  ? 'bg-white text-gray-800 shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <Calendar size={14} />
              Add Holidays
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="bg-white p-12 rounded-2xl border border-gray-100 flex flex-col items-center justify-center gap-3 shadow-sm min-h-[300px]">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-bold text-gray-500">Loading details...</span>
        </div>
      ) : (
        <>
          {/* LEAVE APPROVALS TAB */}
          {activeTab === 'leaves' && (
            <div className="space-y-8 animate-fade-in">
              
              {/* Pending Requests Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock size={16} className="text-amber-500" />
                  Pending Requests ({pendingLeaves.length})
                </h3>

                {pendingLeaves.length === 0 ? (
                  <div className="bg-white p-10 rounded-2xl border border-gray-100 text-center shadow-sm">
                    <CheckCircle2 className="mx-auto text-emerald-400 mb-3" size={32} />
                    <p className="text-gray-700 font-bold text-base">No Pending Applications</p>
                    <p className="text-gray-400 text-xs mt-1">You are all caught up! There are no leaves awaiting approval.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pendingLeaves.map((leave) => (
                      <div 
                        key={leave.id} 
                        className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between gap-5"
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm">
                                {leave.employee_name?.charAt(0)}
                              </div>
                              <div>
                                <h4 className="font-bold text-gray-800 text-sm">{leave.employee_name}</h4>
                                <p className="text-[10px] text-gray-400 font-medium">{leave.employee_code}</p>
                              </div>
                            </div>
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase border bg-amber-50 text-amber-600 border-amber-100">
                              {leave.leave_type}
                            </span>
                          </div>

                          <div className="border-t border-gray-100 pt-3 space-y-2">
                            <div className="flex items-center gap-2 text-xs text-gray-600 font-medium">
                              <Calendar size={14} className="text-gray-400" />
                              <span>{formatDateRange(leave.start_date, leave.end_date)}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-bold">
                                {calculateDays(leave.start_date, leave.end_date)} {calculateDays(leave.start_date, leave.end_date) === 1 ? 'day' : 'days'}
                              </span>
                            </div>
                            {leave.reason && (
                              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-xs text-gray-500 italic font-medium leading-relaxed">
                                "{leave.reason}"
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 border-t border-gray-100 pt-4">
                          <button
                            onClick={() => handleAction(leave.id, 'Rejected')}
                            className="flex items-center justify-center gap-1.5 py-2.5 border border-red-200 text-red-600 font-bold rounded-xl text-xs hover:bg-red-50 transition-colors"
                          >
                            <X size={14} />
                            Reject
                          </button>
                          <button
                            onClick={() => handleAction(leave.id, 'Approved')}
                            className="flex items-center justify-center gap-1.5 py-2.5 bg-blue-600 text-white font-bold rounded-xl text-xs hover:bg-blue-700 transition-colors shadow-sm"
                          >
                            <Check size={14} />
                            Approve
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Resolved Approvals History */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 size={16} className="text-emerald-500" />
                  Resolved Approvals History ({resolvedLeaves.length})
                </h3>

                {resolvedLeaves.length === 0 ? (
                  <div className="bg-white p-8 rounded-2xl border border-gray-100 text-center shadow-sm">
                    <p className="text-gray-400 text-xs font-semibold">No resolved leaves history found.</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-[10px] font-bold uppercase tracking-widest">
                            <th className="px-6 py-4">Employee</th>
                            <th className="px-6 py-4">Type</th>
                            <th className="px-6 py-4">Duration</th>
                            <th className="px-6 py-4">Reason</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Resolved By</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {resolvedLeaves.map((leave) => (
                            <tr key={leave.id} className="hover:bg-gray-50/50 transition-colors">
                              <td className="px-6 py-4">
                                <p className="font-bold text-gray-800 text-sm">{leave.employee_name}</p>
                                <p className="text-[10px] text-gray-400 font-medium">{leave.employee_code}</p>
                              </td>
                              <td className="px-6 py-4">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold border bg-gray-50 text-gray-600 border-gray-100">
                                  {leave.leave_type}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex flex-col text-xs font-medium text-gray-600">
                                  <span>{formatDateRange(leave.start_date, leave.end_date)}</span>
                                  <span className="text-[10px] text-gray-400">
                                    {calculateDays(leave.start_date, leave.end_date)} {calculateDays(leave.start_date, leave.end_date) === 1 ? 'day' : 'days'}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <p className="text-xs text-gray-500 truncate max-w-[150px] font-medium" title={leave.reason}>
                                  {leave.reason || '-'}
                                </p>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${statusColors[leave.status]}`}>
                                  {leave.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <p className="text-xs font-bold text-gray-500">{leave.approved_by || '-'}</p>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TEAM ATTENDANCE TAB */}
          {activeTab === 'attendance' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <User size={16} className="text-blue-500" />
                  Direct Reports ({teamAttendance.length})
                </h3>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10px] font-bold text-gray-500">
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-emerald-500 rounded border border-emerald-100" /> Present (P)</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-rose-500 rounded border border-rose-100" /> Full Leave (L)</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-amber-500 rounded border border-amber-100" /> Half Leave (HL)</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-blue-500 rounded border border-blue-100" /> Holiday (H)</span>
                </div>
              </div>

              {teamAttendance.length === 0 ? (
                <div className="bg-white p-12 rounded-2xl border border-gray-100 text-center shadow-sm">
                  <User className="mx-auto text-gray-300 mb-3" size={36} />
                  <p className="text-gray-700 font-bold text-base">No Direct Reports Found</p>
                  <p className="text-gray-400 text-xs mt-1">There are no employees registered with reporting manager: {managerName}.</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-[10px] font-bold uppercase tracking-widest">
                          <th className="px-6 py-4">Team Member</th>
                          <th className="px-6 py-4">Designation</th>
                          {weekDays.map((day, idx) => (
                            <th key={idx} className="px-4 py-4 text-center">
                              <span className="block font-black text-gray-700">
                                {day.toLocaleDateString('en-US', { weekday: 'short' })}
                              </span>
                              <span className="block text-[8px] text-gray-400 font-medium">
                                {day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {teamAttendance.map((emp) => (
                          <tr key={emp.employee_id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <p className="font-bold text-gray-800 text-sm">{emp.employee_name}</p>
                              <p className="text-[10px] text-gray-400 font-medium">{emp.employee_code}</p>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-xs font-bold text-gray-500 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100">
                                {emp.designation}
                              </span>
                            </td>
                            {weekDays.map((day, idx) => (
                              <td key={idx} className="px-4 py-4 text-center whitespace-nowrap">
                                {renderDailyStatus(emp, day)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}



          {/* ADD HOLIDAYS TAB */}
          {activeTab === 'holidays' && isDirector && (
            <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6 animate-fade-in">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div>
                  <h3 className="text-lg font-black text-gray-800 flex items-center gap-2">
                    <Calendar size={22} className="text-blue-600" />
                    Organization Holidays
                  </h3>
                  <p className="text-xs text-gray-400 font-medium">Add and manage holidays applicable to all employees across the organization.</p>
                </div>
              </div>

              {/* Add Holiday Form */}
              <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100 space-y-4">
                <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                  Add New Holiday
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2">
                    <input
                      type="text"
                      id="global-holiday-name"
                      placeholder="Holiday Name (e.g. Diwali)"
                      className="w-full p-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 text-xs font-semibold text-gray-700"
                    />
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      id="global-holiday-date"
                      className="p-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 text-xs font-semibold text-gray-700 flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const nameEl = document.getElementById("global-holiday-name");
                        const dateEl = document.getElementById("global-holiday-date");
                        if (nameEl && dateEl && nameEl.value.trim() && dateEl.value) {
                          const updated = [...globalHolidays, { name: nameEl.value.trim(), date: dateEl.value }];
                          setGlobalHolidays(updated);
                          nameEl.value = '';
                          dateEl.value = '';
                        }
                      }}
                      className="px-4 py-2 bg-gray-800 text-white font-bold rounded-xl hover:bg-gray-900 transition-all text-xs"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Holidays Table list */}
              {globalHolidays.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-xs font-medium bg-white rounded-2xl border border-dashed border-gray-200">
                  No holidays configured yet.
                </div>
              ) : (
                <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                        <th className="px-6 py-4">Holiday Name</th>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {globalHolidays
                        .sort((a, b) => new Date(a.date) - new Date(b.date))
                        .map((h, index) => (
                          <tr key={index} className="hover:bg-gray-50/30 transition-colors">
                            <td className="px-6 py-4 font-bold text-gray-800 text-sm">{h.name}</td>
                            <td className="px-6 py-4 font-semibold text-gray-500">
                              {new Date(h.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', weekday: 'short' })}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => {
                                  const updated = globalHolidays.filter((_, i) => i !== index);
                                  setGlobalHolidays(updated);
                                }}
                                className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-xl transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Save Button */}
              <div className="border-t border-gray-100 pt-6 flex justify-end">
                <button
                  onClick={async () => {
                    setConfigSubmitting(true);
                    setError('');
                    setSuccessMsg('');
                    try {
                      const payload = configDesignations.map(d => ({
                        id: d.id,
                        leaves: (leavesMap[d.id] === '' || leavesMap[d.id] === undefined) ? 30 : Number(leavesMap[d.id]),
                        holidays: globalHolidays
                      }));
                      await saveApprovalsConfig(payload);
                      setSuccessMsg('Holidays saved and applied to all designations successfully!');
                      await loadConfigDesignations();
                      setTimeout(() => setSuccessMsg(''), 4000);
                    } catch (err) {
                      console.error(err);
                      setError('Failed to save holidays. Please try again.');
                    } finally {
                      setConfigSubmitting(false);
                    }
                  }}
                  disabled={configSubmitting}
                  className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all text-xs flex items-center gap-1.5 shadow-lg shadow-blue-500/20 disabled:bg-blue-400 disabled:shadow-none"
                >
                  <Check size={16} />
                  {configSubmitting ? 'Saving Holidays...' : 'Save & Apply Holidays'}
                </button>
              </div>
            </div>
          )}
        </>
      )}

    </div>
  );
};

export default ManageApprovals;
