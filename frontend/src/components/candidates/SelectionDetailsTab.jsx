import React, { useState, useEffect } from 'react';
import { Building2, Briefcase, Info, CheckCircle2, IndianRupee, Clock, Calendar, MessageSquare, BriefcaseBusiness, XCircle, User, Zap, Sparkles } from 'lucide-react';
import { fetchSelectionDetails, updateSelectionDetails, matchCandidateJobs } from '../../api/candidatesApi';
import { getCurrentUser } from '../../api/authApi';
import Button from '../common/Button';
import Badge from '../common/Badge';
import toast, { Toaster } from 'react-hot-toast';

const PIPELINE_STAGES = [
  'Applied',
  'Matched',
  'Shortlisted',
  'Interview Scheduled',
  'Interview Completed',
  'Selected',
  'Rejected',
  'Hold'
];

const SelectionDetailsTab = ({ candidateId }) => {
  const [selections, setSelections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [matching, setMatching] = useState(false);
  const [filterStatus, setFilterStatus] = useState('All');
  const [sortOption, setSortOption] = useState('highest_match');

  const currentUser = getCurrentUser() || { role: 'Administrator' };
  const isAdmin = currentUser.role === 'Administrator' || currentUser.role === 'Admin';
  const isTL = currentUser.role === 'Team Lead' || currentUser.role === 'TL';

  useEffect(() => {
    loadSelections();
  }, [candidateId]);

  const loadSelections = async () => {
    try {
      setLoading(true);
      const { data } = await fetchSelectionDetails(candidateId);
      setSelections(data || []);
      if (data?.length > 0) setExpandedId(data[0].id);
    } catch (error) {
      console.error('Failed to load selection details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (selection) => {
    setEditingId(selection.id);
    setEditForm({
      status: selection.status || 'Applied',
      joining_status: selection.joining_status || 'Pending',
      joining_date: selection.joining_date || '',
      salary_offered: selection.salary_offered || '',
      rate_card: selection.rate_card || '',
      incentive: selection.incentive || '',
      recruiter_notes: selection.recruiter_notes || '',
      tl_notes: selection.tl_notes || '',
      client_feedback: selection.client_feedback || '',
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleSave = async (mappingId, overrideData = null) => {
    try {
      setSubmitting(true);
      // Clean up empty strings, especially for dates
      const payload = overrideData ? { ...overrideData } : { ...editForm };
      if (!payload.joining_date) payload.joining_date = null;
      if (!payload.salary_offered) payload.salary_offered = null;
      if (!payload.rate_card) payload.rate_card = null;
      if (!payload.incentive) payload.incentive = null;
      
      await updateSelectionDetails(candidateId, mappingId, payload);
      setEditingId(null);
      loadSelections();
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

  const renderPipeline = (currentStatus) => {
    const currentIndex = PIPELINE_STAGES.indexOf(currentStatus);
    const renderIndex = currentIndex === -1 ? 0 : currentIndex;

    return (
      <div className="w-full py-6">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 rounded-full z-0"></div>
          <div 
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-blue-500 rounded-full z-0 transition-all duration-500"
            style={{ width: `${(renderIndex / (PIPELINE_STAGES.length - 1)) * 100}%` }}
          ></div>
          
          {PIPELINE_STAGES.map((stage, idx) => {
            const isCompleted = idx <= renderIndex;
            const isCurrent = idx === renderIndex;
            
            return (
              <div key={stage} className="relative z-10 flex flex-col items-center">
                <div 
                  className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                    isCompleted 
                      ? 'bg-blue-500 border-blue-500 text-white shadow-md shadow-blue-500/30' 
                      : 'bg-white border-gray-300 text-gray-300'
                  } ${isCurrent ? 'ring-4 ring-blue-500/20' : ''}`}
                >
                  {isCompleted && <CheckCircle2 size={12} strokeWidth={3} />}
                </div>
                <p className={`text-[10px] font-bold mt-2 absolute top-8 whitespace-nowrap text-center ${
                  isCurrent ? 'text-blue-600' : (isCompleted ? 'text-gray-700' : 'text-gray-400')
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
        <Button onClick={handleMatchJobs} disabled={matching} className="px-6 py-3">
          <Sparkles size={16} className="mr-2" />
          {matching ? 'Matching...' : 'Match with Open Jobs'}
        </Button>
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

  const STATUS_COLORS = {
    Matched: 'bg-blue-100 text-blue-700 border-blue-200',
    Shortlisted: 'bg-purple-100 text-purple-700 border-purple-200',
    'Interview Scheduled': 'bg-orange-100 text-orange-700 border-orange-200',
    'Interview Completed': 'bg-indigo-100 text-indigo-700 border-indigo-200',
    Selected: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    Joined: 'bg-green-100 text-green-700 border-green-200',
    Rejected: 'bg-rose-100 text-rose-700 border-rose-200',
    Hold: 'bg-gray-100 text-gray-700 border-gray-200'
  };

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
            <option value="Matched">Matched</option>
            <option value="Shortlisted">Shortlisted</option>
            <option value="Interview Scheduled">Interview Scheduled</option>
            <option value="Interview Completed">Interview Completed</option>
            <option value="Selected">Selected</option>
            <option value="Rejected">Rejected</option>
            <option value="Hold">Hold</option>
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
      </div>

      {sortedSelections.map((selection) => {
        const isExpanded = expandedId === selection.id;
        const isEditing = editingId === selection.id;
        
        let matchedSkills = [];
        let missingSkills = [];
        try { if(selection.matched_skills) matchedSkills = JSON.parse(selection.matched_skills); } catch(e){}
        try { if(selection.missing_skills) missingSkills = JSON.parse(selection.missing_skills); } catch(e){}

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
                    <span className="flex items-center gap-1"><User size={14}/> CID: {candidateId}</span>
                    <span className="text-gray-300">•</span>
                    <span className="flex items-center gap-1"><Building2 size={14}/> {selection.organization_name || 'Unknown Company'}</span>
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
                  {selection.status === 'Matched' && (
                    <>
                      <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleSave(selection.id, { status: 'Shortlisted' }); }} className="text-xs py-1 px-3 border-purple-200 text-purple-700 hover:bg-purple-50">Shortlist</Button>
                      <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleSave(selection.id, { status: 'Rejected' }); }} className="text-xs py-1 px-3 border-rose-200 text-rose-700 hover:bg-rose-50">Reject</Button>
                    </>
                  )}
                  {selection.status === 'Shortlisted' && (
                    <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleSave(selection.id, { status: 'Interview Scheduled' }); }} className="text-xs py-1 px-3 border-orange-200 text-orange-700 hover:bg-orange-50">Schedule Interview</Button>
                  )}
                  {selection.status === 'Interview Completed' && (
                    <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleSave(selection.id, { status: 'Selected' }); }} className="text-xs py-1 px-3 border-emerald-200 text-emerald-700 hover:bg-emerald-50">Mark Selected</Button>
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
                  {renderPipeline(selection.status || 'Applied')}
                </div>

                {!isEditing ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column */}
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                          <CheckCircle2 size={14} className="text-blue-500"/> Matching Details
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

                      <div>
                        <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                          <Clock size={14} className="text-indigo-500"/> Joining Information
                        </h4>
                        <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100 grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Status</p>
                            <p className="text-sm font-semibold text-gray-900">{selection.joining_status || 'Pending'}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Date</p>
                            <p className="text-sm font-semibold text-gray-900">{selection.joining_date || '—'}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                          <IndianRupee size={14} className="text-emerald-500"/> Commercial Details
                        </h4>
                        <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100 space-y-3">
                          <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                            <span className="text-sm font-semibold text-gray-600">Salary Offered</span>
                            <span className="text-sm font-bold text-gray-900">{selection.salary_offered || '—'}</span>
                          </div>
                          
                          {(isAdmin) && (
                            <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                              <span className="text-sm font-semibold text-gray-600">Rate Card (Admin)</span>
                              <span className="text-sm font-bold text-gray-900">{selection.rate_card || '—'}</span>
                            </div>
                          )}
                          
                          {(isAdmin || isTL) && (
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-semibold text-gray-600">Incentive (TL)</span>
                              <span className="text-sm font-bold text-gray-900">{selection.incentive || '—'}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                          <MessageSquare size={14} className="text-amber-500"/> Remarks & Feedback
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
                          {!selection.recruiter_notes && !selection.tl_notes && !selection.client_feedback && (
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
                            onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                          >
                            <option value="Applied">Applied</option>
                            <option value="Matched">Matched</option>
                            <option value="Shortlisted">Shortlisted</option>
                            <option value="Interview Scheduled">Interview Scheduled</option>
                            <option value="Interview Completed">Interview Completed</option>
                            <option value="Selected">Selected</option>
                            <option value="Rejected">Rejected</option>
                            <option value="Hold">Hold</option>
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Joining Status</label>
                            <select 
                              value={editForm.joining_status} 
                              onChange={(e) => setEditForm({...editForm, joining_status: e.target.value})}
                              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                              <option value="Pending">Pending</option>
                              <option value="Joined">Joined</option>
                              <option value="Not Joined">Not Joined</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Joining Date</label>
                            <input 
                              type="date" 
                              value={editForm.joining_date} 
                              onChange={(e) => setEditForm({...editForm, joining_date: e.target.value})}
                              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Salary Offered</label>
                          <input 
                            type="text" 
                            placeholder="e.g. ₹15 LPA"
                            value={editForm.salary_offered} 
                            onChange={(e) => setEditForm({...editForm, salary_offered: e.target.value})}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>
                        
                        {(isAdmin) && (
                          <div>
                            <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Rate Card (Admin)</label>
                            <input 
                              type="text" 
                              placeholder="e.g. ₹20,000"
                              value={editForm.rate_card} 
                              onChange={(e) => setEditForm({...editForm, rate_card: e.target.value})}
                              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                          </div>
                        )}
                        
                        {(isAdmin || isTL) && (
                          <div>
                            <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Incentive (TL)</label>
                            <input 
                              type="text" 
                              placeholder="e.g. ₹5,000"
                              value={editForm.incentive} 
                              onChange={(e) => setEditForm({...editForm, incentive: e.target.value})}
                              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                          </div>
                        )}
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Recruiter Notes</label>
                          <textarea 
                            rows={2}
                            value={editForm.recruiter_notes} 
                            onChange={(e) => setEditForm({...editForm, recruiter_notes: e.target.value})}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                          ></textarea>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">TL Notes</label>
                          <textarea 
                            rows={2}
                            value={editForm.tl_notes} 
                            onChange={(e) => setEditForm({...editForm, tl_notes: e.target.value})}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                          ></textarea>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Client Feedback</label>
                          <textarea 
                            rows={2}
                            value={editForm.client_feedback} 
                            onChange={(e) => setEditForm({...editForm, client_feedback: e.target.value})}
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
