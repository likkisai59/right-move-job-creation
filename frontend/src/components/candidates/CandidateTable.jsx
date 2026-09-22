import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Pencil, FileText, Briefcase } from 'lucide-react';
import Table from '../common/Table';
import EmptyState from '../common/EmptyState';
import Button from '../common/Button';
import { Users } from 'lucide-react';
import { checkPermission } from '../../api/authApi';
import { PIPELINE_STATUS_COLORS } from '../../utils/constants';

const CandidateTable = ({ candidates = [], loading = false, filters, onFilterChange }) => {
  const navigate = useNavigate();

  const columns = [
    {
      key: 'id',
      header: 'Candidate ID',
      filterKey: 'candidateCode',
      filterType: 'text',
      filterPlaceholder: 'Search ID...',
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
      filterKey: 'search',
      filterType: 'text',
      filterPlaceholder: 'Search name or code...',
      render: (_, row) => (
        <span className="font-medium text-gray-900">{`${row.firstName} ${row.lastName}`.trim()}</span>
      ),
    },
    {
      key: 'businessUnit',
      header: 'Business Unit',
      filterKey: 'businessUnit',
      filterType: 'select',
      filterOptions: [
        { value: '', label: 'All Units' },
        { value: 'IT', label: 'IT' },
        { value: 'ITSM', label: 'ITSM' },
        { value: 'BPO', label: 'BPO' },
        { value: 'ITES', label: 'ITES' },
        { value: 'Lateral', label: 'Lateral' },
        { value: 'FLP', label: 'FLP' },
        { value: 'F&A', label: 'F&A' },
      ],
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
      filterKey: 'skills',
      filterType: 'text',
      filterPlaceholder: 'Search skills...',
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
      filterKey: 'experience',
      filterType: 'text',
      filterPlaceholder: 'Search...',
      render: (val) => {
        if (!val) return '—';
        const s = val.toString();
        const lower = s.toLowerCase();
        if (lower === 'fresher' || lower === '0' || lower === '0 years') return 'Fresher';
        // Req 2: if value already contains 'year', 'yr', show as-is; otherwise append 'Years'
        if (/(years?|yrs?)/i.test(s)) return s;
        if (s === '1') return '1 Year';
        return `${s} Years`;
      }
    },
    {
      key: 'currentCTC',
      header: 'Total CTC',
      filterKey: 'currentCTC',
      filterType: 'text',
      filterPlaceholder: 'Search...',
      render: (val) => (val ? `₹${val} LPA` : '—'),
    },
    {
      key: 'expectedCTC',
      header: 'Expected CTC',
      filterKey: 'expectedCTC',
      filterType: 'text',
      filterPlaceholder: 'Search...',
      render: (val) => (val ? `₹${val} LPA` : '—'),
    },
    {
      key: 'noticePeriod',
      header: 'Notice Period',
      filterKey: 'noticePeriod',
      filterType: 'select',
      filterOptions: [
        { value: '', label: 'All' },
        { value: 'Immediate', label: 'Immediate' },
        { value: '15 Days', label: '15 Days' },
        { value: '30 Days', label: '30 Days' },
        { value: '45 Days', label: '45 Days' },
        { value: '60 Days', label: '60 Days' },
        { value: '90 Days', label: '90 Days' },
      ],
      render: (val) => val || '—',
    },
    {
      key: 'currentLocation',
      header: 'Current Location',
      filterKey: 'currentLocation',
      filterType: 'text',
      filterPlaceholder: 'Search location...',
      render: (val) => val || '—',
    },
    {
      key: 'pipelineStatus',
      header: 'Pipeline Status',
      filterKey: 'pipelineStatus',
      filterType: 'select',
      filterOptions: [
        { value: '', label: 'All' },
        { value: 'Submitted', label: 'Submitted' },
        { value: 'In Progress', label: 'In Progress' },
        { value: 'Selected', label: 'Selected' },
        { value: 'Rejected', label: 'Rejected' },
        { value: 'On Hold', label: 'On Hold' },
      ],
      render: (_, row) => {
        const status = row.pipelineStatus || row.status || 'Submitted';
        const colorClass = PIPELINE_STATUS_COLORS[status] || 'bg-blue-50 text-blue-700 border-blue-100';
        return (
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${colorClass}`}>
            {status}
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

          {/* Req 3: View Resume button — only when resume is uploaded */}
          {row.resumeUrl && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                const base = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');
                const url = encodeURI(`${base}${row.resumeUrl}`);
                const fallback = `${base}/api/candidates/${row.id}/resume`;
                const win = window.open(url, '_blank');
                if (!win) window.open(fallback, '_blank');
              }}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-emerald-500 hover:bg-emerald-50 transition-colors"
              title="View Resume"
            >
              <FileText size={15} />
            </button>
          )}

          {/* Req 4: Tag to Job button — navigate to candidate detail, Selection tab */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (row.id) {
                navigate(`/candidates/${row.id}?tab=selection`);
              }
            }}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-violet-500 hover:bg-violet-50 transition-colors"
            title="Tag / Assign to Job"
          >
            <Briefcase size={15} />
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
            checkPermission('add_candidate') ? (
              <Button onClick={() => navigate('/candidates/create')} icon={Users}>
                Add Candidate
              </Button>
            ) : null
          }
        />
      </div>
    );
  }

  return <Table columns={columns} data={candidates} loading={loading} filters={filters} onFilterChange={onFilterChange} />;
};

export default CandidateTable;
