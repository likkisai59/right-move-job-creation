// api/candidatesApi.js
import api from './axios';

// Map backend snake_case response to frontend camelCase expected shape
const mapToFrontend = (dbRecord) => {
  if (!dbRecord) return null;
  return {
    id: dbRecord.id,
    candidateCode: dbRecord.candidate_code,
    // Personal Details
    firstName: dbRecord.first_name,
    lastName: dbRecord.last_name,
    countryCode: dbRecord.country_code,
    email: dbRecord.email_address,
    alternativeEmail: dbRecord.alternative_email || null,
    phone: dbRecord.phone_number,
    alternativePhone: dbRecord.alternative_contact_number || null,
    currentLocation: dbRecord.current_location,
    highestQualification: dbRecord.highest_qualification,
    // Employee Details
    businessUnit: dbRecord.business_unit || 'IT',
    currentCompany: dbRecord.current_last_company,
    currentDesignation: dbRecord.current_designation,
    totalExperience: dbRecord.total_experience,
    relevantExperience: dbRecord.relevant_experience_years,
    highestEducation: dbRecord.highest_qualification,
    skills: dbRecord.skills ? dbRecord.skills.split(',').map(s => s.trim()) : [],
    mappedJobId: dbRecord.mapped_job_id,
    relevantExperienceBySkill: dbRecord.relevant_experience_by_skill
      ? (() => { try { return JSON.parse(dbRecord.relevant_experience_by_skill); } catch (e) { return []; } })()
      : [],
    noticePeriod: dbRecord.notice_period,
    lwd: dbRecord.lwd || null,
    employmentLocation: dbRecord.employment_location,
    currentCTC: dbRecord.current_ctc,
    fixedCTC: dbRecord.fixed_ctc,
    variableCTC: dbRecord.variable_ctc,
    expectedCTC: dbRecord.expected_ctc,
    reasonForChange: dbRecord.reason_for_job_change,
    source: dbRecord.source,
    comments: dbRecord.comments,
    recruiterName: dbRecord.recruiter_name,
    // Resume
    resumeFileName: dbRecord.resume_file_name,
    resumeFilePath: dbRecord.resume_file_path,
    resumeUrl: dbRecord.resume_url,
    appliedDate: dbRecord.created_at ? dbRecord.created_at.split('T')[0] : null,
    createdAt: dbRecord.created_at,
    updatedAt: dbRecord.updated_at,
  };
};

// ── GET /api/candidates ───────────────────────────────────
export const fetchCandidates = async (params = {}) => {
  const queryParams = {};
  if (params.search) queryParams.search = params.search;
  if (params.candidateCode) queryParams.candidate_code = params.candidateCode;
  if (params.skills) queryParams.skills = params.skills;
  if (params.totalExperience) queryParams.total_experience = params.totalExperience;
  if (params.currentLocation) queryParams.current_location = params.currentLocation;
  if (params.businessUnit && params.businessUnit !== 'All') {
    queryParams.business_unit = params.businessUnit;
  }
  if (params.noticePeriod) queryParams.notice_period = params.noticePeriod;

  const response = await api.get('/candidates', { params: queryParams });
  return { data: response.data.data.map(mapToFrontend) };
};

// ── GET /api/candidates/{id} ─────────────────────────────────
export const fetchCandidateById = async (id) => {
  const response = await api.get(`/candidates/${id}`);
  return { data: mapToFrontend(response.data.data) };
};

// ── GET /api/candidates/{id}/history ─────────────────────────
export const fetchCandidateHistory = async (id) => {
  const response = await api.get(`/candidates/${id}/history`);
  return { data: response.data.data };
};

