import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil, Eye, CheckCircle2 } from 'lucide-react';
import Table from '../common/Table';
import Badge from '../common/Badge';
import Button from '../common/Button';
import EmptyState from '../common/EmptyState';
import { Briefcase } from 'lucide-react';
import { formatDate } from '../../utils/formatters';


const JobTable = ({ jobs = [], loading = false, onEdit }) => {
  const navigate = useNavigate();
  const [popoverId, setPopoverId] = useState(null);
  const popoverRef = useRef(null);

  // Close popover when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setPopoverId(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

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
      key: 'businessCategory',
      header: 'Category',
      render: (val) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-700">
          {val || 'IT'}
        </span>
      ),
    },
    {
      key: 'jobTitle',
      header: 'Job Title',
      minWidth: '220px',
      render: (val, row) => {
        const hasMore = row.requirements && row.requirements.length > 1;
        const firstTitle = row.requirements?.[0]?.job_title || val;
        
        return (
          <div className="relative flex flex-col items-start gap-1">
            <span className="font-medium text-gray-900 leading-tight">
              {firstTitle}
            </span>
            {hasMore && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setPopoverId(popoverId === row.id ? null : row.id);
                }}
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-all border outline-none
                  ${popoverId === row.id 
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                    : 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100 hover:border-blue-200'
                  }`}
              >
                (+{row.requirements.length - 1} more)
              </button>
            )}

            {/* Popover */}
            {popoverId === row.id && (
              <div 
                ref={popoverRef}
                className="absolute z-[999] top-full left-0 mt-3 w-72 bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.12)] border border-gray-100 p-4 animate-slide-up"
              >
                <div className="flex items-center gap-2 mb-3 border-b border-gray-50 pb-2.5">
                  <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Briefcase size={12} className="text-blue-600" />
                  </div>
                  <h4 className="text-xs font-bold text-gray-800 uppercase tracking-widest">
                    Job Requirements ({row.requirements.length})
                  </h4>
                </div>
                
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                  {row.requirements.map((req, idx) => (
                    <div key={req.id || idx} className="flex flex-col gap-1 group">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                        <span className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {req.job_title}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 pl-4.5">
                        <span className="text-[10px] text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                          {req.experience}
                        </span>
                        <span className="text-[10px] font-medium text-emerald-600">
                           {req.budget}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Arrow pointer */}
                <div className="absolute -top-1.5 left-6 w-3 h-3 bg-white border-t border-l border-gray-100 rotate-45" />
              </div>
            )}
          </div>
        );
      },
    },

    {
      key: 'mandatorySkill',
      header: 'Mandatory Skill',
      minWidth: '150px',
      render: (val) => (
        <span className="text-gray-600 italic">
          {val || '—'}
        </span>
      ),
    },

    {
      key: 'numberOfCandidates',
      header: 'Candidates',
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
