import React from 'react';
import { Pencil, Calendar, AlertTriangle, CheckCircle, HelpCircle, Wallet, FileText } from 'lucide-react';
import Table from '../../components/common/Table';
import EmptyState from '../../components/common/EmptyState';

const OrganizationBillingTab = ({ data = [], loading = false, onEditInvoice }) => {
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

  const handlePrintBilling = (row) => {
    const printWindow = window.open('', '_blank', 'width=850,height=950');
    if (!printWindow) {
      alert('Pop-up blocker is preventing opening the billing invoice. Please allow pop-ups for this website.');
      return;
    }

    const gross = row.gross || 0;
    const cgstPct = row.cgst || 0;
    const sgstPct = row.sgst || 0;
    const igstPct = row.igst || 0;

    const cgstAmt = gross * (cgstPct / 100.0);
    const sgstAmt = gross * (sgstPct / 100.0);
    const igstAmt = gross * (igstPct / 100.0);
    const totalGst = cgstAmt + sgstAmt + igstAmt;
    const grandTotal = gross + totalGst;

    const invoiceDateStr = row.invoice_date ? new Date(row.invoice_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-') : '—';
    const dojStr = row.candidate_joined_date ? new Date(row.candidate_joined_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }).replace(/ /g, '-') : '—';

    const grandTotalWords = numberToWords(Math.round(grandTotal));

    const htmlContent = `
      <html>
      <head>
        <title>Tax Invoice - ${row.invoice_number || ''}</title>
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
            <p class="font-bold text-slate-900 text-sm">${row.organization_name || '—'}</p>
            <p class="text-slate-600">${row.location || '—'}</p>
            <p class="text-slate-700 font-medium mt-2"><span class="font-bold text-slate-500">State:</span> Maharashtra</p>
            <p class="text-slate-700 font-medium"><span class="font-bold text-slate-500">State Code:</span> 27</p>
            <p class="text-slate-900 font-bold font-mono text-blue-700 mt-2 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded w-fit"><span class="text-slate-500 font-semibold text-[10px] mr-1">GSTIN:</span>${row.gst_number || '—'}</p>
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
              <td class="border border-slate-300 py-2.5 font-bold font-mono text-blue-700">${row.invoice_number || '—'}</td>
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
            <tr>
              <td class="text-center font-medium">1</td>
              <td class="font-bold text-slate-850">${row.candidate_name || '—'}</td>
              <td class="font-medium">${row.job_designation || '—'}</td>
              <td class="text-center">${dojStr}</td>
              <td class="text-right font-mono font-bold">₹${Number(gross).toLocaleString()}</td>
            </tr>
            <!-- Empty rows to match premium layout height -->
            <tr>
              <td class="text-center">&nbsp;</td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
            </tr>
            <tr class="font-bold bg-slate-50/30 text-slate-800">
              <td colspan="4" class="text-right">Total</td>
              <td class="text-right font-mono text-slate-900">₹${Number(gross).toLocaleString()}</td>
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
                <td class="font-medium text-slate-700">CGST ${cgstPct}%</td>
                <td class="text-right font-mono font-medium">${cgstPct > 0 ? `₹${Number(cgstAmt.toFixed(2)).toLocaleString()}` : '—'}</td>
              </tr>
              <tr>
                <td class="font-medium text-slate-700">SGST ${sgstPct}%</td>
                <td class="text-right font-mono font-medium">${sgstPct > 0 ? `₹${Number(sgstAmt.toFixed(2)).toLocaleString()}` : '—'}</td>
              </tr>
              <tr>
                <td class="font-medium text-slate-700">IGST ${igstPct}%</td>
                <td class="text-right font-mono font-medium">${igstPct > 0 ? `₹${Number(igstAmt.toFixed(2)).toLocaleString()}` : '—'}</td>
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

  const formatMonth = (val) => {
    if (!val) return '—';
    try {
      const d = new Date(val);
      return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    } catch {
      return '—';
    }
  };

  const columns = [
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
        const isOverdue = invoiceDate && row.billing_status !== 'Received' && (new Date() > new Date(invoiceDate.getTime() + 30 * 24 * 60 * 60 * 1000));

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
      render: (_, row) => {
        const cgstAmt = (row.gross || 0) * ((row.cgst || 0.0) / 100.0);
        const sgstAmt = (row.gross || 0) * ((row.sgst || 0.0) / 100.0);
        const igstAmt = (row.gross || 0) * ((row.igst || 0.0) / 100.0);
        const totalGst = cgstAmt + sgstAmt + igstAmt;
        return <span className="font-medium text-gray-700">{formatCurrency(totalGst)}</span>;
      },
    },
    {
      key: 'billable_amount',
      header: 'Billable Amount',
      render: (_, row) => {
        const cgstAmt = (row.gross || 0) * ((row.cgst || 0.0) / 100.0);
        const sgstAmt = (row.gross || 0) * ((row.sgst || 0.0) / 100.0);
        const igstAmt = (row.gross || 0) * ((row.igst || 0.0) / 100.0);
        const totalGst = cgstAmt + sgstAmt + igstAmt;
        const billable = (row.gross || 0) + totalGst;
        return <span className="font-bold text-gray-800">{formatCurrency(billable)}</span>;
      },
    },
    {
      key: 'tds_deduction',
      header: 'TDS Deduction',
      render: (_, row) => {
        const igstAmt = (row.gross || 0) * ((row.igst || 0.0) / 100.0);
        const tdsAmt = igstAmt * 0.1;
        return <span className="text-rose-600 font-medium">{formatCurrency(tdsAmt)}</span>;
      },
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
      render: (_, row) => {
        const cgstAmt = (row.gross || 0) * ((row.cgst || 0.0) / 100.0);
        const sgstAmt = (row.gross || 0) * ((row.sgst || 0.0) / 100.0);
        const igstAmt = (row.gross || 0) * ((row.igst || 0.0) / 100.0);
        const totalGst = cgstAmt + sgstAmt + igstAmt;
        const billable = (row.gross || 0) + totalGst;
        const tds = igstAmt * 0.1;
        const bal = billable - tds - (row.deduction || 0) - (row.received_amount || 0);
        return <span className={`font-bold ${bal > 0 ? 'text-amber-600' : 'text-emerald-700'}`}>{formatCurrency(bal)}</span>;
      },
    },
    {
      key: 'received_date',
      header: 'Received Date',
      render: (val) => <span>{formatDate(val)}</span>,
    },
    {
      key: 'candidate_status',
      header: 'Candidate Status',
      render: (val) => (
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
          val === 'Candidate served' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
          val === 'Candidate not served' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
          'bg-amber-50 text-amber-700 border border-amber-100'
        }`}>
          {val || 'Candidate served'}
        </span>
      ),
    },
    {
      key: 'billing_status',
      header: 'Billing Status',
      render: (val) => (
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1 w-fit ${
          val === 'Received' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
          'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
        }`}>
          {val === 'Received' ? <CheckCircle size={10} /> : <Calendar size={10} />}
          {val || 'Pending'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEditInvoice && onEditInvoice(row)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
            title="Edit Invoice Details"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={() => handlePrintBilling(row)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
            title="Generate Billing"
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
          title="No invoice records found"
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

export default OrganizationBillingTab;