// ── POST /api/candidates ─────────────────────────────────────
export const createCandidate = async (candidateData) => {
  const formData = new FormData();

  // Personal Details
  formData.append('first_name', candidateData.firstName);
  formData.append('last_name', candidateData.lastName);
  formData.append('email_address', candidateData.email);
  formData.append('phone_number', candidateData.phone);
  formData.append('country_code', candidateData.countryCode || '+91');
  if (candidateData.alternativeEmail) formData.append('alternative_email', candidateData.alternativeEmail);
  if (candidateData.alternativePhone) formData.append('alternative_contact_number', candidateData.alternativePhone);
  if (candidateData.currentLocation) formData.append('current_location', candidateData.currentLocation);
  if (candidateData.highestQualification) formData.append('highest_qualification', candidateData.highestQualification);

  // Employee Details
  formData.append('business_unit', candidateData.businessUnit || 'IT');
  if (candidateData.currentCompany) formData.append('current_last_company', candidateData.currentCompany);
  if (candidateData.currentDesignation) formData.append('current_designation', candidateData.currentDesignation);
  if (candidateData.totalExperience) formData.append('total_experience', candidateData.totalExperience);
  if (candidateData.relevantExperience) formData.append('relevant_experience_years', candidateData.relevantExperience);
  if (candidateData.relevantExperienceBySkill && candidateData.relevantExperienceBySkill.length > 0) {
    formData.append('relevant_experience_by_skill', JSON.stringify(candidateData.relevantExperienceBySkill));
  }
  const skills = Array.isArray(candidateData.skills) ? candidateData.skills.join(', ') : candidateData.skills;
  if (skills) formData.append('skills', skills);
  if (candidateData.noticePeriod) formData.append('notice_period', candidateData.noticePeriod);
  if (candidateData.lwd) formData.append('lwd', candidateData.lwd);
  if (candidateData.employmentLocation) formData.append('employment_location', candidateData.employmentLocation);
  if (candidateData.currentCTC) formData.append('current_ctc', candidateData.currentCTC);
  if (candidateData.fixedCTC) formData.append('fixed_ctc', candidateData.fixedCTC);
  if (candidateData.variableCTC !== undefined && candidateData.variableCTC !== null) {
    formData.append('variable_ctc', String(candidateData.variableCTC));
  }
  if (candidateData.expectedCTC) formData.append('expected_ctc', candidateData.expectedCTC);
  if (candidateData.reasonForChange) formData.append('reason_for_job_change', candidateData.reasonForChange);
  if (candidateData.source) formData.append('source', candidateData.source);
  if (candidateData.comments) formData.append('comments', candidateData.comments);
  if (candidateData.recruiterName) formData.append('recruiter_name', candidateData.recruiterName);

  if (candidateData.mappedJobId) formData.append('mapped_job_id', candidateData.mappedJobId);

  // Resume file
  if (candidateData.resumeFile) {
    formData.append('file', candidateData.resumeFile);
  }

  const response = await api.post('/candidates', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return { data: mapToFrontend(response.data.data) };
};

// ── PUT /api/candidates/{id} ───────────────────────────────
export const updateCandidate = async (id, candidateData) => {
  const formData = new FormData();

  const appendIfPresent = (key, val) => {
    if (val !== undefined && val !== null && val !== '') {
      formData.append(key, val);
    }
  };

  appendIfPresent('first_name', candidateData.firstName);
  appendIfPresent('last_name', candidateData.lastName);
  appendIfPresent('email_address', candidateData.email);
  appendIfPresent('alternative_email', candidateData.alternativeEmail);
  appendIfPresent('phone_number', candidateData.phone);
  appendIfPresent('country_code', candidateData.countryCode);
  appendIfPresent('alternative_contact_number', candidateData.alternativePhone);
  appendIfPresent('current_location', candidateData.currentLocation);
  appendIfPresent('highest_qualification', candidateData.highestQualification);
  appendIfPresent('business_unit', candidateData.businessUnit);
  appendIfPresent('current_last_company', candidateData.currentCompany);
  appendIfPresent('current_designation', candidateData.currentDesignation);
  appendIfPresent('total_experience', candidateData.totalExperience);
  appendIfPresent('relevant_experience_years', candidateData.relevantExperience);
  if (candidateData.relevantExperienceBySkill && candidateData.relevantExperienceBySkill.length > 0) {
    formData.append('relevant_experience_by_skill', JSON.stringify(candidateData.relevantExperienceBySkill));
  }
  const skills = Array.isArray(candidateData.skills) ? candidateData.skills.join(', ') : candidateData.skills;
  appendIfPresent('skills', skills);
  appendIfPresent('notice_period', candidateData.noticePeriod);
  appendIfPresent('lwd', candidateData.lwd);
  appendIfPresent('employment_location', candidateData.employmentLocation);
  appendIfPresent('current_ctc', candidateData.currentCTC);
  appendIfPresent('fixed_ctc', candidateData.fixedCTC);
  if (candidateData.variableCTC !== undefined && candidateData.variableCTC !== null) {
    formData.append('variable_ctc', String(candidateData.variableCTC));
  }
  appendIfPresent('expected_ctc', candidateData.expectedCTC);
  appendIfPresent('reason_for_job_change', candidateData.reasonForChange);
  appendIfPresent('source', candidateData.source);
  appendIfPresent('comments', candidateData.comments);
  appendIfPresent('recruiter_name', candidateData.recruiterName);
  appendIfPresent('updated_by', candidateData.updatedBy);

  if (candidateData.resumeFile) {
    formData.append('file', candidateData.resumeFile);
  }

  const response = await api.put(`/candidates/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return { data: mapToFrontend(response.data.data) };
};

// ── DELETE /api/candidates/{id} ─────────────────────────────
export const deleteCandidate = async (id) => {
  const response = await api.delete(`/candidates/${id}`);
  return { data: response.data };
};

// ── GET /api/candidates/next-id ────────────────────────────
export const fetchNextCandidateId = async () => {
  const response = await api.get('/candidates/next-id');
  return response.data.data.next_id;
};

// ── GET /api/candidates/check-duplicate ─────────────────────
export const checkDuplicateCandidate = async (params) => {
  const response = await api.get('/candidates/check-duplicate', { params });
  return response.data.data;
};

// ── POST /api/candidates/parse-resume ────────────────────────
export const parseResume = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/candidates/parse-resume', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000, // 60s – AI parsing can take time
  });
  return response.data;
};
