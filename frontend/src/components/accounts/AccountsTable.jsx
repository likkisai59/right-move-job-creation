import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil, Trash2, Wallet } from 'lucide-react';
import Table from '../common/Table';
import EmptyState from '../common/EmptyState';
import Button from '../common/Button';

const AccountsTable = ({ accounts = [], loading = false, onEdit, onDelete }) => {
  const navigate = useNavigate();

  const columns = [
    {
      key: 'srNo',
      header: 'Sr. No.',
      render: (val) => <span className="text-gray-500 text-sm font-medium">{val}</span>,
    },
    {
      key: 'employeeIdCode',
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
      key: 'basic_pay',
      header: 'Basic Salary',
      render: (val) => <span className="text-gray-600 text-sm">{val ? `₹${val.toLocaleString()}` : '₹0'}</span>,
    },
    {
      key: 'total_leaves',
      header: 'Total Leaves',
      render: (val) => <span className="text-gray-600 text-sm">{val !== undefined ? val : '0'}</span>,
    },
    {
      key: 'ld',
      header: 'LD',
      render: (_, row) => {
        const basicPay = row.basic_pay || 0;
        const totalLeaves = row.total_leaves || 0;
        const calculatedLd = Math.floor(basicPay / 30) * totalLeaves;
        return <span className="text-gray-600 text-sm">{calculatedLd ? `₹${calculatedLd.toLocaleString()}` : '₹0'}</span>;
      },
    },
    {
      key: 'net_payable_salary',
      header: 'Net Payable Salary',
      render: (_, row) => {
        const basicPay = row.basic_pay || 0;
        const totalLeaves = row.total_leaves || 0;
        const calculatedLd = Math.floor(basicPay / 30) * totalLeaves;
        const netPayable = basicPay - calculatedLd;
        return <span className="text-gray-900 font-bold text-sm">{netPayable ? `₹${netPayable.toLocaleString()}` : '₹0'}</span>;
      },
    },
    {
      key: 'ctc_offered',
      header: 'CTC Offered',
      render: (val) => <span className="text-gray-600 text-sm">{val ? `₹${val.toLocaleString()}` : '₹0'}</span>,
    },
    {
      key: 'incentives',
      header: 'Incentives',
      render: (val) => <span className="text-gray-600 text-sm">{val ? `₹${val.toLocaleString()}` : '₹0'}</span>,
    },
    {
      key: 'client_total',
      header: 'Client Total',
      render: (val) => <span className="text-gray-600 text-sm">{val ? `₹${val.toLocaleString()}` : '₹0'}</span>,
    },
    {
      key: 'total_net_payable_salary',
      header: 'Total Net Payable Salary',
      render: (val) => <span className="text-emerald-700 font-extrabold text-sm">{val ? `₹${val.toLocaleString()}` : '₹0'}</span>,
    },
    {
      key: 'deduction_amount',
      header: 'Deduction Amount',
      render: (val) => <span className="text-gray-600 text-sm">{val ? `₹${val.toLocaleString()}` : '₹0'}</span>,
    },
    {
      key: 'gross_salary',
      header: 'Gross Salary',
      render: (val) => <span className="text-gray-600 text-sm">{val ? `₹${val.toLocaleString()}` : '₹0'}</span>,
    },

    {
      key: 'total_gross_salary',
      header: 'Total Gross Salary',
      render: (val) => <span className="text-gray-600 text-sm">{val ? `₹${val.toLocaleString()}` : '₹0'}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit && onEdit(row);
            }}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            title="Edit accounts"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete && onDelete(row.id);
            }}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Delete accounts"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ];

  if (!loading && accounts.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <EmptyState
          icon={Wallet}
          title="No accounts records found"
          description="Create accounts details for employees to get started"
        />
      </div>
    );
  }

  // Pre-process data to inject serial numbers
  const processedData = accounts.map((item, index) => ({
    ...item,
    srNo: index + 1,
  }));

  return <Table columns={columns} data={processedData} loading={loading} />;
};

export default AccountsTable;
