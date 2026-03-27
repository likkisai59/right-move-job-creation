import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import PageContainer from '../components/layout/PageContainer';
import CandidateTable from '../components/candidates/CandidateTable';
import JobTable from '../components/jobs/JobTable';
import { fetchCandidates } from '../api/candidatesApi';
import { fetchJobs } from '../api/jobsApi';

const GlobalSearchPage = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const navigate = useNavigate();

  const [candidates, setCandidates] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const performSearch = async () => {
      if (!query) {
        setCandidates([]);
        setJobs([]);
        return;
      }
      
      setLoading(true);
      try {
        // Fetch candidates using the global search param we built
        const candidatesRes = await fetchCandidates({ search: query });
        
        // Fetch jobs using the new global search parameter for company and title
        const jobsRes = await fetchJobs({ search: query });
        
        setCandidates(candidatesRes.data || []);
        setJobs(jobsRes.data || []);
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [query]);

  return (
    <PageContainer
      title="Global Search Results"
      subtitle={`Results for "${query}"`}
    >
      <div className="flex flex-col gap-8 animate-fade-in pb-10">
        
        {/* Candidates Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Candidates ({candidates.length})
            </h2>
            <button 
              onClick={() => navigate(`/candidates`)}
              className="text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              View all candidates &rarr;
            </button>
          </div>
          
          {candidates.length > 0 ? (
            <CandidateTable candidates={candidates} loading={loading} />
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 p-8 text-center shadow-sm">
              <p className="text-gray-500 text-sm">No candidates found matching "{query}"</p>
            </div>
          )}
        </section>

        {/* Jobs Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Jobs ({jobs.length})
            </h2>
            <button 
              onClick={() => navigate(`/jobs`)}
              className="text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              View all jobs &rarr;
            </button>
          </div>
          
          {jobs.length > 0 ? (
            <JobTable jobs={jobs} loading={loading} />
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 p-8 text-center shadow-sm">
              <p className="text-gray-500 text-sm">No jobs found matching "{query}"</p>
            </div>
          )}
        </section>
        
      </div>
    </PageContainer>
  );
};

export default GlobalSearchPage;
