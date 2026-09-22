import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Search, Filter, Download } from 'lucide-react';
import PageContainer from '../../components/layout/PageContainer';
import Button from '../../components/common/Button';
import SortBy from '../../components/common/SortBy';
import EmployeeTable from '../../components/employees/EmployeeTable';
import { EMPLOYEE_STATUS_OPTIONS, EMPLOYEE_BLOOD_GROUP_OPTIONS } from '../../utils/constants';
import { fetchEmployees, deleteEmployee, exportEmployees } from '../../api/employeesApi';
import { fetchDesignations } from '../../api/designationsApi';
import { checkPermission } from '../../api/authApi';

const EmployeeListPage = () => {
  const navigate = useNavigate();

  const [employees, setEmployees] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const [filters, setFilters] = useState({
    search: '',
    status: 'ALL',
    designation: 'ALL',
    bloodGroup: 'ALL',
    minPackage: '',
    maxPackage: '',
    sortField: '',
    sortOrder: 'desc'
  });
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 500);
    return () => clearTimeout(timer);
  }, [filters.search]);

  // Load all designations dynamically for the filter dropdown
  useEffect(() => {
    const loadDesignationOptions = async () => {
      try {
        const res = await fetchDesignations();
        if (res.success) {
          setDesignations(res.data);
        }
      } catch (err) {
        console.error('Failed to load designations for filters:', err);
      }
    };
    loadDesignationOptions();
  }, []);

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
      if (filters.sortField) params.sortField = filters.sortField;
      if (filters.sortOrder) params.sortOrder = filters.sortOrder;

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, filters.status, filters.designation, filters.bloodGroup, filters.minPackage, filters.maxPackage, filters.sortField, filters.sortOrder]);

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
      if (filters.sortField) params.sortField = filters.sortField;
      if (filters.sortOrder) params.sortOrder = filters.sortOrder;

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
          {checkPermission('add_employee') && (
            <Button onClick={() => navigate('/employees/create')} icon={UserPlus}>
              Add Employee
            </Button>
          )}
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        <EmployeeTable
          employees={employees}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          filters={filters}
          onFilterChange={handleFilterChange}
          designations={designations}
        />
      </div>
    </PageContainer>
  );
};

export default EmployeeListPage;
