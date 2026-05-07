import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Users } from 'lucide-react';
import PageContainer from '../../components/layout/PageContainer';
import EmployeeTable from '../../components/employees/EmployeeTable';
import { EMPLOYEE_STATUS_OPTIONS } from '../../utils/constants';
import { fetchEmployees, deleteEmployee } from '../../api/employeesApi';

const EmployeeListPage = () => {
  const navigate = useNavigate();

  // State
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Debounce search so we don't spam the API on every keystroke
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // 1. Debounce Logic
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500); // Wait 500ms after user stops typing
    return () => clearTimeout(timer);
  }, [search]);

  // 2. Fetch Data
  const loadEmployees = async () => {
    setLoading(true);
    try {
      // Build the params object. Only include what is necessary.
      const params = {};
      if (debouncedSearch) params.search = debouncedSearch;
      if (statusFilter !== 'ALL') params.status = statusFilter;

      const response = await fetchEmployees(params);
      setEmployees(response.data || []);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch whenever the debounced search or status filter changes
  useEffect(() => {
    loadEmployees();
  }, [debouncedSearch, statusFilter]);

  // 3. Handlers
  const handleEdit = (id) => {
    navigate(`/employees/edit/${id}`);
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this employee? This action cannot be undone.");
    if (!confirmDelete) return;

    try {
      await deleteEmployee(id);
      // Reload the list to show the employee is gone
      loadEmployees();
    } catch (error) {
      console.error('Failed to delete employee:', error);
      alert('Error deleting employee. Please try again.');
    }
  };

  return (
    <PageContainer>
      <div className="flex flex-col gap-6 animate-fade-in max-w-7xl mx-auto">
        
        {/* ── Page Header ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-600 text-white rounded-xl shadow-md shadow-blue-200">
              <Users size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Employees</h1>
              <p className="text-sm text-gray-500 font-medium">Manage your organization's workforce</p>
            </div>
          </div>
          
          <button
            onClick={() => navigate('/employees/create')}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white text-sm font-bold rounded-xl shadow-md hover:bg-blue-700 hover:shadow-lg focus:ring-4 focus:ring-blue-200 transition-all"
          >
            <Plus size={18} strokeWidth={3} />
            Add Employee
          </button>
        </div>

        {/* ── Filters Section ── */}
        <div className="flex flex-col md:flex-row gap-4">
          
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, ID, or designation..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all shadow-sm font-medium"
            />
            {search && (
              <button 
                onClick={() => setSearch('')}
                className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600 text-xs font-bold bg-gray-100 px-2 py-0.5 rounded-md"
              >
                CLEAR
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="relative w-full md:w-64">
            <Filter size={16} className="absolute left-4 top-3.5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl appearance-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all shadow-sm font-medium cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              {EMPLOYEE_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          
        </div>

        {/* ── Data Table ── */}
        {loading ? (
          <div className="flex justify-center items-center p-20 bg-white rounded-2xl border border-gray-100">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <EmployeeTable 
            employees={employees} 
            onEdit={handleEdit} 
            onDelete={handleDelete} 
          />
        )}

      </div>
    </PageContainer>
  );
};

export default EmployeeListPage;
