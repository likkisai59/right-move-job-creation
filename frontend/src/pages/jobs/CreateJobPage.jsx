import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import PageContainer from '../../components/layout/PageContainer';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import JobForm from '../../components/jobs/JobForm';
import { createJob } from '../../api/jobsApi';

const CreateJobPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (data) => {
    setLoading(true);
    try {
      await createJob(data);
      setSuccess(true);
      setTimeout(() => navigate('/jobs'), 1200);
    } catch (err) {
      console.error('Failed to create job:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer>
      <div className="max-w-3xl mx-auto animate-fade-in">
        {/* Back button */}
        <button
          onClick={() => navigate('/jobs')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-5 transition-colors group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          Back
        </button>

        <Card>
          <div className="mb-6">
            <h1 className="text-lg font-semibold text-gray-900">
              Create Job Requirement
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Fill in the details below to post a new job requirement
            </p>
          </div>

          {success && (
            <div className="mb-5 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Job requirement created successfully. Redirecting...
            </div>
          )}

          <JobForm
            onSubmit={handleSubmit}
            loading={loading}
            isEdit={false}
          />
        </Card>
      </div>
    </PageContainer>
  );
};

export default CreateJobPage;
