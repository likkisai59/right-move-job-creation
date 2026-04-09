import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Download, ChevronDown, FileText, FileSpreadsheet } from 'lucide-react';
import PageContainer from '../../components/layout/PageContainer';
import Button from '../../components/common/Button';
import CandidateTable from '../../components/candidates/CandidateTable';
import CandidateFilters from '../../components/candidates/CandidateFilters';
import { fetchCandidates, deleteCandidate } from '../../api/candidatesApi';

const CandidateListPage = () => {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', businessCategory: '', skills: '', totalExperience: '', noticePeriod: '' });
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const exportRef = React.useRef(null);

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

  const loadCandidates = async (activeFilters = filters) => {
    setLoading(true);
    try {
      const res = await fetchCandidates(activeFilters);
      setCandidates(res.data);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCandidate = async (candidate) => {
    if (!window.confirm(`Are you sure you want to delete ${candidate.firstName} ${candidate.lastName}?`)) {
      return;
    }

    try {
      setLoading(true);
      await deleteCandidate(candidate.id);
      await loadCandidates(); // Refresh list
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Failed to delete candidate');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCandidates(filters);
  }, [filters]);

  const handleExport = async (format) => {
    setExportOpen(false);
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.businessCategory) params.append('business_category', filters.businessCategory);
      if (filters.skills) params.append('skills', filters.skills);
      if (filters.totalExperience) params.append('total_experience', filters.totalExperience);
      if (filters.noticePeriod) params.append('notice_period', filters.noticePeriod);
      params.append('format', format);

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'}/candidates/export?${params.toString()}`,
        { method: 'GET' }
      );

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = format === 'csv' ? 'candidates.csv' : 'candidates.xlsx';
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
      title="Candidates"
      subtitle={`${candidates.length} candidate${candidates.length !== 1 ? 's' : ''} registered`}
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

          <Button icon={UserPlus} onClick={() => navigate('/candidates/create')}>
            Add Candidate
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4 animate-fade-in">
        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <CandidateFilters
            filters={filters}
            onChange={setFilters}
            onClear={() => setFilters({ search: '', businessCategory: '', skills: '', totalExperience: '', noticePeriod: '' })}
          />
        </div>

        {/* Table */}
        <CandidateTable 
          candidates={candidates} 
          loading={loading} 
          onDelete={handleDeleteCandidate}
        />
      </div>
    </PageContainer>
  );
};

export default CandidateListPage;
