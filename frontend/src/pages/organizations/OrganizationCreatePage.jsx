import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
      alert('Failed to save organization. Please check if the name already exists.');
      setSaving(false);
    }
  };

  return (
    <PageContainer
      title="Add Organization Details"
      subtitle="Register a new organization profile into the database system."
    >
      <div className="flex justify-center mt-6">
        <OrganizationForm onSubmit={handleSubmit} loading={saving} />
      </div>
    </PageContainer>
  );
};

export default OrganizationCreatePage;
