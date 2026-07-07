import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Settings, Percent, FileText, CheckCircle, AlertCircle, X, Save, Download, RefreshCw } from 'lucide-react';
import PageContainer from '../../components/layout/PageContainer';
import SalaryBaselineTab from './SalaryBaselineTab';
import PlacementsTab from './PlacementsTab';
import PayrollCalculationsTab from './PayrollCalculationsTab';
import OrganizationBillingTab from './OrganizationBillingTab';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import SortBy from '../../components/common/SortBy';
import { CANDIDATE_STATUS_OPTIONS, BILLING_STATUS_OPTIONS } from '../../utils/constants';
import {
  fetchAccounts,
  fetchPayrollConfig,
  updatePayrollConfig,
  fetchPlacements,
  fetchInvoices,
  updateInvoice,
  exportAccounts,
  closeMonth,
  fetchHistoryMonths,
  exportHistory
} from '../../api/accountsApi';

const AccountsPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('baseline'); // baseline, placements, payroll, invoices

  // Data States
  const [accounts, setAccounts] = useState([]);
  const [placements, setPlacements] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [config, setConfig] = useState({ pf_percentage: 12.0, tds_percentage: 10.0 });

  // UI States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchText, setSearchText] = useState('');
  const [sortField, setSortField] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');
  const [exporting, setExporting] = useState(false);
  const [historyMonths, setHistoryMonths] = useState([]);
  const [closingMonth, setClosingMonth] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedHistoryMonth, setSelectedHistoryMonth] = useState('');
  const [downloadingHistory, setDownloadingHistory] = useState(false);

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      await exportAccounts({
        tab: activeTab,
        search: searchText
      });
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to export data.');
    } finally {
      setExporting(false);
    }
  };

  const handleCloseMonth = async () => {
    if (!window.confirm("Are you sure you want to close and lock the current payroll month? This will snapshot the calculations, save them to the database history, and reset monthly variables (incentives, deductions, and loans) for the next cycle. This action cannot be undone.")) {
      return;
    }

    setClosingMonth(true);
    try {
      await closeMonth();
      alert("Payroll month closed successfully!");
      await loadAllData();
    } catch (err) {
      console.error('Failed to close month:', err);
      alert('Error closing payroll month. Please try again.');
    } finally {
      setClosingMonth(false);
    }
  };

  useEffect(() => {
    setSortField('');
    setSortOrder('desc');
  }, [activeTab]);

  // Configuration Modal State
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [configForm, setConfigForm] = useState({ pf_percentage: 12.0, tds_percentage: 10.0 });
  const [configSaving, setConfigSaving] = useState(false);
  const [configErrors, setConfigErrors] = useState({});

  // Invoice Edit Modal State
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [invoiceForm, setInvoiceForm] = useState({});
  const [invoiceSaving, setInvoiceSaving] = useState(false);
  const [invoiceErrors, setInvoiceErrors] = useState({});

  const loadAllData = async () => {
    setLoading(true);
    setError('');

    // 1. Load active accounts list
    try {
      const accountsData = await fetchAccounts();
      setAccounts(accountsData);
    } catch (err) {
      console.error('Failed to load accounts baseline:', err);
      setError('Failed to fetch accounts data from server.');
    }

    // 2. Load global configurations
    try {
      const configData = await fetchPayrollConfig();
      setConfig(configData);
      setConfigForm({ pf_percentage: configData.pf_percentage, tds_percentage: configData.tds_percentage });
    } catch (err) {
      console.error('Failed to load payroll configuration:', err);
    }

    // 3. Load recruitment placements
    try {
      const placementsData = await fetchPlacements();
      setPlacements(placementsData);
    } catch (err) {
      console.error('Failed to load placements:', err);
    }

    // 4. Load invoicing details
    try {
      const invoicesData = await fetchInvoices();
      setInvoices(invoicesData);
    } catch (err) {
      console.error('Failed to load invoices:', err);
    }

    // 5. Load history months
    try {
      const months = await fetchHistoryMonths();
      setHistoryMonths(months);
    } catch (err) {
      console.error('Failed to load history months:', err);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleEditAccountClick = (row, editType) => {
    navigate(`/accounts/edit/${row.employee_id}?editType=${editType || 'baseline'}`);
  };

  // ── CONFIGURATION DRAWER ACTIONS ─────────────────────────────

  const handleConfigSave = async (e) => {
    e.preventDefault();

    const errors = {};
    const pf = parseFloat(configForm.pf_percentage);
    const tds = parseFloat(configForm.tds_percentage);

    if (isNaN(pf) || pf < 0 || pf > 100) {
      errors.pf_percentage = 'PF percentage must be a valid number between 0 and 100';
    }
    if (isNaN(tds) || tds < 0 || tds > 100) {
      errors.tds_percentage = 'TDS percentage must be a valid number between 0 and 100';
    }

    if (Object.keys(errors).length > 0) {
      setConfigErrors(errors);
      return;
    }

    setConfigErrors({});
    setConfigSaving(true);
    try {
      const updated = await updatePayrollConfig({
        pf_percentage: parseFloat(configForm.pf_percentage),
        tds_percentage: parseFloat(configForm.tds_percentage)
      });
      setConfig(updated);
      setIsConfigOpen(false);
      // Reload calculations with new percentages
      const accountsData = await fetchAccounts();
      setAccounts(accountsData);
    } catch (err) {
      console.error('Failed to save config:', err);
      alert('Failed to save payroll configurations.');
    } finally {
      setConfigSaving(false);
    }
  };

  // ── INVOICE EDIT MODAL ACTIONS ────────────────────────────────

  const handleEditInvoiceClick = (invoice) => {
    setEditingInvoice(invoice);
    setInvoiceErrors({});
    setInvoiceForm({
      billable_ctc: invoice.billable_ctc || 0.0,
      gross: invoice.gross || 0.0,
      deduction: invoice.deduction || 0.0,
      received_amount: invoice.received_amount || 0.0,
      candidate_status: invoice.candidate_status || 'Candidate served',
      billing_status: invoice.billing_status || 'Pending'
    });
  };

  const handleInvoiceSave = async (e) => {
    e.preventDefault();
    if (invoiceSaving) return;

    // Validate Invoice
    const errors = {};

    const numericFields = [
      { name: 'billable_ctc', label: 'Billable CTC' },
      { name: 'gross', label: 'Gross' },
      { name: 'deduction', label: 'Other Deductions' },
      { name: 'received_amount', label: 'Received Amount' }
    ];

    numericFields.forEach(field => {
      const val = invoiceForm[field.name];
      if (val !== '' && val !== undefined && val !== null) {
        const numVal = parseFloat(val);
        if (isNaN(numVal)) {
          errors[field.name] = `${field.label} must be a valid number`;
        } else if (numVal < 0) {
          errors[field.name] = `${field.label} cannot be negative`;
        }
      }
    });

    if (Object.keys(errors).length > 0) {
      setInvoiceErrors(errors);
      return;
    }

    setInvoiceErrors({});
    setInvoiceSaving(true);
    try {
      const updated = await updateInvoice(editingInvoice.job_candidate_mapping_id, {
        billable_ctc: parseFloat(invoiceForm.billable_ctc) || 0.0,
        gross: parseFloat(invoiceForm.gross) || 0.0,
        deduction: parseFloat(invoiceForm.deduction) || 0.0,
        received_amount: parseFloat(invoiceForm.received_amount) || 0.0,
        candidate_status: invoiceForm.candidate_status,
        billing_status: invoiceForm.billing_status
      });

      // Update in local state list
      setInvoices((prev) =>
        prev.map((inv) =>
          inv.job_candidate_mapping_id === editingInvoice.job_candidate_mapping_id
            ? { ...inv, ...updated }
            : inv
        )
      );
      setEditingInvoice(null);
    } catch (err) {
      console.error('Failed to update invoice details:', err);
      alert('Failed to save invoice configuration.');
    } finally {
      setInvoiceSaving(false);
    }
  };

  // ── FILTERING DATA PER TAB ───────────────────────────────────

  const getFilteredData = () => {
    const searchLower = searchText.toLowerCase().trim();

    if (activeTab === 'baseline' || activeTab === 'payroll') {
      return accounts.filter((acc) => {
        if (!searchLower) return true;
        const fullName = `${acc.employee?.first_name || ''} ${acc.employee?.last_name || ''}`.toLowerCase();
        const empId = (acc.employee?.employee_id || '').toLowerCase();
        return fullName.includes(searchLower) || empId.includes(searchLower);
      });
    }

    if (activeTab === 'placements') {
      return placements.filter((pl) => {
        if (!searchLower) return true;
        const candidateName = (pl.candidate_name || '').toLowerCase();
        const candCode = (pl.candidate_code || '').toLowerCase();
        const orgName = (pl.organization_name || '').toLowerCase();
        return candidateName.includes(searchLower) || candCode.includes(searchLower) || orgName.includes(searchLower);
      });
    }

    if (activeTab === 'invoices') {
      return invoices.filter((inv) => {
        if (!searchLower) return true;
        const candidateName = (inv.candidate_name || '').toLowerCase();
        const invNum = (inv.invoice_number || '').toLowerCase();
        const orgName = (inv.organization_name || '').toLowerCase();
        return candidateName.includes(searchLower) || invNum.includes(searchLower) || orgName.includes(searchLower);
      });
    }

    return [];
  };

  const getSortOptions = () => {
    if (activeTab === 'baseline') {
      return [
        { label: 'Employee Name (A-Z)', value: 'employeeName:asc' },
        { label: 'Employee Name (Z-A)', value: 'employeeName:desc' },
        { label: 'Employee ID (Asc)', value: 'employee_id:asc' },
        { label: 'Employee ID (Desc)', value: 'employee_id:desc' },
        { label: 'Joining Date (Newest)', value: 'date_of_joining:desc' },
        { label: 'Joining Date (Oldest)', value: 'date_of_joining:asc' },
        { label: 'Basic Pay (High-Low)', value: 'basic_pay:desc' },
        { label: 'Basic Pay (Low-High)', value: 'basic_pay:asc' },
        { label: 'Offered CTC (High-Low)', value: 'ctc_offered:desc' },
        { label: 'Offered CTC (Low-High)', value: 'ctc_offered:asc' },
      ];
    }
    if (activeTab === 'placements') {
      return [
        { label: 'Candidate Name (A-Z)', value: 'candidate_name:asc' },
        { label: 'Candidate Name (Z-A)', value: 'candidate_name:desc' },
        { label: 'Approval Date (Newest)', value: 'approval_date:desc' },
        { label: 'Approval Date (Oldest)', value: 'approval_date:asc' },
        { label: 'Incentive (High-Low)', value: 'incentive:desc' },
        { label: 'Incentive (Low-High)', value: 'incentive:asc' },
        { label: 'Organization (A-Z)', value: 'organization_name:asc' },
        { label: 'Organization (Z-A)', value: 'organization_name:desc' },
      ];
    }
    if (activeTab === 'payroll') {
      return [
        { label: 'Employee Name (A-Z)', value: 'employeeName:asc' },
        { label: 'Employee Name (Z-A)', value: 'employeeName:desc' },
        { label: 'Employee ID (Asc)', value: 'employee_id:asc' },
        { label: 'Employee ID (Desc)', value: 'employee_id:desc' },
        { label: 'Net Salary Payout (High-Low)', value: 'net_salary_pay:desc' },
        { label: 'Net Salary Payout (Low-High)', value: 'net_salary_pay:asc' },
        { label: 'Unpaid Leaves (High-Low)', value: 'unpaid_leaves:desc' },
        { label: 'Unpaid Leaves (Low-High)', value: 'unpaid_leaves:asc' },
      ];
    }
    if (activeTab === 'invoices') {
      return [
        { label: 'Organization Name (A-Z)', value: 'organization_name:asc' },
        { label: 'Organization Name (Z-A)', value: 'organization_name:desc' },
        { label: 'Candidate Name (A-Z)', value: 'candidate_name:asc' },
        { label: 'Candidate Name (Z-A)', value: 'candidate_name:desc' },
        { label: 'Invoice Date (Newest)', value: 'invoice_date:desc' },
        { label: 'Invoice Date (Oldest)', value: 'invoice_date:asc' },
        { label: 'Billable Amount (High-Low)', value: 'billable_amount:desc' },
        { label: 'Billable Amount (Low-High)', value: 'billable_amount:asc' },
        { label: 'Balance Amount (High-Low)', value: 'balance_amount:desc' },
        { label: 'Balance Amount (Low-High)', value: 'balance_amount:asc' },
      ];
    }
    return [];
  };

  const getSortValue = (row, field) => {
    if (field === 'employeeName' || field === 'employee_name') {
      return `${row.employee?.first_name || row.employee_name || ''} ${row.employee?.last_name || ''}`.trim().toLowerCase();
    }
    if (field === 'date_of_joining' || field === 'candidate_joined_date') {
      const dateVal = row.employee?.date || row.employee?.date_of_joining || row.candidate_joined_date || row.approval_date;
      return dateVal ? new Date(dateVal).getTime() : 0;
    }
    if (field === 'approval_date' || field === 'received_date' || field === 'invoice_date') {
      const dateVal = row[field];
      return dateVal ? new Date(dateVal).getTime() : 0;
    }
    if (field === 'employee_id') {
      return row.employee?.employee_id || row.employee_id || '';
    }
    if (field === 'ctc_offered') {
      return Number(row.employee?.ctc || row.ctc_offered || 0);
    }
    if (field === 'compliance') {
      return row.employee?.compliance || '';
    }
    if (field === 'status') {
      return row.employee?.status || '';
    }
    if (field === 'month') {
      return row.candidate_joined_date ? new Date(row.candidate_joined_date).getTime() : 0;
    }
    if (field === 'cgst_amt') {
      return Number(row.gross || 0) * (Number(row.cgst || 0.0) / 100.0);
    }
    if (field === 'sgst_amt') {
      return Number(row.gross || 0) * (Number(row.sgst || 0.0) / 100.0);
    }
    if (field === 'igst_amt') {
      return Number(row.gross || 0) * (Number(row.igst || 0.0) / 100.0);
    }
    if (field === 'net_salary_pay') {
      return (row.basic_pay || 0) - (row.unpaid_leave_amount || 0) + (row.incentives || 0) + (row.additional_incentive || 0) + (row.client_incentive || 0) - (row.pf || 0) - (row.tds || 0) - (row.loan_deducted || 0) - (row.incentive_deducted || 0);
    }

    const val = row[field];
    if (typeof val === 'string') {
      const num = Number(val);
      if (!isNaN(num) && val.trim() !== '') return num;
      return val.toLowerCase();
    }
    return val;
  };

  const getSortedAndFilteredData = () => {
    const filtered = getFilteredData();
    if (!sortField) return filtered;

    return [...filtered].sort((a, b) => {
      const valA = getSortValue(a, sortField);
      const valB = getSortValue(b, sortField);

      if (valA === undefined || valA === null) return 1;
      if (valB === undefined || valB === null) return -1;

      if (valA < valB) {
        return sortOrder === 'asc' ? -1 : 1;
      }
      if (valA > valB) {
        return sortOrder === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  const filteredData = getSortedAndFilteredData();

  return (
    <PageContainer
      title="Accounts Management"
      subtitle="Manage your employee accounting details, salary baseline structure, placements, payroll runs, and invoices."
      actions={
        <div className="flex items-center gap-3">
          {activeTab === 'payroll' && (
            <Button
              variant="danger"
              onClick={handleCloseMonth}
              disabled={closingMonth || new Date().getDate() < 26}
              icon={RefreshCw}
              title={new Date().getDate() < 26 ? "Active on or after 26th of the month" : "Close current cycle and lock calculations"}
            >
              {closingMonth ? 'Locking...' : 'Lock & Refresh Month'}
            </Button>
          )}
          <Button
            variant="secondary"
            onClick={handleExportExcel}
            icon={Download}
            disabled={exporting}
          >
            {exporting ? 'Exporting...' : 'Export Excel'}
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setConfigForm({ pf_percentage: config.pf_percentage, tds_percentage: config.tds_percentage });
              setConfigErrors({});
              setIsConfigOpen(true);
            }}
            icon={Settings}
          >
            Set PF/TDS
          </Button>
        </div>
      }
    >
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-6">

        {/* Tab Selector & Download History */}
        <div className="flex justify-between items-center border-b border-gray-100 pb-px gap-4">
          <div className="flex gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('baseline')}
              className={`px-4 py-2.5 font-semibold text-sm transition-all border-b-2 shrink-0 ${activeTab === 'baseline'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-200'
                }`}
            >
              Employee Salary Baseline
            </button>
            <button
              onClick={() => setActiveTab('placements')}
              className={`px-4 py-2.5 font-semibold text-sm transition-all border-b-2 shrink-0 ${activeTab === 'placements'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-200'
                }`}
            >
              Candidates Hired For Organizations
            </button>
            <button
              onClick={() => setActiveTab('payroll')}
              className={`px-4 py-2.5 font-semibold text-sm transition-all border-b-2 shrink-0 ${activeTab === 'payroll'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-200'
                }`}
            >
              Payroll Calculations
            </button>
            <button
              onClick={() => setActiveTab('invoices')}
              className={`px-4 py-2.5 font-semibold text-sm transition-all border-b-2 shrink-0 ${activeTab === 'invoices'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-200'
                }`}
            >
              Organization Billing
            </button>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsHistoryModalOpen(true)}
            icon={Download}
            className="mb-1.5 shrink-0"
          >
            Download Payrolls
          </Button>
        </div>

        {/* Search Panel */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-3.5 text-gray-400" />
            <input
              type="text"
              placeholder={`Search by name, ID or details in ${activeTab}...`}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full pl-9 pr-4 h-11 text-sm bg-white border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-shadow"
            />
          </div>
          <SortBy
            options={getSortOptions()}
            sortField={sortField}
            sortOrder={sortOrder}
            onChange={(val) => {
              setSortField(val.sortField);
              setSortOrder(val.sortOrder);
            }}
          />
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 text-sm">
            {error}
          </div>
        )}

        {/* Dynamic accounts tables depending on active tab */}
        {activeTab === 'baseline' && (
          <SalaryBaselineTab
            data={filteredData}
            loading={loading}
            config={config}
            onEdit={handleEditAccountClick}
          />
        )}
        {activeTab === 'placements' && (
          <PlacementsTab
            data={filteredData}
            loading={loading}
          />
        )}
        {activeTab === 'payroll' && (
          <PayrollCalculationsTab
            data={filteredData}
            loading={loading}
            onEdit={handleEditAccountClick}
          />
        )}
        {activeTab === 'invoices' && (
          <OrganizationBillingTab
            data={filteredData}
            loading={loading}
            onEditInvoice={handleEditInvoiceClick}
          />
        )}
      </div>

      {/* ── PAYROLL CONFIGURATION DRAWER / MODAL ─────────────────── */}
      {isConfigOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-scale-up">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <Percent size={18} className="text-blue-600" />
                Set PF/TDS
              </h3>
              <button
                onClick={() => setIsConfigOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleConfigSave}>
              <div className="p-6 space-y-4">
                <p className="text-xs text-gray-500">
                  Update default PF and TDS deduction percentages applied dynamically across salary slips.
                </p>
                <Input
                  label="PF Default Percentage (%)"
                  type="number"
                  step="0.01"
                  required
                  value={configForm.pf_percentage}
                  onChange={(e) => {
                    setConfigForm({ ...configForm, pf_percentage: e.target.value });
                    setConfigErrors(prev => ({ ...prev, pf_percentage: '' }));
                  }}
                  error={configErrors.pf_percentage}
                />
                <Input
                  label="TDS Default Percentage (%)"
                  type="number"
                  step="0.01"
                  required
                  value={configForm.tds_percentage}
                  onChange={(e) => {
                    setConfigForm({ ...configForm, tds_percentage: e.target.value });
                    setConfigErrors(prev => ({ ...prev, tds_percentage: '' }));
                  }}
                  error={configErrors.tds_percentage}
                />
              </div>
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={() => setIsConfigOpen(false)}>Cancel</Button>
                <Button type="submit" loading={configSaving} icon={Save}>Save Settings</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── INVOICING DETAILS EDIT MODAL ───────────────────────── */}
      {editingInvoice && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl border border-gray-100 overflow-hidden my-8 animate-scale-up">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-50">
              <div className="flex flex-col">
                <h3 className="font-bold text-gray-800 flex items-center gap-2 text-base">
                  <FileText size={18} className="text-blue-600" />
                  Edit Invoice Configuration
                </h3>
                <span className="text-xs text-gray-500 mt-0.5">Candidate: {editingInvoice.candidate_name} | Org: {editingInvoice.organization_name}</span>
              </div>
              <button
                onClick={() => setEditingInvoice(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleInvoiceSave}>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">
                <Input
                  label="Billable CTC"
                  type="number"
                  step="0.01"
                  value={invoiceForm.billable_ctc}
                  onChange={(e) => {
                    setInvoiceForm({ ...invoiceForm, billable_ctc: e.target.value });
                    setInvoiceErrors(prev => ({ ...prev, billable_ctc: '' }));
                  }}
                  error={invoiceErrors.billable_ctc}
                />
                <Input
                  label="Gross"
                  type="number"
                  step="0.01"
                  value={invoiceForm.gross}
                  onChange={(e) => {
                    setInvoiceForm({ ...invoiceForm, gross: e.target.value });
                    setInvoiceErrors(prev => ({ ...prev, gross: '' }));
                  }}
                  error={invoiceErrors.gross}
                />
                <Input
                  label="Other Deductions"
                  type="number"
                  step="0.01"
                  value={invoiceForm.deduction}
                  onChange={(e) => {
                    setInvoiceForm({ ...invoiceForm, deduction: e.target.value });
                    setInvoiceErrors(prev => ({ ...prev, deduction: '' }));
                  }}
                  error={invoiceErrors.deduction}
                />
                <Input
                  label="Received Amount"
                  type="number"
                  step="0.01"
                  value={invoiceForm.received_amount}
                  onChange={(e) => {
                    setInvoiceForm({ ...invoiceForm, received_amount: e.target.value });
                    setInvoiceErrors(prev => ({ ...prev, received_amount: '' }));
                  }}
                  error={invoiceErrors.received_amount}
                />
                <Select
                  label="Candidate Status"
                  options={CANDIDATE_STATUS_OPTIONS}
                  value={invoiceForm.candidate_status}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, candidate_status: e.target.value })}
                />
                <Select
                  label="Billing Status"
                  options={BILLING_STATUS_OPTIONS}
                  value={invoiceForm.billing_status}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, billing_status: e.target.value })}
                />
              </div>
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={() => setEditingInvoice(null)}>Cancel</Button>
                <Button type="submit" loading={invoiceSaving} icon={Save}>Save Invoice</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DOWNLOAD PAST PAYROLLS MODAL ───────────────────────── */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-scale-up">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <Download size={18} className="text-blue-600" />
                Download Past Payrolls
              </h3>
              <button
                onClick={() => {
                  setIsHistoryModalOpen(false);
                  setSelectedHistoryMonth('');
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {historyMonths.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  No past payroll records found. Close a payroll cycle to see history.
                </p>
              ) : (
                <div className="space-y-3">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Select Month & Year
                  </label>
                  <select
                    value={selectedHistoryMonth}
                    onChange={(e) => setSelectedHistoryMonth(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-300 transition-all"
                  >
                    <option value="">-- Select Month-Year --</option>
                    {historyMonths.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setIsHistoryModalOpen(false);
                  setSelectedHistoryMonth('');
                }}
              >
                Cancel
              </Button>
              {historyMonths.length > 0 && (
                <Button
                  onClick={async () => {
                    if (!selectedHistoryMonth) {
                      alert("Please select a month first.");
                      return;
                    }
                    setDownloadingHistory(true);
                    try {
                      await exportHistory(selectedHistoryMonth);
                      setIsHistoryModalOpen(false);
                      setSelectedHistoryMonth('');
                    } catch (err) {
                      alert("Failed to download payroll for " + selectedHistoryMonth);
                    } finally {
                      setDownloadingHistory(false);
                    }
                  }}
                  disabled={!selectedHistoryMonth}
                  loading={downloadingHistory}
                  icon={Download}
                >
                  Download Excel
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
};

export default AccountsPage;
