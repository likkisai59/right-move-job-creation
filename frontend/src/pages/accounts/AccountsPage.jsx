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
  exportHistory,
  exportBillingHistory,
  exportCreditDetails
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
  const [isBillingHistoryModalOpen, setIsBillingHistoryModalOpen] = useState(false);
  const [selectedBillingHistoryMonth, setSelectedBillingHistoryMonth] = useState('');
  const [downloadingBillingHistory, setDownloadingBillingHistory] = useState(false);

  // Bank Credit details export states
  const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);
  const [selectedCreditBank, setSelectedCreditBank] = useState('');
  const [exportingCredit, setExportingCredit] = useState(false);

  // Organization-wise invoice generator states
  const [isGenerateInvoiceModalOpen, setIsGenerateInvoiceModalOpen] = useState(false);
  const [selectedInvoiceOrg, setSelectedInvoiceOrg] = useState('');
  const [invoiceOrgNumber, setInvoiceOrgNumber] = useState('');
  const [invoiceOrgDate, setInvoiceOrgDate] = useState(new Date().toISOString().split('T')[0]);
  const [invoiceOrgCgst, setInvoiceOrgCgst] = useState(0);
  const [invoiceOrgSgst, setInvoiceOrgSgst] = useState(0);
  const [invoiceOrgIgst, setInvoiceOrgIgst] = useState(18);
  const [selectedInvoiceCandidates, setSelectedInvoiceCandidates] = useState([]);

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

  useEffect(() => {
    if (!selectedInvoiceOrg) {
      setSelectedInvoiceCandidates([]);
      return;
    }
    const orgInvoices = invoices.filter(inv => inv.organization_name === selectedInvoiceOrg);
    setSelectedInvoiceCandidates(orgInvoices.map(inv => inv.id));
    
    if (orgInvoices.length > 0) {
      const first = orgInvoices[0];
      setInvoiceOrgCgst(first.cgst || 0);
      setInvoiceOrgSgst(first.sgst || 0);
      setInvoiceOrgIgst(first.igst || 18);
    }
  }, [selectedInvoiceOrg, invoices]);

  // Sync Invoice Number dynamically whenever Organization or Invoice Date changes!
  useEffect(() => {
    if (!selectedInvoiceOrg) return;
    
    // Find the first invoice of this organization to get the organization_id code
    const orgInvoices = invoices.filter(inv => inv.organization_name === selectedInvoiceOrg);
    let orgId = '';
    if (orgInvoices.length > 0) {
      const first = orgInvoices[0];
      if (first.organization_id) {
        orgId = first.organization_id;
      } else if (first.invoice_number) {
        const invParts = first.invoice_number.split('-');
        if (invParts.length >= 2) {
          orgId = invParts[1];
        }
      }
    }
    
    // Fallback if not found
    if (!orgId) {
      orgId = selectedInvoiceOrg.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    }
    
    let dateStr = '';
    if (invoiceOrgDate) {
      const parts = invoiceOrgDate.split('-'); // e.g. ["2026", "07", "19"]
      if (parts.length === 3) {
        dateStr = `${parts[2]}-${parts[1]}-${parts[0]}`; // "19-07-2026"
      }
    }
    
    if (!dateStr) {
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();
      dateStr = `${day}-${month}-${year}`;
    }
    
    setInvoiceOrgNumber(`INV-${orgId}-${dateStr}`);
  }, [selectedInvoiceOrg, invoiceOrgDate, invoices]);

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

  const numberToWords = (num) => {
    if (num <= 0) return 'Zero';
    const a = [
      '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
      'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
    ];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const helper = (n) => {
      if (n < 20) return a[n];
      if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
      return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + helper(n % 100) : '');
    };
    let result = '';
    if (Math.floor(num / 10000000) > 0) {
      result += helper(Math.floor(num / 10000000)) + ' Crore ';
      num %= 10000000;
    }
    if (Math.floor(num / 100000) > 0) {
      result += helper(Math.floor(num / 100000)) + ' Lakh ';
      num %= 100000;
    }
    if (Math.floor(num / 1000) > 0) {
      result += helper(Math.floor(num / 1000)) + ' Thousand ';
      num %= 1000;
    }
    if (num > 0) {
      result += helper(Math.floor(num));
    }
    return result.trim() + ' Only';
  };

  const handlePrintOrganizationInvoice = () => {
    const chosenInvoices = invoices.filter(inv => selectedInvoiceCandidates.includes(inv.id));
    if (chosenInvoices.length === 0) {
      alert("Please select at least one candidate to include in the invoice.");
      return;
    }

    const printWindow = window.open('', '_blank', 'width=850,height=950');
    if (!printWindow) {
      alert('Pop-up blocker is preventing opening the billing invoice. Please allow pop-ups for this website.');
      return;
    }

    const subtotal = chosenInvoices.reduce((sum, row) => sum + (row.gross || 0), 0);
    const cgstAmt = subtotal * (invoiceOrgCgst / 100.0);
    const sgstAmt = subtotal * (invoiceOrgSgst / 100.0);
    const igstAmt = subtotal * (invoiceOrgIgst / 100.0);
    const totalGst = cgstAmt + sgstAmt + igstAmt;
    const grandTotal = subtotal + totalGst;

    const invoiceDateStr = invoiceOrgDate ? new Date(invoiceOrgDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-') : '—';
    const grandTotalWords = numberToWords(Math.round(grandTotal));

    const firstRow = chosenInvoices[0];
    const receiverLocation = firstRow.location || '—';
    const receiverGstin = firstRow.gst_number || '—';

    const itemsHtml = chosenInvoices.map((row, index) => {
      const dojStr = row.candidate_joined_date ? new Date(row.candidate_joined_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }).replace(/ /g, '-') : '—';
      return `
        <tr>
          <td class="text-center font-medium">${index + 1}</td>
          <td class="font-bold text-slate-800">${row.candidate_name || '—'}</td>
          <td class="font-medium">${row.job_designation || '—'}</td>
          <td class="text-center">${dojStr}</td>
          <td class="text-right font-mono font-bold">₹${Number(row.gross || 0).toLocaleString()}</td>
        </tr>
      `;
    }).join('');

    const htmlContent = `
      <html>
      <head>
        <title>Tax Invoice - ${invoiceOrgNumber || ''}</title>
        <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
        <style>
          body { font-family: 'Outfit', 'Inter', sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; color: #1e293b; }
          .invoice-table th, .invoice-table td { border: 1px solid #cbd5e1; padding: 8px; }
          @media print {
            body { border: none !important; box-shadow: none !important; margin: 0 !important; padding: 1cm !important; }
            .no-print { display: none !important; }
          }
        </style>
      </head>
      <body class="p-8 max-w-4xl mx-auto border border-slate-200 my-8 rounded-2xl shadow-xl bg-white relative">
        <div class="absolute right-8 top-8 no-print">
          <button onclick="window.print()" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-5 rounded-xl shadow-md text-xs flex items-center gap-1.5 transition-all">
            Print Invoice / Save PDF
          </button>
        </div>

        <!-- Supplier Logo & Header -->
        <div class="flex justify-between items-start mb-6 mt-4">
          <div>
            <h1 class="text-lg font-bold text-slate-800 tracking-tight">RIGHT MOVE STAFFING SOLUTIONS PRIVATE LIMITED</h1>
            <p class="text-xs text-slate-500 font-medium">T-313 Ashoka Mall, Bund Garden Road, Pune 411001</p>
            <p class="text-xs text-slate-400">www.rightmoveconsultants.com</p>
          </div>
          <div class="text-right">
            <span class="text-3xl font-black text-blue-600 tracking-tighter">rm</span>
            <span class="text-[8px] font-extrabold text-slate-400 tracking-widest block uppercase mt-0.5">RIGHT MOVE</span>
            <span class="text-[7px] font-semibold text-slate-400 tracking-wider block">STAFFING SOLUTIONS</span>
          </div>
        </div>

        <h2 class="text-center text-sm font-bold text-slate-800 uppercase tracking-widest border border-slate-300 py-1.5 bg-slate-50 mb-4">TAX INVOICE</h2>

        <!-- Details of Billed to vs Supplier -->
        <div class="grid grid-cols-2 border border-slate-300 divide-x divide-slate-300 text-xs mb-4">
          <div class="p-4 space-y-1.5">
            <h3 class="font-bold text-slate-800 border-b pb-1 mb-2 uppercase tracking-wider text-[10px] text-slate-500">Details of Receiver (Billed To)</h3>
            <p class="font-bold text-slate-900 text-sm">${selectedInvoiceOrg || '—'}</p>
            <p class="text-slate-600">${receiverLocation}</p>
            <p class="text-slate-700 font-medium mt-2"><span class="font-bold text-slate-500">State:</span> Maharashtra</p>
            <p class="text-slate-700 font-medium"><span class="font-bold text-slate-500">State Code:</span> 27</p>
            <p class="text-slate-900 font-bold font-mono text-blue-700 mt-2 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded w-fit"><span class="text-slate-500 font-semibold text-[10px] mr-1">GSTIN:</span>${receiverGstin}</p>
          </div>
          <div class="p-4 space-y-1.5">
            <h3 class="font-bold text-slate-800 border-b pb-1 mb-2 uppercase tracking-wider text-[10px] text-slate-500">Details of Supplier</h3>
            <p class="font-bold text-slate-900 text-sm">RIGHT MOVE STAFFING SOLUTIONS PVT LTD</p>
            <p class="text-slate-600">T313, Ashoka Mall, Opp Hotel Sun And Sand,<br/>Bund Garden Road, Pune 411001</p>
            <p class="text-slate-700 font-medium mt-2"><span class="font-bold text-slate-500">State:</span> Maharashtra</p>
            <p class="text-slate-700 font-medium"><span class="font-bold text-slate-500">State Code:</span> 27</p>
            <p class="text-slate-900 font-bold font-mono text-blue-700 mt-2 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded w-fit"><span class="text-slate-500 font-semibold text-[10px] mr-1">GSTIN:</span>27AAJCR0207N1Z8</p>
          </div>
        </div>

        <p class="text-center font-bold text-slate-800 text-xs italic mb-4">"Original for recipient"</p>

        <!-- Invoice Meta Grid -->
        <table class="w-full border-collapse border border-slate-300 text-center text-xs mb-4">
          <thead>
            <tr class="bg-slate-50 font-bold text-slate-600">
              <th class="border border-slate-300 py-2">Date</th>
              <th class="border border-slate-300 py-2">Invoice No.</th>
              <th class="border border-slate-300 py-2">PAN No.</th>
              <th class="border border-slate-300 py-2">HSN / SAC Code</th>
            </tr>
          </thead>
          <tbody>
            <tr class="text-slate-800 font-medium">
              <td class="border border-slate-300 py-2.5">${invoiceDateStr}</td>
              <td class="border border-slate-300 py-2.5 font-bold font-mono text-blue-700">${invoiceOrgNumber || '—'}</td>
              <td class="border border-slate-300 py-2.5 font-mono">AAJCR0207N</td>
              <td class="border border-slate-300 py-2.5 font-mono">998512</td>
            </tr>
          </tbody>
        </table>

        <!-- Main Items Table -->
        <table class="w-full border-collapse border border-slate-300 text-xs text-left mb-4 invoice-table">
          <thead>
            <tr class="bg-slate-50 font-bold text-slate-600 text-center">
              <th class="w-16">Sr. No.</th>
              <th>Name</th>
              <th>Designation</th>
              <th class="w-28 text-center">DOJ</th>
              <th class="w-36 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
            <tr class="font-bold bg-slate-50/30 text-slate-800">
              <td colspan="4" class="text-right">Total</td>
              <td class="text-right font-mono text-slate-900">₹${Number(subtotal).toLocaleString()}</td>
            </tr>
          </tbody>
        </table>

        <!-- GST Breakup Section -->
        <div class="flex justify-end mb-4">
          <table class="w-80 border-collapse border border-slate-300 text-xs invoice-table">
            <thead>
              <tr class="bg-slate-50 font-bold text-slate-600 text-center">
                <th colspan="2">GST Breakup</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="font-medium text-slate-700">CGST ${invoiceOrgCgst}%</td>
                <td class="text-right font-mono font-medium">${invoiceOrgCgst > 0 ? `₹${Number(cgstAmt.toFixed(2)).toLocaleString()}` : '—'}</td>
              </tr>
              <tr>
                <td class="font-medium text-slate-700">SGST ${invoiceOrgSgst}%</td>
                <td class="text-right font-mono font-medium">${invoiceOrgSgst > 0 ? `₹${Number(sgstAmt.toFixed(2)).toLocaleString()}` : '—'}</td>
              </tr>
              <tr>
                <td class="font-medium text-slate-700">IGST ${invoiceOrgIgst}%</td>
                <td class="text-right font-mono font-medium">${invoiceOrgIgst > 0 ? `₹${Number(igstAmt.toFixed(2)).toLocaleString()}` : '—'}</td>
              </tr>
              <tr class="bg-slate-50/50 font-bold text-slate-800">
                <td>Total GST</td>
                <td class="text-right font-mono">₹${Number(totalGst.toFixed(2)).toLocaleString()}</td>
              </tr>
              <tr class="bg-slate-100 font-extrabold text-slate-900 text-sm">
                <td>Grand Total</td>
                <td class="text-right font-mono text-blue-900">₹${Number(Math.round(grandTotal)).toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Words and Bank Details -->
        <div class="border border-slate-300 p-4 rounded-xl text-xs space-y-3 mb-8">
          <p><span class="font-bold text-slate-500 uppercase tracking-wider">Amount in words:</span> <span class="font-bold text-slate-900">${grandTotalWords}</span></p>
          <div class="border-t pt-2.5 grid grid-cols-2 gap-4">
            <div>
              <h4 class="font-bold text-slate-500 uppercase tracking-wider mb-1.5">Bank Details</h4>
              <p class="font-medium text-slate-700"><span class="font-bold text-slate-500">Bank Name:</span> Kotak Mahindra Bank Ltd</p>
              <p class="font-medium text-slate-700"><span class="font-bold text-slate-500">A/c Holder:</span> Right Move Staffing Solutions Pvt Ltd</p>
              <p class="font-medium text-slate-700"><span class="font-bold text-slate-500">A/c Number:</span> 1000001313</p>
              <p class="font-medium text-slate-700"><span class="font-bold text-slate-500">IFSC Code:</span> KKBK0001986</p>
              <p class="font-medium text-slate-700"><span class="font-bold text-slate-500">Bank Add:</span> 266/B, Jawaharlal Nehru Rd, Bhawani Peth, Pune, Maharashtra 411042</p>
            </div>
            <div class="flex flex-col justify-end items-end text-right">
              <div class="mb-4">
                <span class="text-[9px] font-black text-slate-300 tracking-tighter block select-none">DIGITALLY SIGNED</span>
                <span class="font-bold text-slate-700 text-sm tracking-tight block">GURPREET SINGH WALIA</span>
                <span class="text-[8px] text-slate-400 block">Date: ${new Date().toLocaleDateString('en-GB')}</span>
              </div>
              <p class="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-t pt-2 w-full">Authorised Signature and Stamp</p>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="text-center border-t pt-5">
          <p class="text-[9px] text-slate-400 font-bold uppercase tracking-widest">RIGHT MOVE STAFFING SOLUTIONS PRIVATE LIMITED</p>
          <p class="text-[8px] text-slate-400">T-313 Ashoka Mall, Bund Garden Road, Pune 411001 | www.rightmoveconsultants.com</p>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    setIsGenerateInvoiceModalOpen(false);
    setSelectedInvoiceOrg('');
  };

  const filteredData = getSortedAndFilteredData();

  return (
    <PageContainer
      title="Accounts Management"
      subtitle="Manage your employee accounting details, salary baseline structure, placements, payroll runs, and invoices."
      actions={
        <div className="flex items-center gap-3">
          {['placements', 'payroll', 'invoices'].includes(activeTab) && (
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
        <div className="flex flex-col xl:flex-row xl:justify-between xl:items-center border-b border-gray-100 pb-3 gap-4">
          <div className="flex gap-2 overflow-x-auto pb-2 xl:pb-0">
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
          <div className="flex flex-wrap gap-2 justify-start xl:justify-end">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsHistoryModalOpen(true)}
              icon={Download}
              className="shrink-0"
            >
              Download salary payrolls
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsBillingHistoryModalOpen(true)}
              icon={Download}
              className="shrink-0"
            >
              Download organization billings
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsCreditModalOpen(true)}
              icon={Download}
              className="shrink-0"
            >
              Export Credit Details
            </Button>
          </div>
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
          {activeTab === 'invoices' && (
            <Button
              variant="primary"
              onClick={() => setIsGenerateInvoiceModalOpen(true)}
              icon={FileText}
              className="h-11 rounded-xl shrink-0 font-bold"
            >
              Generate Invoice
            </Button>
          )}
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

      {/* ── DOWNLOAD PAST BILLINGS MODAL ───────────────────────── */}
      {isBillingHistoryModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-scale-up">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <Download size={18} className="text-emerald-600" />
                Download Past Billings
              </h3>
              <button
                onClick={() => {
                  setIsBillingHistoryModalOpen(false);
                  setSelectedBillingHistoryMonth('');
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {historyMonths.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  No past billing records found. Close a cycle to see history.
                </p>
              ) : (
                <div className="space-y-3">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Select Month & Year
                  </label>
                  <select
                    value={selectedBillingHistoryMonth}
                    onChange={(e) => setSelectedBillingHistoryMonth(e.target.value)}
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
                  setIsBillingHistoryModalOpen(false);
                  setSelectedBillingHistoryMonth('');
                }}
              >
                Cancel
              </Button>
              {historyMonths.length > 0 && (
                <Button
                  onClick={async () => {
                    if (!selectedBillingHistoryMonth) {
                      alert("Please select a month first.");
                      return;
                    }
                    setDownloadingBillingHistory(true);
                    try {
                      await exportBillingHistory(selectedBillingHistoryMonth);
                      setIsBillingHistoryModalOpen(false);
                      setSelectedBillingHistoryMonth('');
                    } catch (err) {
                      alert("Failed to download billing for " + selectedBillingHistoryMonth);
                    } finally {
                      setDownloadingBillingHistory(false);
                    }
                  }}
                  disabled={!selectedBillingHistoryMonth}
                  loading={downloadingBillingHistory}
                  icon={Download}
                >
                  Download Excel
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── GENERATE ORGANIZATION INVOICE MODAL ───────────────── */}
      {isGenerateInvoiceModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-scale-up">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <FileText size={18} className="text-blue-600" />
                Generate Organization Invoice
              </h3>
              <button
                onClick={() => {
                  setIsGenerateInvoiceModalOpen(false);
                  setSelectedInvoiceOrg('');
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Select Organization */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Select Organization
                </label>
                <select
                  value={selectedInvoiceOrg}
                  onChange={(e) => setSelectedInvoiceOrg(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-300 transition-all font-semibold"
                >
                  <option value="">-- Select Organization --</option>
                  {[...new Set(invoices.map((inv) => inv.organization_name))].filter(Boolean).map((org) => (
                    <option key={org} value={org}>{org}</option>
                  ))}
                </select>
              </div>

              {selectedInvoiceOrg && (
                <>
                  {/* Invoice Details Row */}
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Invoice Number"
                      type="text"
                      value={invoiceOrgNumber}
                      onChange={(e) => setInvoiceOrgNumber(e.target.value)}
                    />
                    <Input
                      label="Invoice Date"
                      type="date"
                      value={invoiceOrgDate}
                      onChange={(e) => setInvoiceOrgDate(e.target.value)}
                    />
                  </div>

                  {/* GST breakups */}
                  <div className="grid grid-cols-3 gap-4">
                    <Input
                      label="CGST (%)"
                      type="number"
                      step="0.1"
                      value={invoiceOrgCgst}
                      onChange={(e) => setInvoiceOrgCgst(Number(e.target.value))}
                    />
                    <Input
                      label="SGST (%)"
                      type="number"
                      step="0.1"
                      value={invoiceOrgSgst}
                      onChange={(e) => setInvoiceOrgSgst(Number(e.target.value))}
                    />
                    <Input
                      label="IGST (%)"
                      type="number"
                      step="0.1"
                      value={invoiceOrgIgst}
                      onChange={(e) => setInvoiceOrgIgst(Number(e.target.value))}
                    />
                  </div>

                  {/* Candidates Checklist */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Select Candidates to Include
                    </label>
                    <div className="border border-gray-150 rounded-xl overflow-hidden divide-y divide-gray-100">
                      {invoices.filter((inv) => inv.organization_name === selectedInvoiceOrg).map((cand) => {
                        const isChecked = selectedInvoiceCandidates.includes(cand.id);
                        return (
                          <label
                            key={cand.id}
                            className="flex items-center gap-3 p-3 text-sm text-gray-700 hover:bg-slate-50 cursor-pointer transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  setSelectedInvoiceCandidates(prev => prev.filter(id => id !== cand.id));
                                } else {
                                  setSelectedInvoiceCandidates(prev => [...prev, cand.id]);
                                }
                              }}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <div className="flex-1">
                              <span className="font-semibold text-gray-800">{cand.candidate_name}</span>
                              <span className="text-gray-400 text-xs mx-2">•</span>
                              <span className="text-gray-500 text-xs">{cand.job_designation}</span>
                            </div>
                            <span className="font-bold text-gray-700 font-mono">₹{cand.gross?.toLocaleString()}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setIsGenerateInvoiceModalOpen(false);
                  setSelectedInvoiceOrg('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handlePrintOrganizationInvoice}
                disabled={!selectedInvoiceOrg || selectedInvoiceCandidates.length === 0}
                icon={FileText}
              >
                Print Invoice
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── EXPORT CREDIT DETAILS MODAL ───────────────────────── */}
      {isCreditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-scale-up">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <Download size={18} className="text-blue-600" />
                Export Credit Details
              </h3>
              <button
                onClick={() => {
                  setIsCreditModalOpen(false);
                  setSelectedCreditBank('');
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Select Bank (Export Rules)
                </label>
                <select
                  value={selectedCreditBank}
                  onChange={(e) => setSelectedCreditBank(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-300 transition-all font-semibold"
                >
                  <option value="">-- Select Bank --</option>
                  <option value="HDFC">HDFC Bank (Compliance: None)</option>
                  <option value="ICICI">ICICI Bank (Compliance: PF/TDS)</option>
                </select>
              </div>

              {selectedCreditBank && (
                <div className="bg-blue-50/50 rounded-xl p-3.5 border border-blue-100 text-xs text-blue-800 leading-relaxed">
                  <strong>Exporting to Excel:</strong> Beneficiary Name, Account Number, IFSC Code, and Net Payout amount for all employees matching the <strong>{selectedCreditBank}</strong> compliance filter.
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setIsCreditModalOpen(false);
                  setSelectedCreditBank('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (!selectedCreditBank) {
                    alert("Please select a bank first.");
                    return;
                  }
                  setExportingCredit(true);
                  try {
                    await exportCreditDetails(selectedCreditBank);
                    setIsCreditModalOpen(false);
                    setSelectedCreditBank('');
                  } catch (err) {
                    alert("Failed to export credit details for " + selectedCreditBank);
                  } finally {
                    setExportingCredit(false);
                  }
                }}
                disabled={!selectedCreditBank}
                loading={exportingCredit}
                icon={Download}
              >
                Export Excel
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
};

export default AccountsPage;
