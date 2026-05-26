// Application constants

export const APP_NAME = 'Right Move CRM';
export const APP_SHORT = 'RM';

export const ROUTES = {
  DASHBOARD: '/dashboard',
  JOBS: '/jobs',
  JOBS_CREATE: '/jobs/create',
  JOBS_EDIT: '/jobs/edit/:id',
  CANDIDATES: '/candidates',
  CANDIDATES_CREATE: '/candidates/create',
};

export const JOB_STATUSES = {
  active: { label: 'Active', color: 'green' },
  closed: { label: 'Closed', color: 'red' },
  'on-hold': { label: 'On Hold', color: 'yellow' },
  draft: { label: 'Draft', color: 'gray' },
};

export const NOTICE_PERIODS = [
  { value: 'Immediate', label: 'Immediate' },
  { value: 'Currently Serving', label: 'Currently Serving' },
  { value: '30 Days', label: '30 Days' },
  { value: '45 Days', label: '45 Days' },
  { value: '60 Days', label: '60 Days' },
  { value: '90 Days', label: '90 Days' },
];

export const BUSINESS_UNIT_OPTIONS = [
  { value: 'IT', label: 'IT' },
  { value: 'ITES', label: 'ITES' },
  { value: 'BPO', label: 'BPO' },
  { value: 'Lateral', label: 'Lateral' },
  { value: 'FLP', label: 'FLP' },
  { value: 'F&A', label: 'F&A' },
];

export const SOURCE_OPTIONS = [
  { value: 'Naukri', label: 'Naukri' },
  { value: 'LinkedIn', label: 'LinkedIn' },
  { value: 'Monster', label: 'Monster' },
  { value: 'Shine', label: 'Shine' },
  { value: 'Referral', label: 'Referral' },
];

export const EXPERIENCE_OPTIONS = [
  { value: 'fresher', label: 'Fresher (0 Years)' },
  { value: '1', label: '1 Year' },
  { value: '2', label: '2 Years' },
  { value: '3', label: '3 Years' },
  { value: '4', label: '4 Years' },
  { value: '5', label: '5 Years' },
  { value: '6', label: '6 Years' },
  { value: '7', label: '7 Years' },
  { value: '8', label: '8 Years' },
  { value: '9', label: '9 Years' },
  { value: '10', label: '10 Years' },
  { value: '11', label: '11 Years' },
  { value: '12', label: '12 Years' },
  { value: '13', label: '13 Years' },
  { value: '14', label: '14 Years' },
  { value: '15', label: '15 Years' },
  { value: '16', label: '16 Years' },
  { value: '17', label: '17 Years' },
  { value: '18', label: '18 Years' },
  { value: '19', label: '19 Years' },
  { value: '20', label: '20 Years' },
  { value: '21', label: '21 Years' },
  { value: '22', label: '22 Years' },
  { value: '23', label: '23 Years' },
  { value: '24', label: '24 Years' },
  { value: '25+', label: '25+ Years' },
];

export const EDUCATION_OPTIONS = [
  { value: 'SSC', label: 'SSC' },
  { value: 'Intermediate', label: 'Intermediate' },
  { value: 'Diploma', label: 'Diploma' },
  { value: 'B.Tech', label: 'B.Tech' },
  { value: 'BE', label: 'BE' },
  { value: 'B.Sc', label: 'B.Sc' },
  { value: 'B.Com', label: 'B.Com' },
  { value: 'BCA', label: 'BCA' },
  { value: 'M.Tech', label: 'M.Tech' },
  { value: 'MCA', label: 'MCA' },
  { value: 'MBA', label: 'MBA' },
  { value: 'Degree', label: 'Degree' },
  { value: 'PhD', label: 'PhD' },
  { value: 'Other', label: 'Other' },
];

export const CANDIDATE_STATUS_COLORS = {
  sourcing: 'blue',
  screening: 'yellow',
  interview: 'purple',
  offer: 'green',
  rejected: 'red',
  hired: 'teal',
};

export const ALLOWED_RESUME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export const MAX_RESUME_SIZE_MB = 5;
export const COUNTRY_CODES = [
  { value: '+91', label: '+91 (India)' },
  { value: '+1', label: '+1 (USA)' },
  { value: '+44', label: '+44 (UK)' },
  { value: '+971', label: '+971 (UAE)' },
  { value: '+65', label: '+65 (Singapore)' },
  { value: '+61', label: '+61 (Australia)' },
  { value: '+1-CA', label: '+1 (Canada)' },
  { value: '+49', label: '+49 (Germany)' },
];

// ─────────────────────────────────────────────────────────────
// EMPLOYEE CONSTANTS
// ─────────────────────────────────────────────────────────────

export const EMPLOYEE_STATUS_OPTIONS = [
  { value: 'Active', label: 'Active' },
  { value: 'Inactive', label: 'Inactive' }
];

export const EMPLOYEE_DESIGNATION_OPTIONS = [
  { value: 'Software Engineer', label: 'Software Engineer' },
  { value: 'Senior Software Engineer', label: 'Senior Software Engineer' },
  { value: 'HR Manager', label: 'HR Manager' },
  { value: 'Project Manager', label: 'Project Manager' },
  { value: 'Sales Executive', label: 'Sales Executive' },
  { value: 'Director', label: 'Director' }
];

export const EMPLOYEE_GENDER_OPTIONS = [
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
  { value: 'Other', label: 'Other' }
];

export const EMPLOYEE_BLOOD_GROUP_OPTIONS = [
  { value: 'A+', label: 'A+' },
  { value: 'A-', label: 'A-' },
  { value: 'B+', label: 'B+' },
  { value: 'B-', label: 'B-' },
  { value: 'AB+', label: 'AB+' },
  { value: 'AB-', label: 'AB-' },
  { value: 'O+', label: 'O+' },
  { value: 'O-', label: 'O-' },
];
