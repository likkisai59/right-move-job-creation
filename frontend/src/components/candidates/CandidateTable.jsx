import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import Table from '../common/Table';
import Badge from '../common/Badge';
import EmptyState from '../common/EmptyState';
import Button from '../common/Button';
import { Users } from 'lucide-react';
import { truncateText } from '../../utils/formatters';

const CandidateTable = ({ candidates = [], loading = false, onDelete }) => {
  const navigate = useNavigate();

  const columns = [
    {
      key: 'id',
      header: 'Candidate ID',
      render: (val) => (
        <span className="font-mono text-xs text-gray-500">{val}</span>
      ),
    },
    {
      key: 'firstName',
      header: 'Full Name',
      minWidth: '150px',
      render: (_, row) => (
        <span className="font-medium text-gray-900">{`${row.firstName} ${row.lastName}`}</span>
      ),
    },
    {
      key: 'businessCategory',
      header: 'Category',
      render: (val) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-700">
          {val || 'IT'}
        </span>
      ),
    },
    {
      key: 'skills',
      header: 'Skills',
      minWidth: '200px',
      render: (val) => (
        <div className="flex flex-wrap gap-1">
          {(val || []).slice(0, 3).map((skill) => (
            <span
              key={skill}
              className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-medium"
            >
              {skill}
            </span>
          ))}
          {(val || []).length > 3 && (
            <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-xs">
              +{val.length - 3}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'totalExperience',
      header: 'Experience',
    },
    {
      key: 'mappedJobId',
      header: 'Mapped Job',
      render: (val) =>
        val ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
            Mapped
          </span>
        ) : (
          <span className="text-gray-400 text-xs">—</span>
        ),
    },
    {
      key: 'currentCTC',
      header: 'Current CTC',
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
    },
    {
      key: 'currentLocation',
      header: 'Location',
    },
    {
      key: 'reasonForChange',
      header: 'Reason',
      render: (val) => (
        <span title={val} className="text-gray-600">
          {truncateText(val, 25)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              console.log('Navigating to candidate:', row.id);
              if (row.id) {
                navigate(`/candidates/${row.id}`);
              } else {
                console.error('Candidate ID is undefined');
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
              onDelete && onDelete(row);
            }}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Delete candidate"
          >
            <Trash2 size={15} />
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
