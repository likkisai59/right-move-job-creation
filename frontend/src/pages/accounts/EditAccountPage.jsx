import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import PageContainer from '../../components/layout/PageContainer';
import Button from '../../components/common/Button';
import { fetchEmployeeById } from '../../api/employeesApi';
import { createAccount, updateAccount, fetchAccounts, fetchPayrollConfig } from '../../api/accountsApi';

const EditAccountPage = () => {
  const navigate = useNavigate();
  const { employeeId } = useParams(); // Database integer ID of the employee
  const queryParams = new URLSearchParams(window.location.search);
  const editType = queryParams.get('editType') || 'baseline';

  const [employee, setEmployee] = useState(null);
  const [hasAccount, setHasAccount] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const [config, setConfig] = useState({ pf_percentage: 12.0, tds_percentage: 10.0 });

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
    tds: 0.0,
    additional_incentive: 0,
    incentive_deducted: 0,
    loan_deducted: 0,
    total_gross_salary: 0,
  });

  useEffect(() => {
    const loadDetails = async () => {
      setLoading(true);
      setError('');
      try {
        // 1. Fetch employee details to show name & code
        const empRes = await fetchEmployeeById(employeeId);
        let employeeData = null;
        if (empRes.success) {
          setEmployee(empRes.data);
          employeeData = empRes.data;
        } else {
          setError('Failed to fetch employee details.');
          return;
        }

        // 2. Fetch payroll config
        let currentConfig = { pf_percentage: 12.0, tds_percentage: 10.0 };
        try {
          const configRes = await fetchPayrollConfig();
          if (configRes) {
            setConfig(configRes);
            currentConfig = configRes;
          }
        } catch (confErr) {
          console.error('Failed to load payroll configuration:', confErr);
        }

        // 3. Fetch all accounts and find if there is an existing record
        // (This is safer than calling direct fetch by employee ID which throws 404 when missing)
        const accountsData = await fetchAccounts();
        const existing = accountsData.find((acc) => acc.employee_id === parseInt(employeeId, 10));

        if (existing) {
          setHasAccount(existing.id !== null);
          const basicPayVal = existing.basic_pay || 0;
          const hraVal = existing.hra || 0;
          const unpaidLeavesVal = existing.unpaid_leaves || 0.0;
          const calculatedUnpaidLeaveAmount = Math.floor(basicPayVal / 30) * unpaidLeavesVal;
          const calculatedNetPayable = basicPayVal - calculatedUnpaidLeaveAmount;
          const totalPay = calculatedNetPayable + hraVal;
          const comp = employeeData?.compliance ? employeeData.compliance.trim().toUpperCase() : '';

          let calculatedPf = existing.pf;
          let calculatedTds = existing.tds;

          if (comp === 'PF') {
            calculatedPf = parseFloat((totalPay * (currentConfig.pf_percentage / 100.0)).toFixed(2));
            calculatedTds = 0.0;
          } else if (comp === 'TDS') {
            calculatedPf = 0.0;
            calculatedTds = parseFloat((totalPay * (currentConfig.tds_percentage / 100.0)).toFixed(2));
          } else {
            calculatedPf = 0.0;
            calculatedTds = 0.0;
          }

          const additionalIncentive = existing.additional_incentive || 0;
          const clientIncentive = existing.client_incentive || 0;
          const incentiveDeducted = existing.incentive_deducted || 0;
          const recruiterIncentive = existing.candidate_incentives || 0;

          const calculatedTotalNetPayable = calculatedNetPayable + recruiterIncentive;
          const deductionVal = existing.deduction_amount || 0;
          const calculatedGross = calculatedTotalNetPayable + additionalIncentive + clientIncentive - deductionVal;
          const loanDeducted = existing.loan_deducted || 0;
          const calculatedTotalGross = Math.floor(calculatedNetPayable + hraVal - calculatedPf - calculatedTds + additionalIncentive + clientIncentive - incentiveDeducted + recruiterIncentive - loanDeducted);

          setFormData({
            basic_pay: basicPayVal,
            hra: hraVal,
            loan_amount: existing.loan_amount || 0,
            client_incentive: clientIncentive,
            deduction_amount: deductionVal,
            unpaid_leaves: unpaidLeavesVal,
            unpaid_leave_amount: calculatedUnpaidLeaveAmount,
            net_payable_salary: calculatedNetPayable,
            ctc_offered: existing.ctc_offered || 0,
            incentives: existing.incentives || 0,
            candidate_incentives: recruiterIncentive,
            client_total: existing.client_total || 0,
            total_net_payable_salary: calculatedTotalNetPayable,
            gross_salary: calculatedGross,
            pf: calculatedPf,
            tds: calculatedTds,
            additional_incentive: additionalIncentive,
            incentive_deducted: incentiveDeducted,
            loan_deducted: loanDeducted,
            net_salary_pay: calculatedTotalGross,
          });
        } else {
          setHasAccount(false);
          // Pre-populate with default 0 calculations based on compliance
          const comp = employeeData?.compliance;
          setFormData((prev) => ({
            ...prev,
            pf: 0.0,
            tds: 0.0,
            net_salary_pay: 0,
          }));
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

    // Live validation
    let errorMsg = '';
    if (value !== '') {
      const numVal = parseFloat(value);
      if (isNaN(numVal)) {
        errorMsg = 'Must be a valid number';
      } else if (numVal < 0) {
        errorMsg = 'Value cannot be negative';
      }
    } else {
      if (name === 'basic_pay') {
        errorMsg = 'Basic Salary is required';
      }
    }
    setErrors((prevErr) => ({ ...prevErr, [name]: errorMsg }));

    setFormData((prev) => {
      const parsedValue = value === '' ? '' : (['total_leaves', 'pf', 'tds'].includes(name) ? parseFloat(value) || 0.0 : parseInt(value, 10) || 0);
      const updated = {
        ...prev,
        [name]: parsedValue,
      };

      // 1. Calculate basic_pay derived values (Unpaid Leave Amount and Net Payable Salary)
      const basicPayVal = name === 'basic_pay'
        ? (parsedValue === '' ? 0 : parsedValue)
        : (prev.basic_pay || 0);

      const unpaidLeavesVal = prev.unpaid_leaves || 0;
      const calculatedUnpaidLeaveAmount = Math.floor(basicPayVal / 30) * unpaidLeavesVal;
      updated.unpaid_leave_amount = calculatedUnpaidLeaveAmount;
      updated.net_payable_salary = basicPayVal - calculatedUnpaidLeaveAmount;

      // 2. Incentives are kept as recruiter incentives (from DB)
      const recruiterIncentive = prev.candidate_incentives || 0;
      updated.candidate_incentives = recruiterIncentive;
      updated.total_net_payable_salary = updated.net_payable_salary + recruiterIncentive;

      // 3. gross_salary = total_net_payable_salary + additional_incentive + client_incentive - deduction_amount
      const additionalIncentive = name === 'additional_incentive'
        ? (parsedValue === '' ? 0 : parsedValue)
        : (prev.additional_incentive || 0);
      const clientIncentive = name === 'client_incentive'
        ? (parsedValue === '' ? 0 : parsedValue)
        : (prev.client_incentive || 0);
      const deductionVal = name === 'deduction_amount'
        ? (parsedValue === '' ? 0 : parsedValue)
        : (prev.deduction_amount || 0);
      updated.gross_salary = updated.total_net_payable_salary + additionalIncentive + clientIncentive - deductionVal;

      // 4. Calculate PF and TDS based on compliance and basic/hra changes
      const hraVal = name === 'hra'
        ? (parsedValue === '' ? 0 : parsedValue)
        : (prev.hra || 0);
      const totalPay = updated.net_payable_salary + hraVal;
      const comp = employee?.compliance ? employee.compliance.trim().toUpperCase() : '';

      if (comp === 'PF') {
        updated.pf = parseFloat((totalPay * (config.pf_percentage / 100.0)).toFixed(2));
        updated.tds = 0.0;
      } else if (comp === 'TDS') {
        updated.pf = 0.0;
        updated.tds = parseFloat((totalPay * (config.tds_percentage / 100.0)).toFixed(2));
      } else {
        updated.pf = 0.0;
        updated.tds = 0.0;
      }

      // 5. Net Salary Payout = Calculated Basic Pay + HRA - PF - TDS + Additional Incentive + Client Incentive - Incentive Deducted + Candidate Incentives - Loan Deducted
      const loanDeducted = name === 'loan_deducted'
        ? (parsedValue === '' ? 0 : parsedValue)
        : (prev.loan_deducted || 0);
      const incentiveDeducted = name === 'incentive_deducted'
        ? (parsedValue === '' ? 0 : parsedValue)
        : (prev.incentive_deducted || 0);
      updated.net_salary_pay = Math.floor(
        updated.net_payable_salary + 
        hraVal - 
        updated.pf - 
        updated.tds + 
        additionalIncentive + 
        clientIncentive - 
        incentiveDeducted + 
        recruiterIncentive - 
        loanDeducted
      );

      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate all numeric fields on submit
    const newErrors = {};
    const fieldsToValidate = (editType === 'baseline' ? [
      { name: 'basic_pay', label: 'Basic Salary', required: true },
      { name: 'hra', label: 'HRA' }
    ] : [
      { name: 'loan_amount', label: 'Loan Amount' },
      { name: 'client_incentive', label: 'Client Incentive' },
      { name: 'deduction_amount', label: 'Deduction Amount' },
      { name: 'additional_incentive', label: 'Additional Incentive' },
      { name: 'incentive_deducted', label: 'Incentive Deducted' },
      { name: 'loan_deducted', label: 'Loan Deducted' }
    ]);

    fieldsToValidate.forEach((field) => {
      const val = formData[field.name];
      if (val === '' || val === undefined || val === null) {
        if (field.required) {
          newErrors[field.name] = `${field.label} is required`;
        }
      } else {
        const numVal = parseFloat(val);
        if (isNaN(numVal)) {
          newErrors[field.name] = `${field.label} must be a valid number`;
        } else if (numVal < 0) {
          newErrors[field.name] = `${field.label} cannot be negative`;
        }
      }
    });

    if (Object.values(newErrors).some((err) => err)) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setSaving(true);

    // Convert empty string values to default numeric values
    const sanitizedData = Object.keys(formData).reduce((acc, key) => {
      const val = formData[key];
      acc[key] = val === '' ? (['unpaid_leaves', 'pf', 'tds'].includes(key) ? 0.0 : 0) : val;
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
            {editType === 'baseline' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Basic Salary</label>
                <input
                  type="number"
                  name="basic_pay"
                  value={formData.basic_pay}
                  onChange={handleInputChange}
                  className={`border rounded-xl px-4 py-2.5 text-sm focus:ring-2 outline-none transition-all ${errors.basic_pay ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : 'border-gray-200 focus:border-blue-500 focus:ring-blue-100'
                    }`}
                  placeholder="Enter basic pay"
                  required
                />
                {errors.basic_pay && <span className="text-xs text-red-500 font-medium">{errors.basic_pay}</span>}
              </div>
            )}

            {/* HRA */}
            {editType === 'baseline' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">HRA</label>
                <input
                  type="number"
                  name="hra"
                  value={formData.hra}
                  onChange={handleInputChange}
                  className={`border rounded-xl px-4 py-2.5 text-sm focus:ring-2 outline-none transition-all ${errors.hra ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : 'border-gray-200 focus:border-blue-500 focus:ring-blue-100'
                    }`}
                  placeholder="Enter HRA"
                />
                {errors.hra && <span className="text-xs text-red-500 font-medium">{errors.hra}</span>}
              </div>
            )}

            {/* Loan Amount */}
            {editType === 'payroll' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Loan Amount</label>
                <input
                  type="number"
                  name="loan_amount"
                  value={formData.loan_amount}
                  onChange={handleInputChange}
                  className={`border rounded-xl px-4 py-2.5 text-sm focus:ring-2 outline-none transition-all ${errors.loan_amount ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : 'border-gray-200 focus:border-blue-500 focus:ring-blue-100'
                    }`}
                  placeholder="Enter loan amount"
                />
                {errors.loan_amount && <span className="text-xs text-red-500 font-medium">{errors.loan_amount}</span>}
              </div>
            )}

            {/* Client Incentive */}
            {editType === 'payroll' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Client Incentive</label>
                <input
                  type="number"
                  name="client_incentive"
                  value={formData.client_incentive}
                  onChange={handleInputChange}
                  className={`border rounded-xl px-4 py-2.5 text-sm focus:ring-2 outline-none transition-all ${errors.client_incentive ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : 'border-gray-200 focus:border-blue-500 focus:ring-blue-100'
                    }`}
                  placeholder="Enter client incentive"
                />
                {errors.client_incentive && <span className="text-xs text-red-500 font-medium">{errors.client_incentive}</span>}
              </div>
            )}

            {/* Deduction Amount */}
            {editType === 'payroll' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Deduction Amount</label>
                <input
                  type="number"
                  name="deduction_amount"
                  value={formData.deduction_amount}
                  onChange={handleInputChange}
                  className={`border rounded-xl px-4 py-2.5 text-sm focus:ring-2 outline-none transition-all ${errors.deduction_amount ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : 'border-gray-200 focus:border-blue-500 focus:ring-blue-100'
                    }`}
                  placeholder="Enter deductions"
                />
                {errors.deduction_amount && <span className="text-xs text-red-500 font-medium">{errors.deduction_amount}</span>}
              </div>
            )}

            {/* Additional Incentive */}
            {editType === 'payroll' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Additional Incentive</label>
                <input
                  type="number"
                  name="additional_incentive"
                  value={formData.additional_incentive}
                  onChange={handleInputChange}
                  className={`border rounded-xl px-4 py-2.5 text-sm focus:ring-2 outline-none transition-all ${errors.additional_incentive ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : 'border-gray-200 focus:border-blue-500 focus:ring-blue-100'
                    }`}
                  placeholder="Enter additional incentive"
                />
                {errors.additional_incentive && <span className="text-xs text-red-500 font-medium">{errors.additional_incentive}</span>}
              </div>
            )}

            {/* Incentive Deducted */}
            {editType === 'payroll' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Incentive Deducted</label>
                <input
                  type="number"
                  name="incentive_deducted"
                  value={formData.incentive_deducted}
                  onChange={handleInputChange}
                  className={`border rounded-xl px-4 py-2.5 text-sm focus:ring-2 outline-none transition-all ${errors.incentive_deducted ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : 'border-gray-200 focus:border-blue-500 focus:ring-blue-100'
                    }`}
                  placeholder="Enter incentive deducted"
                />
                {errors.incentive_deducted && <span className="text-xs text-red-500 font-medium">{errors.incentive_deducted}</span>}
              </div>
            )}

            {/* Loan Deducted */}
            {editType === 'payroll' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Loan Deducted</label>
                <input
                  type="number"
                  name="loan_deducted"
                  value={formData.loan_deducted}
                  onChange={handleInputChange}
                  className={`border rounded-xl px-4 py-2.5 text-sm focus:ring-2 outline-none transition-all ${errors.loan_deducted ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : 'border-gray-200 focus:border-blue-500 focus:ring-blue-100'
                    }`}
                  placeholder="Enter loan deducted"
                />
                {errors.loan_deducted && <span className="text-xs text-red-500 font-medium">{errors.loan_deducted}</span>}
              </div>
            )}
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
