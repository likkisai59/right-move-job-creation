import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Search, Filter, Download } from 'lucide-react';
import PageContainer from '../../components/layout/PageContainer';
import Button from '../../components/common/Button';
import EmployeeTable from '../../components/employees/EmployeeTable';
import { EMPLOYEE_STATUS_OPTIONS, EMPLOYEE_DESIGNATION_OPTIONS, EMPLOYEE_BLOOD_GROUP_OPTIONS } from '../../utils/constants';
import { fetchEmployees, deleteEmployee, exportEmployees } from '../../api/employeesApi';

const EmployeeListPage = () => {
  const navigate = useNavigate();

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  
  const [filters, setFilters] = useState({
    search: '',
    status: 'ALL',
    designation: 'ALL',
    bloodGroup: 'ALL',
    minPackage: '',
    maxPackage: ''
  });
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 500);
    return () => clearTimeout(timer);
  }, [filters.search]);

  const loadEmployees = async () => {
    setLoading(true);
    try {
      const params = {};
      if (debouncedSearch) params.search = debouncedSearch;
      if (filters.status !== 'ALL') params.status = filters.status;
      if (filters.designation !== 'ALL') params.designation = filters.designation;
      if (filters.bloodGroup !== 'ALL') params.blood_group = filters.bloodGroup;
      if (filters.minPackage) params.min_package = filters.minPackage;
      if (filters.maxPackage) params.max_package = filters.maxPackage;

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
  }, [debouncedSearch, filters.status, filters.designation, filters.bloodGroup, filters.minPackage, filters.maxPackage]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = {};
      if (debouncedSearch) params.search = debouncedSearch;
      if (filters.status !== 'ALL') params.status = filters.status;
      if (filters.designation !== 'ALL') params.designation = filters.designation;
      if (filters.bloodGroup !== 'ALL') params.blood_group = filters.bloodGroup;
      if (filters.minPackage) params.min_package = filters.minPackage;
      if (filters.maxPackage) params.max_package = filters.maxPackage;
      
      await exportEmployees(params);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to export employees.');
    } finally {
      setExporting(false);
    }
  };

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

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <PageContainer
      title="Employees"
      subtitle={`${employees.length} employee${employees.length !== 1 ? 's' : ''} in the system`}
      actions={
        <div className="flex items-center gap-3">
          <Button 
            variant="secondary" 
            onClick={handleExport} 
            icon={Download}
            disabled={exporting}
          >
            {exporting ? 'Exporting...' : 'Export Excel'}
          </Button>
          <Button onClick={() => navigate('/employees/create')} icon={UserPlus}>
            Add Employee
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        {/* Filters */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-4">
          <div className="relative w-full">
            <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, ID, or designation..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-shadow"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg appearance-none focus:border-blue-500 outline-none"
            >
              <option value="ALL">All Statuses</option>
              {EMPLOYEE_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            <select
              value={filters.designation}
              onChange={(e) => handleFilterChange('designation', e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg appearance-none focus:border-blue-500 outline-none"
            >
              <option value="ALL">All Designations</option>
              {EMPLOYEE_DESIGNATION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            <select
              value={filters.bloodGroup}
              onChange={(e) => handleFilterChange('bloodGroup', e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg appearance-none focus:border-blue-500 outline-none"
            >
              <option value="ALL">All Blood Groups</option>
              {EMPLOYEE_BLOOD_GROUP_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min LPA"
                value={filters.minPackage}
                onChange={(e) => handleFilterChange('minPackage', e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:border-blue-500 outline-none"
              />
              <input
                type="number"
                placeholder="Max LPA"
                value={filters.maxPackage}
                onChange={(e) => handleFilterChange('maxPackage', e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:border-blue-500 outline-none"
              />
            </div>
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
