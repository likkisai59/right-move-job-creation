import api from './axios';
import { mockDashboardStats, mockPipeline, mockRecentApplications } from '../utils/mockData';
import { fetchJobs } from './jobsApi';
import { fetchCandidates } from './candidatesApi';

// Mock implementation - replace with real API calls when backend is ready
export const fetchDashboardStats = async (category = "All") => {
  try {
    const params = category !== 'All' ? { business_unit: category } : {};
    const response = await api.get('/candidates/analytics/dashboard', { params });
    return { data: response.data.data };
  } catch (error) {
    console.error("Failed to fetch dashboard stats:", error);
    return {
      data: {
        total_jobs: 0,
        total_candidates: 0,
        total_openings: 0,
        filled_positions: 0,
        available_openings: 0,
        shortlisted_candidates: 0,
        interview_selected_candidates: 0,
        interview_rejected_candidates: 0,
        approved_candidates: 0,
        candidate_rejected_candidates: 0,
        joined_candidates: 0,
        rejected_candidates: 0
      }
    };
  }
};


export const fetchPipelineData = async (category = "All") => {
  try {
    const params = category !== 'All' ? { business_unit: category } : {};
    const response = await api.get('/candidates/analytics/pipeline', { params });
    return { data: response.data.data };
  } catch (error) {
    console.error("Failed to fetch pipeline analytics:", error);
    return { data: mockPipeline };
  }
};

export const fetchRecentApplications = async () => {
  // return api.get('/dashboard/recent-applications');
  return { data: mockRecentApplications };
};
