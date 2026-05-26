import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import PageContainer from '../../components/layout/PageContainer';
import Card from '../../components/common/Card';
import CandidateForm from '../../components/candidates/CandidateForm';
import { fetchCandidateById, updateCandidate } from '../../api/candidatesApi';
import { getCurrentUser } from '../../api/authApi';

const EditCandidatePage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [candidateData, setCandidateData] = useState(null);

  useEffect(() => {
    const getCandidateDetails = async () => {
      try {
        const response = await fetchCandidateById(id);
        const data = response.data;
        
        // Map backend code to frontend ID for visual display in the form
        if (data && data.candidateCode) {
          data.id = data.candidateCode;
        }

        // Format dates if necessary (LWD comes as ISO string or YYYY-MM-DD)
        if (data.lwd && data.lwd.includes('T')) {
          data.lwd = data.lwd.split('T')[0];
        }
        
        setCandidateData(data);
      } catch (err) {
        console.error('Failed to fetch candidate details:', err);
        setError('Failed to load candidate details. They might have been deleted or there is a network issue.');
      } finally {
        setFetching(false);
      }
    };
    
    if (id) {
      getCandidateDetails();
    }
  }, [id]);

  const handleSubmit = async (data) => {
    setLoading(true);
    setError(null);
    try {
      const user = getCurrentUser();
      const updatedBy = user ? user.name || user.username || user.email : 'System';
      
      const payload = {
        ...data,
        updatedBy
      };
      
      await updateCandidate(id, payload);

      setSuccess(true);
      setTimeout(() => navigate(`/candidates/${id}`), 1500);
    } catch (err) {
      console.error('Failed to update candidate:', err);
      const message = err.response?.data?.message || err.message || 'An unexpected error occurred';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => navigate(`/candidates/${id}`);

  return (
    <PageContainer>
      <div className="max-w-4xl mx-auto animate-fade-in">
        {/* Back button */}
        <button
          onClick={handleCancel}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-5 transition-colors group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          Back to Profile
        </button>

        <Card>
          <div className="mb-6">
            <h1 className="text-lg font-semibold text-gray-900">
              Edit Candidate Profile
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Update candidate details and preferences
            </p>
          </div>

          {success && (
            <div className="mb-5 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium flex items-center gap-2 animate-slide-up">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Candidate updated successfully. Redirecting...
            </div>
          )}

          {error && (
            <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm font-medium flex items-center gap-2 animate-slide-up">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              {error}
            </div>
          )}

          {fetching ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-4" />
              <p className="text-sm font-medium">Loading candidate details...</p>
            </div>
          ) : candidateData ? (
            <CandidateForm
              defaultValues={candidateData}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              loading={loading}
            />
          ) : null}

        </Card>
      </div>
    </PageContainer>
  );
};

export default EditCandidatePage;
