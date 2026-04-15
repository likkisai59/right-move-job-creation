import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageContainer from '../../components/layout/PageContainer';
import OrganizationForm from '../../components/organizations/OrganizationForm';
import { getOrganizationById, updateOrganization } from '../../api/organizationsApi';
import { Building2 } from 'lucide-react';

const OrganizationEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadOrganization = async () => {
      try {
        const response = await getOrganizationById(id);
        setOrganization(response.data);
      } catch (error) {
        console.error('Failed to fetch organization:', error);
        alert('Could not find the organization. Redirecting back...');
        navigate('/organizations');
      } finally {
        setLoading(false);
      }
    };
    loadOrganization();
  }, [id, navigate]);

  const handleSubmit = async (formData) => {
    setSaving(true);
    try {
      await updateOrganization(id, formData);
      // Brief delay for UX effect, then redirect to list
      setTimeout(() => navigate('/organizations'), 500);
    } catch (error) {
      console.error('Failed to update organization:', error);
      const errorMsg = error.response?.data?.message || 'Failed to update organization. Please try again.';
      alert(errorMsg);
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PageContainer title="Edit Organization" subtitle="Please wait while organization details are loading...">
        <div className="flex flex-col items-center justify-center p-20 gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 font-medium">Loading organization data...</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Edit Organization Details"
      subtitle={`Updating profile for: ${organization?.organization_name || 'Organization'}`}
    >
      <div className="flex justify-center mt-6">
        <OrganizationForm 
          initialData={organization} 
          onSubmit={handleSubmit} 
          loading={saving} 
        />
      </div>
    </PageContainer>
  );
};

export default OrganizationEditPage;
