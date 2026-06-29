import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Settings, Percent, FileText, CheckCircle, AlertCircle, X, Save } from 'lucide-react';
import PageContainer from '../../components/layout/PageContainer';
import AccountsTable from './AccountsTable';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { 
  fetchAccounts, 
  fetchPayrollConfig, 
  updatePayrollConfig, 
  fetchPlacements, 
  fetchInvoices, 
  updateInvoice 
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
  
  // Configuration Modal State
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [configForm, setConfigForm] = useState({ pf_percentage: 12.0, tds_percentage: 10.0 });
  const [configSaving, setConfigSaving] = useState(false);
  
  // Invoice Edit Modal State
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [invoiceForm, setInvoiceForm] = useState({});
  const [invoiceSaving, setInvoiceSaving] = useState(false);

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
    
    setLoading(false);
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleEditAccountClick = (row) => {
    navigate(`/accounts/edit/${row.employee_id}`);
  };

  // ── CONFIGURATION DRAWER ACTIONS ─────────────────────────────
  
  const handleConfigSave = async (e) => {
    e.preventDefault();
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
    setInvoiceForm({
      invoice_number: invoice.invoice_number || '',
      invoice_date: invoice.invoice_date || '',
      billable_ctc: invoice.billable_ctc || 0.0,
      gross: invoice.gross || 0.0,
      cgst: invoice.cgst !== undefined ? invoice.cgst : 0.0,
      sgst: invoice.sgst !== undefined ? invoice.sgst : 0.0,
      igst: invoice.igst !== undefined ? invoice.igst : 0.0,
      tds_deduction: invoice.tds_deduction || 0.0,
      deduction: invoice.deduction || 0.0,
      received_amount: invoice.received_amount || 0.0,
      received_date: invoice.received_date || '',
      status: invoice.status || 'Pending'
    });
  };

  const handleInvoiceSave = async (e) => {
    e.preventDefault();
    if (invoiceSaving) return;
    setInvoiceSaving(true);
    try {
      const updated = await updateInvoice(editingInvoice.job_candidate_mapping_id, {
        invoice_number: invoiceForm.invoice_number,
        invoice_date: invoiceForm.invoice_date || null,
        billable_ctc: parseFloat(invoiceForm.billable_ctc) || 0.0,
        gross: parseFloat(invoiceForm.gross) || 0.0,
        cgst: parseFloat(invoiceForm.cgst) || 0.0,
        sgst: parseFloat(invoiceForm.sgst) || 0.0,
        igst: parseFloat(invoiceForm.igst) || 0.0,
        tds_deduction: parseFloat(invoiceForm.tds_deduction) || 0.0,
        deduction: parseFloat(invoiceForm.deduction) || 0.0,
        received_amount: parseFloat(invoiceForm.received_amount) || 0.0,
        received_date: invoiceForm.received_date || null,
        status: invoiceForm.status
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

  const filteredData = getFilteredData();

  return (
    <PageContainer
      title="Accounts Management"
      subtitle="Manage your employee accounting details, salary baseline structure, placements, payroll runs, and invoices."
      actions={
        <Button
          variant="secondary"
          onClick={() => setIsConfigOpen(true)}
          icon={Settings}
        >
          Set PF/TDS
        </Button>
      }
    >
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-6">
        
        {/* Tab Selector */}
        <div className="flex border-b border-gray-100 gap-2 overflow-x-auto pb-px">
          <button
            onClick={() => setActiveTab('baseline')}
            className={`px-4 py-2.5 font-semibold text-sm transition-all border-b-2 shrink-0 ${
              activeTab === 'baseline'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-200'
            }`}
          >
            Salary Baseline
          </button>
          <button
            onClick={() => setActiveTab('placements')}
            className={`px-4 py-2.5 font-semibold text-sm transition-all border-b-2 shrink-0 ${
              activeTab === 'placements'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-200'
            }`}
          >
            Recruitment Placements
          </button>
          <button
            onClick={() => setActiveTab('payroll')}
            className={`px-4 py-2.5 font-semibold text-sm transition-all border-b-2 shrink-0 ${
              activeTab === 'payroll'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-200'
            }`}
          >
            Payroll Calculations
          </button>
          <button
            onClick={() => setActiveTab('invoices')}
            className={`px-4 py-2.5 font-semibold text-sm transition-all border-b-2 shrink-0 ${
              activeTab === 'invoices'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-200'
            }`}
          >
            Invoicing & Billing
          </button>
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
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 text-sm">
            {error}
          </div>
        )}

        {/* Dynamic accounts tables depending on active tab */}
        <AccountsTable
          key={activeTab}
          activeTab={activeTab}
          data={filteredData}
          loading={loading}
          config={config}
          onEdit={handleEditAccountClick}
          onEditInvoice={handleEditInvoiceClick}
        />
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
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">PF Default Percentage (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={configForm.pf_percentage}
                    onChange={(e) => setConfigForm({ ...configForm, pf_percentage: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">TDS Default Percentage (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={configForm.tds_percentage}
                    onChange={(e) => setConfigForm({ ...configForm, tds_percentage: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  />
                </div>
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
                  label="Invoice Number (System Generated)"
                  value={invoiceForm.invoice_number}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, invoice_number: e.target.value })}
                />
                <Input
                  label="Invoice Date"
                  type="date"
                  value={invoiceForm.invoice_date}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, invoice_date: e.target.value })}
                />
                <Input
                  label="Billable CTC"
                  type="number"
                  step="0.01"
                  value={invoiceForm.billable_ctc}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, billable_ctc: e.target.value })}
                />
                <Input
                  label="Gross"
                  type="number"
                  step="0.01"
                  value={invoiceForm.gross}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, gross: e.target.value })}
                />
                <Input
                  label="CGST (%)"
                  type="number"
                  step="0.01"
                  value={invoiceForm.cgst}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, cgst: e.target.value })}
                />
                <Input
                  label="SGST (%)"
                  type="number"
                  step="0.01"
                  value={invoiceForm.sgst}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, sgst: e.target.value })}
                />
                <Input
                  label="IGST (%)"
                  type="number"
                  step="0.01"
                  value={invoiceForm.igst}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, igst: e.target.value })}
                />
                <Input
                  label="TDS Deduction"
                  type="number"
                  step="0.01"
                  value={invoiceForm.tds_deduction}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, tds_deduction: e.target.value })}
                />
                <Input
                  label="Other Deductions"
                  type="number"
                  step="0.01"
                  value={invoiceForm.deduction}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, deduction: e.target.value })}
                />
                <Input
                  label="Received Amount"
                  type="number"
                  step="0.01"
                  value={invoiceForm.received_amount}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, received_amount: e.target.value })}
                />
                <Input
                  label="Received Date"
                  type="date"
                  value={invoiceForm.received_date}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, received_date: e.target.value })}
                />
                <Select
                  label="Status"
                  options={[
                    { value: 'Pending', label: 'Pending' },
                    { value: 'Received', label: 'Received' },
                    { value: 'Not Served', label: 'Not Served' }
                  ]}
                  value={invoiceForm.status}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, status: e.target.value })}
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
    </PageContainer>
  );
};

export default AccountsPage;
