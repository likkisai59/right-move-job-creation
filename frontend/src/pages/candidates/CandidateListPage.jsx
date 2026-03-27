import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import PageContainer from '../../components/layout/PageContainer';
import Button from '../../components/common/Button';
import CandidateTable from '../../components/candidates/CandidateTable';
import CandidateFilters from '../../components/candidates/CandidateFilters';
import { fetchCandidates } from '../../api/candidatesApi';

const CandidateListPage = () => {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '' });

  const loadCandidates = async (activeFilters = filters) => {
    setLoading(true);
    try {
      const res = await fetchCandidates(activeFilters);
      setCandidates(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCandidates(filters);
  }, [filters]);

  return (
    <PageContainer
      title="Candidates"
      subtitle={`${candidates.length} candidate${candidates.length !== 1 ? 's' : ''} registered`}
      actions={
        <Button icon={UserPlus} onClick={() => navigate('/candidates/create')}>
          Add Candidate
        </Button>
      }
    >
      <div className="flex flex-col gap-4 animate-fade-in">
        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <CandidateFilters
            filters={filters}
            onChange={setFilters}
            onClear={() => setFilters({ search: '' })}
          />
        </div>

        {/* Table */}
        <CandidateTable candidates={candidates} loading={loading} />
      </div>
    </PageContainer>
  );
};

export default CandidateListPage;
