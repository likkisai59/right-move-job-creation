import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Briefcase,
  Users,
  UserCheck,
  Clock,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Search,
  Check
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

const JobDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [matchingCandidates, setMatchingCandidates] = useState([]);
  const [shortlistedCandidates, setShortlistedCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('matching'); // 'matching' or 'shortlisted'
  const [processingId, setProcessingId] = useState(null);
  const [strict, setStrict] = useState(true);

  const mapCandidate = (c) => ({
    ...c,
    skills: c.skills ? c.skills.split(',').map(s => s.trim()) : []
  });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const jobRes = await fetchJobById(id);
        setJob(jobRes.data);
      } catch (err) {
        console.error('Failed to load job details:', err);
      }

      // Load matching and shortlisted candidates independently
      try {
        const [matchingRes, shortlistedRes] = await Promise.all([
          fetchMatchingCandidates(id, strict),
          fetchShortlistedCandidates(id)
        ]);

        // The API returns the list directly in .data
        const matchedList = Array.isArray(matchingRes.data) ? matchingRes.data : (matchingRes.data?.matched_candidates || []);
        
        setMatchingCandidates(matchedList.map(c => ({
          ...c,
          // Skills from matching API are already a list, from others they might be comma-separated
          skills: Array.isArray(c.skills) ? c.skills : (c.skills ? c.skills.split(',').map(s => s.trim()) : [])
        })));
        
        setShortlistedCandidates((shortlistedRes.data || []).map(c => ({
          ...c,
          skills: Array.isArray(c.skills) ? c.skills : (c.skills ? c.skills.split(',').map(s => s.trim()) : [])
        })));
      } catch (err) {
        console.error('Failed to load candidates:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id, strict]);

  const handleShortlist = async (candidateId) => {
    setProcessingId(candidateId);
    try {
      await shortlistCandidate(id, candidateId);

      // Update matching list locally to show "Shortlisted"
      setMatchingCandidates(prev => prev.map(c => {
        if ((c.candidate_id || c.id) === candidateId) {
          return { ...c, status: 'shortlisted' };
        }
        return c;
      }));

      // Refresh shortlisted list
      const res = await fetchShortlistedCandidates(id);
      setShortlistedCandidates(res.data || []);
    } catch (err) {
      console.error('Shortlist failed:', err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (candidateId) => {
    setProcessingId(candidateId);
    try {
      await rejectCandidate(id, candidateId);

      // Update matching list locally to show "Rejected"
      setMatchingCandidates(prev => prev.map(c => {
        if ((c.candidate_id || c.id) === candidateId) {
          return { ...c, status: 'rejected' };
        }
        return c;
      }));
    } catch (err) {
      console.error('Reject failed:', err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleBulkShortlist = async (candidateIds) => {
    setLoading(true);
    try {
      await Promise.all(candidateIds.map(cid => shortlistCandidate(id, cid)));
      
      const [matchingRes, shortlistedRes] = await Promise.all([
        fetchMatchingCandidates(id),
        fetchShortlistedCandidates(id)
      ]);
      setMatchingCandidates(matchingRes.data || []);
      setShortlistedCandidates(shortlistedRes.data || []);
    } catch (err) {
      console.error('Bulk shortlist failed:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <PageContainer><PageLoader /></PageContainer>;
  if (!job) return (
    <PageContainer>
      <EmptyState icon={Briefcase} title="Job not found" description="The job you're looking for doesn't exist." />
    </PageContainer>
  );

  return (
    <PageContainer>
      <div className="flex flex-col gap-6 animate-fade-in max-w-7xl mx-auto">
        {/* Header Navigation */}
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

        {/* Job Summary Card */}
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
                <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                  {job.jobTitle}
                </h1>
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

        {/* Tab Selection & Extras */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-1 bg-gray-100/50 p-1 rounded-xl w-fit border border-gray-100">
            <button
              onClick={() => setActiveTab('matching')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'matching'
                  ? 'bg-white text-blue-600 shadow-sm border border-gray-100'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
            >
              <Search size={16} />
              Matching Candidates
              <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'matching' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'
                }`}>
                {matchingCandidates.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('shortlisted')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'shortlisted'
                  ? 'bg-white text-emerald-600 shadow-sm border border-gray-100'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
            >
              <UserCheck size={16} />
              Shortlisted
              <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'shortlisted' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-600'
                }`}>
                {shortlistedCandidates.length}
              </span>
            </button>
          </div>

          {activeTab === 'matching' && (
            <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-xl border border-gray-100 shadow-sm">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Smart Filtering</span>
              <button 
                onClick={() => setStrict(!strict)}
                className={`w-12 h-6 rounded-full p-1 transition-all duration-300 ${strict ? 'bg-emerald-500' : 'bg-gray-300'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full transition-all duration-300 ${strict ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>
          )}
        </div>

        {/* Content Area */}
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
