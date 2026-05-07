import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Briefcase,
  UserCheck,
  Calendar,
  Search,
} from 'lucide-react';
import PageContainer from '../../components/layout/PageContainer';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import { PageLoader } from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import TimeStamp from '../../components/common/TimeStamp';
import { formatDate } from '../../utils/formatters';
import MatchingCandidatesTable from '../../components/jobs/MatchingCandidatesTable';
import {
  fetchJobById,
  fetchMatchingCandidates,
  shortlistCandidate,
  fetchShortlistedCandidates,
  rejectCandidate
} from '../../api/jobsApi';

const normalizeSkills = (skills) =>
  Array.isArray(skills) ? skills : (skills ? skills.split(',').map(s => s.trim()) : []);

const JobDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [strict, setStrict] = useState(true);

  // Per-role matching: { [reqId]: Candidate[] } — prefetched all at once
  const [roleMatching, setRoleMatching] = useState({});

  // Shared shortlisted list (job-level, not per role)
  const [shortlistedCandidates, setShortlistedCandidates] = useState([]);

  // Which role tab is selected
  const [selectedReqId, setSelectedReqId] = useState(null);

  // 'matching' or 'shortlisted'
  const [activeTab, setActiveTab] = useState('matching');

  const [processingId, setProcessingId] = useState(null);

  // ── Load everything on mount (or when strict changes) ──────────────
  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      try {
        // 1. Fetch job data first
        const jobRes = await fetchJobById(id);
        const jobData = jobRes.data;
        setJob(jobData);

        const requirements = jobData?.requirements || [];
        const firstReqId = requirements[0]?.id || null;
        setSelectedReqId(firstReqId);

        // 2. Prefetch ALL roles' matching candidates simultaneously + shortlisted
        const matchingPromises = requirements.map(req =>
          fetchMatchingCandidates(id, strict, req.id)
            .then(res => {
              const list = Array.isArray(res.data) ? res.data : (res.data?.matched_candidates || []);
              return { reqId: req.id, candidates: list.map(c => ({ ...c, skills: normalizeSkills(c.skills) })) };
            })
            .catch(() => ({ reqId: req.id, candidates: [] }))
        );

        const [shortlistedRes, ...matchingResults] = await Promise.all([
          fetchShortlistedCandidates(id),
          ...matchingPromises
        ]);

        // 3. Build role matching map
        const matchingMap = {};
        matchingResults.forEach(({ reqId, candidates }) => {
          matchingMap[reqId] = candidates;
        });
        setRoleMatching(matchingMap);

        // 4. Set shared shortlisted
        setShortlistedCandidates(
          (shortlistedRes.data || []).map(c => ({ ...c, skills: normalizeSkills(c.skills) }))
        );
      } catch (err) {
        console.error('Failed to load job details:', err);
      } finally {
        setLoading(false);
      }
    };

    loadAll();
  }, [id, strict]);

  // ── Shortlist ───────────────────────────────────────────────────────
  const handleShortlist = async (candidateId) => {
    setProcessingId(candidateId);
    try {
      await shortlistCandidate(id, candidateId);

      // Mark as shortlisted in the current role's matching list (local update)
      setRoleMatching(prev => ({
        ...prev,
        [selectedReqId]: prev[selectedReqId]?.map(c =>
          (c.candidate_id || c.id) === candidateId ? { ...c, status: 'shortlisted' } : c
        ) || []
      }));

      // Refresh shared shortlisted
      const res = await fetchShortlistedCandidates(id);
      setShortlistedCandidates(
        (res.data || []).map(c => ({ ...c, skills: normalizeSkills(c.skills) }))
      );
    } catch (err) {
      console.error('Shortlist failed:', err);
    } finally {
      setProcessingId(null);
    }
  };

  // ── Reject ─────────────────────────────────────────────────────────
  const handleReject = async (candidateId) => {
    setProcessingId(candidateId);
    try {
      await rejectCandidate(id, candidateId);

      setRoleMatching(prev => ({
        ...prev,
        [selectedReqId]: prev[selectedReqId]?.map(c =>
          (c.candidate_id || c.id) === candidateId ? { ...c, status: 'rejected' } : c
        ) || []
      }));
    } catch (err) {
      console.error('Reject failed:', err);
    } finally {
      setProcessingId(null);
    }
  };

  // ── Bulk Shortlist ─────────────────────────────────────────────────
  const handleBulkShortlist = async (candidateIds) => {
    setProcessingId('bulk');
    try {
      await Promise.all(candidateIds.map(cid => shortlistCandidate(id, cid)));
      const res = await fetchShortlistedCandidates(id);
      setShortlistedCandidates(
        (res.data || []).map(c => ({ ...c, skills: normalizeSkills(c.skills) }))
      );
    } catch (err) {
      console.error('Bulk shortlist failed:', err);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return <PageContainer><PageLoader /></PageContainer>;
  if (!job) return (
    <PageContainer>
      <EmptyState icon={Briefcase} title="Job not found" description="The job you're looking for doesn't exist." />
    </PageContainer>
  );

  const hasMultipleRoles = job.requirements && job.requirements.length > 1;
  const matchingCandidates = selectedReqId ? (roleMatching[selectedReqId] || []) : [];

  return (
    <PageContainer>
      <div className="flex flex-col gap-6 animate-fade-in max-w-7xl mx-auto">

        {/* ── Header Nav ── */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/jobs')}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
            Back to Requirements
          </button>
          <div className="flex items-center gap-2">
            <Badge status={job.status} />
            <button
              onClick={() => navigate(`/jobs/edit/${id}`)}
              className="text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 transition-colors"
            >
              Edit Details
            </button>
          </div>
        </div>

        {/* ── Job Summary Card ── */}
        <Card className="overflow-hidden border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-2">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200 shrink-0">
                <Briefcase size={28} />
              </div>
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">
                  <span>{job.jobCode}</span>
                  <span className="text-gray-300">•</span>
                  <span>{job.companyName}</span>
                </div>

                {hasMultipleRoles ? (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {job.requirements.map(req => (
                      <span key={req.id} className="text-sm font-semibold text-gray-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-lg">
                        {req.job_title}
                      </span>
                    ))}
                  </div>
                ) : (
                  <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">{job.jobTitle}</h1>
                )}

                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={14} className="text-gray-400" />
                    <span>Created: {formatDate(job.date)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <UserCheck size={14} className="text-gray-400" />
                    <span>Assigned to: <span className="text-gray-700 font-medium">{job.assignedTo}</span></span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 md:flex-col md:items-end">
              <div className="text-right">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Budget Range</p>
                <p className="text-lg font-bold text-emerald-600">{job.budget}</p>
              </div>
              <div className="px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100">
                <TimeStamp created={job.created_at} updated={job.updated_at} />
              </div>
            </div>
          </div>
        </Card>

        {/* ── Role Selector (only for multi-role jobs) ── */}
        {hasMultipleRoles && (
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Select Job Role</p>
            <div className="flex flex-wrap gap-2">
              {job.requirements.map(req => {
                const count = (roleMatching[req.id] || []).length;
                const isActive = selectedReqId === req.id;
                return (
                  <button
                    key={req.id}
                    onClick={() => { setSelectedReqId(req.id); setActiveTab('matching'); }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-100'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600'
                    }`}
                  >
                    <Briefcase size={14} />
                    {req.job_title}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {count} matched
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Tab Bar: Matching | Shortlisted ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-1 bg-gray-100/50 p-1 rounded-xl w-fit border border-gray-100">
            <button
              onClick={() => setActiveTab('matching')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'matching'
                  ? 'bg-white text-blue-600 shadow-sm border border-gray-100'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Search size={16} />
              Matching Candidates
              <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] ${
                activeTab === 'matching' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'
              }`}>
                {matchingCandidates.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('shortlisted')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'shortlisted'
                  ? 'bg-white text-emerald-600 shadow-sm border border-gray-100'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              <UserCheck size={16} />
              Shortlisted
              {hasMultipleRoles && (
                <span className="text-[9px] text-gray-400 font-normal">(all roles)</span>
              )}
              <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] ${
                activeTab === 'shortlisted' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-600'
              }`}>
                {shortlistedCandidates.length}
              </span>
            </button>
          </div>

          {activeTab === 'matching' && (
            <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-xl border border-gray-100 shadow-sm">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Smart Filtering</span>
              <button
                onClick={() => setStrict(s => !s)}
                className={`w-12 h-6 rounded-full p-1 transition-all duration-300 ${strict ? 'bg-emerald-500' : 'bg-gray-300'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full transition-all duration-300 ${strict ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>
          )}
        </div>

        {/* ── Content Area ── */}
        <div className="animate-slide-up">
          {activeTab === 'matching' ? (
            <MatchingCandidatesTable
              candidates={matchingCandidates}
              onShortlist={handleShortlist}
              onReject={handleReject}
              onBulkShortlist={handleBulkShortlist}
              processingId={processingId}
              tab="matching"
            />
          ) : (
            <MatchingCandidatesTable
              candidates={shortlistedCandidates}
              processingId={processingId}
              tab="shortlisted"
            />
          )}
        </div>

      </div>
    </PageContainer>
  );
};

export default JobDetailsPage;
