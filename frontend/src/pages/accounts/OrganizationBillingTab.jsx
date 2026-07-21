import React from 'react';
import { Pencil, Calendar, AlertTriangle, CheckCircle, HelpCircle, Wallet } from 'lucide-react';
import Table from '../../components/common/Table';
import EmptyState from '../../components/common/EmptyState';

const OrganizationBillingTab = ({ data = [], loading = false, onEditInvoice }) => {
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
