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
  { value: '15 Days', label: '15 Days' },
  { value: '30 Days', label: '30 Days' },
  { value: '45 Days', label: '45 Days' },
  { value: '60 Days', label: '60 Days' },
  { value: '90 Days', label: '90 Days' },
];


export const SOURCE_OPTIONS = [
  { value: 'Naukri', label: 'Naukri' },
  { value: 'LinkedIn', label: 'LinkedIn' },
  { value: 'Monster', label: 'Monster' },
  { value: 'Shine', label: 'Shine' },
  { value: 'Referral', label: 'Referral' },
];

export const JOB_SHIFTS = [
  { value: 'General', label: 'General' },
  { value: 'Night', label: 'Night' },
  { value: 'Rotational', label: 'Rotational' }
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

import { parsePhoneNumberFromString } from 'libphonenumber-js';

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

export const PHONE_LENGTH_MAP = {
  '+91': { min: 10, max: 10, label: '10 digits' },
  '+1': { min: 10, max: 10, label: '10 digits' },
  '+1-CA': { min: 10, max: 10, label: '10 digits' },
  '+44': { min: 10, max: 11, label: '10 to 11 digits' },
  '+971': { min: 9, max: 9, label: '9 digits' },
  '+65': { min: 8, max: 8, label: '8 digits' },
  '+61': { min: 9, max: 10, label: '9 to 10 digits' },
  '+49': { min: 10, max: 11, label: '10 to 11 digits' },
};

export const getPhoneValidationRules = (code = '+91') => {
  const normalizedCode = code ? code.replace('-CA', '') : '+91';
  const config = PHONE_LENGTH_MAP[code] || { min: 7, max: 15, label: '7 to 15 digits' };
  return {
    maxLength: config.max,
    minLength: {
      value: config.min,
      message: `Phone number must be ${config.label} for ${code}`
    },
    validate: (value) => {
      if (!value) return true;
      const cleanVal = String(value).trim();
      if (!/^\d+$/.test(cleanVal)) {
        return 'Only numeric characters allowed';
      }
      if (cleanVal.length < config.min || cleanVal.length > config.max) {
        return `Phone number must be ${config.label} for ${code}`;
      }
      const fullNumber = cleanVal.startsWith('+') ? cleanVal : `${normalizedCode}${cleanVal}`;
      try {
        const phoneNumber = parsePhoneNumberFromString(fullNumber);
        if (!phoneNumber || !phoneNumber.isPossible()) {
          return `Invalid phone number structure for ${code}`;
        }
        if (!phoneNumber.isValid()) {
          return `Invalid phone number or area code for ${code}`;
        }
        return true;
      } catch (err) {
        return `Invalid phone number format for ${code}`;
      }
    }
  };
};

// ─────────────────────────────────────────────────────────────
// EMPLOYEE CONSTANTS
// ─────────────────────────────────────────────────────────────

export const EMPLOYEE_STATUS_OPTIONS = [
  { value: 'Active', label: 'Active' },
  { value: 'Inactive', label: 'Inactive' }
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


export const EMPLOYEE_COMPLIANCE_OPTIONS = [
  { value: 'None', label: 'None' },
  { value: 'TDS', label: 'TDS' },
  { value: 'PF', label: 'PF' }
];

export const EMPLOYEE_YES_NO_OPTIONS = [
  { value: 'Yes', label: 'Yes' },
  { value: 'No', label: 'No' }
];

export const CANDIDATE_STATUS_OPTIONS = [
  { value: 'Candidate served', label: 'Candidate served' },
  { value: 'Candidate not served', label: 'Candidate not served' }
];

export const BILLING_STATUS_OPTIONS = [
  { value: 'Pending', label: 'Pending' },
  { value: 'Received', label: 'Received' }
];
