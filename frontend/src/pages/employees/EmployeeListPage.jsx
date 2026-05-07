import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Search, Filter } from 'lucide-react';
import PageContainer from '../../components/layout/PageContainer';
import Button from '../../components/common/Button';
import EmployeeTable from '../../components/employees/EmployeeTable';
import { EMPLOYEE_STATUS_OPTIONS } from '../../utils/constants';
import { fetchEmployees, deleteEmployee } from '../../api/employeesApi';

const EmployeeListPage = () => {
  const navigate = useNavigate();

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const loadEmployees = async () => {
    setLoading(true);
    try {
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

  useEffect(() => {
    loadEmployees();
  }, [debouncedSearch, statusFilter]);

  const handleEdit = (id) => {
    navigate(`/employees/edit/${id}`);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this employee? This action cannot be undone.")) {
      return;
    }

    try {
      setLoading(true);
      await deleteEmployee(id);
      await loadEmployees();
    } catch (error) {
      console.error('Failed to delete employee:', error);
      alert('Error deleting employee. Please try again.');
      setLoading(false);
    }
  };

  return (
    <PageContainer
      title="Employees"
      subtitle={`${employees.length} employee${employees.length !== 1 ? 's' : ''} in the system`}
      actions={
        <div className="flex items-center gap-3">
          <Button onClick={() => navigate('/employees/create')} icon={UserPlus}>
            Add Employee
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        {/* Simple inline filters to match the page style */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, ID, or designation..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-shadow"
            />
          </div>

          <div className="relative w-full md:w-64">
            <Filter size={16} className="absolute left-3 top-2.5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-lg appearance-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-shadow cursor-pointer"
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

        <EmployeeTable 
          employees={employees} 
          loading={loading}
          onEdit={handleEdit} 
          onDelete={handleDelete} 
        />
      </div>
    </PageContainer>
  );
};

export default EmployeeListPage;
