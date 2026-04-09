import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import PageContainer from '../../components/layout/PageContainer';
import Button from '../../components/common/Button';
import OrganizationTable from '../../components/organizations/OrganizationTable';
import { fetchOrganizations } from '../../api/organizationsApi';

const OrganizationListPage = () => {
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadOrganizations = async () => {
    setLoading(true);
    try {
      const res = await fetchOrganizations();
      setOrganizations(res.data);
    } catch (error) {
      console.error('Failed to fetch organizations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrganizations();
  }, []);

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
      <div className="flex flex-col gap-4 animate-fade-in mt-4">
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
