import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import PageContainer from '../../components/layout/PageContainer';
import Card from '../../components/common/Card';
import { PageLoader } from '../../components/common/Loader';
import JobForm from '../../components/jobs/JobForm';
import { fetchJobById, updateJob } from '../../api/jobsApi';
import EmptyState from '../../components/common/EmptyState';
import { Briefcase } from 'lucide-react';
import Button from '../../components/common/Button';

const EditJobPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const loadJob = async () => {
      try {
        const res = await fetchJobById(id);
        if (!res.data) {
          setNotFound(true);
        } else {
          setJob(res.data);
        }
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    loadJob();
  }, [id]);

  const handleSubmit = async (data) => {
    setSaving(true);
    try {
      await updateJob(id, data);
      setSuccess(true);
      setTimeout(() => navigate('/jobs'), 1200);
    } catch (err) {
      console.error('Failed to update job:', err);
    } finally {
      setSaving(false);
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

        {loading ? (
          <Card>
            <PageLoader />
          </Card>
        ) : notFound ? (
          <Card>
            <EmptyState
              icon={Briefcase}
              title="Job requirement not found"
              description="The job requirement you are looking for does not exist."
              action={
                <Button onClick={() => navigate('/jobs')}>Back to Jobs</Button>
              }
            />
          </Card>
        ) : (
          <Card>
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">
                    Update Job Requirement
                  </h1>
                  <p className="text-sm text-gray-500 mt-1">
                    Editing: <span className="font-medium text-gray-700">{job?.jobTitle}</span>
                    {job?.companyName && (
                      <span className="text-gray-400"> · {job.companyName}</span>
                    )}
                  </p>
                </div>
                <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-1 rounded">
                  {id}
                </span>
              </div>
            </div>

            {success && (
              <div className="mb-5 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Job requirement updated successfully. Redirecting...
              </div>
            )}

            <JobForm
              defaultValues={job}
              onSubmit={handleSubmit}
              loading={saving}
              isEdit
            />
          </Card>
        )}
      </div>
    </PageContainer>
  );
};

export default EditJobPage;
