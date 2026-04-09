import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Pencil } from 'lucide-react';
import Table from '../common/Table';
import EmptyState from '../common/EmptyState';
import Button from '../common/Button';

const OrganizationTable = ({ organizations = [], loading = false }) => {
  const navigate = useNavigate();

  const columns = [
    {
      key: 'id',
      header: 'Org ID',
      render: (val) => (
        <span className="font-mono text-xs text-blue-700 font-semibold bg-blue-50 px-2 py-1 rounded border border-blue-100">
          ORG{String(val).padStart(4, '0')}
        </span>
      ),
    },
    {
      key: 'name',
      header: 'Organization Name',
      minWidth: '200px',
      render: (val) => (
        <span className="font-medium text-gray-900">{val}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (val) => {
        const isActive = val?.toUpperCase() === 'ACTIVE';
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
            isActive 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
              : 'bg-red-50 text-red-700 border-red-200'
          }`}>
            {val || 'UNKNOWN'}
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          {/* Placeholder for future editing capability */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/organizations/edit/${row.id}`);
            }}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
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
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <EmptyState
          icon={Building2}
          title="No organizations found"
          description="Create your first organization to get started"
          action={
            <Button onClick={() => navigate('/organizations/create')} icon={Building2}>
              Add Organization
            </Button>
          }
        />
      </div>
    );
  }

  return <Table columns={columns} data={organizations} loading={loading} />;
};

export default OrganizationTable;
