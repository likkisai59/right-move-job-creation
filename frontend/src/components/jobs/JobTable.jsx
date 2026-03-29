import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil, Eye } from 'lucide-react';
import Table from '../common/Table';
import Badge from '../common/Badge';
import Button from '../common/Button';
import EmptyState from '../common/EmptyState';
import { Briefcase } from 'lucide-react';
import { formatDate } from '../../utils/formatters';

const JobTable = ({ jobs = [], loading = false, onEdit }) => {
  const navigate = useNavigate();

  const columns = [
    {
      key: 'date',
      header: 'Date',
      render: (val) => formatDate(val),
    },
    {
      key: 'companyName',
      header: 'Company Name',
      minWidth: '160px',
      render: (val) => (
        <span className="font-medium text-gray-900">{val}</span>
      ),
    },
    {
      key: 'jobTitle',
      header: 'Job Title',
      minWidth: '180px',
    },
    {
      key: 'numberOfCandidates',
      header: '# Candidates',
      render: (val) => (
        <span className="text-center block">{val}</span>
      ),
    },
    {
      key: 'experience',
      header: 'Experience',
    },
    {
      key: 'budget',
      header: 'Budget',
    },
    {
      key: 'assignedTo',
      header: 'Recruiter',
    },
    {
      key: 'status',
      header: 'Status',
      render: (val) => <Badge status={val} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/jobs/edit/${row.id}`);
            }}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
            title="Edit job"
          >
            <Pencil size={15} />
          </button>
        </div>
      ),
    },
  ];

  if (!loading && jobs.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <EmptyState
          icon={Briefcase}
          title="No job requirements found"
          description="Create a new job requirement to get started"
          action={
            <Button onClick={() => navigate('/jobs/create')} icon={Briefcase}>
              Create Job Requirement
            </Button>
          }
        />
      </div>
    );
  }

  return <Table columns={columns} data={jobs} loading={loading} />;
};

export default JobTable;
