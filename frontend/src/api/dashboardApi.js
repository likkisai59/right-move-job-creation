import api from './axios';
import { mockDashboardStats, mockPipeline, mockRecentApplications } from '../utils/mockData';
import { fetchJobs } from './jobsApi';
import { fetchCandidates } from './candidatesApi';

// Mock implementation - replace with real API calls when backend is ready
export const fetchDashboardStats = async () => {
  try {
    const [jobsRes, candidatesRes] = await Promise.all([
      fetchJobs(),
      fetchCandidates()
    ]);
    const jobsData = jobsRes.data || [];
    const candidatesData = candidatesRes.data || [];

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const jobsThisWeek = jobsData.filter(job => {
      return job.date && new Date(job.date) >= oneWeekAgo;
    }).length;

    const candidatesThisMonth = candidatesData.filter(cand => {
      return cand.appliedDate && new Date(cand.appliedDate) >= oneMonthAgo;
    }).length;
    
    return { 
      data: {
        ...mockDashboardStats,
        openPositions: jobsData.length,
        candidates: candidatesData.length,
        openPositionsTrend: `${jobsThisWeek} new this week`,
        candidatesTrend: `${candidatesThisMonth} added this month`
      } 
    };
  } catch (error) {
    console.error("Failed to fetch live stats for dashboard:", error);
    return { data: mockDashboardStats };
  }
};

export const fetchPipelineData = async () => {
  // return api.get('/dashboard/pipeline');
  return { data: mockPipeline };
};

export const fetchRecentApplications = async () => {
  // return api.get('/dashboard/recent-applications');
  return { data: mockRecentApplications };
};
