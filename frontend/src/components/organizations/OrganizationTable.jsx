import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Pencil, Percent, Calendar, AlertTriangle, Phone, MapPin, RotateCcw } from 'lucide-react';
import Table from '../common/Table';
import EmptyState from '../common/EmptyState';
import Button from '../common/Button';
import { formatRelativeTime } from '../../utils/formatters';

const STATUS_CONFIG = {
  active: { label: 'Active', classes: 'bg-blue-50 text-blue-700 border-blue-200' },
  complete: { label: 'Complete', classes: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  cancel: { label: 'Cancel', classes: 'bg-gray-50 text-gray-700 border-gray-200' },
};

const OrganizationTable = ({ organizations = [], loading = false }) => {
  const navigate = useNavigate();

  const columns = [
    {
      key: 'organization_id',
      header: 'Org ID',
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
          {row.updated_at && (
            <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-0.5">
              <RotateCcw size={10} />
              <span>Updated {formatRelativeTime(row.updated_at)}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'commission_percentage',
      header: 'Commission%',
      render: (val) => (
        <div className="flex items-center gap-1 text-gray-600 font-medium">
          {val ? `${val}%` : '-'}
        </div>
      ),
    },
    {
      key: 'contact_number',
      header: 'Contact Number',
      render: (_, row) => (
        <div className="flex flex-col gap-1 py-1">
          {row.contact_number ? (
            <div className="flex items-center gap-1.5 text-sm text-slate-700">
              <span className="text-blue-500" title="Contact Number"><Phone size={13} /></span>
              <span className="font-medium whitespace-nowrap">{row.country_code} {row.contact_number}</span>
            </div>
          ) : (
            <span className="text-gray-400 text-xs italic">No phone info</span>
          )}
        </div>
      ),
    },
    {
      key: 'address',
      header: 'Office Address',
      minWidth: '280px',
      render: (val) => (
        <div className="flex flex-col gap-1 py-1">
          {val ? (
            <div className="flex items-start gap-1.5 text-xs text-slate-600 max-w-[280px]" title={val}>
              <span className="text-blue-400 mt-0.5 shrink-0"><MapPin size={12} /></span>
              <span className="leading-relaxed">{val}</span>
            </div>
          ) : (
            <span className="text-gray-400 text-[10px] italic font-medium">No address provided</span>
          )}
        </div>
      ),
    },
    {
      key: 'contract_signed_date',
      header: 'Contract Signed',
      render: (val) => {
        if (!val) return <span className="text-gray-400">-</span>;
        return <span className="text-slate-600 font-medium text-sm">{new Date(val).toLocaleDateString('en-GB')}</span>;
      }
    },
    {
      key: 'contract_end_date',
      header: 'Contract End',
      render: (val) => {
        if (!val) return <span className="text-gray-400">-</span>;

        const endDate = new Date(val);
        const today = new Date();
        const diffTime = endDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        const isExpiringSoon = diffDays >= 0 && diffDays <= 7;
        const isExpired = diffDays < 0;

        return (
          <div className="flex items-center gap-2">
            <span className={`text-sm font-semibold ${isExpiringSoon ? 'text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded' :
                isExpired ? 'text-rose-600 bg-rose-50 px-2 py-0.5 rounded' :
                  'text-slate-600'
              }`}>
              {new Date(val).toLocaleDateString('en-GB')}
            </span>
            {isExpiringSoon && (
              <span className="flex w-2 h-2 rounded-full bg-indigo-500" title="Renewal due soon"></span>
            )}
            {isExpired && (
              <span className="flex w-2 h-2 rounded-full bg-rose-500" title="Contract expired"></span>
            )}
          </div>
        );
      }
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
