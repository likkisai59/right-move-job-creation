import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  Users, 
  CheckCircle2, 
  XCircle, 
  Building2, 
  Hash, 
  Loader2, 
  AlertCircle, 
  Clock, 
  Award, 
  UserMinus,
  Play
} from 'lucide-react';
import Modal from '../common/Modal';
import { fetchJobStats } from '../../api/jobsApi';

const JobStatsModal = ({ isOpen, onClose, job }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (isOpen && job?.id) {
      loadStats();
    } else {
      setStats(null);
      setError(null);
    }
  }, [isOpen, job]);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await fetchJobStats(job.id);
      setStats(data);
    } catch (err) {
      console.error('Failed to load job stats:', err);
      setError('Failed to load job statistics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getPercentage = (value, total) => {
    if (!total) return 0;
    return Math.round((value / total) * 100);
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Job Pipeline & Openings Summary"
      size="lg"
    >
      {loading && (
        <div className="flex flex-col items-center justify-center py-12 space-y-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-sm font-semibold text-gray-500 animate-pulse">
            Fetching requirement statistics...
          </p>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl mb-4">
          <AlertCircle className="shrink-0" size={20} />
          <p className="text-sm font-semibold">{error}</p>
        </div>
      )}

      {!loading && !error && stats && (
        <div className="space-y-6">
          {/* Job Info Header Card */}
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-200">
                <Briefcase size={22} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                  {stats.job_code}
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-100">
                    {job?.businessUnit || 'IT'}
                  </span>
                </h3>
                <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 font-semibold">
                  <Building2 size={13} />
                  <span>{stats.company_name}</span>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Total Openings
              </span>
              <span className="text-2xl font-black text-slate-800">
                {stats.openings.total}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: Positions Breakdown */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Hash size={14} className="text-blue-500" /> Openings Breakdown
              </h4>

              <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-4 shadow-sm">
                {/* Active */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-600 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                      Active Requirements
                    </span>
                    <span className="text-slate-800">
                      {stats.openings.active} / {stats.openings.total}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${getPercentage(stats.openings.active, stats.openings.total)}%` }}
                    />
                  </div>
                </div>

                {/* On Hold */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-600 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                      On Hold Requirements
                    </span>
                    <span className="text-slate-800">
                      {stats.openings.on_hold} / {stats.openings.total}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-amber-500 rounded-full transition-all duration-500"
                      style={{ width: `${getPercentage(stats.openings.on_hold, stats.openings.total)}%` }}
                    />
                  </div>
                </div>

                {/* Closed */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-600 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                      Closed Requirements
                    </span>
                    <span className="text-slate-800">
                      {stats.openings.closed} / {stats.openings.total}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-rose-500 rounded-full transition-all duration-500"
                      style={{ width: `${getPercentage(stats.openings.closed, stats.openings.total)}%` }}
                    />
                  </div>
                </div>

                {/* Draft */}
                {stats.openings.draft > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-600 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block" />
                        Draft Requirements
                      </span>
                      <span className="text-slate-800">
                        {stats.openings.draft} / {stats.openings.total}
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-slate-400 rounded-full transition-all duration-500"
                        style={{ width: `${getPercentage(stats.openings.draft, stats.openings.total)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Candidate Pipeline Funnel */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Users size={14} className="text-indigo-500" /> Candidate Pipeline
              </h4>

              <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-3 shadow-sm">

                {/* Shortlisted */}
                <div className="flex items-center justify-between p-2.5 hover:bg-slate-50 rounded-xl transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                      <Play size={15} className="rotate-90" />
                    </div>
                    <span className="text-xs font-bold text-slate-700">Shortlisted</span>
                  </div>
                  <span className="text-sm font-black text-slate-900 bg-purple-50 px-3 py-1 rounded-full">
                    {stats.candidates.shortlisted}
                  </span>
                </div>

                {/* Interviewing */}
                <div className="flex items-center justify-between p-2.5 hover:bg-slate-50 rounded-xl transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                      <Clock size={16} />
                    </div>
                    <span className="text-xs font-bold text-slate-700">Interviews Scheduled</span>
                  </div>
                  <span className="text-sm font-black text-slate-900 bg-indigo-50 px-3 py-1 rounded-full">
                    {stats.candidates.interviewing}
                  </span>
                </div>

                {/* Approved */}
                <div className="flex items-center justify-between p-2.5 hover:bg-slate-50 rounded-xl transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                      <CheckCircle2 size={16} />
                    </div>
                    <span className="text-xs font-bold text-slate-700">Candidate Approved</span>
                  </div>
                  <span className="text-sm font-black text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
                    {stats.candidates.approved}
                  </span>
                </div>

                {/* Joined */}
                <div className="flex items-center justify-between p-2.5 hover:bg-slate-50 rounded-xl transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                      <Award size={16} />
                    </div>
                    <span className="text-xs font-bold text-slate-700">Joined</span>
                  </div>
                  <span className="text-sm font-black text-blue-700 bg-blue-50 px-3 py-1 rounded-full">
                    {stats.candidates.joined ?? 0}
                  </span>
                </div>

                {/* Rejected */}
                <div className="flex items-center justify-between p-2.5 hover:bg-slate-50 rounded-xl transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                      <UserMinus size={16} />
                    </div>
                    <span className="text-xs font-bold text-slate-700">Rejected</span>
                  </div>
                  <span className="text-sm font-black text-rose-700 bg-rose-50 px-3 py-1 rounded-full">
                    {stats.candidates.rejected}
                  </span>
                </div>

              </div>
            </div>

          </div>
        </div>
      )}
    </Modal>
  );
};

export default JobStatsModal;
