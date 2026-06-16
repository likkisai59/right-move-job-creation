import React, { useState, useEffect } from 'react';
import { ClipboardList, Plus, Clock, CheckCircle2, XCircle, Calendar, ShieldAlert } from 'lucide-react';
import { applyLeave, getLeaveHistory, getLeaveConfig } from '../../api/attendanceApi';

const LeaveManagement = () => {
  const [showForm, setShowForm] = useState(false);
  const [leaves, setLeaves] = useState([]);
  const [annualQuota, setAnnualQuota] = useState(30);
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form states
  const [leaveType, setLeaveType] = useState('Paid Leave');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  const employee = JSON.parse(localStorage.getItem('employee_data') || '{}');
  const employeeId = employee.id;

  const fetchLeavesAndConfig = async () => {
    if (!employeeId) return;
    setLoading(true);
    setError('');
    try {
      const [historyData, configData] = await Promise.all([
        getLeaveHistory(employeeId),
        getLeaveConfig(employeeId)
      ]);
      setLeaves(historyData || []);
      if (configData) {
        setAnnualQuota(configData.leaves ?? 30);
        setHolidays(configData.holidays || []);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch leave details. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeavesAndConfig();
  }, [employeeId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      setError('Start date and end date are required.');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setError('Start date cannot be after end date.');
      return;
    }

    // Check if any date in the applied range is a holiday
    const start = new Date(startDate);
    const end = new Date(endDate);
    const holidayDates = holidays.map(h => h.date);

    let current = new Date(start);
    let hasHoliday = false;

    while (current <= end) {
      const yyyy = current.getFullYear();
      const mm = String(current.getMonth() + 1).padStart(2, '0');
      const dd = String(current.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;

      if (holidayDates.includes(dateStr)) {
        hasHoliday = true;
        break;
      }
      current.setDate(current.getDate() + 1);
    }

    if (hasHoliday) {
      setError('Applied date is a holiday');
      return;
    }

    setError('');
    setSuccessMsg('');
    try {
      await applyLeave({
        employee_id: employeeId,
        leave_type: leaveType,
        start_date: startDate,
        end_date: endDate,
        reason: reason.trim()
      });
      setSuccessMsg('Leave application submitted successfully!');
      setShowForm(false);

      // Reset form
      setLeaveType('Paid Leave');
      setStartDate('');
      setEndDate('');
      setReason('');

      // Refresh details
      fetchLeavesAndConfig();

      // Clear success banner after 4s
      setTimeout(() => {
        setSuccessMsg('');
      }, 4000);
    } catch (err) {
      console.error(err);
      setError('Failed to submit leave application. Please check details and try again.');
    }
  };

  const calculateDays = (start, end) => {
    const s = new Date(start);
    const e = new Date(end);
    const diff = Math.abs(e - s);
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
  };

  // Dynamic Quota Calculations based on approved leaves
  const approvedLeaves = leaves.filter(l => l.status === 'Approved');
  const totalApprovedDays = approvedLeaves.reduce((acc, leave) => {
    return acc + calculateDays(leave.start_date, leave.end_date);
  }, 0);

  const pendingLeavesCount = leaves.filter(l => l.status === 'Pending').length;
  const availableBalance = Math.max(0, annualQuota - totalApprovedDays);

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

      {error && !showForm && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl flex items-center gap-3 animate-slide-down shadow-sm">
          <ShieldAlert className="text-rose-500 shrink-0" size={20} />
          <span className="text-sm font-semibold">{error}</span>
        </div>
      )}

      {/* Summary Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Annual Leave Quota', val: annualQuota, color: 'blue' },
          { label: 'Leaves Taken (Approved)', val: approvedLeaves.length, color: 'rose' },
          { label: 'Pending Requests', val: pendingLeavesCount, color: 'amber' },
          { label: 'Available Balance', val: availableBalance, color: 'emerald' },
        ].map(item => (
          <div key={item.label} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">{item.label}</p>
            <p className={`text-2xl font-black text-${item.color}-600`}>{item.val}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <ClipboardList size={20} className="text-blue-600" />
          Leave Requests
        </h2>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setError('');
          }}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all text-sm"
        >
          <Plus size={18} />
          {showForm ? 'Close Form' : 'Apply for Leave'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-8 rounded-xl shadow-sm border border-blue-100 animate-slide-down">
          <h3 className="text-lg font-bold text-gray-800 mb-6">New Leave Application</h3>
          {error && (
            <div className="mb-5 p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl flex items-center gap-2.5 text-sm font-semibold animate-shake shadow-sm">
              <ShieldAlert className="shrink-0 text-rose-500" size={18} />
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Leave Type</label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 font-semibold text-gray-700"
                >
                  <option>Paid Leave</option>
                  <option>Unpaid Leave</option>
                  <option>Optional Leave</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 font-medium text-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 font-medium text-gray-700"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Reason</label>
                <textarea
                  rows="4"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-700"
                  placeholder="Please specify your reason..."
                />
              </div>
              <button type="submit" className="w-full py-4 bg-gray-800 text-white font-bold rounded-xl hover:bg-gray-900 transition-all shadow-md">
                Submit Application
              </button>
            </div>
          </form>
        </div>
      )}

      {/* History Table */}
      {loading ? (
        <div className="bg-white p-12 rounded-xl border border-gray-100 flex flex-col items-center justify-center gap-2 shadow-sm min-h-[200px]">
          <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-bold text-gray-400">Loading history...</span>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
              <ClipboardList size={18} className="text-blue-600" />
              Leave Applications History
            </h3>
          </div>
          {leaves.length === 0 ? (
            <div className="p-10 text-center text-gray-400 text-sm font-medium">
              No leave history records found.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Type</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Duration</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-right">Approved By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {leaves.map((leave) => (
                  <tr key={leave.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-5">
                      <p className="font-bold text-gray-700">{leave.leave_type}</p>
                      <p className="text-[10px] text-gray-400 font-medium truncate max-w-[250px]">{leave.reason}</p>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-600">{leave.start_date}</span>
                        <span className="text-[10px] text-gray-400">to {leave.end_date} ({calculateDays(leave.start_date, leave.end_date)} {calculateDays(leave.start_date, leave.end_date) === 1 ? 'day' : 'days'})</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${statusColors[leave.status]}`}>
                        {leave.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <p className="text-sm font-bold text-gray-500">{leave.approved_by || '-'}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Holiday Calendar */}
      {!loading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
              <Calendar size={18} className="text-blue-600" />
              Holiday Calendar
            </h3>
            <span className="text-[10px] text-gray-400 font-medium">Organization-wide holiday calendar</span>
          </div>

          {holidays.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-xs font-semibold">
              No holidays configured yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-[10px] font-bold uppercase tracking-widest">
                    <th className="px-6 py-3">Holiday Name</th>
                    <th className="px-6 py-3 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {holidays.map((h, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-gray-700 text-sm">{h.name}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="text-xs font-bold text-gray-500">
                          {new Date(h.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default LeaveManagement;
