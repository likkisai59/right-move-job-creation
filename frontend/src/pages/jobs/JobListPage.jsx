import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import PageContainer from '../../components/layout/PageContainer';
import Button from '../../components/common/Button';
import JobTable from '../../components/jobs/JobTable';
import JobFilters from '../../components/jobs/JobFilters';
import { fetchJobs } from '../../api/jobsApi';

const JobListPage = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ company: '', date: '' });

  const loadJobs = async (activeFilters = filters) => {
    setLoading(true);
    try {
      const res = await fetchJobs(activeFilters);
      setJobs(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs(filters);
  }, [filters]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleFilterClear = () => {
    setFilters({ company: '', date: '' });
  };

  return (
    <PageContainer
      title="Update Job Requirement"
      subtitle={`${jobs.length} requirement${jobs.length !== 1 ? 's' : ''} found`}
      actions={
        <Button
          icon={Plus}
          onClick={() => navigate('/jobs/create')}
        >
          Create Job
        </Button>
      }
    >
      <div className="flex flex-col gap-4 animate-fade-in">
        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <JobFilters
            filters={filters}
            onChange={handleFilterChange}
            onClear={handleFilterClear}
          />
        </div>

        {/* Table */}
        <JobTable jobs={jobs} loading={loading} />
      </div>
    </PageContainer>
  );
};

export default JobListPage;
