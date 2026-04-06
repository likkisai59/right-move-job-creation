import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Download, ChevronDown, FileText, FileSpreadsheet } from 'lucide-react';
import PageContainer from '../../components/layout/PageContainer';
import Button from '../../components/common/Button';
import JobTable from '../../components/jobs/JobTable';
import JobFilters from '../../components/jobs/JobFilters';
import { fetchJobs } from '../../api/jobsApi';

const JobListPage = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ company: '', startDate: '', endDate: '', status: '' });
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const exportRef = useRef(null);

  // Close export dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (exportRef.current && !exportRef.current.contains(e.target)) {
        setExportOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const loadJobs = async (activeFilters = filters) => {
    setLoading(true);
    try {
      const res = await fetchJobs(activeFilters);
      setJobs(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs(filters);
  }, [filters]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleFilterClear = () => {
    setFilters({ company: '', startDate: '', endDate: '', status: '' });
  };

  const handleExport = async (format) => {
    setExportOpen(false);
    setExporting(true);
    try {
      // Build query params from current filters
      const params = new URLSearchParams();
      if (filters.company)   params.append('company',     filters.company);
      if (filters.startDate) params.append('start_date',  filters.startDate);
      if (filters.endDate)   params.append('end_date',    filters.endDate);
      if (filters.status)    params.append('status',      filters.status);
      params.append('format', format);

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'}/jobs/export?${params.toString()}`,
        { method: 'GET' }
      );

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = format === 'csv' ? 'jobs.csv' : 'jobs.xlsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
      alert('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <PageContainer
      title="Update Job Requirement"
      subtitle={`${jobs.length} requirement${jobs.length !== 1 ? 's' : ''} found`}
      actions={
        <div className="flex items-center gap-3">
          {/* Export Dropdown */}
          <div className="relative" ref={exportRef}>
            <button
              onClick={() => setExportOpen((prev) => !prev)}
              disabled={exporting}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm disabled:opacity-60"
            >
              <Download size={15} className="text-gray-500" />
              {exporting ? 'Exporting...' : 'Export'}
              <ChevronDown
                size={14}
                className={`text-gray-400 transition-transform duration-200 ${exportOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {exportOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl border border-gray-100 shadow-lg z-50 overflow-hidden animate-slide-up">
                <button
                  onClick={() => handleExport('csv')}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <FileText size={15} className="text-blue-500" />
                  Export as CSV
                </button>
                <button
                  onClick={() => handleExport('excel')}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-t border-gray-50"
                >
                  <FileSpreadsheet size={15} className="text-green-500" />
                  Export as Excel
                </button>
              </div>
            )}
          </div>

          {/* Create Job Button */}
          <Button
            icon={Plus}
            onClick={() => navigate('/jobs/create')}
          >
            Create Job
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4 animate-fade-in">
        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <JobFilters
            filters={filters}
            onChange={handleFilterChange}
            onClear={handleFilterClear}
          />
        </div>

        {/* Table */}
        <JobTable jobs={jobs} loading={loading} />
      </div>
    </PageContainer>
  );
};

export default JobListPage;
