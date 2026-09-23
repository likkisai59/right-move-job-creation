import React, { useState, useEffect } from 'react';
import { Building2, Briefcase, Info, CheckCircle2, IndianRupee, Clock, Calendar, MessageSquare, BriefcaseBusiness, XCircle, User, Zap, Sparkles, Plus, X } from 'lucide-react';
import { fetchSelectionDetails, updateSelectionDetails, matchCandidateJobs } from '../../api/candidatesApi';
import { fetchJobs, shortlistCandidate } from '../../api/jobsApi';
import { getCurrentUser, getSystemRole } from '../../api/authApi';
import Button from '../common/Button';
import Badge from '../common/Badge';
import toast, { Toaster } from 'react-hot-toast';
import { CANDIDATE_PIPELINE_STATUSES, PIPELINE_STATUS_COLORS } from '../../utils/constants';

const PIPELINE_STAGES = CANDIDATE_PIPELINE_STATUSES;
const STATUS_COLORS = PIPELINE_STATUS_COLORS;

const HOUR_OPTIONS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

const parseTimeString = (timeStr) => {
  if (!timeStr) return { hour: '', minute: '', ampm: 'AM' };
  const trimmed = timeStr.trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})(?:\s*([AaPp][Mm]))?$/);
  if (match) {
    let h = parseInt(match[1], 10);
    const m = match[2];
    let ampm = match[3] ? match[3].toUpperCase() : 'AM';
    if (!match[3]) {
      if (h >= 12) {
        ampm = 'PM';
        if (h > 12) h -= 12;
      } else if (h === 0) {
        h = 12;
        ampm = 'AM';
      }
    }
    return {
      hour: String(h).padStart(2, '0'),
      minute: m,
      ampm: ampm
    };
  }
  return { hour: '', minute: '', ampm: 'AM' };
};

