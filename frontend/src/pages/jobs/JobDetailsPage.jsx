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
import { fetchJobById, fetchMatchingCandidates, shortlistCandidate, fetchShortlistedCandidates } from '../../api/jobsApi';
import TimeStamp from '../../components/common/TimeStamp';
import { formatDate } from '../../utils/formatters';

const JobDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [matchingCandidates, setMatchingCandidates] = useState([]);
  const [shortlistedCandidates, setShortlistedCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('matching'); // 'matching' or 'shortlisted'
  const [processingId, setProcessingId] = useState(null);

  const mapCandidate = (c) => ({
    ...c,
    skills: c.skills ? c.skills.split(',').map(s => s.trim()) : []
  });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [jobRes, matchingRes, shortlistedRes] = await Promise.all([
          fetchJobById(id),
          fetchMatchingCandidates(id),
          fetchShortlistedCandidates(id)
        ]);

        setJob(jobRes.data);
        setMatchingCandidates((matchingRes.data || []).map(mapCandidate));
        setShortlistedCandidates((shortlistedRes.data || []).map(mapCandidate));
      } catch (err) {
        console.error('Failed to load job details:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  const handleShortlist = async (candidateId) => {
    setProcessingId(candidateId);
    try {
      await shortlistCandidate(id, candidateId);

      // Move candidate from matching to shortlisted in the UI state
      const candidate = matchingCandidates.find(c => c.id === candidateId);
      if (candidate) {
        setShortlistedCandidates(prev => [...prev, candidate]);
        setMatchingCandidates(prev => prev.filter(c => c.id !== candidateId));
      }
    } catch (err) {
      console.error('Shortlist failed:', err);
      const msg = err.response?.data?.message || 'Failed to shortlist candidate';
      alert(msg);
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

        {/* Tab Selection */}
        <div className="flex items-center gap-1 bg-gray-100/50 p-1 rounded-xl w-fit border border-gray-100 mb-2">
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

        {/* Content Area */}
        <div className="grid grid-cols-1 gap-6">
          {activeTab === 'matching' ? (
            <div className="space-y-4">
              {matchingCandidates.length === 0 ? (
                <EmptyState
                  icon={Search}
                  title="No matching candidates"
                  description="We couldn't find any candidates matching the mandatory skills for this job."
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {matchingCandidates.map(c => (
                    <Card key={c.id} className="group hover:border-blue-200 transition-all duration-300 hover:shadow-md">
                      <div className="flex flex-col h-full">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                              <Users size={20} />
                            </div>
                            <div>
                              <h3 className="font-bold text-gray-900 leading-tight">
                                {c.firstName} {c.lastName}
                              </h3>
                              <p className="text-[10px] text-gray-400 font-mono mt-0.5 uppercase tracking-wider">
                                {c.candidateCode || 'No Code'}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3 mb-6 flex-grow">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-400 font-medium uppercase tracking-widest text-[9px]">Experience</span>
                            <span className="text-gray-700 font-semibold">{c.totalExperience || 'N/A'}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-400 font-medium uppercase tracking-widest text-[9px]">Location</span>
                            <span className="text-gray-700 font-semibold">{c.currentLocation || 'N/A'}</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {(c.skills || []).slice(0, 4).map(skill => (
                              <span key={skill} className="px-2 py-0.5 rounded-md bg-gray-50 border border-gray-100 text-gray-600 text-[10px] font-medium">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>

                        <button
                          onClick={() => handleShortlist(c.id)}
                          disabled={processingId === c.id}
                          className={`w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${processingId === c.id
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-100 active:scale-[0.98]'
                            }`}
                        >
                          {processingId === c.id ? (
                            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                          ) : (
                            <>
                              <Check size={18} />
                              Shortlist Candidate
                            </>
                          )}
                        </button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {shortlistedCandidates.length === 0 ? (
                <EmptyState
                  icon={UserCheck}
                  title="No shortlisted candidates"
                  description="Start shortlisting candidates from the matching list to see them here."
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {shortlistedCandidates.map(c => (
                    <Card key={c.id} className="border-emerald-100 bg-emerald-50/10">
                      <div className="flex flex-col h-full">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500">
                              <UserCheck size={20} />
                            </div>
                            <div>
                              <h3 className="font-bold text-gray-900 leading-tight">
                                {c.firstName} {c.lastName}
                              </h3>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] text-gray-400 font-mono uppercase tracking-wider">
                                  {c.candidateCode}
                                </span>
                                <span className="w-1 h-1 rounded-full bg-gray-300" />
                                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
                                  Shortlisted
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3 mb-6 flex-grow">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-400 font-medium uppercase tracking-widest text-[9px]">Experience</span>
                            <span className="text-gray-700 font-semibold">{c.totalExperience}</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {(c.skills || []).slice(0, 4).map(skill => (
                              <span key={skill} className="px-2 py-0.5 rounded-md bg-white border border-emerald-100 text-emerald-700 text-[10px] font-medium">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>

                        <button
                          disabled
                          className="w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 bg-emerald-100 text-emerald-700 cursor-default"
                        >
                          <CheckCircle2 size={18} />
                          Shortlisted
                        </button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
};

export default JobDetailsPage;
