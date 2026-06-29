import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import PageContainer from '../../components/layout/PageContainer';
import AccountsTable from '../../components/accounts/AccountsTable';
import SortBy from '../../components/common/SortBy';
import Button from '../../components/common/Button';
import { fetchAccounts } from '../../api/accountsApi';

const AccountsPage = () => {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filter & Sort States
  const [searchText, setSearchText] = useState('');
  const [sortField, setSortField] = useState('employee_id');
  const [sortOrder, setSortOrder] = useState('asc');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchAccounts();
      setAccounts(data);
    } catch (err) {
      console.error('Failed to load accounts:', err);
      setError('Failed to fetch accounts data from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEditClick = (row) => {
    navigate(`/accounts/edit/${row.employee_id}`);
  };

  // ── FILTER & SORT LOGIC ───────────────────────────────────────
  
  // 1. Filter by Search Text (Employee ID or Full Name)
  const filteredAccounts = accounts.filter((acc) => {
    const searchLower = searchText.toLowerCase().trim();
    if (!searchLower) return true;

    const fullName = `${acc.employee?.first_name || ''} ${acc.employee?.last_name || ''}`.toLowerCase();
    const empId = (acc.employee?.employee_id || '').toLowerCase();

    return fullName.includes(searchLower) || empId.includes(searchLower);
  });

  // 2. Sort the filtered accounts
  const sortedAccounts = [...filteredAccounts].sort((a, b) => {
    if (!sortField) return 0;

    let valA, valB;

    if (sortField === 'employee_id') {
      valA = a.employee?.employee_id || '';
      valB = b.employee?.employee_id || '';
    } else if (sortField === 'first_name') {
      valA = `${a.employee?.first_name || ''} ${a.employee?.last_name || ''}`.trim().toLowerCase();
      valB = `${b.employee?.first_name || ''} ${b.employee?.last_name || ''}`.trim().toLowerCase();
    } else {
      valA = a[sortField] || 0;
      valB = b[sortField] || 0;
    }

    if (typeof valA === 'string') {
      return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    } else {
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    }
  });

  return (
    <PageContainer
      title="Accounts Management"
      subtitle="Manage your employee accounting details, salary breakdown, incentives, and deductions here."
    >
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-6">
        
        {/* Search & Sort Panel */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[240px]">
            <Search size={16} className="absolute left-3 top-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or Employee ID..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full pl-9 pr-4 h-11 text-sm bg-white border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-shadow"
            />
          </div>

          {/* Sort Dropdown */}
          <SortBy
            options={[
              { label: 'Employee ID (Ascending)', value: 'employee_id:asc' },
              { label: 'Employee ID (Descending)', value: 'employee_id:desc' },
              { label: 'Employee Name (A-Z)', value: 'first_name:asc' },
              { label: 'Employee Name (Z-A)', value: 'first_name:desc' },
              { label: 'Basic Salary (Low to High)', value: 'basic_pay:asc' },
              { label: 'Basic Salary (High to Low)', value: 'basic_pay:desc' },
              { label: 'Total Net Salary (Low to High)', value: 'total_net_payable_salary:asc' },
              { label: 'Total Net Salary (High to Low)', value: 'total_net_payable_salary:desc' },
            ]}
            sortField={sortField}
            sortOrder={sortOrder}
            onChange={(val) => {
              setSortField(val.sortField);
              setSortOrder(val.sortOrder);
            }}
          />

          {/* Clear Filters button */}
          {(searchText || sortField !== 'employee_id' || sortOrder !== 'asc') && (
            <Button
              variant="ghost"
              size="md"
              onClick={() => {
                setSearchText('');
                setSortField('employee_id');
                setSortOrder('asc');
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 text-sm">
            {error}
          </div>
        )}

        <AccountsTable
          accounts={sortedAccounts}
          loading={loading}
          onEdit={handleEditClick}
          onDelete={() => {}}
        />
      </div>
    </PageContainer>
  );
};

export default AccountsPage;
