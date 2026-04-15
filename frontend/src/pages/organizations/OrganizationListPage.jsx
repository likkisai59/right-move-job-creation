import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import PageContainer from '../../components/layout/PageContainer';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import OrganizationTable from '../../components/organizations/OrganizationTable';
import { fetchOrganizations } from '../../api/organizationsApi';

const OrganizationListPage = () => {
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const loadOrganizations = async (search = '') => {
    setLoading(true);
    try {
      const response = await fetchOrganizations({ search: search.trim() });
      setOrganizations(response.data || []);
    } catch (error) {
      console.error('Failed to fetch organizations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadOrganizations(searchTerm);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  return (
    <PageContainer
      title="Organizations"
      subtitle={`${organizations.length} organization${organizations.length !== 1 ? 's' : ''} registered`}
      actions={
        <div className="flex items-center gap-3">
          <Button icon={Plus} onClick={() => navigate('/organizations/create')}>
            Add Organization
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-6 animate-fade-in mt-6">
        {/* Search Bar */}
        <div className="w-full max-w-md">
          <Input
            placeholder="Search organizations by name..."
            icon={Search}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Table Component */}
        <OrganizationTable 
          organizations={organizations} 
          loading={loading} 
        />
      </div>
    </PageContainer>
  );
};

export default OrganizationListPage;
