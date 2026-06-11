import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil, Eye, Briefcase, BarChart2 } from 'lucide-react';
import Table from '../common/Table';
import Button from '../common/Button';
import EmptyState from '../common/EmptyState';
import { formatDate } from '../../utils/formatters';


const JobTable = ({ jobs = [], loading = false, onEdit, onViewStats }) => {
  const navigate = useNavigate();
  const [popoverId, setPopoverId] = useState(null);
  const popoverRef = useRef(null);

  // Close popover when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (e.target.closest('.toggle-popover-btn')) return;
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
      header: 'Requisition open Date',
      render: (val) => formatDate(val),
    },
    {
      key: 'ageing',
      header: 'Ageing',
      render: (_, row) => {
        if (!row.date) return '—';
        const openDate = new Date(row.date);
        const today = new Date();
        const diffTime = today.getTime() - openDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        return (
          <span className="font-medium text-gray-900">
            {Math.max(0, diffDays)} Days
          </span>
        );
      }
    },
    {
      key: 'companyName',
      header: 'Company name',
      minWidth: '160px',
      render: (val) => (
        <span className="font-medium text-gray-900">{val}</span>
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
      key: 'numberOfCandidates',
      header: 'Total Open Positions',
      render: (val, row) => {
        const totalPositions = row.requirements
          ? row.requirements.reduce((sum, r) => sum + (r.number_of_open_positions || 0), 0)
          : val || 0;
        const hasMore = row.requirements && row.requirements.length > 1;
        const candidatesPopoverId = row.id + '-candidates';

        return (
          <div className="relative flex flex-col items-start gap-1">
            {totalPositions <= 0 ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-black bg-rose-50 text-rose-700 border border-rose-100">
                Position Filled
              </span>
            ) : (
              <span className="text-gray-900 font-medium">{totalPositions}</span>
            )}
            {hasMore && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setPopoverId(popoverId === candidatesPopoverId ? null : candidatesPopoverId);
                }}
                className={`toggle-popover-btn text-[10px] font-bold px-2.5 py-1 rounded-full transition-all border outline-none
                  ${popoverId === candidatesPopoverId
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100 hover:border-blue-200'
                  }`}
              >
                (View Breakdown)
              </button>
            )}

            {/* Independent Candidates Popover */}
            {popoverId === candidatesPopoverId && (
              <div
                ref={popoverRef}
                className="absolute z-[99] top-full left-0 mt-3 w-56 bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.12)] border border-gray-100 p-4 animate-slide-up"
              >
                <div className="flex items-center mb-3 border-b border-gray-50 pb-2.5">
                  <h4 className="text-xs font-bold text-gray-800 uppercase tracking-widest">
                    Positions Breakdown
                  </h4>
                </div>

                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {row.requirements.map((req, idx) => {
                    const count = req.number_of_open_positions ?? 0;
                    return (
                      <div key={req.id || idx} className="flex flex-col gap-1">
                        <span className="text-xs font-semibold text-gray-900 leading-tight">
                          {req.job_title}
                        </span>
                        <div>
                          {count <= 0 ? (
                            <span className="text-[10px] px-1.5 py-0.5 rounded border border-rose-100 bg-rose-50 text-rose-600 font-bold">
                              Position Filled
                            </span>
                          ) : (
                            <span className="text-[10px] px-1.5 py-0.5 rounded border border-gray-100 bg-gray-50 text-gray-500">
                              {count} Positions
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="absolute -top-1.5 left-6 w-3 h-3 bg-white border-t border-l border-gray-100 rotate-45" />
              </div>
            )}
          </div>
        );
      }
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/jobs/${row.id}`);
            }}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            title="View details"
          >
            <Eye size={15} />
          </button>

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

          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onViewStats) onViewStats(row);
            }}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-purple-600 hover:bg-purple-50 transition-colors"
            title="View Pipeline Stats"
          >
            <BarChart2 size={15} />
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
