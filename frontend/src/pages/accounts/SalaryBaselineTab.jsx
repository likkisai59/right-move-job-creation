import React from 'react';
import { Pencil, FileText, Wallet } from 'lucide-react';
import Table from '../../components/common/Table';
import EmptyState from '../../components/common/EmptyState';

const SalaryBaselineTab = ({ data = [], loading = false, config = { pf_percentage: 12.0, tds_percentage: 10.0 }, onEdit }) => {
  const numberToWords = (num) => {
    if (num <= 0) return 'Zero';
    const a = [
      '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
      'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
    ];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const g = ['', 'Thousand', 'Lakh', 'Crore'];

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

  const columns = [
    {
      key: 'srNo',
      header: 'Sr. No.',
      render: (val) => <span className="text-gray-500 text-sm font-medium">{val}</span>,
    },
    {
      key: 'baseline_status',
      header: 'Basic Pay & HRA Status',
      render: (_, row) => {
        let pct = 0;
        if (row.basic_pay > 0) pct += 50;
        if (row.hra > 0) pct += 50;
        return (
          <div className="flex flex-col gap-1 min-w-[120px]">
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-bold ${
                pct === 100 ? 'text-emerald-600' : pct === 50 ? 'text-amber-655' : 'text-rose-500'
              }`}>
                {pct}% Complete
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-300 ${
                  pct === 100 ? 'bg-emerald-500' : pct === 50 ? 'bg-amber-500' : 'bg-rose-400'
                }`} 
                style={{ width: `${pct}%` }} 
              />
            </div>
          </div>
        );
      },
    },
    {
      key: 'date_of_joining',
      header: 'Joining date',
      render: (_, row) => <span>{formatDate(row.employee?.date || row.employee?.date_of_joining)}</span>,
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
      render: (_, row) => {
        const comp = row.employee?.compliance ? row.employee.compliance.trim().toUpperCase() : '';
        return (
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${comp === 'PF' ? 'bg-indigo-50 text-indigo-700' :
            comp === 'TDS' ? 'bg-amber-50 text-amber-700' :
              'bg-gray-100 text-gray-600'
            }`}>
            {row.employee?.compliance || 'None'}
          </span>
        );
      },
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
        const comp = row.employee?.compliance ? row.employee.compliance.trim().toUpperCase() : '';
        if (comp === 'PF') {
          return (
            <span className="font-medium text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded text-xs border border-indigo-100">
              {config.pf_percentage}% PF
            </span>
          );
        }
        if (comp === 'TDS') {
          return (
            <span className="font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded text-xs border border-amber-100">
              {config.tds_percentage}% TDS
            </span>
          );
        }
        return <span className="text-gray-400 text-xs">None</span>;
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (_, row) => (
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${row.employee?.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
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
            onClick={() => onEdit && onEdit(row, 'baseline')}
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

  if (!loading && data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <EmptyState
          icon={Wallet}
          title="No baseline records found"
          description="Wait for entries to load or verify your search details."
        />
      </div>
    );
  }

  const processedData = data.map((item, index) => ({
    ...item,
    srNo: index + 1,
  }));

  return <Table columns={columns} data={processedData} loading={loading} />;
};

export default SalaryBaselineTab;
