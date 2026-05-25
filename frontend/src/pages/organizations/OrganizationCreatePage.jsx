import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import PageContainer from '../../components/layout/PageContainer';
import OrganizationForm from '../../components/organizations/OrganizationForm';
import { createOrganization } from '../../api/organizationsApi';

const OrganizationCreatePage = () => {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (formData) => {
    setSaving(true);
    try {
      await createOrganization(formData);
      // Wait briefly for UX, then navigate to dashboard
      setTimeout(() => navigate('/organizations'), 500);
    } catch (error) {
      console.error('Failed to create organization:', error);
      const errorMsg = error.response?.data?.message || 'Failed to save organization. Please try again.';
      alert(errorMsg);
      setSaving(false);
    }
  };

  return (
    <PageContainer
      title="Add Organization Details"
      subtitle="Register a new organization profile into the database system."
    >
      {/* Back button */}
      <button
        onClick={() => navigate('/organizations')}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-5 transition-colors group"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
        Back
      </button>
      <div className="flex justify-center mt-6">
        <OrganizationForm onSubmit={handleSubmit} loading={saving} />
      </div>
    </PageContainer>
  );
};

export default OrganizationCreatePage;
