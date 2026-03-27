import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import PageContainer from '../../components/layout/PageContainer';
import Card from '../../components/common/Card';
import CandidateForm from '../../components/candidates/CandidateForm';
import { createCandidate } from '../../api/candidatesApi';
import { generateCandidateId } from '../../utils/formatters';

const AddCandidatePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const defaultId = generateCandidateId();

  const handleSubmit = async (data) => {
    setLoading(true);
    try {
      await createCandidate(data);
      setSuccess(true);
      setTimeout(() => navigate('/candidates'), 1500);
    } catch (err) {
      console.error('Failed to add candidate:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => navigate('/candidates');

  return (
    <PageContainer>
      <div className="max-w-4xl mx-auto animate-fade-in">
        {/* Back button */}
        <button
          onClick={() => navigate('/candidates')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-5 transition-colors group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          Back
        </button>

        <Card>
          <div className="mb-6">
            <h1 className="text-lg font-semibold text-gray-900">
              Candidate Registration
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Register a new candidate in the recruitment database
            </p>
          </div>

          {success && (
            <div className="mb-5 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Candidate registered successfully. Redirecting...
            </div>
          )}

          <CandidateForm
            defaultValues={{ id: defaultId, skills: [] }}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            loading={loading}
          />
        </Card>
      </div>
    </PageContainer>
  );
};

export default AddCandidatePage;
