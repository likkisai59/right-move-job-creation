import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Pencil, Percent } from 'lucide-react';
import Table from '../common/Table';
import EmptyState from '../common/EmptyState';
import Button from '../common/Button';
import TimeStamp from '../common/TimeStamp';

const STATUS_CONFIG = {
  in_progress: { label: 'In Progress', classes: 'bg-blue-50 text-blue-700 border-blue-200' },
  completed: { label: 'Completed', classes: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  rejected: { label: 'Rejected', classes: 'bg-red-50 text-red-700 border-red-200' },
  cancel: { label: 'Cancelled', classes: 'bg-gray-50 text-gray-700 border-gray-200' },
};

const OrganizationTable = ({ organizations = [], loading = false }) => {
  const navigate = useNavigate();

  const columns = [
    {
      key: 'organization_id',
      header: 'ID',
      render: (val) => (
        <span className="font-mono text-xs text-blue-700 font-semibold bg-blue-50 px-2 py-1 rounded border border-blue-100">
          {val}
        </span>
      ),
    },
    {
      key: 'organization_name',
      header: 'Organization Name',
      minWidth: '220px',
      render: (val, row) => (
        <div className="flex flex-col">
          <span className="font-semibold text-gray-900">{val}</span>
          <TimeStamp created={row.created_at} updated={row.updated_at} />
        </div>
      ),
    },
    {
      key: 'commission_percentage',
      header: 'Comm. %',
      render: (val) => (
        <div className="flex items-center gap-1 text-gray-600 font-medium">
          {val ? `${val}%` : '-'}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (val) => {
        const config = STATUS_CONFIG[val] || { label: val, classes: 'bg-gray-50 text-gray-500 border-gray-200' };
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase tracking-wider ${config.classes}`}>
            {config.label}
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
              navigate(`/organizations/edit/${row.id}`);
            }}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors shadow-sm bg-white border border-gray-100"
            title="Edit Organization"
          >
            <Pencil size={15} />
          </button>
        </div>
      ),
    },
  ];

  if (!loading && organizations.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 flex justify-center">
        <EmptyState
          icon={Building2}
          title="No organizations listed"
          description="Initialize your recruiter database by adding your first organization partner."
          action={
            <Button onClick={() => navigate('/organizations/create')} icon={Building2} size="md">
              Create Organization
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-fade-in">
      <Table columns={columns} data={organizations} loading={loading} />
    </div>
  );
};

export default OrganizationTable;
