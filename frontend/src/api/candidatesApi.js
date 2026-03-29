// api/candidatesApi.js
import api from './axios';

// Map backend snake_case response to frontend camelCase expected shape
const mapToFrontend = (dbRecord) => {
  if (!dbRecord) return null;
  return {
    id: dbRecord.id,
    candidateCode: dbRecord.candidate_code,
    fullName: dbRecord.full_name,
    phone: dbRecord.phone_number,
    email: dbRecord.email_address,
    currentLocation: dbRecord.current_location,
    currentCompany: dbRecord.current_last_company,
    totalExperience: dbRecord.total_experience,
    relevantExperience: dbRecord.relevant_experience_years,
    highestEducation: dbRecord.highest_education,
    skills: dbRecord.skills ? dbRecord.skills.split(',').map(s => s.trim()) : [],
    currentCTC: dbRecord.current_ctc,
    expectedCTC: dbRecord.expected_ctc,
    noticePeriod: dbRecord.notice_period,
    reasonForChange: dbRecord.reason_for_job_change,
    resumeFileName: dbRecord.resume_file_name,
    resumeFilePath: dbRecord.resume_file_path,
    appliedDate: dbRecord.created_at ? dbRecord.created_at.split('T')[0] : null,
  };
};

// Map frontend camelCase to backend snake_case expected payload
const mapToBackend = (formData) => {
  return {
    full_name: formData.fullName,
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
  const payload = mapToBackend(candidateData);
  const response = await api.post('/candidates', payload);
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

