// api/candidatesApi.js
import api from './axios';

// Map backend snake_case response to frontend camelCase expected shape
const mapToFrontend = (dbRecord) => {
  if (!dbRecord) return null;
  return {
    id: dbRecord.id,
    candidateCode: dbRecord.candidate_code,
    firstName: dbRecord.first_name,
    lastName: dbRecord.last_name,
    countryCode: dbRecord.country_code,
    businessCategory: dbRecord.business_category || 'IT',
    phone: dbRecord.phone_number,
    email: dbRecord.email_address,
    currentLocation: dbRecord.current_location,
    currentCompany: dbRecord.current_last_company,
    totalExperience: dbRecord.total_experience,
    relevantExperience: dbRecord.relevant_experience_years,
    highestEducation: dbRecord.highest_education,
    skills: dbRecord.skills ? dbRecord.skills.split(',').map(s => s.trim()) : [],
    mappedJobId: dbRecord.mapped_job_id,
    relevantExperienceBySkill: dbRecord.relevant_experience_by_skill
      ? (() => { try { return JSON.parse(dbRecord.relevant_experience_by_skill); } catch (e) { return []; } })()
      : [],
    currentCTC: dbRecord.current_ctc,
    expectedCTC: dbRecord.expected_ctc,
    noticePeriod: dbRecord.notice_period,
    reasonForChange: dbRecord.reason_for_job_change,
    resumeFileName: dbRecord.resume_file_name,
    resumeFilePath: dbRecord.resume_file_path,
    resumeUrl: dbRecord.resume_url,
    appliedDate: dbRecord.created_at ? dbRecord.created_at.split('T')[0] : null,
  };
};

// Map frontend camelCase to backend snake_case expected payload
const mapToBackend = (formData) => {
  return {
    first_name: formData.firstName,
    last_name: formData.lastName,
    country_code: formData.countryCode,
    phone_number: formData.phone,
    email_address: formData.email,
    current_location: formData.currentLocation,
    current_last_company: formData.currentCompany,
    total_experience: formData.totalExperience,
    relevant_experience_years: formData.relevantExperience,
    highest_education: formData.highestEducation,
    skills: Array.isArray(formData.skills) ? formData.skills.join(', ') : formData.skills,
    current_ctc: formData.currentCTC,
    expected_ctc: formData.expectedCTC,
    notice_period: formData.noticePeriod,
    reason_for_job_change: formData.reasonForChange || null,
    resume_file_name: formData.resumeFileName || null,
    resume_file_path: null, // Handle upload separately later
  };
};

// ── GET /api/candidates ───────────────────────────────────
export const fetchCandidates = async (params = {}) => {
  const queryParams = {};
  if (params.search) {
    queryParams.search = params.search;
  }
  // Allow explicit backend filters too:
  if (params.candidateCode) queryParams.candidate_code = params.candidateCode;
  if (params.skills) queryParams.skills = params.skills;
  if (params.totalExperience) queryParams.total_experience = params.totalExperience;
  if (params.currentLocation) queryParams.current_location = params.currentLocation;
  if (params.businessCategory && params.businessCategory !== 'All') {
    queryParams.business_category = params.businessCategory;
  }

  const response = await api.get('/candidates', { params: queryParams });
  return { data: response.data.data.map(mapToFrontend) };
};

// ── GET /api/candidates/{id} ─────────────────────────────────
export const fetchCandidateById = async (id) => {
  const response = await api.get(`/candidates/${id}`);
  return { data: mapToFrontend(response.data.data) };
};

// ── POST /api/candidates ─────────────────────────────────────
export const createCandidate = async (candidateData) => {
  const formData = new FormData();

  // Basic Fields
  formData.append('first_name', candidateData.firstName);
  formData.append('last_name', candidateData.lastName);
  formData.append('email_address', candidateData.email);
  formData.append('phone_number', candidateData.phone);
  formData.append('country_code', candidateData.countryCode || '+91');
  formData.append('business_category', candidateData.businessCategory || 'IT');

  // Optional / Additional Fields
  if (candidateData.currentLocation) formData.append('current_location', candidateData.currentLocation);
  if (candidateData.currentCompany) formData.append('current_last_company', candidateData.currentCompany);
  if (candidateData.totalExperience) formData.append('total_experience', candidateData.totalExperience);
  if (candidateData.relevantExperience) formData.append('relevant_experience_years', candidateData.relevantExperience);
  if (candidateData.highestEducation) formData.append('highest_education', candidateData.highestEducation);

  if (candidateData.mappedJobId) formData.append('mapped_job_id', candidateData.mappedJobId);
  if (candidateData.relevantExperienceBySkill && candidateData.relevantExperienceBySkill.length > 0) {
    formData.append('relevant_experience_by_skill', JSON.stringify(candidateData.relevantExperienceBySkill));
  }

  const skills = Array.isArray(candidateData.skills) ? candidateData.skills.join(', ') : candidateData.skills;
  if (skills) formData.append('skills', skills);

  if (candidateData.currentCTC) formData.append('current_ctc', candidateData.currentCTC);
  if (candidateData.expectedCTC) formData.append('expected_ctc', candidateData.expectedCTC);
  if (candidateData.noticePeriod) formData.append('notice_period', candidateData.noticePeriod);
  if (candidateData.reasonForChange) formData.append('reason_for_job_change', candidateData.reasonForChange);

  // The resume file itself
  if (candidateData.resumeFile) {
    formData.append('file', candidateData.resumeFile);
  }

  const response = await api.post('/candidates', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return { data: mapToFrontend(response.data.data) };
};

// ── PUT /api/candidates/{id} (Mocked until Task 3) ────────────
export const updateCandidate = async (id, candidateData) => {
  const payload = mapToBackend(candidateData);
  const response = await api.put(`/candidates/${id}`, payload);
  return { data: mapToFrontend(response.data.data) };
};

// ── DELETE /api/candidates/{id} (Mocked until Task 3) ─────────
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