const SelectionDetailsTab = ({ candidateId, onUpdate, jobId = null }) => {
  const [selections, setSelections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [matching, setMatching] = useState(false);
  const [filterStatus, setFilterStatus] = useState('All');
  const [sortOption, setSortOption] = useState('highest_match');
  // Req 4: Assign to Job modal state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [jobList, setJobList] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [assigning, setAssigning] = useState(false);

  const currentUser = getCurrentUser() || { role: 'Administrator' };
  const isAdmin = currentUser.role === 'Administrator' || currentUser.role === 'Admin' || currentUser.role === 'Director';
  const isTL = currentUser.role === 'Team Lead' || currentUser.role === 'TL';

  // Req 10: Accounts role access only for incentive editing
  const canEditIncentive = (role) => {
    const userRole = (role || '').toLowerCase();
    const sysRole = (getSystemRole ? getSystemRole() : '').toLowerCase();
    return (
      userRole.includes('account') ||
      sysRole.includes('account') ||
      userRole === 'administrator' ||
      userRole === 'admin' ||
      sysRole === 'super_admin' ||
      sysRole === 'admin_admin' ||
      sysRole === 'admin_user'
    );
  };

  useEffect(() => {
    loadSelections();
  }, [candidateId]);

  const loadSelections = async () => {
    try {
      setLoading(true);
      const { data } = await fetchSelectionDetails(candidateId);
      // If jobId is provided (e.g. from Job Details page), filter to only show that job's mapping
      const filtered = jobId
        ? (data || []).filter(s => s.job_id === jobId)
        : (data || []);
      setSelections(filtered);
      if (filtered?.length > 0) setExpandedId(filtered[0].id);
    } catch (error) {
      console.error('Failed to load selection details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (selection) => {
    setEditingId(selection.id);
    const parsedTime = parseTimeString(selection.interview_time || '');
    setEditForm({
      status: selection.status || 'Submitted',
      interview_date: selection.interview_date || '',
      interview_time: selection.interview_time || '',
      interview_hour: parsedTime.hour,
      interview_minute: parsedTime.minute,
      interview_ampm: parsedTime.ampm,
      approval_date: selection.approval_date || '',
      rejection_date: selection.rejection_date || '',
      band: selection.band || '',
      joining_status: selection.joining_status || 'Pending',
      joining_date: selection.joining_date || '',
      salary_offered: selection.salary_offered || '',
      rate_card: selection.rate_card || '',
      incentive: selection.incentive || '',
      recruiter_notes: selection.recruiter_notes || '',
      tl_notes: selection.tl_notes || '',
      client_feedback: selection.client_feedback || '',
      joined_by: selection.joined_by || '',
      remarks: selection.remarks || '',
    });
  };

  const handleTimeChange = (type, val) => {
    const nextHour = type === 'hour' ? val : (editForm.interview_hour || '');
    const nextMin = type === 'minute' ? val : (editForm.interview_minute || '');
    const nextAmpm = type === 'ampm' ? val : (editForm.interview_ampm || 'AM');

    const combined = (nextHour && nextMin) ? `${nextHour}:${nextMin} ${nextAmpm}` : '';
    setEditForm(prev => ({
      ...prev,
      interview_hour: nextHour,
      interview_minute: nextMin,
      interview_ampm: nextAmpm,
      interview_time: combined
    }));
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
    setFormErrors({});
  };

  const handleSave = async (mappingId, overrideData = null) => {
    try {
      setSubmitting(true);
      setFormErrors({});
      // Clean up empty strings, especially for dates
      const payload = overrideData ? { ...overrideData } : { ...editForm };

      let errors = {};
      const statusToCheck = payload.status;

      if (statusToCheck === 'Interview Selected' || statusToCheck === 'Interview Scheduled') {
        if (!payload.interview_date) errors.interview_date = 'Interview Date is required';
        if (!payload.interview_time) errors.interview_time = 'Interview Time is required';
        // Req 33: Recruiter Notes, TL Notes, Client Feedback are NOT mandatory
      }
      if (statusToCheck === 'Final Select' || statusToCheck === 'Candidate Approved') {
        if (!payload.approval_date) errors.approval_date = 'Selection Date is required';
        if (payload.salary_offered && isNaN(Number(payload.salary_offered))) {
          errors.salary_offered = 'Salary must be numeric only';
        }
        if (canEditIncentive(currentUser.role) && payload.incentive && isNaN(Number(payload.incentive))) {
          errors.incentive = 'Incentive must be numeric only';
        }
      }
      if (statusToCheck === 'Joined') {
        if (!payload.joining_date) errors.joining_date = 'Joining Date is required';
      }
      if (statusToCheck === 'Candidate Rejected' && !payload.rejection_date) {
        errors.rejection_date = 'Rejection Date is required';
      }

      // Also validate salary and incentive if provided but they aren't on 'Candidate Approved'
      if (payload.salary_offered && isNaN(Number(payload.salary_offered))) {
        errors.salary_offered = 'Salary must be numeric only';
      }
      if (payload.incentive && isNaN(Number(payload.incentive))) {
        errors.incentive = 'Incentive must be numeric only';
      }

      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        toast.error('Please fix the validation errors before saving');
        setSubmitting(false);
        // If it was a quick action button (overrideData is not null), open the edit form so they can fix it
        if (overrideData) {
          handleEditClick({ ...selections.find(s => s.id === mappingId), status: overrideData.status });
        }
        return;
      }

      if (!payload.interview_date) payload.interview_date = null;
      if (!payload.interview_time) payload.interview_time = null;
      if (!payload.approval_date) payload.approval_date = null;
      if (!payload.rejection_date) payload.rejection_date = null;
      if (!payload.joining_date) payload.joining_date = null;
      if (!payload.salary_offered) payload.salary_offered = null;
      if (!payload.rate_card) payload.rate_card = null;
      if (!payload.incentive) payload.incentive = null;
      if (!payload.joined_by) payload.joined_by = null;
      if (!payload.remarks) payload.remarks = null;

      await updateSelectionDetails(candidateId, mappingId, payload);
      setEditingId(null);
      loadSelections();
      if (onUpdate) onUpdate();
      toast.success('Selection details updated successfully');
    } catch (error) {
      console.error('Failed to update selection details:', error);
      const msg = error.response?.data?.message || 'Failed to update details. Please try again.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleMatchJobs = async () => {
    try {
      setMatching(true);
      await matchCandidateJobs(candidateId);
      await loadSelections();
      toast.success('Candidate successfully auto-matched with open jobs');
    } catch (error) {
      console.error('Failed to run matching engine:', error);
      const msg = error.response?.data?.message || 'Failed to match jobs. Please try again.';
      toast.error(msg);
    } finally {
      setMatching(false);
    }
  };

  // Req 4: Open Assign to Job modal, load active jobs
  const handleOpenAssignModal = async () => {
    setShowAssignModal(true);
    setSelectedJobId('');
    try {
      const res = await fetchJobs({ status: 'active' });
      const jobs = (res.data || []).map(j => ({
        id: j.id,
        label: `${j.jobCode || j.id} — ${j.jobTitle || j.companyName || 'Job'}`,
      }));
      setJobList(jobs);
    } catch {
      setJobList([]);
      toast.error('Could not load job list');
    }
  };

  // Req 4: Perform manual assignment
  const handleAssignToJob = async () => {
    if (!selectedJobId) {
      toast.error('Please select a job to assign');
      return;
    }
    try {
      setAssigning(true);
      await shortlistCandidate(selectedJobId, candidateId);
      toast.success('Candidate successfully assigned to job!');
      setShowAssignModal(false);
      await loadSelections();
      if (onUpdate) onUpdate();
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to assign candidate. Please try again.';
      toast.error(msg);
    } finally {
      setAssigning(false);
    }
  };

  const renderPipeline = (currentStatus, selection = {}) => {
    let path = [];
    if (currentStatus === 'Reject' || currentStatus === 'Interview Rejected' || currentStatus === 'Candidate Rejected') {
      if (selection.interview_date) {
        path = ['Submitted', 'CV Shortlisted', 'Interview Scheduled', 'Reject'];
      } else {
        path = ['Submitted', 'CV Shortlisted', 'Reject'];
      }
    } else if (currentStatus === 'Drop') {
      path = ['Submitted', 'CV Shortlisted', 'Interview Scheduled', 'Drop'];
    } else if (currentStatus === 'Not Offered') {
      path = ['Submitted', 'CV Shortlisted', 'Interview Scheduled', 'Final Select', 'Not Offered'];
    } else {
      path = ['Submitted', 'CV Shortlisted', 'Interview Scheduled', 'Final Select', 'Offered', 'Joined'];
    }

    // Determine completion index
    let renderIndex = path.indexOf(currentStatus);
    if (renderIndex === -1) {
      if (currentStatus === 'Shortlisted') renderIndex = 1;
      else if (currentStatus === 'Interview Selected') renderIndex = 2;
      else if (currentStatus === 'Candidate Approved') renderIndex = 4;
      else if (currentStatus === 'Joined') renderIndex = path.length - 1;
      else if (currentStatus === 'Interview Rejected' || currentStatus === 'Candidate Rejected') renderIndex = path.length - 1;
      else renderIndex = 0;
    }

    return (
      <div className="w-full py-6">
        <div className="flex items-center justify-between relative max-w-2xl mx-auto">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 rounded-full z-0"></div>
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-blue-500 rounded-full z-0 transition-all duration-500"
            style={{ width: `${(renderIndex / (path.length - 1 || 1)) * 100}%` }}
          ></div>

          {path.map((stage, idx) => {
            const isCompleted = idx <= renderIndex;
            const isCurrent = stage === currentStatus || (idx === renderIndex);
            const isReject = stage === 'Reject' || stage.includes('Reject') || stage === 'Drop' || stage === 'Not Offered';

            let circleClass = "w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all duration-300 bg-white ";
            if (isCurrent) {
              circleClass += isReject
                ? "border-red-500 bg-red-500 text-white shadow-md shadow-red-500/30 ring-4 ring-red-500/20"
                : "border-blue-500 bg-blue-500 text-white shadow-md shadow-blue-500/30 ring-4 ring-blue-500/20";
            } else if (isCompleted) {
              circleClass += "border-blue-500 bg-blue-500 text-white shadow-md shadow-blue-500/30";
            } else {
              circleClass += "border-gray-300 text-gray-300";
            }

            return (
              <div key={stage} className="relative z-10 flex flex-col items-center">
                <div className={circleClass}>
                  {isCompleted && !isCurrent && <CheckCircle2 size={12} strokeWidth={3} />}
                  {isCurrent && isReject && <XCircle size={12} strokeWidth={3} />}
                  {isCurrent && !isReject && <CheckCircle2 size={12} strokeWidth={3} />}
                  {!isCompleted && <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />}
                </div>
                <p className={`text-[10px] font-bold mt-2 absolute top-8 whitespace-nowrap text-center ${isCurrent ? (isReject ? 'text-red-600' : 'text-blue-600') : (isCompleted ? 'text-gray-700' : 'text-gray-400')
                  }`}>
                  {stage}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-[3px] border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (selections.length === 0) {
    return (
      <div className="bg-white rounded-[2rem] p-12 border border-gray-100 shadow-sm text-center">
        <div className="w-16 h-16 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
          <Briefcase size={32} />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">No Applications Yet</h3>
        <p className="text-gray-500 mb-6">This candidate has not been mapped or applied to any jobs.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={handleMatchJobs} disabled={matching} className="px-6 py-3">
            <Sparkles size={16} className="mr-2" />
            {matching ? 'Matching...' : 'Match with Open Jobs'}
          </Button>
          {/* Req 4: Manual assign button in empty state */}
          <Button onClick={handleOpenAssignModal} className="px-6 py-3 bg-violet-600 hover:bg-violet-700">
            <Plus size={16} className="mr-2" />
            Assign to Job Manually
          </Button>
        </div>
        {/* Req 4: Assign to Job Modal */}
        {showAssignModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowAssignModal(false)}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Assign to Job</h3>
                <button onClick={() => setShowAssignModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
              </div>
              <p className="text-sm text-gray-500 mb-4">Select a job to manually assign this candidate. Match score will not block assignment.</p>
              <select
                value={selectedJobId}
                onChange={e => setSelectedJobId(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-violet-500 outline-none mb-4"
              >
                <option value="" disabled>Select</option>
                <option value="">Select a job...</option>
                {jobList.map(job => (
                  <option key={job.id} value={job.id}>{job.label}</option>
                ))}
              </select>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setShowAssignModal(false)} className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
                <Button onClick={handleAssignToJob} disabled={assigning || !selectedJobId} className="px-5 py-2 bg-violet-600 hover:bg-violet-700">
                  {assigning ? 'Assigning...' : 'Assign'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  const filteredSelections = selections.filter(sel => {
    if (filterStatus === 'All') return true;
    return sel.status === filterStatus;
  });

  const sortedSelections = [...filteredSelections].sort((a, b) => {
    if (sortOption === 'highest_match') return (b.match_score || 0) - (a.match_score || 0);
    if (sortOption === 'lowest_match') return (a.match_score || 0) - (b.match_score || 0);
    if (sortOption === 'latest_updated') return new Date(b.updated_at) - new Date(a.updated_at);
    if (sortOption === 'recently_added') return new Date(b.created_at) - new Date(a.created_at);
    return 0;
  });

  const STATUS_COLORS = PIPELINE_STATUS_COLORS;

  const SCORE_COLORS = (score) => {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 60) return 'text-orange-500';
    return 'text-rose-600';
  };

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="All">All Status</option>
            {CANDIDATE_PIPELINE_STATUSES.map(stage => (
              <option key={stage} value={stage}>{stage}</option>
            ))}
          </select>

          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="highest_match">Highest Match Score</option>
            <option value="lowest_match">Lowest Match Score</option>
            <option value="latest_updated">Latest Updated</option>
            <option value="recently_added">Recently Added</option>
          </select>
        </div>

        <Button onClick={handleMatchJobs} disabled={matching} className="bg-blue-50 text-blue-600 hover:bg-blue-100 border-none font-bold shrink-0">
          <Sparkles size={16} className="mr-2" />
          {matching ? 'Matching...' : 'Run Auto-Match'}
        </Button>
        {/* Req 4: Assign to Job button in header */}
        <Button onClick={handleOpenAssignModal} className="bg-violet-50 text-violet-600 hover:bg-violet-100 border-none font-bold shrink-0">
          <Plus size={16} className="mr-2" />
          Assign to Job
        </Button>
      </div>

      {/* Req 4: Assign to Job Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowAssignModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Assign to Job</h3>
              <button onClick={() => setShowAssignModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <p className="text-sm text-gray-500 mb-4">Select a job to manually assign this candidate. Match score will not block assignment.</p>
            <select
              value={selectedJobId}
              onChange={e => setSelectedJobId(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-violet-500 outline-none mb-4"
            >
              <option value="" disabled>Select</option>
              <option value="">Select a job...</option>
              {jobList.map(job => (
                <option key={job.id} value={job.id}>{job.label}</option>
              ))}
            </select>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowAssignModal(false)} className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
              <Button onClick={handleAssignToJob} disabled={assigning || !selectedJobId} className="px-5 py-2 bg-violet-600 hover:bg-violet-700">
                {assigning ? 'Assigning...' : 'Assign'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {sortedSelections.map((selection) => {
        const isExpanded = expandedId === selection.id;
        const isEditing = editingId === selection.id;

        let matchedSkills = [];
        let missingSkills = [];
        try { if (selection.matched_skills) matchedSkills = JSON.parse(selection.matched_skills); } catch (e) { }
        try { if (selection.missing_skills) missingSkills = JSON.parse(selection.missing_skills); } catch (e) { }

        return (
          <div key={selection.id} className="bg-white rounded-[2rem] overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            {/* Header / Summary */}
            <div
              className="p-6 md:p-8 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-50 bg-gray-50/30 hover:bg-gray-50 transition-colors"
              onClick={() => !isEditing && setExpandedId(isExpanded ? null : selection.id)}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${STATUS_COLORS[selection.status] || 'bg-blue-100 text-blue-600'}`}>
                  <BriefcaseBusiness size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900 tracking-tight mb-1 flex items-center gap-2">
                    {selection.job_title || 'Unknown Job'}
                    <span className={`text-sm font-black px-2 py-0.5 rounded-full bg-gray-50 border border-gray-100 ${SCORE_COLORS(selection.match_score || 0)}`}>
                      {selection.match_score || 0}% Match
                    </span>
                  </h3>
                  <div className="flex items-center gap-3 text-sm font-semibold text-gray-500">
                    <span className="flex items-center gap-1"><User size={14} /> CID: {candidateId}</span>
                    <span className="text-gray-300">•</span>
                    <span className="flex items-center gap-1"><Building2 size={14} /> {selection.organization_name || 'Unknown Company'}</span>
                    {selection.business_unit && (
                      <>
                        <span className="text-gray-300">•</span>
                        <span className="flex items-center gap-1"><Badge color="purple" label={selection.business_unit} /></span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex gap-2 mr-4">
                  {(selection.status === 'Submitted' || selection.status === 'CV Shortlisted' || selection.status === 'Shortlisted') && (
                    <>
                      <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleEditClick({ ...selection, status: 'Interview Scheduled' }); }} className="text-xs py-1 px-3 border-indigo-200 text-indigo-700 hover:bg-indigo-50">Schedule Interview</Button>
                      <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleEditClick({ ...selection, status: 'Reject' }); }} className="text-xs py-1 px-3 border-red-200 text-red-700 hover:bg-red-50">Reject</Button>
                    </>
                  )}
                  {(selection.status === 'Interview Scheduled' || selection.status === 'Interview Selected') && (
                    <>
                      <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleEditClick({ ...selection, status: 'Final Select' }); }} className="text-xs py-1 px-3 border-teal-200 text-teal-700 hover:bg-teal-50">Final Select</Button>
                      <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleEditClick({ ...selection, status: 'Reject' }); }} className="text-xs py-1 px-3 border-rose-200 text-rose-700 hover:bg-rose-50">Reject</Button>
                    </>
                  )}
                  {(selection.status === 'Final Select' || selection.status === 'Candidate Approved') && (
                    <>
                      <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleEditClick({ ...selection, status: 'Offered' }); }} className="text-xs py-1 px-3 border-amber-200 text-amber-700 hover:bg-amber-50">Offer</Button>
                      <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleEditClick({ ...selection, status: 'Not Offered' }); }} className="text-xs py-1 px-3 border-rose-200 text-rose-700 hover:bg-rose-50">Not Offered</Button>
                    </>
                  )}
                  {selection.status === 'Offered' && (
                    <>
                      <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleEditClick({ ...selection, status: 'Joined' }); }} className="text-xs py-1 px-3 border-blue-200 text-blue-700 hover:bg-blue-50">Mark as Joined</Button>
                      <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleEditClick({ ...selection, status: 'Drop' }); }} className="text-xs py-1 px-3 border-gray-200 text-gray-700 hover:bg-gray-50">Drop</Button>
                    </>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Current Status</p>
                  <div className={`text-sm font-bold py-1 px-3 rounded-full border ${STATUS_COLORS[selection.status] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                    {selection.status || 'Applied'}
                  </div>
                </div>
              </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="p-6 md:p-8 space-y-8 animate-in slide-in-from-top-2 duration-300">
                {/* Pipeline */}
                <div className="mb-12">
                  {renderPipeline(selection.status || 'Applied', selection)}
                </div>

                {!isEditing ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column */}
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                          <CheckCircle2 size={14} className="text-blue-500" /> Matching Details
                        </h4>
                        <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100 space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-semibold text-gray-600">Match Score</span>
                            <span className="text-lg font-black text-blue-600">{selection.match_score || 0}%</span>
                          </div>

                          <div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase block mb-2">Matched Skills</span>
                            <div className="flex flex-wrap gap-2">
                              {matchedSkills.length > 0 ? matchedSkills.map(s => (
                                <span key={s} className="px-2 py-1 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-lg border border-emerald-100">{s}</span>
                              )) : <span className="text-xs text-gray-400 italic">None</span>}
                            </div>
                          </div>

                          <div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase block mb-2">Missing Skills</span>
                            <div className="flex flex-wrap gap-2">
                              {missingSkills.length > 0 ? missingSkills.map(s => (
                                <span key={s} className="px-2 py-1 bg-red-50 text-red-600 text-xs font-bold rounded-lg border border-red-100">{s}</span>
                              )) : <span className="text-xs text-gray-400 italic">None</span>}
                            </div>
                          </div>
                        </div>
                      </div>

                      {(selection.interview_date || selection.approval_date || selection.rejection_date || selection.joining_date) && (
                        <div>
                          <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <Clock size={14} className="text-indigo-500" /> Workflow Dates & Details
                          </h4>
                          <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100 grid grid-cols-2 gap-4">
                            {selection.interview_date && (
                              <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Interview Details</p>
                                <p className="text-sm font-semibold text-gray-900">{selection.interview_date} {selection.interview_time ? `@ ${selection.interview_time}` : ''}</p>
                              </div>
                            )}
                            {selection.approval_date && (
                              <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Selection Date</p>
                                <p className="text-sm font-semibold text-gray-900">{selection.approval_date}</p>
                              </div>
                            )}
                            {selection.joining_date && (
                              <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Joining Date</p>
                                <p className="text-sm font-semibold text-gray-900">{selection.joining_date}</p>
                              </div>
                            )}
                            {selection.rejection_date && (
                              <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Rejection Date</p>
                                <p className="text-sm font-semibold text-gray-900">{selection.rejection_date}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                      {(selection.salary_offered || selection.band || selection.rate_card || selection.incentive) && (
                        <div>
                          <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <IndianRupee size={14} className="text-emerald-500" /> Commercial Details
                          </h4>
                          <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100 space-y-3">
                            {selection.salary_offered && (
                              <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                                <span className="text-sm font-semibold text-gray-600">Salary</span>
                                <span className="text-sm font-bold text-gray-900">{selection.salary_offered}</span>
                              </div>
                            )}

                            {selection.band && (
                              <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                                <span className="text-sm font-semibold text-gray-600">Band</span>
                                <span className="text-sm font-bold text-gray-900">{selection.band}</span>
                              </div>
                            )}

                            {(isAdmin && selection.rate_card) && (
                              <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                                <span className="text-sm font-semibold text-gray-600">Rate Card (Admin)</span>
                                <span className="text-sm font-bold text-gray-900">{selection.rate_card}</span>
                              </div>
                            )}

                            {(canEditIncentive(currentUser.role) && selection.incentive) && (
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-semibold text-gray-600">Incentive</span>
                                <span className="text-sm font-bold text-gray-900">{selection.incentive}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <div>
                        <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                          <MessageSquare size={14} className="text-amber-500" /> Remarks & Feedback
                        </h4>
                        <div className="bg-amber-50/30 p-5 rounded-2xl border border-amber-100 space-y-4">
                          {selection.recruiter_notes && (
                            <div>
                              <p className="text-[10px] font-bold text-amber-600 uppercase mb-1">Recruiter Notes</p>
                              <p className="text-sm text-gray-700 italic">{selection.recruiter_notes}</p>
                            </div>
                          )}
                          {selection.tl_notes && (
                            <div>
                              <p className="text-[10px] font-bold text-amber-600 uppercase mb-1">TL Notes</p>
                              <p className="text-sm text-gray-700 italic">{selection.tl_notes}</p>
                            </div>
                          )}
                          {selection.client_feedback && (
                            <div>
                              <p className="text-[10px] font-bold text-amber-600 uppercase mb-1">Client Feedback</p>
                              <p className="text-sm text-gray-700 italic">{selection.client_feedback}</p>
                            </div>
                          )}
                          {selection.remarks && (
                            <div>
                              <p className="text-[10px] font-bold text-amber-600 uppercase mb-1">
                                {selection.status === 'Reject' || selection.status === 'Candidate Rejected' ? 'Rejection Reason' : 'Joining Remarks'}
                              </p>
                              <p className="text-sm text-gray-700 italic">{selection.remarks}</p>
                            </div>
                          )}
                          {!selection.recruiter_notes && !selection.tl_notes && !selection.client_feedback && !selection.remarks && (
                            <p className="text-sm text-gray-400 italic">No remarks provided yet.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  // EDIT MODE
                  <div className="bg-blue-50/30 p-6 rounded-2xl border border-blue-100">
                    <h4 className="text-sm font-black text-blue-800 uppercase tracking-widest mb-6">Update Selection Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                      <div className="space-y-4">
                        <div>
                          <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Pipeline Status</label>
                          <select
                            value={editForm.status}
                            onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                          >
                            <option value="" disabled>Select</option>
                            {CANDIDATE_PIPELINE_STATUSES.map((status) => (
                              <option key={status} value={status}>{status}</option>
                            ))}
                          </select>
                        </div>

                        {(editForm.status === 'Interview Scheduled' || editForm.status === 'Interview Selected') && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Interview Date</label>
                              <input
                                type="date"
                                value={editForm.interview_date}
                                onChange={(e) => setEditForm({ ...editForm, interview_date: e.target.value })}
                                className={`w-full px-4 py-2.5 rounded-xl border ${formErrors.interview_date ? 'border-red-400 focus:ring-red-500' : 'border-gray-200 focus:ring-blue-500'} bg-white text-sm font-semibold focus:ring-2 outline-none`}
                              />
                              {formErrors.interview_date && <p className="text-red-500 text-[10px] mt-1 font-semibold">{formErrors.interview_date}</p>}
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Interview Time</label>
                              <div className="grid grid-cols-3 gap-2">
                                <select
                                  value={editForm.interview_hour || ''}
                                  onChange={(e) => handleTimeChange('hour', e.target.value)}
                                  className={`w-full px-2 py-2.5 rounded-xl border ${formErrors.interview_time ? 'border-red-400 focus:ring-red-500' : 'border-gray-200 focus:ring-blue-500'} bg-white text-sm font-semibold focus:ring-2 outline-none`}
                                >
                                  <option value="" disabled>Select</option>
                                  <option value="">HH</option>
                                  {HOUR_OPTIONS.map(h => (
                                    <option key={h} value={h}>{h}</option>
                                  ))}
                                </select>
                                <select
                                  value={editForm.interview_minute || ''}
                                  onChange={(e) => handleTimeChange('minute', e.target.value)}
                                  className={`w-full px-2 py-2.5 rounded-xl border ${formErrors.interview_time ? 'border-red-400 focus:ring-red-500' : 'border-gray-200 focus:ring-blue-500'} bg-white text-sm font-semibold focus:ring-2 outline-none`}
                                >
                                  <option value="" disabled>Select</option>
                                  <option value="">MM</option>
                                  {MINUTE_OPTIONS.map(m => (
                                    <option key={m} value={m}>{m}</option>
                                  ))}
                                </select>
                                <select
                                  value={editForm.interview_ampm || 'AM'}
                                  onChange={(e) => handleTimeChange('ampm', e.target.value)}
                                  className="w-full px-2 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                  <option value="AM">AM</option>
                                  <option value="PM">PM</option>
                                </select>
                              </div>
                              {formErrors.interview_time && <p className="text-red-500 text-[10px] mt-1 font-semibold">{formErrors.interview_time}</p>}
                            </div>
                          </div>
                        )}

                        {(editForm.status === 'Final Select' || editForm.status === 'Candidate Approved') && (
                          <>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Selection Date *</label>
                                <input
                                  type="date"
                                  value={editForm.approval_date}
                                  onChange={(e) => setEditForm({ ...editForm, approval_date: e.target.value })}
                                  className={`w-full px-4 py-2.5 rounded-xl border ${formErrors.approval_date ? 'border-red-400 focus:ring-red-500' : 'border-gray-200 focus:ring-blue-500'} bg-white text-sm font-semibold focus:ring-2 outline-none`}
                                />
                                {formErrors.approval_date && <p className="text-red-500 text-[10px] mt-1 font-semibold">{formErrors.approval_date}</p>}
                              </div>
                              <div>
                                <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Joining Date (Optional)</label>
                                <input
                                  type="date"
                                  value={editForm.joining_date}
                                  onChange={(e) => setEditForm({ ...editForm, joining_date: e.target.value })}
                                  className={`w-full px-4 py-2.5 rounded-xl border ${formErrors.joining_date ? 'border-red-400 focus:ring-red-500' : 'border-gray-200 focus:ring-blue-500'} bg-white text-sm font-semibold focus:ring-2 outline-none`}
                                />
                                {formErrors.joining_date && <p className="text-red-500 text-[10px] mt-1 font-semibold">{formErrors.joining_date}</p>}
                              </div>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                              <div>
                                <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Salary</label>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  placeholder="e.g. 500000"
                                  onKeyDown={(e) => { if (!/[0-9.]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) e.preventDefault(); }}
                                  onPaste={(e) => { const paste = e.clipboardData.getData('text'); if (!/^\d*\.?\d*$/.test(paste)) e.preventDefault(); }}
                                  value={editForm.salary_offered}
                                  onChange={(e) => setEditForm({ ...editForm, salary_offered: e.target.value })}
                                  className={`w-full px-4 py-2.5 rounded-xl border ${formErrors.salary_offered ? 'border-red-400 focus:ring-red-500' : 'border-gray-200 focus:ring-blue-500'} bg-white text-sm font-semibold focus:ring-2 outline-none`}
                                />
                                {formErrors.salary_offered && <p className="text-red-500 text-[10px] mt-1 font-semibold">{formErrors.salary_offered}</p>}
                              </div>
                            </div>
                        )}

                            {editForm.status === 'Joined' && (
                              <>
                                <div className="grid grid-cols-1 gap-4">
                                  <div>
                                    <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Joining Date *</label>
                                    <input
                                      type="date"
                                      value={editForm.joining_date}
                                      onChange={(e) => setEditForm({ ...editForm, joining_date: e.target.value })}
                                      className={`w-full px-4 py-2.5 rounded-xl border ${formErrors.joining_date ? 'border-red-400 focus:ring-red-500' : 'border-gray-200 focus:ring-blue-500'} bg-white text-sm font-semibold focus:ring-2 outline-none`}
                                    />
                                    {formErrors.joining_date && <p className="text-red-500 text-[10px] mt-1 font-semibold">{formErrors.joining_date}</p>}
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Remarks</label>
                                  <textarea
                                    rows={2}
                                    placeholder="Joining remarks..."
                                    value={editForm.remarks}
                                    onChange={(e) => setEditForm({ ...editForm, remarks: e.target.value })}
                                    className={`w-full px-4 py-2.5 rounded-xl border ${formErrors.remarks ? 'border-red-400 focus:ring-red-500' : 'border-gray-200 focus:ring-blue-500'} bg-white text-sm font-semibold focus:ring-2 outline-none resize-none`}
                                  ></textarea>
                                  {formErrors.remarks && <p className="text-red-500 text-[10px] mt-1 font-semibold">{formErrors.remarks}</p>}
                                </div>
                              </>
                            )}

                            {(editForm.status === 'Reject' || editForm.status === 'Candidate Rejected') && (
                              <div className="space-y-4">
                                <div>
                                  <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Rejection Reason</label>
                                  <textarea
                                    rows={2}
                                    placeholder="Enter rejection reason..."
                                    value={editForm.remarks || ''}
                                    onChange={(e) => setEditForm({ ...editForm, remarks: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                  ></textarea>
                                </div>
                                <div>
                                  <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Rejection Date</label>
                                  <input
                                    type="date"
                                    value={editForm.rejection_date}
                                    onChange={(e) => setEditForm({ ...editForm, rejection_date: e.target.value })}
                                    className={`w-full px-4 py-2.5 rounded-xl border ${formErrors.rejection_date ? 'border-red-400 focus:ring-red-500' : 'border-gray-200 focus:ring-blue-500'} bg-white text-sm font-semibold focus:ring-2 outline-none`}
                                  />
                                  {formErrors.rejection_date && <p className="text-red-500 text-[10px] mt-1 font-semibold">{formErrors.rejection_date}</p>}
                                </div>
                              </div>
                            )}
                          </div>

                        <div className="space-y-4">
                          <div>
                            <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Recruiter Notes</label>
                            <textarea
                              rows={2}
                              value={editForm.recruiter_notes}
                              onChange={(e) => setEditForm({ ...editForm, recruiter_notes: e.target.value })}
                              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                            ></textarea>
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">TL Notes</label>
                            <textarea
                              rows={2}
                              value={editForm.tl_notes}
                              onChange={(e) => setEditForm({ ...editForm, tl_notes: e.target.value })}
                              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                            ></textarea>
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Client Feedback</label>
                            <textarea
                              rows={2}
                              value={editForm.client_feedback}
                              onChange={(e) => setEditForm({ ...editForm, client_feedback: e.target.value })}
                              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                            ></textarea>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-blue-200">
                        <Button variant="outline" onClick={handleCancelEdit} disabled={submitting}>Cancel</Button>
                        <Button variant="primary" onClick={() => handleSave(selection.id)} disabled={submitting}>
                          {submitting ? 'Saving...' : 'Save Changes'}
                        </Button>
                      </div>
                    </div>
                )}

                    {/* Edit Toggle Button */}
                    {!isEditing && (
                      <div className="flex justify-end pt-4 border-t border-gray-100">
                        <Button variant="outline" onClick={() => handleEditClick(selection)} className="text-sm">
                          Update Selection Details
                        </Button>
                      </div>
                    )}

                    {/* Audit Trail */}
                    <div className="mt-8 pt-6 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4 text-[10px] font-medium text-gray-400">
                      <div>
                        <p>Record Created: {selection.created_at ? new Date(selection.created_at).toLocaleString() : '—'}</p>
                        <p>Last Updated: {selection.updated_at ? new Date(selection.updated_at).toLocaleString() : '—'} {selection.updated_by ? `by User ${selection.updated_by}` : ''}</p>
                      </div>
                      <div className="md:text-right">
                        <p>Last Status Change: {selection.last_status_changed_at ? new Date(selection.last_status_changed_at).toLocaleString() : '—'} {selection.last_status_changed_by ? `by User ${selection.last_status_changed_by}` : ''}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
      })}
          </div>
        );
      };

      export default SelectionDetailsTab;
