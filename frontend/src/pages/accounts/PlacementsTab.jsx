import React from 'react';
import { Wallet } from 'lucide-react';
import Table from '../../components/common/Table';
import EmptyState from '../../components/common/EmptyState';

const PlacementsTab = ({ data = [], loading = false }) => {
  const formatDate = (val) => {
    if (!val) return '—';
    try {
      return new Date(val).toLocaleDateString('en-GB');
    } catch {
      return val;
    }
  };

  const columns = [
    {
      key: 'srNo',
      header: 'Sr. No.',
      render: (val) => <span className="text-gray-500 text-sm font-medium">{val}</span>,
    },
    {
      key: 'approval_date',
      header: 'Candidate approval date',
      render: (val) => <span>{formatDate(val)}</span>,
    },
    {
      key: 'candidate_code',
      header: 'Candidate ID',
      render: (val) => <span className="font-mono text-xs text-blue-700 font-semibold bg-blue-50 px-2 py-1 rounded">{val || '—'}</span>,
    },
    {
      key: 'candidate_name',
      header: 'Candidate Name',
      render: (val) => <span className="font-medium text-gray-900">{val}</span>,
    },
    {
      key: 'employee_id',
      header: 'Employee ID',
      render: (_, row) => <span className="font-mono text-xs text-blue-700 font-semibold bg-blue-50 px-2 py-1 rounded">{row.employee_id || '—'}</span>,
    },
    {
      key: 'employee_name',
      header: 'Employee Name',
      render: (_, row) => <span className="font-medium text-gray-850">{row.employee_name || '—'}</span>,
    },
    {
      key: 'organization_id',
      header: 'Org ID',
      render: (val) => <span className="font-mono text-xs text-gray-500">{val || '—'}</span>,
    },
    {
      key: 'organization_name',
      header: 'Organization Name',
      render: (val) => <span className="text-gray-800 text-sm">{val}</span>,
    },
    {
      key: 'location',
      header: 'Location',
      render: (val) => <span className="text-gray-600 text-sm">{val || '—'}</span>,
    },
    {
      key: 'job_designation',
      header: 'Job Designation',
      render: (val) => <span className="text-gray-600 text-sm font-medium">{val}</span>,
    },
    {
      key: 'incentive',
      header: 'Incentive',
      render: (val) => {
        if (!val) return '—';
        const parts = String(val).split(/[,+/]|\s+plus\s+/i).map(p => p.trim()).filter(Boolean);
        return (
          <div className="flex flex-wrap gap-1">
            {parts.map((p, idx) => {
              const num = Number(p.replace(/[^0-9.]/g, ''));
              const formatted = !isNaN(num) && p !== '' ? `₹${num.toLocaleString()}` : p;
              return (
                <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                  {formatted}
                </span>
              );
            })}
          </div>
        );
      }
    },
    {
      key: 'rate_card',
      header: 'Rate Card',
      render: (val) => <span className="text-gray-600 text-sm">{val || '—'}</span>,
    },
    {
      key: 'band',
      header: 'Band',
      render: (val) => <span className="text-gray-600 text-xs bg-gray-50 border px-2 py-0.5 rounded font-medium">{val || '—'}</span>,
    },
  ];

  if (!loading && data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <EmptyState
          icon={Wallet}
          title="No placement records found"
          description="Wait for entries to load or verify your search details."
        />
      </div>
    );
  }

  const processedData = data.map((item, index) => ({
    ...item,
    srNo: index + 1,
  }));

  return <Table columns={columns} data={processedData} loading={loading} />;
};

export default PlacementsTab;
