import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil, Trash2, Users } from 'lucide-react';
import Table from '../common/Table';
import EmptyState from '../common/EmptyState';
import Button from '../common/Button';
import { formatDate } from '../../utils/formatters';

const EmployeeTable = ({ employees = [], loading = false, onEdit, onDelete }) => {
  const navigate = useNavigate();

  const columns = [
    {
      key: 'employeeId',
      header: 'EMPID',
      render: (val) => (
        <span className="font-mono text-xs text-blue-700 font-semibold bg-blue-50 px-2 py-1 rounded border border-blue-100">
          {val}
        </span>
      ),
    },
    {
      key: 'firstName',
      header: 'First Name',
      render: (val) => <span className="font-medium text-gray-900">{val || '—'}</span>,
    },
    {
      key: 'lastName',
      header: 'Last Name',
      render: (val) => <span className="font-medium text-gray-900">{val || '—'}</span>,
    },
    {
      key: 'contactNumberOffice',
      header: 'Contact (Office)',
      render: (val) => <span className="text-gray-600 text-sm">{val || '—'}</span>,
    },
    {
      key: 'designation',
      header: 'Designation',
      render: (val) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
          {val || '—'}
        </span>
      ),
    },
    {
      key: 'reportingTo',
      header: 'Reporting Manager',
      render: (val) => <span className="text-gray-600 text-sm">{val || '—'}</span>,
    },
    {
      key: 'dateOfJoining',
      header: 'Joining Date',
      render: (val) => <span className="text-gray-600 text-sm">{formatDate(val)}</span>,
    },
    {
      key: 'ctc',
      header: 'CTC(LPA)',
      render: (val) => <span className="text-gray-600 text-sm">{val ? `₹${val.toLocaleString()}` : '—'}</span>,
    },
    {
      key: 'compliance',
      header: 'Compliance',
      render: (val) => {
        if (!val || val === 'None') {
          return <span className="text-gray-400 text-sm">None</span>;
        }
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
            {val}
          </span>
        );
      },
    },
    {
      key: 'hrStatus',
      header: 'HR Status',
      render: (_, row) => {
        const val = row.profileStatusHr || 'Draft';
        const pct = row.completionPercentageHr || 0;
        let colors = 'bg-gray-100 text-gray-600 border border-gray-200';
        if (val === 'In Progress') colors = 'bg-amber-50 text-amber-600 border border-amber-200';
        else if (val === 'Completed') colors = 'bg-emerald-50 text-emerald-600 border border-emerald-200';

        return (
          <div className="flex flex-col gap-1.5 w-28">
            <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-xs font-bold ${colors} w-fit`}>
              {val}
            </span>
            <div className="flex items-center gap-2">
              <div className="h-1.5 flex-1 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-emerald-500' : pct > 0 ? 'bg-amber-500' : 'bg-gray-300'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-[10px] font-semibold text-gray-500">{pct}%</span>
            </div>
          </div>
        );
      },
    },
    {
      key: 'adminStatus',
      header: 'Admin Status',
      render: (_, row) => {
        const val = row.profileStatusAdmin || 'Draft';
        const pct = row.completionPercentageAdmin || 0;
        let colors = 'bg-gray-100 text-gray-600 border border-gray-200';
        if (val === 'In Progress') colors = 'bg-amber-50 text-amber-600 border border-amber-200';
        else if (val === 'Completed') colors = 'bg-emerald-50 text-emerald-600 border border-emerald-200';

        return (
          <div className="flex flex-col gap-1.5 w-28">
            <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-xs font-bold ${colors} w-fit`}>
              {val}
            </span>
            <div className="flex items-center gap-2">
              <div className="h-1.5 flex-1 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-emerald-500' : pct > 0 ? 'bg-amber-500' : 'bg-gray-300'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-[10px] font-semibold text-gray-500">{pct}%</span>
            </div>
          </div>
        );
      },
    },
    {
      key: 'employeePassword',
      header: 'Employee Password',
      render: (_, row) => {
        // Password is generated only when both HR and Admin sections are 100% complete
        const isComplete = row.completionPercentageHr === 100 && row.completionPercentageAdmin === 100;
        if (!isComplete) {
          return <span className="text-gray-400 text-sm">—</span>;
        }
        // Derive password using the same formula as backend employee_service.py:
        // Format: {FirstNameInitial}{LastName}@{EmployeeIDDigits}
        const firstChar = (row.firstName || '')[0] || '';
        const lastName = row.lastName || '';
        const digits = (row.employeeId || '').replace(/\D/g, '');
        const derivedPassword = `${firstChar}${lastName}@${digits}`;
        return (
          <span className="font-mono text-xs text-slate-700 bg-slate-50 px-2 py-1 rounded border border-slate-200 select-all cursor-text">
            {derivedPassword}
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit && onEdit(row.id);
            }}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            title="Edit employee"
          >
            <Pencil size={15} />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete && onDelete(row.id);
            }}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Delete employee"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ];

  if (!loading && employees.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <EmptyState
          icon={Users}
          title="No employees found"
          description="Add a new employee to get started"
          action={
            <Button onClick={() => navigate('/employees/create')} icon={Users}>
              Add Employee
            </Button>
          }
        />
      </div>
    );
  }

  return <Table columns={columns} data={employees} loading={loading} />;
};

export default EmployeeTable;
