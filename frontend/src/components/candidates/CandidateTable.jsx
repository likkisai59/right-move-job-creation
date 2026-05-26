import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Pencil } from 'lucide-react';
import Table from '../common/Table';
import EmptyState from '../common/EmptyState';
import Button from '../common/Button';
import { Users } from 'lucide-react';

const CandidateTable = ({ candidates = [], loading = false }) => {
  const navigate = useNavigate();

  const columns = [
    {
      key: 'id',
      header: 'Candidate ID',
      render: (val, row) => {
        const displayCode = row.candidateCode || row.candidate_code || `CAN${String(val).padStart(4, '0')}`;
        return (
          <span className="font-mono text-xs text-blue-700 font-semibold bg-blue-50 px-2 py-1 rounded border border-blue-100">
            {displayCode}
          </span>
        );
      },
    },
    {
      key: 'firstName',
      header: 'Full Name',
      minWidth: '150px',
      render: (_, row) => (
        <span className="font-medium text-gray-900">{`${row.firstName} ${row.lastName}`.trim()}</span>
      ),
    },
    {
      key: 'businessUnit',
      header: 'Business Unit',
      render: (val) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-700">
          {val || 'IT'}
        </span>
      ),
    },
    {
      key: 'skills',
      header: 'Primary Skills',
      minWidth: '150px',
      render: (val) => {
        const skillsList = val || [];
        if (skillsList.length === 0) return <span className="text-gray-400">—</span>;
        
        return (
          <div className="flex flex-wrap gap-1">
            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
              {skillsList[0]}
            </span>
            {skillsList.length > 1 && (
              <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-xs font-medium">
                +{skillsList.length - 1}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'totalExperience',
      header: 'Experience',
      render: (val) => {
        if (!val) return '—';
        if (val.toLowerCase() === 'fresher') return 'Fresher';
        if (val === '1') return '1 Year';
        return `${val} Years`;
      }
    },
    {
      key: 'currentCTC',
      header: 'Total CTC',
      render: (val) => (val ? `₹${val} LPA` : '—'),
    },
    {
      key: 'expectedCTC',
      header: 'Expected CTC',
      render: (val) => (val ? `₹${val} LPA` : '—'),
    },
    {
      key: 'noticePeriod',
      header: 'Notice Period',
      render: (val) => val || '—',
    },
    {
      key: 'currentLocation',
      header: 'Current Location',
      render: (val) => val || '—',
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (row.id) {
                navigate(`/candidates/${row.id}`);
              }
            }}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            title="View candidate"
          >
            <Eye size={15} />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              if (row.id) {
                navigate(`/candidates/edit/${row.id}`);
              }
            }}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-blue-500 hover:bg-blue-50 transition-colors"
            title="Edit candidate"
          >
            <Pencil size={15} />
          </button>
        </div>
      ),
    },
  ];

  if (!loading && candidates.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <EmptyState
          icon={Users}
          title="No candidates found"
          description="Add a new candidate to get started"
          action={
            <Button onClick={() => navigate('/candidates/create')} icon={Users}>
              Add Candidate
            </Button>
          }
        />
      </div>
    );
  }

  return <Table columns={columns} data={candidates} loading={loading} />;
};

export default CandidateTable;
