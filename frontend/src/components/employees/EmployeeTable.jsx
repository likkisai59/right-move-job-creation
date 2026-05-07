import React from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import { formatDate } from '../../utils/formatters';

const EmployeeTable = ({ employees, onEdit, onDelete }) => {
  if (!employees || employees.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-gray-100 border-dashed animate-fade-in">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </div>
        <p className="text-gray-500 font-bold text-lg">No employees found</p>
        <p className="text-gray-400 text-sm mt-1">Try adjusting your filters or add a new employee.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] animate-slide-up">
      <table className="w-full text-left border-collapse min-w-[800px]">
        <thead>
          <tr className="bg-gray-50/80 border-b border-gray-100">
            <th className="py-4 px-6 text-xs font-extrabold text-gray-500 uppercase tracking-widest rounded-tl-2xl">Employee</th>
            <th className="py-4 px-6 text-xs font-extrabold text-gray-500 uppercase tracking-widest">Designation</th>
            <th className="py-4 px-6 text-xs font-extrabold text-gray-500 uppercase tracking-widest">Joined</th>
            <th className="py-4 px-6 text-xs font-extrabold text-gray-500 uppercase tracking-widest">Package</th>
            <th className="py-4 px-6 text-xs font-extrabold text-gray-500 uppercase tracking-widest">Status</th>
            <th className="py-4 px-6 text-xs font-extrabold text-gray-500 uppercase tracking-widest text-right rounded-tr-2xl">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {employees.map((emp) => (
            <tr key={emp.id} className="hover:bg-blue-50/30 transition-colors group">
              
              {/* Employee Avatar & Name */}
              <td className="py-4 px-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700 flex items-center justify-center font-bold text-sm shadow-sm">
                    {emp.firstName?.[0]}{emp.lastName?.[0]}
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                      {emp.preferredName ? `${emp.preferredName} (${emp.firstName} ${emp.lastName})` : `${emp.firstName} ${emp.lastName}`}
                    </div>
                    <div className="text-xs text-gray-500 font-semibold tracking-wider">{emp.employeeId}</div>
                  </div>
                </div>
              </td>

              {/* Designation */}
              <td className="py-4 px-6">
                <span className="text-xs font-bold text-gray-700 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200">
                  {emp.designation}
                </span>
              </td>

              {/* Date of Joining */}
              <td className="py-4 px-6 text-sm text-gray-600 font-semibold">
                {formatDate(emp.dateOfJoining)}
              </td>

              {/* Package */}
              <td className="py-4 px-6">
                <span className="text-sm font-bold text-emerald-600">
                  {emp.package ? `₹${emp.package.toLocaleString()}` : '—'}
                </span>
              </td>

              {/* Status Badge */}
              <td className="py-4 px-6">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${
                  emp.status === 'Active' 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm shadow-emerald-100' 
                    : 'bg-red-50 text-red-700 border-red-200 shadow-sm shadow-red-100'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full mr-2 ${emp.status === 'Active' ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`}></span>
                  {emp.status}
                </span>
              </td>

              {/* Actions (Hidden until hover) */}
              <td className="py-4 px-6">
                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                  <button 
                    onClick={() => onEdit(emp.id)}
                    className="p-2 text-blue-600 bg-white border border-blue-100 hover:bg-blue-50 hover:border-blue-200 rounded-xl transition-all shadow-sm"
                    title="Edit Employee"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => onDelete(emp.id)}
                    className="p-2 text-red-600 bg-white border border-red-100 hover:bg-red-50 hover:border-red-200 rounded-xl transition-all shadow-sm"
                    title="Delete Employee"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
              
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default EmployeeTable;
