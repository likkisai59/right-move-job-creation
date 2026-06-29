import React from 'react';
import { Pencil, Trash2, Wallet, Calendar, FileText, AlertTriangle, CheckCircle, HelpCircle } from 'lucide-react';
import Table from '../../components/common/Table';
import EmptyState from '../../components/common/EmptyState';
import Button from '../../components/common/Button';

const AccountsTable = ({ 
  activeTab = 'baseline', 
  data = [], 
  loading = false, 
  config = { pf_percentage: 12.0, tds_percentage: 10.0 }, 
  onEdit, 
  onDelete,
  onEditInvoice 
}) => {

  const numberToWords = (num) => {
    if (num <= 0) return 'Zero';
    const a = [
      '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
      'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
    ];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const g = ['', 'Thousand', 'Lakh', 'Crore']; // Indian numbering formatting is standard for INR

    const helper = (n) => {
      if (n < 20) return a[n];
      if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
      return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + helper(n % 100) : '');
    };

    let result = '';
    // Handle Crores
    if (Math.floor(num / 10000000) > 0) {
      result += helper(Math.floor(num / 10000000)) + ' Crore ';
      num %= 10000000;
    }
    // Handle Lakhs
    if (Math.floor(num / 100000) > 0) {
      result += helper(Math.floor(num / 100000)) + ' Lakh ';
      num %= 100000;
    }
    // Handle Thousands
    if (Math.floor(num / 1000) > 0) {
      result += helper(Math.floor(num / 1000)) + ' Thousand ';
      num %= 1000;
    }
    // Handle Remaining
    if (num > 0) {
      result += helper(Math.floor(num));
    }
    return result.trim() + ' Only';
  };

  const handlePrintSlip = (row) => {
    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (!printWindow) {
      alert('Pop-up blocker is preventing opening the slip. Please allow pop-ups for this website.');
      return;
    }
    
    const basicPay = row.basic_pay || 0;
    const incentives = row.incentives || 0;
    const grossEarnings = basicPay + incentives;
    
    const pf = row.pf || 0;
    const tds = row.tds || 0;
    const ld = row.ld || 0;
    const otherDeduction = row.deduction_amount || 0;
    const totalDeductions = pf + tds + ld + otherDeduction;
    const netSalary = grossEarnings - totalDeductions;
    
    const monthYear = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const netWords = numberToWords(netSalary);
    
    const htmlContent = `
      <html>
      <head>
        <title>Salary Slip - ${row.employee?.first_name || ''} ${row.employee?.last_name || ''}</title>
        <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
        <style>
          body { font-family: 'Outfit', 'Inter', sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          @media print {
            body { border: none !important; box-shadow: none !important; margin: 0 !important; padding: 1.5cm !important; }
            .no-print { display: none !important; }
          }
        </style>
      </head>
      <body class="p-8 max-w-4xl mx-auto border border-gray-200 my-8 rounded-xl shadow-lg bg-white relative">
        <div class="absolute right-8 top-8 no-print">
          <button onclick="window.print()" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 px-4 rounded shadow text-xs flex items-center gap-1 transition-all">
            Print Slip / Save PDF
          </button>
        </div>

        <div class="flex justify-between items-start mb-6 mt-4">
          <div>
            <h1 class="text-xl font-extrabold text-blue-900 tracking-tight">Right Move Staffing Solutions Pvt. Ltd</h1>
            <p class="text-xs text-gray-500 mt-1 font-medium">T-313, Ashoka Mall, Opp Sun-N-Sand, Bund Garden Rd, Pune - 411001</p>
            <p class="text-xs text-gray-400">www.rightmoveconsultants.com | CIN: U74999PN2018PTC177424</p>
          </div>
          <div class="text-right">
            <span class="text-4xl font-black text-blue-600 tracking-tighter">rm</span>
            <span class="text-[9px] font-extrabold text-slate-400 tracking-widest block uppercase mt-0.5">RIGHT MOVE</span>
          </div>
        </div>

        <h2 class="text-center text-md font-bold text-gray-800 uppercase tracking-widest border-b border-t border-gray-100 py-2 bg-slate-50/50 mb-6">Salary Slip</h2>

        <div class="grid grid-cols-2 gap-y-3.5 gap-x-8 text-xs mb-8 bg-slate-50/20 p-4 rounded-xl border border-gray-50">
          <div class="flex"><span class="w-36 font-semibold text-gray-500 uppercase tracking-wider">Employee ID:</span><span class="text-gray-900 font-bold font-mono text-blue-700 bg-blue-50/50 px-2 py-0.5 rounded border border-blue-100/50">${row.employee?.employee_id || '—'}</span></div>
          <div class="flex"><span class="w-36 font-semibold text-gray-500 uppercase tracking-wider">Employee Name:</span><span class="text-gray-900 font-semibold">${row.employee ? (row.employee.first_name + ' ' + row.employee.last_name) : '—'}</span></div>
          <div class="flex"><span class="w-36 font-semibold text-gray-500 uppercase tracking-wider">Department:</span><span class="text-gray-900">${row.employee?.assigned_business_unit || 'Recruitment'}</span></div>
          <div class="flex"><span class="w-36 font-semibold text-gray-500 uppercase tracking-wider">Designation:</span><span class="text-gray-900">${row.employee?.designation || '—'}</span></div>
          <div class="flex"><span class="w-36 font-semibold text-gray-500 uppercase tracking-wider">Month & Year:</span><span class="text-gray-900 font-medium">${monthYear}</span></div>
          <div class="flex"><span class="w-36 font-semibold text-gray-500 uppercase tracking-wider">UAN/PAN:</span><span class="text-gray-900 font-mono">${row.employee?.pan_number || '—'}</span></div>
          <div class="flex"><span class="w-36 font-semibold text-gray-500 uppercase tracking-wider">Account Number:</span><span class="text-gray-900 font-mono">${row.employee?.bank_account_number || '—'}</span></div>
          <div class="flex"><span class="w-36 font-semibold text-gray-500 uppercase tracking-wider">Bank Name:</span><span class="text-gray-900">${row.employee?.bank_name || '—'}</span></div>
        </div>

        <table class="w-full border-collapse border border-gray-200 mb-6 text-xs">
          <thead>
            <tr class="bg-slate-50 uppercase tracking-wider text-[10px] text-gray-500">
              <th class="border border-gray-200 px-4 py-2.5 text-left font-bold">Earnings</th>
              <th class="border border-gray-200 px-4 py-2.5 text-right font-bold w-36">Amount</th>
              <th class="border border-gray-200 px-4 py-2.5 text-left font-bold">Deductions</th>
              <th class="border border-gray-200 px-4 py-2.5 text-right font-bold w-36">Amount</th>
            </tr>
          </thead>
          <tbody class="text-gray-700">
            <tr>
              <td class="border border-gray-100 px-4 py-2.5">Basic Salary</td>
              <td class="border border-gray-100 px-4 py-2.5 text-right font-mono font-medium">₹${basicPay.toLocaleString()}</td>
              <td class="border border-gray-100 px-4 py-2.5">PF</td>
              <td class="border border-gray-100 px-4 py-2.5 text-right font-mono text-red-600 font-medium">₹${pf.toLocaleString()}</td>
            </tr>
            <tr>
              <td class="border border-gray-100 px-4 py-2.5">Incentives</td>
              <td class="border border-gray-100 px-4 py-2.5 text-right font-mono font-medium">₹${incentives.toLocaleString()}</td>
              <td class="border border-gray-100 px-4 py-2.5">TDS</td>
              <td class="border border-gray-100 px-4 py-2.5 text-right font-mono text-red-600 font-medium">₹${tds.toLocaleString()}</td>
            </tr>
            <tr>
              <td class="border border-gray-100 px-4 py-2.5"></td>
              <td class="border border-gray-100 px-4 py-2.5 text-right"></td>
              <td class="border border-gray-100 px-4 py-2.5">Leaves (Unpaid)</td>
              <td class="border border-gray-100 px-4 py-2.5 text-right font-mono text-red-600 font-medium">₹${ld.toLocaleString()}</td>
            </tr>
            <tr>
              <td class="border border-gray-100 px-4 py-2.5"></td>
              <td class="border border-gray-100 px-4 py-2.5 text-right"></td>
              <td class="border border-gray-100 px-4 py-2.5">Other Deductions</td>
              <td class="border border-gray-100 px-4 py-2.5 text-right font-mono text-red-600 font-medium">₹${otherDeduction.toLocaleString()}</td>
            </tr>
            <tr class="font-bold bg-slate-50/50">
              <td class="border border-gray-200 px-4 py-2.5 text-gray-800">Gross Salary</td>
              <td class="border border-gray-200 px-4 py-2.5 text-right font-mono text-gray-900">₹${grossEarnings.toLocaleString()}</td>
              <td class="border border-gray-200 px-4 py-2.5 text-gray-800">Total Deduction</td>
              <td class="border border-gray-200 px-4 py-2.5 text-right font-mono text-red-700">₹${totalDeductions.toLocaleString()}</td>
            </tr>
            <tr class="font-extrabold bg-blue-50 text-blue-900 text-sm">
              <td colspan="2" class="border border-gray-200 px-4 py-3"></td>
              <td class="border border-gray-200 px-4 py-3">NET Salary</td>
              <td class="border border-gray-200 px-4 py-3 text-right font-mono">₹${netSalary.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>

        <div class="space-y-2.5 text-xs mb-16 bg-slate-50/10 p-4 rounded-xl border border-gray-100">
          <p><span class="font-bold text-gray-500 uppercase tracking-wider w-36 inline-block">In words:</span> <span class="capitalize text-gray-800 font-semibold">${netWords}</span></p>
          <p><span class="font-bold text-gray-500 uppercase tracking-wider w-36 inline-block">Payment Type:</span> <span class="text-gray-800 font-semibold">NEFT</span></p>
          <p><span class="font-bold text-gray-500 uppercase tracking-wider w-36 inline-block">Total Working Days:</span> <span class="text-gray-800">31 Days</span></p>
        </div>

        <div class="text-center border-t border-gray-100 pt-5">
          <p class="text-[9px] text-gray-400 font-extrabold uppercase tracking-widest">This is a computer generated pay slip and does not require a signature.</p>
        </div>
      </body>
      </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const formatCurrency = (val) => {
    return val !== undefined && val !== null ? `₹${Number(val).toLocaleString()}` : '₹0';
  };

  const formatDate = (val) => {
    if (!val) return '—';
    try {
      return new Date(val).toLocaleDateString('en-GB');
    } catch {
      return val;
    }
  };

  // Helper to extract month name and year
  const formatMonth = (val) => {
    if (!val) return '—';
    try {
      const d = new Date(val);
      return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    } catch {
      return '—';
    }
  };

  const getColumns = () => {
    const srNoCol = {
      key: 'srNo',
      header: 'Sr. No.',
      render: (val) => <span className="text-gray-500 text-sm font-medium">{val}</span>,
    };

    if (activeTab === 'baseline') {
      return [
        srNoCol,
        {
          key: 'date_of_joining',
          header: 'Date',
          render: (_, row) => <span>{formatDate(row.employee?.date_of_joining)}</span>,
        },
        {
          key: 'employee_id',
          header: 'EMP ID',
          render: (_, row) => (
            <span className="font-mono text-xs text-blue-700 font-semibold bg-blue-50 px-2 py-1 rounded border border-blue-100">
              {row.employee?.employee_id || '—'}
            </span>
          ),
        },
        {
          key: 'employeeName',
          header: 'Employee Name',
          render: (_, row) => (
            <span className="font-medium text-gray-900">
              {row.employee ? `${row.employee.first_name || ''} ${row.employee.last_name || ''}`.trim() : '—'}
            </span>
          ),
        },
        {
          key: 'ctc_offered',
          header: 'CTC',
          render: (_, row) => <span>{formatCurrency(row.employee?.ctc || row.ctc_offered)}</span>,
        },
        {
          key: 'compliance',
          header: 'Compliance',
          render: (_, row) => (
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
              row.employee?.compliance === 'PF' ? 'bg-indigo-50 text-indigo-700' :
              row.employee?.compliance === 'TDS' ? 'bg-amber-50 text-amber-700' :
              'bg-gray-100 text-gray-600'
            }`}>
              {row.employee?.compliance || 'None'}
            </span>
          ),
        },
        {
          key: 'basic_pay',
          header: 'Basic Pay',
          render: (val) => <span>{formatCurrency(val)}</span>,
        },
        {
          key: 'hra',
          header: 'HRA',
          render: (val) => <span>{formatCurrency(val)}</span>,
        },
        {
          key: 'pf_or_tds_percentage',
          header: 'PF or TDS %',
          render: (_, row) => {
            const comp = row.employee?.compliance;
            const basic = Number(row.basic_pay) || 0;
            const hra = Number(row.hra) || 0;
            const total = basic + hra;
            if (comp === 'PF') {
              const val = total * ((config.pf_percentage || 12.0) / 100.0);
              return (
                <span className="font-medium text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded text-xs border border-indigo-100">
                  ₹{Math.floor(val).toLocaleString()} ({config.pf_percentage}% PF)
                </span>
              );
            }
            if (comp === 'TDS') {
              const val = total * ((config.tds_percentage || 10.0) / 100.0);
              return (
                <span className="font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded text-xs border border-amber-100">
                  ₹{Math.floor(val).toLocaleString()} ({config.tds_percentage}% TDS)
                </span>
              );
            }
            return <span className="text-gray-400 text-xs">—</span>;
          },
        },
        {
          key: 'status',
          header: 'Status',
          render: (_, row) => (
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
              row.employee?.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
            }`}>
              {row.employee?.status || 'Inactive'}
            </span>
          ),
        },
        {
          key: 'actions',
          header: 'Actions',
          render: (_, row) => (
            <div className="flex items-center gap-1">
              <button
                onClick={() => onEdit && onEdit(row)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                title="Edit Salary Structure"
              >
                <Pencil size={15} />
              </button>
              <button
                onClick={() => handlePrintSlip(row)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                title="Download Salary Slip"
              >
                <FileText size={15} />
              </button>
            </div>
          ),
        },
      ];
    }

    if (activeTab === 'placements') {
      return [
        srNoCol,
        {
          key: 'joining_date',
          header: 'Date',
          render: (val) => <span>{formatDate(val)}</span>,
        },
        {
          key: 'candidate_code',
          header: 'Candidate ID',
          render: (val) => <span className="font-mono text-xs text-blue-700 font-semibold bg-blue-50 px-2 py-1 rounded">{val || '—'}</span>,
        },
        {
          key: 'candidate_name',
          header: 'Candidate Name',
          render: (val) => <span className="font-medium text-gray-900">{val}</span>,
        },
        {
          key: 'organization_id',
          header: 'Org ID',
          render: (val) => <span className="font-mono text-xs text-gray-500">{val || '—'}</span>,
        },
        {
          key: 'organization_name',
          header: 'Organization Name',
          render: (val) => <span className="text-gray-800 text-sm">{val}</span>,
        },
        {
          key: 'location',
          header: 'Location',
          render: (val) => <span className="text-gray-600 text-sm">{val || '—'}</span>,
        },
        {
          key: 'job_designation',
          header: 'Job Designation',
          render: (val) => <span className="text-gray-600 text-sm font-medium">{val}</span>,
        },
        {
          key: 'incentive',
          header: 'Incentive',
          render: (val) => <span className="text-gray-600 text-sm font-semibold">{val ? `₹${Number(val).toLocaleString()}` : '—'}</span>,
        },
        {
          key: 'rate_card',
          header: 'Rate Card',
          render: (val) => <span className="text-gray-600 text-sm">{val || '—'}</span>,
        },
        {
          key: 'band',
          header: 'Band',
          render: (val) => <span className="text-gray-600 text-xs bg-gray-50 border px-2 py-0.5 rounded font-medium">{val || '—'}</span>,
        },
      ];
    }

    if (activeTab === 'payroll') {
      return [
        srNoCol,
        {
          key: 'date_of_joining',
          header: 'Date',
          render: (_, row) => <span>{formatDate(row.employee?.date_of_joining)}</span>,
        },
        {
          key: 'employee_id',
          header: 'EMP ID',
          render: (_, row) => (
            <span className="font-mono text-xs text-blue-700 font-semibold bg-blue-50 px-2 py-1 rounded">
              {row.employee?.employee_id || '—'}
            </span>
          ),
        },
        {
          key: 'employeeName',
          header: 'Employee Name',
          render: (_, row) => (
            <span className="font-medium text-gray-900">
              {row.employee ? `${row.employee.first_name || ''} ${row.employee.last_name || ''}`.trim() : '—'}
            </span>
          ),
        },
        {
          key: 'basic_pay',
          header: 'Basic Pay',
          render: (val) => <span>{formatCurrency(val)}</span>,
        },
        {
          key: 'pf',
          header: 'PF Amount',
          render: (val) => <span className="text-indigo-700 font-medium">{formatCurrency(val)}</span>,
        },
        {
          key: 'tds',
          header: 'TDS Amount',
          render: (val) => <span className="text-amber-700 font-medium">{formatCurrency(val)}</span>,
        },
        {
          key: 'incentives',
          header: 'Calculated Incentive',
          render: (val) => <span className="text-gray-600">{formatCurrency(val)}</span>,
        },
        {
          key: 'additional_incentive',
          header: 'Additional Incentive',
          render: (val) => <span className="text-gray-600">{formatCurrency(val)}</span>,
        },
        {
          key: 'loan_amount',
          header: 'Loan Amount',
          render: (val) => <span className="text-gray-600">{formatCurrency(val)}</span>,
        },
        {
          key: 'incentive_deducted',
          header: 'Incentive Deducted',
          render: (val) => <span className="text-rose-600">{formatCurrency(val)}</span>,
        },
        {
          key: 'loan_deducted',
          header: 'Loan Deducted',
          render: (val) => <span className="text-rose-600">{formatCurrency(val)}</span>,
        },
        {
          key: 'total_leaves',
          header: 'Unpaid Leaves',
          render: (val) => <span className="text-gray-600">{val || 0}</span>,
        },
        {
          key: 'ld',
          header: 'Unpaid Leave Amount',
          render: (val) => <span className="text-rose-600">{formatCurrency(val)}</span>,
        },
        {
          key: 'client_incentive',
          header: 'Client Incentive',
          render: (val) => <span className="text-gray-600">{formatCurrency(val)}</span>,
        },
        {
          key: 'net_salary_pay',
          header: 'Net Salary Payout',
          render: (_, row) => {
            const netPay = row.basic_pay - row.ld + row.incentives + (row.additional_incentive || 0) + (row.client_incentive || 0) - row.pf - row.tds - (row.loan_deducted || 0) - (row.incentive_deducted || 0);
            return <span className="text-emerald-700 font-extrabold text-sm">{formatCurrency(netPay)}</span>;
          },
        },
        {
          key: 'actions',
          header: 'Actions',
          render: (_, row) => (
            <div className="flex items-center gap-1">
              <button
                onClick={() => onEdit && onEdit(row)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                title="Edit salary configuration"
              >
                <Pencil size={15} />
              </button>
              <button
                onClick={() => handlePrintSlip(row)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                title="Download Salary Slip"
              >
                <FileText size={15} />
              </button>
            </div>
          ),
        },
      ];
    }

    if (activeTab === 'invoices') {
      return [
        {
          key: 'month',
          header: 'Month',
          render: (_, row) => <span>{formatMonth(row.candidate_joined_date)}</span>,
        },
        {
          key: 'candidate_joined_date',
          header: 'Candidate Joined Date',
          render: (val) => <span>{formatDate(val)}</span>,
        },
        {
          key: 'candidate_name',
          header: 'Candidate Name',
          render: (val) => <span className="font-semibold text-gray-900">{val}</span>,
        },
        {
          key: 'job_designation',
          header: 'Job Designation',
          render: (val) => <span className="text-gray-600 text-sm font-medium">{val}</span>,
        },
        {
          key: 'organization_name',
          header: 'Organization Name',
          render: (val) => <span className="text-gray-800 text-sm">{val}</span>,
        },
        {
          key: 'location',
          header: 'Location',
          render: (val) => <span className="text-gray-600 text-sm">{val || '—'}</span>,
        },
        {
          key: 'offered_ctc',
          header: 'Offered CTC',
          render: (val) => <span>{formatCurrency(val)}</span>,
        },
        {
          key: 'billable_ctc',
          header: 'Billable CTC',
          render: (val) => <span>{formatCurrency(val)}</span>,
        },
        {
          key: 'invoice_number',
          header: 'Invoice Number (System Generated)',
          render: (val) => <span className="font-mono text-xs font-bold text-gray-700 bg-slate-100 border px-2 py-0.5 rounded">{val || '—'}</span>,
        },
        {
          key: 'invoice_date',
          header: 'Invoice Date',
          render: (val, row) => {
            const invoiceDate = val ? new Date(val) : null;
            // Overdue indicator: if invoice date is more than 30 days old and status != 'Received'
            const isOverdue = invoiceDate && row.status !== 'Received' && (new Date() > new Date(invoiceDate.getTime() + 30 * 24 * 60 * 60 * 1000));
            
            return (
              <div className="flex items-center gap-1.5">
                <span>{formatDate(val)}</span>
                {isOverdue && (
                  <span className="flex items-center gap-0.5 text-[9px] font-extrabold text-red-600 bg-red-50 border border-red-200 px-1 rounded animate-pulse" title="Invoice payment due date exceeded (30+ days)">
                    <AlertTriangle size={10} />
                    OVERDUE
                  </span>
                )}
              </div>
            );
          },
        },
        {
          key: 'gst_number',
          header: 'GST Number',
          render: (val) => <span className="font-mono text-xs text-gray-600">{val || '—'}</span>,
        },
        {
          key: 'gross',
          header: 'Gross',
          render: (val) => <span>{formatCurrency(val)}</span>,
        },
        {
          key: 'cgst_amt',
          header: 'CGST',
          render: (_, row) => <span>{formatCurrency(row.gross * ((row.cgst || 0.0) / 100.0))}</span>,
        },
        {
          key: 'sgst_amt',
          header: 'SGST',
          render: (_, row) => <span>{formatCurrency(row.gross * ((row.sgst || 0.0) / 100.0))}</span>,
        },
        {
          key: 'igst_amt',
          header: 'IGST',
          render: (_, row) => <span>{formatCurrency(row.gross * ((row.igst || 0.0) / 100.0))}</span>,
        },
        {
          key: 'total_gst',
          header: 'Total GST',
          render: (val) => <span className="font-medium text-gray-700">{formatCurrency(val)}</span>,
        },
        {
          key: 'billable_amount',
          header: 'Billable Amount',
          render: (val) => <span className="font-bold text-gray-800">{formatCurrency(val)}</span>,
        },
        {
          key: 'tds_deduction',
          header: 'TDS Deduction',
          render: (val) => <span className="text-rose-600">{formatCurrency(val)}</span>,
        },
        {
          key: 'deduction',
          header: 'Deduction',
          render: (val) => <span className="text-rose-600">{formatCurrency(val)}</span>,
        },
        {
          key: 'received_amount',
          header: 'Received Amount',
          render: (val) => <span className="text-emerald-700 font-semibold">{formatCurrency(val)}</span>,
        },
        {
          key: 'balance_amount',
          header: 'Balance Amount',
          render: (val) => <span className={`font-bold ${val > 0 ? 'text-amber-600' : 'text-emerald-700'}`}>{formatCurrency(val)}</span>,
        },
        {
          key: 'received_date',
          header: 'Received Date',
          render: (val) => <span>{formatDate(val)}</span>,
        },
        {
          key: 'status',
          header: 'Status',
          render: (val) => (
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1 w-fit ${
              val === 'Received' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
              val === 'Not Served' ? 'bg-gray-100 text-gray-600 border border-gray-200' :
              'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
            }`}>
              {val === 'Received' ? <CheckCircle size={10} /> : val === 'Pending' ? <Calendar size={10} /> : <HelpCircle size={10} />}
              {val}
            </span>
          ),
        },
        {
          key: 'actions',
          header: 'Actions',
          render: (_, row) => (
            <button
              onClick={() => onEditInvoice && onEditInvoice(row)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
              title="Edit Invoice Details"
            >
              <Pencil size={15} />
            </button>
          ),
        },
      ];
    }

    return [];
  };

  if (!loading && data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <EmptyState
          icon={Wallet}
          title={`No ${activeTab} records found`}
          description="Wait for entries to load or verify your search details."
        />
      </div>
    );
  }

  // Pre-process data to inject serial numbers
  const processedData = data.map((item, index) => ({
    ...item,
    srNo: index + 1,
  }));

  return <Table key={activeTab} columns={getColumns()} data={processedData} loading={loading} />;
};

export default AccountsTable;
