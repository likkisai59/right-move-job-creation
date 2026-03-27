// api/jobsApi.js
// ─────────────────────────────────────────────────────────────
// API layer for Job Requirements.
//
// Converts frontend camelCase to backend snake_case and vice-versa.
// ─────────────────────────────────────────────────────────────

import api from './axios';

// Helper to map backend snake_case response to frontend camelCase expected shape
const mapToFrontend = (dbRecord) => {
  if (!dbRecord) return null;
  return {
    id: dbRecord.id, // primary key for fetching/editing
    jobCode: dbRecord.job_code,
    date: dbRecord.job_date, // YYYY-MM-DD
    companyName: dbRecord.company_name,
    jobTitle: dbRecord.job_title,
    numberOfCandidates: dbRecord.candidates_required,
    experience: dbRecord.experience_required,
    budget: dbRecord.budgeted_package,
    assignedRecruiter: dbRecord.assigned_recruiter,
    // Frontend expects UI statuses like 'active', 'on-hold', 'closed', 'draft'
    status: (dbRecord.status || 'ACTIVE').toLowerCase().replace('_', '-'),
  };
};

// Helper to map frontend camelCase to backend snake_case expected payload
const mapToBackend = (formData) => {
  return {
    job_date: formData.date,
    company_name: formData.companyName,
    job_title: formData.jobTitle,
    candidates_required: Number(formData.numberOfCandidates),
    experience_required: formData.experience,
    budgeted_package: formData.budget || '',
    assigned_recruiter: formData.assignedRecruiter,
    // Backend expects ENUM uppercase 'ACTIVE', 'ON_HOLD'
    status: (formData.status || 'active').toUpperCase().replace('-', '_'),
  };
};

// ── GET /api/jobs ──────────────────────────────────────────
export const fetchJobs = async (params = {}) => {
  const queryParams = {};
  if (params.search) queryParams.search = params.search;
  if (params.company) queryParams.company_name = params.company;
  if (params.date) queryParams.job_date = params.date;

  const response = await api.get('/jobs', { params: queryParams });
  
  return {
    data: response.data.data.map(mapToFrontend)
  };
};

// ── GET /api/jobs/{id} ───────────────────────────────────────
export const fetchJobById = async (id) => {
  const response = await api.get(`/jobs/${id}`);
  return { data: mapToFrontend(response.data.data) };
};

// ── POST /api/jobs ────────────────────────────────────────────
export const createJob = async (formData) => {
  const payload = mapToBackend(formData);
  const response = await api.post('/jobs', payload);
  // Return in the same shape the rest of the app expects: { data: {...} }
  return { data: mapToFrontend(response.data.data) };
};

// ── PUT /api/jobs/{id} ────────────────────────────────────────
export const updateJob = async (id, formData) => {
  const payload = mapToBackend(formData);
  const response = await api.put(`/jobs/${id}`, payload);
  return { data: mapToFrontend(response.data.data) };
};

// ── DELETE /api/jobs/{id} ─────────────────────────────────────
export const deleteJob = async (id) => {
  const response = await api.delete(`/jobs/${id}`);
  return { data: response.data };
};
