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
    date: dbRecord.requisition_open_date,
    companyName: dbRecord.company_name,
    organizationId: dbRecord.organization_id || '',
    businessUnit: dbRecord.business_unit || 'IT',
    externalSpoc: dbRecord.external_spoc || '',
    externalSpocEmailId: dbRecord.external_spoc_email_id || '',
    mandatorySkill: dbRecord.mandatory_skill || '', // Keep a fallback at root if needed for display, but main data is in reqs
    jobTitle: displayTitle,
    budget: requirements.length > 0 ? requirements[0].budget : '—',
    requirements: requirements.map(req => ({
      id: req.id,
      job_title: req.job_title,
      budget: req.budget,
      experience: req.experience,
      min_experience: req.min_experience,
      max_experience: req.max_experience,
      location: req.location,
      required_skills: req.required_skills,
      number_of_open_positions: req.number_of_open_positions,
      status: req.status || 'ACTIVE',
      mandatorySkill: req.mandatory_skill || '',
      noticePeriod: req.notice_period || '',
      qualification: req.qualification || '',
      shifts: req.shifts || '',
      workMode: req.work_mode || '',
      jobDescription: req.job_description || ''
    })),
    numberOfCandidates: requirements.reduce((sum, r) => sum + r.number_of_open_positions, 0),
    experience: requirements.map(r => r.experience).join(', '),
    assignedTo: dbRecord.assigned_to || '',
    createdBy: dbRecord.created_by || '',
    created_at: dbRecord.created_at,
    updated_at: dbRecord.updated_at,
  };
};

// Helper to map frontend camelCase to backend snake_case expected payload
const mapToBackend = (formData) => {
  return {
    requisition_open_date: formData.date,
    company_name: formData.companyName,
    organization_id: formData.organizationId ? Number(formData.organizationId) : null,
    business_unit: formData.businessUnit || 'IT',
    external_spoc: formData.externalSpoc || null,
    external_spoc_email_id: formData.externalSpocEmailId || null,
    requirements: (formData.requirements || []).map(req => ({
      job_title: req.job_title,
      budget: req.budget,
      experience: req.experience,
      min_experience: req.min_experience ? Number(req.min_experience) : 0,
      max_experience: req.max_experience ? Number(req.max_experience) : 0,
      location: req.location || '',
      required_skills: req.required_skills || '',
      number_of_open_positions: Number(req.number_of_open_positions),
      status: (req.status || 'ACTIVE').toUpperCase(),
      mandatory_skill: req.mandatorySkill || '',
      notice_period: req.noticePeriod || null,
      qualification: req.qualification || null,
      shifts: req.shifts || null,
      work_mode: req.workMode || null,
      job_description: req.jobDescription || null
    })),
    assigned_to: formData.assignedTo,
    created_by: formData.createdBy || null,
  };
};



// ── GET /api/jobs ──────────────────────────────────────────
export const fetchJobs = async (params = {}) => {
  const queryParams = {};
  if (params.search) queryParams.search = params.search;
  if (params.company) queryParams.company_name = params.company;
  if (params.startDate) queryParams.start_date = params.startDate;
  if (params.endDate) queryParams.end_date = params.endDate;
  if (params.status) queryParams.status = params.status;
  if (params.businessUnit && params.businessUnit !== 'All') {
    queryParams.business_unit = params.businessUnit;
  }
  if (params.sortField) queryParams.sort_by = params.sortField;
  if (params.sortOrder) queryParams.sort_order = params.sortOrder;
  if (params.assignedTo) queryParams.assigned_to = params.assignedTo;
  if (params.createdBy) queryParams.created_by = params.createdBy;

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

  try {
    const response = await api.post('/jobs', payload);
    return { data: mapToFrontend(response.data.data) };
  } catch (error) {
    if (error.response?.status === 422) {
      console.error('Validation Error Details:', error.response.data);
    }
    throw error;
  }
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

// ── GET /api/jobs/{id}/matches ────────────────────
export const fetchMatchingCandidates = async (id, strict = true, requirementId = null) => {
  const params = { strict };
  if (requirementId) params.requirement_id = requirementId;
  const response = await api.get(`/jobs/${id}/matches`, { params });
  return { data: response.data.data };
};

// ── POST /api/jobs/{id}/shortlist ──────────────
export const shortlistCandidate = async (jobId, candidateId) => {
  const response = await api.post(`/jobs/${jobId}/shortlist`, { candidate_id: candidateId });
  return response.data;
};

// ── POST /api/jobs/{id}/reject ──────────────
export const rejectCandidate = async (jobId, candidateId) => {
  const response = await api.post(`/jobs/${jobId}/reject`, { candidate_id: candidateId });
  return response.data;
};

// ── GET /api/jobs/{id}/shortlisted ─────────────────
export const fetchShortlistedCandidates = async (id) => {
  const response = await api.get(`/jobs/${id}/shortlisted`);
  return { data: response.data.data };
};

// ── POST /api/jobs/upload ────────────────────────────────────
export const uploadJobDescription = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/jobs/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data; // { message: "...", data: { file_url: "..." } }
};

// ── GET /api/jobs/{id}/stats ───────────────────────
export const fetchJobStats = async (id) => {
  const response = await api.get(`/jobs/${id}/stats`);
  return { data: response.data.data };
};

