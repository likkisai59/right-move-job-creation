import React, { useEffect, useState } from 'react';
import { Briefcase, Users, Calendar, TrendingUp } from 'lucide-react';
import PageContainer from '../components/layout/PageContainer';
import StatsCard from '../components/dashboard/StatsCard';
import PipelineCard from '../components/dashboard/PipelineCard';
import RecentApplications from '../components/dashboard/RecentApplications';
import QuickActions from '../components/dashboard/QuickActions';
import {
  fetchDashboardStats,
  fetchPipelineData,
  fetchRecentApplications,
} from '../api/dashboardApi';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [pipeline, setPipeline] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [statsRes, pipelineRes, appsRes] = await Promise.all([
          fetchDashboardStats(),
          fetchPipelineData(),
          fetchRecentApplications(),
        ]);
        setStats(statsRes.data);
        setPipeline(pipelineRes.data);
        setApplications(appsRes.data);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const statCards = [
    {
      title: 'Open Positions',
      value: stats?.openPositions ?? '—',
      icon: Briefcase,
      color: 'blue',
      trend: { up: true, label: stats?.openPositionsTrend ?? '0 new this week' },
    },
    {
      title: 'Candidates',
      value: stats?.candidates ?? '—',
      icon: Users,
      color: 'emerald',
      trend: { up: true, label: stats?.candidatesTrend ?? '0 added this month' },
    },
    {
      title: 'Interviews',
      value: stats?.interviews ?? '—',
      icon: Calendar,
      color: 'violet',
      trend: { up: false, label: '2 rescheduled' },
    },
    {
      title: 'Offers',
      value: stats?.offers ?? '—',
      icon: TrendingUp,
      color: 'amber',
      trend: { up: true, label: '1 accepted today' },
    },
  ];

  return (
    <PageContainer
      title="Dashboard"
      subtitle="Welcome back, Admin"
      actions={<QuickActions />}
    >
      <div className="flex flex-col gap-6 animate-fade-in">
        {/* Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {loading
            ? [...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 h-24 animate-pulse"
                />
              ))
            : statCards.map((card) => (
                <StatsCard key={card.title} {...card} />
              ))}
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PipelineCard data={pipeline} />
          <RecentApplications applications={applications} />
        </div>
      </div>
    </PageContainer>
  );
};

export default Dashboard;
