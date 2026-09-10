import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Download, ChevronDown, FileText, FileSpreadsheet, Upload, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import PageContainer from '../../components/layout/PageContainer';
import Button from '../../components/common/Button';
import CandidateTable from '../../components/candidates/CandidateTable';
import CandidateFilters from '../../components/candidates/CandidateFilters';
import { fetchCandidates, deleteCandidate, importCandidates, downloadCandidateTemplate } from '../../api/candidatesApi';
import { checkPermission } from '../../api/authApi';

const CandidateListPage = () => {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', businessUnit: '', skills: '', currentLocation: '', noticePeriod: '', pipelineStatus: '', sortField: '', sortOrder: 'desc' });
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const exportRef = React.useRef(null);

  // Import modal states
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [importError, setImportError] = useState(null);

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

  const [debouncedFilters, setDebouncedFilters] = useState(filters);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters(filters);
    }, 500);
    return () => clearTimeout(timer);
  }, [filters]);

  useEffect(() => {
    loadCandidates(debouncedFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedFilters]);

  const handleExport = async (format) => {
    setExportOpen(false);
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.businessUnit) params.append('business_unit', filters.businessUnit);
      if (filters.skills) params.append('skills', filters.skills);
      if (filters.currentLocation) params.append('current_location', filters.currentLocation);
      if (filters.noticePeriod) params.append('notice_period', filters.noticePeriod);
      if (filters.pipelineStatus) params.append('pipeline_status', filters.pipelineStatus);
      if (filters.sortField) params.append('sort_by', filters.sortField);
      if (filters.sortOrder) params.append('sort_order', filters.sortOrder);
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

  const handleImportSubmit = async () => {
    if (!importFile) {
      setImportError('Please select a file to import.');
      return;
    }
    setImporting(true);
    setImportError(null);
    setImportResult(null);
    try {
      const res = await importCandidates(importFile);
      setImportResult(res.data);
      loadCandidates();
    } catch (err) {
      console.error('Import error:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to import candidates.';
      setImportError(msg);
    } finally {
      setImporting(false);
    }
  };

  return (
    <PageContainer
      title="Candidates"
      subtitle={`${candidates.length} candidate${candidates.length !== 1 ? 's' : ''} registered`}
      actions={
        <div className="flex items-center gap-3">
          {/* Import Button */}
          {checkPermission('add_candidate') && (
            <Button
              variant="outline"
              icon={Upload}
              onClick={() => {
                setImportModalOpen(true);
                setImportFile(null);
                setImportResult(null);
                setImportError(null);
              }}
            >
              Import
            </Button>
          )}

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

          {checkPermission('add_candidate') && (
            <Button icon={UserPlus} onClick={() => navigate('/candidates/create')}>
              Add Candidate
            </Button>
          )}
        </div>
      }
    >
      <div className="flex flex-col gap-4 animate-fade-in">
        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <CandidateFilters
            filters={filters}
            onChange={setFilters}
            onClear={() => setFilters({ search: '', businessUnit: '', skills: '', currentLocation: '', noticePeriod: '', pipelineStatus: '', sortField: '', sortOrder: 'desc' })}
          />
        </div>

        {/* Table */}
        <CandidateTable
          candidates={candidates}
          loading={loading}
          onDelete={handleDeleteCandidate}
        />
      </div>

      {/* Import Modal */}
      {importModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 flex flex-col gap-5 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Upload size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Import Candidates</h3>
                  <p className="text-xs text-gray-500">Upload an Excel (.xlsx) or CSV file</p>
                </div>
              </div>
              <button
                onClick={() => setImportModalOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Template Download Banner */}
            <div className="flex items-center justify-between bg-blue-50/60 border border-blue-100/80 rounded-xl p-3.5">
              <div className="flex items-center gap-2 text-xs text-blue-800">
                <FileSpreadsheet size={16} className="text-blue-600" />
                <span>Need the format?</span>
              </div>
              <button
                onClick={downloadCandidateTemplate}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
              >
                <Download size={13} />
                Download Template
              </button>
            </div>

            {/* File Selector */}
            <div className="border-2 border-dashed border-gray-200 hover:border-blue-400 rounded-xl p-6 text-center cursor-pointer transition-colors relative bg-gray-50/50">
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setImportFile(e.target.files[0]);
                    setImportError(null);
                    setImportResult(null);
                  }
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center gap-2">
                <Upload size={28} className="text-gray-400" />
                <p className="text-sm font-semibold text-gray-700">
                  {importFile ? importFile.name : 'Click to select or drag & drop file'}
                </p>
                <p className="text-xs text-gray-400">Supported formats: .xlsx, .xls, .csv</p>
              </div>
            </div>

            {/* Error Banner */}
            {importError && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl p-3 text-xs text-red-700">
                <AlertCircle size={15} className="mt-0.5 shrink-0" />
                <span>{importError}</span>
              </div>
            )}

            {/* Result Banner */}
            {importResult && (
              <div className="flex flex-col gap-2 bg-emerald-50 border border-emerald-100 rounded-xl p-3.5 text-xs text-emerald-800">
                <div className="flex items-center gap-2 font-bold">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  <span>Imported {importResult.imported_count} of {importResult.total_rows} candidate(s)!</span>
                </div>
                {importResult.skipped_count > 0 && (
                  <p className="text-amber-700 text-[11px]">
                    {importResult.skipped_count} row(s) skipped due to missing required fields or existing email.
                  </p>
                )}
                {importResult.errors && importResult.errors.length > 0 && (
                  <div className="max-h-24 overflow-y-auto space-y-1 mt-1 text-[10px] text-gray-600 bg-white/70 p-2 rounded border border-emerald-200">
                    {importResult.errors.map((e, i) => (
                      <div key={i}>{e}</div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-100">
              <Button
                variant="ghost"
                onClick={() => setImportModalOpen(false)}
                disabled={importing}
              >
                Close
              </Button>
              <Button
                variant="primary"
                onClick={handleImportSubmit}
                disabled={!importFile || importing}
              >
                {importing ? 'Importing...' : 'Upload & Import'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
};

export default CandidateListPage;
