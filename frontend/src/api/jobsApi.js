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
  const requirements = dbRecord.requirements || [];
  
  // Create an aggregate job title for the table view
  let displayTitle = '—';
  if (requirements.length > 0) {
    displayTitle = requirements[0].job_title;
    if (requirements.length > 1) {
      displayTitle += ` (+${requirements.length - 1} more)`;
    }
  }

  return {
    id: dbRecord.id,
    jobCode: dbRecord.job_code,
    date: dbRecord.job_date,
    companyName: dbRecord.company_name,
    organizationId: dbRecord.organization_id || '',
    businessCategory: dbRecord.business_category || 'IT',
    mandatorySkill: dbRecord.mandatory_skill || '',
    jobTitle: displayTitle,
    budget: requirements.length > 0 ? requirements[0].budget : '—',
    requirements: requirements.map(req => ({
      id: req.id,
      job_title: req.job_title,
      budget: req.budget,
      experience: req.experience,
      num_candidates: req.num_candidates
    })),
    numberOfCandidates: requirements.reduce((sum, r) => sum + r.num_candidates, 0),
    experience: requirements.map(r => r.experience).join(', '),
    assignedTo: dbRecord.assigned_to,
    status: (dbRecord.status || 'ACTIVE').toLowerCase().replace('_', '-'),
  };
};

// Helper to map frontend camelCase to backend snake_case expected payload
const mapToBackend = (formData) => {
  return {
    job_date: formData.date,
    company_name: formData.companyName,
    organization_id: formData.organizationId ? Number(formData.organizationId) : null,
    business_category: formData.businessCategory || 'IT',
    mandatory_skill: formData.mandatorySkill,
    requirements: (formData.requirements || []).map(req => ({
      job_title: req.job_title,
      budget: req.budget,
      experience: req.experience,
      num_candidates: Number(req.num_candidates)
    })),
    assigned_to: formData.assignedTo,
    status: (formData.status || 'active').toUpperCase().replace('-', '_'),
  };
};



// ── GET /api/jobs ──────────────────────────────────────────
export const fetchJobs = async (params = {}) => {
  const queryParams = {};
  if (params.search) queryParams.search = params.search;
  if (params.company) queryParams.company_name = params.company;
  if (params.date) queryParams.job_date = params.date;
  if (params.businessCategory && params.businessCategory !== 'All') {
    queryParams.business_category = params.businessCategory;
  }

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
