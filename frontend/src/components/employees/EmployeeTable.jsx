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
      header: 'Emp ID',
      render: (val) => (
        <span className="font-mono text-xs text-blue-700 font-semibold bg-blue-50 px-2 py-1 rounded border border-blue-100">
          {val}
        </span>
      ),
    },
    {
      key: 'firstName',
      header: 'Employee Name',
      minWidth: '150px',
      render: (_, row) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900">{`${row.firstName} ${row.lastName}`}</span>
        </div>
      ),
    },
    {
      key: 'preferredName',
      header: 'Preferred Name',
      render: (val) => (
        <span className="text-gray-600">
          {val || '—'}
        </span>
      ),
    },
    {
      key: 'contact',
      header: 'Contact',
      render: (_, row) => (
        <div className="flex flex-col text-sm text-gray-600">
          {row.contactNumber ? (
            <span>{row.countryCode} {row.contactNumber}</span>
          ) : (
            <span>—</span>
          )}
          {row.email ? (
            <span className="text-xs text-gray-400">{row.email}</span>
          ) : null}
        </div>
      ),
    },
    {
      key: 'designation',
      header: 'Designation',
      render: (val) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
          {val}
        </span>
      ),
    },
    {
      key: 'bloodGroup',
      header: 'Blood Group',
      render: (val) => (
        val ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-red-50 text-red-700 border border-red-100">
            {val}
          </span>
        ) : <span className="text-gray-400">—</span>
      ),
    },
    {
      key: 'dateOfJoining',
      header: 'Joined',
      render: (val) => <span className="text-gray-600 text-sm">{formatDate(val)}</span>,
    },
    {
      key: 'package',
      header: 'Package',
      render: (val) => <span className="text-gray-600 text-sm">{val ? `₹${val.toLocaleString()}` : '—'}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (val) => {
        const isActive = val === 'Active';
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
            isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isActive ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
            {val}
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
