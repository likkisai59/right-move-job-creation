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
  { value: 'immediate', label: 'Immediate' },
  { value: '15-days', label: '15 Days' },
  { value: '30-days', label: '30 Days' },
  { value: '60-days', label: '60 Days' },
  { value: '90-days', label: '90 Days' },
  { value: '3-months', label: '3 Months' },
  { value: '6-months', label: '6 Months' },
];

export const EXPERIENCE_OPTIONS = [
  { value: 'fresher', label: 'Fresher (0 years)' },
  { value: '1', label: '1 Year' },
  { value: '2', label: '2 Years' },
  { value: '3', label: '3 Years' },
  { value: '4', label: '4 Years' },
  { value: '5', label: '5 Years' },
  { value: '6', label: '6 Years' },
  { value: '7', label: '7 Years' },
  { value: '8', label: '8 Years' },
  { value: '9', label: '9 Years' },
  { value: '10+', label: '10+ Years' },
];

export const EDUCATION_OPTIONS = [
  { value: 'btech', label: 'B.Tech / B.E.' },
  { value: 'mtech', label: 'M.Tech / M.E.' },
  { value: 'bsc', label: 'B.Sc' },
  { value: 'msc', label: 'M.Sc' },
  { value: 'bca', label: 'BCA' },
  { value: 'mca', label: 'MCA' },
  { value: 'mba', label: 'MBA' },
  { value: 'diploma', label: 'Diploma' },
  { value: 'other', label: 'Other' },
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
