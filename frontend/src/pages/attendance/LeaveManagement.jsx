import React, { useState } from 'react';
import { ClipboardList, Plus, Clock, CheckCircle2, XCircle, Calendar } from 'lucide-react';

const LeaveManagement = () => {
  const [showForm, setShowForm] = useState(false);
  
  // Demo data
  const leaves = [
    { id: 1, type: 'Sick Leave', start: '2024-05-10', end: '2024-05-11', reason: 'Fever', status: 'Approved', by: 'Manager' },
    { id: 2, type: 'Casual Leave', start: '2024-05-23', end: '2024-05-24', reason: 'Family Function', status: 'Pending', by: '-' },
  ];

  const statusColors = {
    'Approved': 'bg-emerald-50 text-emerald-600 border-emerald-100',
    'Pending': 'bg-amber-50 text-amber-600 border-amber-100',
    'Rejected': 'bg-red-50 text-red-600 border-red-100',
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      
      {/* Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Annual Leave', val: 18, color: 'blue' },
          { label: 'Sick Leave', val: 10, color: 'red' },
          { label: 'Casual Leave', val: 6, color: 'amber' },
          { label: 'Available Balance', val: 24, color: 'emerald' },
        ].map(item => (
          <div key={item.label} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">{item.label}</p>
            <p className={`text-2xl font-black text-${item.color}-600`}>{item.val}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <ClipboardList size={20} className="text-blue-600" />
          Leave Requests
        </h2>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all text-sm"
        >
          <Plus size={18} />
          {showForm ? 'Close Form' : 'Apply for Leave'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-blue-100 animate-slide-down">
          <h3 className="text-lg font-bold text-slate-800 mb-6">New Leave Application</h3>
          <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Leave Type</label>
                <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20">
                  <option>Sick Leave</option>
                  <option>Casual Leave</option>
                  <option>Earned Leave</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Start Date</label>
                  <input type="date" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">End Date</label>
                  <input type="date" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20" />
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Reason</label>
                <textarea rows="4" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="Please specify your reason..."></textarea>
              </div>
              <button className="w-full py-4 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 transition-all">
                Submit Application
              </button>
            </div>
          </form>
        </div>
      )}

      {/* History Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Type</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Duration</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Approved By</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {leaves.map((leave) => (
              <tr key={leave.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-5">
                  <p className="font-bold text-slate-700">{leave.type}</p>
                  <p className="text-[10px] text-slate-400 font-medium truncate max-w-[150px]">{leave.reason}</p>
                </td>
                <td className="px-6 py-5">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-600">{leave.start}</span>
                    <span className="text-[10px] text-slate-400">to {leave.end}</span>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${statusColors[leave.status]}`}>
                    {leave.status}
                  </span>
                </td>
                <td className="px-6 py-5 text-right">
                  <p className="text-sm font-bold text-slate-500">{leave.by}</p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeaveManagement;
