import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, AlertTriangle, Download, Filter } from 'lucide-react';
import PageContainer from '../../components/layout/PageContainer';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import SortBy from '../../components/common/SortBy';
import OrganizationTable from '../../components/organizations/OrganizationTable';
import { fetchOrganizations, deleteOrganization } from '../../api/organizationsApi';
import api from '../../api/axios';
import { checkPermission } from '../../api/authApi';

const OrganizationListPage = () => {
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', startDate: '', endDate: '', sortField: '', sortOrder: 'desc' });

  const SORT_OPTIONS = [
    { label: 'Organization Name (A-Z)', value: 'organization_name:asc' },
    { label: 'Organization Name (Z-A)', value: 'organization_name:desc' },
    { label: 'Organization ID Ascending', value: 'organization_id:asc' },
    { label: 'Organization ID Descending', value: 'organization_id:desc' },
    { label: 'Created Date (Newest)', value: 'created_at:desc' },
    { label: 'Created Date (Oldest)', value: 'created_at:asc' },
  ];

  const loadOrganizations = async (search = '', start = '', end = '') => {
    setLoading(true);
    try {
      const response = await fetchOrganizations({
        search: search.trim(),
        start_date: start,
        end_date: end,
        sortField: filters.sortField,
        sortOrder: filters.sortOrder
      });
      setOrganizations(response.data || []);
    } catch (error) {
      console.error('Failed to fetch organizations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name || 'this organization'}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setLoading(true);
      await deleteOrganization(id);
      await loadOrganizations(filters.search, filters.startDate, filters.endDate);
    } catch (error) {
      console.error('Failed to delete organization:', error);
      alert('Error deleting organization. Please try again.');
      setLoading(false);
    }
  };

  const handleCreate = () => {
    navigate('/organizations/create');
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadOrganizations(filters.search, filters.startDate, filters.endDate);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [filters]);

  const handleExport = async (specificIds = null) => {
    try {
      const params = {
        search: filters.search.trim(),
        start_date: filters.startDate,
        end_date: filters.endDate,
        sort_by: filters.sortField,
        sort_order: filters.sortOrder
      };

      if (specificIds && specificIds.length > 0) {
        params.export_ids = specificIds.join(',');
      }

      const response = await api.get('/organizations/export', {
        params,
        responseType: 'blob'
      });

      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `organizations_export_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export Excel file. Please try again.');
    }
  };

  const expiringOrgs = organizations.filter(org => {
    if (!org.contract_end_date) return false;
    const endDate = new Date(org.contract_end_date);
    const today = new Date();
    const diffTime = endDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 30;
  });

  return (
    <PageContainer
      title="Organizations"
      subtitle={`${organizations.length} organization${organizations.length !== 1 ? 's' : ''} registered`}
      actions={
        <div className="flex items-center gap-3">
          <Button variant="secondary" icon={Download} onClick={() => handleExport()} disabled={organizations.length === 0}>
            Export Excel
          </Button>
          {checkPermission('add_organization') && (
            <Button icon={Plus} onClick={() => navigate('/organizations/create')}>
              Add Organization
            </Button>
          )}
        </div>
      }
    >
      <div className="flex flex-col gap-6 animate-fade-in mt-6">
        {/* Expiry Alerts */}
        {expiringOrgs.length > 0 && (
          <div className="bg-white border border-indigo-100 rounded-2xl p-5 flex items-start gap-4 shadow-sm relative overflow-hidden group">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500"></div>
            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 flex-shrink-0">
              <AlertTriangle size={24} />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h4 className="text-base font-bold text-slate-900">Contract Renewal Notice</h4>
                  <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                    The following organizations have contracts reaching their termination date within the next <span className="font-bold text-indigo-600">30 days</span>.
                    Please ensure necessary renewal documentation is processed to maintain service continuity.
                  </p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={Download}
                  onClick={() => handleExport(expiringOrgs.map(org => org.id))}
                >
                  Export Excel
                </Button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {expiringOrgs.map(org => (
                  <span key={org.id} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                    {org.organization_name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        

        {/* Table Component */}
        <OrganizationTable
          filters={filters}
          onFilterChange={setFilters}
          organizations={organizations}
          loading={loading}
          onCreate={handleCreate}
          onDelete={handleDelete}
        />
      </div>
    </PageContainer>
  );
};

export default OrganizationListPage;
