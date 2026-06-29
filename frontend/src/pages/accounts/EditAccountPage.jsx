import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import PageContainer from '../../components/layout/PageContainer';
import Button from '../../components/common/Button';
import { fetchEmployeeById } from '../../api/employeesApi';
import { createAccount, updateAccount, fetchAccounts } from '../../api/accountsApi';

const EditAccountPage = () => {
  const navigate = useNavigate();
  const { employeeId } = useParams(); // Database integer ID of the employee
  
  const [employee, setEmployee] = useState(null);
  const [hasAccount, setHasAccount] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    basic_pay: 0,
    hra: 0,
    loan_amount: 0,
    client_incentive: 0,
    deduction_amount: 0,
    total_leaves: 0.0,
    ld: 0,
    net_payable_salary: 0,
    ctc_offered: 0,
    incentives: 0,
    client_total: 0,
    total_net_payable_salary: 0,
    gross_salary: 0,
    pf: 0.0,
    tdf: 0.0,
    total_gross_salary: 0,
  });

  useEffect(() => {
    const loadDetails = async () => {
      setLoading(true);
      setError('');
      try {
        // 1. Fetch employee details to show name & code
        const empRes = await fetchEmployeeById(employeeId);
        if (empRes.success) {
          setEmployee(empRes.data);
        } else {
          setError('Failed to fetch employee details.');
          return;
        }

        // 2. Fetch all accounts and find if there is an existing record
        // (This is safer than calling direct fetch by employee ID which throws 404 when missing)
        const accountsData = await fetchAccounts();
        const existing = accountsData.find((acc) => acc.employee_id === parseInt(employeeId, 10));
        
        if (existing) {
          setHasAccount(existing.id !== null);
          const basicPayVal = existing.basic_pay || 0;
          const totalLeavesVal = existing.total_leaves || 0.0;
          const calculatedLd = Math.floor(basicPayVal / 30) * totalLeavesVal;
          const calculatedNetPayable = basicPayVal - calculatedLd;
          const incentivesVal = existing.incentives || 0;
          const calculatedTotalNetPayable = calculatedNetPayable + incentivesVal;
          const deductionVal = existing.deduction_amount || 0;
          const calculatedGross = calculatedTotalNetPayable - deductionVal;

          setFormData({
            basic_pay: basicPayVal,
            hra: existing.hra || 0,
            loan_amount: existing.loan_amount || 0,
            client_incentive: existing.client_incentive || 0,
            deduction_amount: deductionVal,
            total_leaves: totalLeavesVal,
            ld: calculatedLd,
            net_payable_salary: calculatedNetPayable,
            ctc_offered: existing.ctc_offered || 0,
            incentives: incentivesVal,
            client_total: existing.client_total || 0,
            total_net_payable_salary: calculatedTotalNetPayable,
            gross_salary: calculatedGross,
            pf: existing.pf || 0.0,
            tdf: existing.tdf || 0.0,
            total_gross_salary: existing.total_gross_salary || 0,
          });
        } else {
          setHasAccount(false);
        }
      } catch (err) {
        console.error('Error loading account configuration:', err);
        setError('Error loading account data from the server.');
      } finally {
        setLoading(false);
      }
    };

    if (employeeId) {
      loadDetails();
    }
  }, [employeeId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const parsedValue = value === '' ? '' : (['total_leaves', 'pf', 'tdf'].includes(name) ? parseFloat(value) || 0.0 : parseInt(value, 10) || 0);
      const updated = {
        ...prev,
        [name]: parsedValue,
      };

      // 1. Calculate basic_pay derived values (LD and Net Payable Salary)
      const basicPayVal = name === 'basic_pay' 
        ? (parsedValue === '' ? 0 : parsedValue) 
        : (prev.basic_pay || 0);
        
      const totalLeavesVal = prev.total_leaves || 0;
      const calculatedLd = Math.floor(basicPayVal / 30) * totalLeavesVal;
      updated.ld = calculatedLd;
      updated.net_payable_salary = basicPayVal - calculatedLd;

      // 2. total_net_payable_salary = net_payable_salary + incentives
      const incentivesVal = prev.incentives || 0;
      updated.total_net_payable_salary = updated.net_payable_salary + incentivesVal;

      // 3. gross_salary = total_net_payable_salary - deduction_amount
      const deductionVal = name === 'deduction_amount' 
        ? (parsedValue === '' ? 0 : parsedValue) 
        : (prev.deduction_amount || 0);
      updated.gross_salary = updated.total_net_payable_salary - deductionVal;

      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    // Convert empty string values to default numeric values
    const sanitizedData = Object.keys(formData).reduce((acc, key) => {
      const val = formData[key];
      acc[key] = val === '' ? (['total_leaves', 'pf', 'tdf'].includes(key) ? 0.0 : 0) : val;
      return acc;
    }, {});

    try {
      if (!hasAccount) {
        // Create new account details
        await createAccount({
          employee_id: parseInt(employeeId, 10),
          ...sanitizedData,
        });
      } else {
        // Update existing account details
        await updateAccount(parseInt(employeeId, 10), sanitizedData);
      }
      navigate('/accounts');
    } catch (err) {
      console.error('Failed to save salary details:', err);
      alert('Failed to save salary configuration. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PageContainer title="Loading..." subtitle="Fetching employee account data">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center min-h-[300px]">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Edit Account Configuration"
      subtitle={employee ? `Configure payroll and salary details for ${employee.firstName} ${employee.lastName}` : 'Configure payroll details'}
      actions={
        <Button
          variant="secondary"
          onClick={() => navigate('/accounts')}
          icon={ArrowLeft}
        >
          Back to Accounts
        </Button>
      }
    >
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-6 max-w-5xl mx-auto">
        
        {/* Profile Summary banner */}
        <div className="bg-slate-50 p-4 rounded-xl border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-gray-800 text-sm">
              Employee Name: {employee ? `${employee.firstName} ${employee.lastName}` : '—'}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Designation: {employee?.designation || '—'} | BU: {employee?.assignedBusinessUnit || '—'}
            </p>
          </div>
          <div className="bg-white px-3 py-1.5 rounded-lg border border-gray-200 text-center shrink-0">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">EMP ID CODE</span>
            <span className="font-mono text-xs font-bold text-blue-700">{employee?.employeeId || '—'}</span>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 text-sm">
            {error}
          </div>
        )}
        
        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Basic Pay */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Basic Salary</label>
              <input
                type="number"
                name="basic_pay"
                value={formData.basic_pay}
                onChange={handleInputChange}
                className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                placeholder="Enter basic pay"
                required
              />
            </div>

            {/* HRA */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">HRA</label>
              <input
                type="number"
                name="hra"
                value={formData.hra}
                onChange={handleInputChange}
                className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                placeholder="Enter HRA"
              />
            </div>

            {/* Loan Amount */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Loan Amount</label>
              <input
                type="number"
                name="loan_amount"
                value={formData.loan_amount}
                onChange={handleInputChange}
                className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                placeholder="Enter loan amount"
              />
            </div>

            {/* Client Incentive */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Client Incentive</label>
              <input
                type="number"
                name="client_incentive"
                value={formData.client_incentive}
                onChange={handleInputChange}
                className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                placeholder="Enter client incentive"
              />
            </div>

            {/* Deduction Amount */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Deduction Amount</label>
              <input
                type="number"
                name="deduction_amount"
                value={formData.deduction_amount}
                onChange={handleInputChange}
                className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                placeholder="Enter deductions"
              />
            </div>


            {/* PF */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">PF</label>
              <input
                type="number"
                step="0.01"
                name="pf"
                value={formData.pf}
                onChange={handleInputChange}
                className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                placeholder="Enter PF"
              />
            </div>

            {/* TDF */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">TDF</label>
              <input
                type="number"
                step="0.01"
                name="tdf"
                value={formData.tdf}
                onChange={handleInputChange}
                className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                placeholder="Enter TDF"
              />
            </div>
          </div>

          {/* Form Actions Footer */}
          <div className="border-t border-gray-100 pt-5 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/accounts')}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-500 hover:text-gray-700 hover:bg-gray-50 border border-gray-200 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/10 flex items-center gap-1.5 transition-all disabled:bg-blue-400"
            >
              <Save size={16} />
              {saving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </form>
      </div>
    </PageContainer>
  );
};

export default EditAccountPage;
