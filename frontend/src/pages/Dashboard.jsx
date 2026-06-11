import React, { useEffect, useState } from 'react';
import { 
  Briefcase, 
  Users, 
  Layers, 
  UserCheck, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  TrendingUp, 
  ArrowRight,
  ClipboardList
} from 'lucide-react';
import PageContainer from '../components/layout/PageContainer';
import RecentApplications from '../components/dashboard/RecentApplications';
import QuickActions from '../components/dashboard/QuickActions';
import {
  fetchDashboardStats,
  fetchRecentApplications,
} from '../api/dashboardApi';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [statsRes, appsRes] = await Promise.all([
          fetchDashboardStats(category),
          fetchRecentApplications(),
        ]);
        setStats(statsRes.data);
        setApplications(appsRes.data);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [category]);

  const demandMetrics = [
    {
      title: 'Total Requirements',
      value: stats?.total_jobs ?? 0,
      icon: Briefcase,
      color: 'from-blue-500 to-indigo-600',
      shadow: 'shadow-blue-500/10',
      label: 'Active requirements'
    },
    {
      title: 'Total Openings',
      value: stats?.total_openings ?? 0,
      icon: Layers,
      color: 'from-indigo-500 to-purple-600',
      shadow: 'shadow-indigo-500/10',
      label: 'Target vacancies'
    },
    {
      title: 'Filled Openings (Joined)',
      value: stats?.filled_positions ?? 0,
      icon: UserCheck,
      color: 'from-emerald-500 to-teal-600',
      shadow: 'shadow-emerald-500/10',
      label: 'Candidates onboarded'
    },
    {
      title: 'Available Openings',
      value: stats?.available_openings ?? 0,
      icon: TrendingUp,
      color: stats?.available_openings > 0 ? 'from-amber-500 to-orange-600' : 'from-gray-500 to-gray-600',
      shadow: 'shadow-orange-500/10',
      label: 'Positions to fill'
    },
    {
      title: 'Total Candidates',
      value: stats?.total_candidates ?? 0,
      icon: Users,
      color: 'from-slate-600 to-slate-800',
      shadow: 'shadow-slate-500/10',
      label: 'Talent database pool'
    }
  ];

  const pipelineStages = [
    {
      stage: 'Shortlisted',
      count: stats?.shortlisted_candidates ?? 0,
      theme: 'border-purple-100 bg-purple-50/50 text-purple-700 hover:bg-purple-50',
      iconColor: 'bg-purple-500 text-white',
      desc: 'Screened profiles'
    },
    {
      stage: 'Interview Selected',
      count: stats?.interview_selected_candidates ?? 0,
      theme: 'border-indigo-100 bg-indigo-50/50 text-indigo-700 hover:bg-indigo-50',
      iconColor: 'bg-indigo-500 text-white',
      desc: 'Selected for interview'
    },
    {
      stage: 'Interview Rejected',
      count: stats?.interview_rejected_candidates ?? 0,
      theme: 'border-rose-100 bg-rose-50/50 text-rose-600 hover:bg-rose-50',
      iconColor: 'bg-rose-500 text-white',
      desc: 'Rejected in interview'
    },
    {
      stage: 'Candidate Approved',
      count: stats?.approved_candidates ?? 0,
      theme: 'border-emerald-100 bg-emerald-50/50 text-emerald-700 hover:bg-emerald-50',
      iconColor: 'bg-emerald-500 text-white',
      desc: 'Offer extended/approved'
    },
    {
      stage: 'Candidate Rejected',
      count: stats?.candidate_rejected_candidates ?? 0,
      theme: 'border-red-100 bg-red-50/50 text-red-600 hover:bg-red-50',
      iconColor: 'bg-red-500 text-white',
      desc: 'Rejected by client/recruiter'
    }
  ];

  return (
    <PageContainer
      title="Dashboard"
      subtitle="Overview of Recruitment operations and status mappings"
      actions={
        <div className="flex items-center gap-3">
          <select 
            value={category} 
            onChange={(e) => setCategory(e.target.value)}
            className="border border-gray-200 rounded-xl text-sm px-4 py-2.5 bg-white text-gray-700 outline-none hover:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all shadow-sm cursor-pointer font-semibold"
          >
            <option value="All">All Categories</option>
            <option value="IT">IT</option>
            <option value="ITSM">ITSM</option>
            <option value="BPO">BPO</option>
          </select>
          <QuickActions />
        </div>
      }
    >
      <div className="flex flex-col gap-8 animate-fade-in max-w-7xl mx-auto pb-12">
        {/* Welcome Premium Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900 to-indigo-800 p-6 md:p-8 text-white shadow-xl shadow-blue-900/10">
          <div className="absolute right-0 top-0 -translate-y-4 translate-x-4 opacity-10 blur-sm pointer-events-none">
            <Sparkles size={200} />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/30 border border-blue-400/20 text-xs font-black uppercase tracking-wider text-blue-200">
                  Live Analytics
                </span>
                <span className="text-xs text-blue-300">•</span>
                <span className="text-xs text-blue-300 font-semibold">{category === 'All' ? 'All business units' : `${category} Category`}</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Recruitment Dashboard</h1>
              <p className="text-sm text-blue-100/80 mt-1 max-w-xl font-medium">
                Track job openings, vacancy fulfillment rates, and candidate pipeline transitions instantly.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center text-white font-bold text-lg">
                {(stats?.total_openings > 0) ? Math.round((stats.filled_positions / stats.total_openings) * 100) : 0}%
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-200">Fulfillment Rate</p>
                <p className="text-sm font-bold text-white mt-0.5">Vacancies filled</p>
              </div>
            </div>
          </div>
        </div>

        {/* 1. Demand & Vacancy Metrics Grid */}
        <div>
          <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <ClipboardList size={14} className="text-blue-500" /> Core Demand & Vacancy Metrics
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 h-32 animate-pulse" />
              ))
            ) : (
              demandMetrics.map((card, i) => {
                const Icon = card.icon;
                return (
                  <div 
                    key={i} 
                    className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col justify-between hover:shadow-md hover:border-gray-200 transition-all duration-300 group cursor-default relative overflow-hidden`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-400 group-hover:text-gray-600 transition-colors uppercase tracking-wider">{card.title}</span>
                      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${card.color} text-white flex items-center justify-center shadow-lg ${card.shadow}`}>
                        <Icon size={18} />
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="text-3xl font-extrabold text-gray-900 tracking-tight">{card.value}</div>
                      <div className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-tight">{card.label}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 2. Selection Pipeline Connected Flow */}
        <div>
          <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <TrendingUp size={14} className="text-indigo-500" /> Pipeline Stage Transitions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 h-28 animate-pulse" />
              ))
            ) : (
              pipelineStages.map((p, idx) => {
                return (
                  <div 
                    key={idx}
                    className={`border rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 ${p.theme} relative group`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-black uppercase tracking-wider">{p.stage}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5 font-medium">{p.desc}</p>
                      </div>
                      {idx < 4 && (
                        <div className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-white border border-gray-100 items-center justify-center text-gray-300 shadow-sm group-hover:text-blue-500 group-hover:border-blue-200 transition-colors">
                          <ArrowRight size={12} strokeWidth={3} />
                        </div>
                      )}
                    </div>
                    <div className="mt-6 flex items-baseline gap-1.5">
                      <span className="text-3xl font-black">{p.count}</span>
                      <span className="text-[10px] font-bold uppercase opacity-75">Candidates</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 3. Bottom Row: Recent Applications & Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RecentApplications applications={applications} />
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-2">Recruitment Success</h3>
              <p className="text-xs text-gray-500 font-medium">Our current fulfillment success across active requirements.</p>
              
              <div className="mt-6 space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-bold text-gray-700 uppercase mb-1">
                    <span>Target Fulfillment</span>
                    <span>{stats?.total_openings > 0 ? Math.round((stats.filled_positions / stats.total_openings) * 100) : 0}%</span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                      style={{ width: `${stats?.total_openings > 0 ? (stats.filled_positions / stats.total_openings) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 space-y-2 mt-4">
                  <div className="flex justify-between text-[11px] font-bold text-gray-500 uppercase">
                    <span>Shortlist-to-Interview</span>
                    <span className="text-gray-900">
                      {stats?.shortlisted_candidates > 0 ? Math.round((stats.interview_selected_candidates / stats.shortlisted_candidates) * 100) : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] font-bold text-gray-500 uppercase">
                    <span>Interview-to-Offer</span>
                    <span className="text-gray-900">
                      {stats?.interview_selected_candidates > 0 ? Math.round((stats.approved_candidates / stats.interview_selected_candidates) * 100) : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] font-bold text-gray-500 uppercase">
                    <span>Offer-to-Join</span>
                    <span className="text-gray-900">
                      {stats?.approved_candidates > 0 ? Math.round((stats.joined_candidates / stats.approved_candidates) * 100) : 0}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="pt-4 border-t border-gray-50 flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer">
              <span>View full funnel analysis</span>
              <ArrowRight size={14} />
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default Dashboard;
