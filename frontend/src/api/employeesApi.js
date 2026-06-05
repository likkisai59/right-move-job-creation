import api from './axios';

// ─────────────────────────────────────────────────────────────
// DATA MAPPERS (Translators)
// ─────────────────────────────────────────────────────────────

// Transforms backend snake_case to frontend camelCase
const mapToFrontend = (data) => {
  if (!data) return null;
  return {
    id: data.id,
    employeeId: data.employee_id,
    firstName: data.first_name,
    lastName: data.last_name,
    bloodGroup: data.blood_group,
    gender: data.gender,
    countryCode: data.country_code,
    contactNumber: data.contact_number,
    email: data.email,
    permanentAddress: data.permanent_address,
    currentAddress: data.current_address,
    designation: data.designation,
    dateOfJoining: data.date_of_joining,
    package: data.package,
    status: data.status,
    profileStatus: data.profile_status || 'Draft',
    completionPercentage: data.completion_percentage || 0,
    profileStatusHr: data.profile_status_hr || 'Draft',
    completionPercentageHr: data.completion_percentage_hr || 0,
    profileStatusAdmin: data.profile_status_admin || 'Draft',
    completionPercentageAdmin: data.completion_percentage_admin || 0,
    employeePassword: data.employee_password,
    lastWorkingDate: data.last_working_date,

    // New fields
    dateOfBirth: data.date_of_birth,
    countrycodeOfficeContact: data.countrycode_office_contact || '+91',
    contactNumberOffice: data.contact_number_office,
    countrycodeEmergencyContact: data.countrycode_emergency_contact || '+91',
    emergencyContactNumber: data.emergency_contact_number,
    aadharNumber: data.aadhar_number,
    aadharUrl: data.aadhar_url,
    panNumber: data.pan_number,
    panUrl: data.pan_url,
    marksheet10thUrl: data.marksheet_10th_url,
    marksheet12thUrl: data.marksheet_12th_url,
    marksheetGraduationUrl: data.marksheet_graduation_url,
    presentAddressProofUrl: data.present_address_proof_url,
    permanentAddressProofUrl: data.permanent_address_proof_url,
    photoUrl: data.photo_url,
    medicalCondition: data.medical_condition,

    // Bank Details
    bankName: data.bank_name,
    bankAccountNumber: data.bank_account_number,
    bankIfscCode: data.bank_ifsc_code,

    // Document & Other fields
    resumeUrl: data.resume_url,
    salarySlipsUrl: data.salary_slips_url,
    offerLetterUrl: data.offer_letter_url,
    lastCompanyName: data.last_company_name,

    // Reporting & Compliance Details
    assignedBusinessUnit: data.assigned_business_unit,
    reportingTo: data.reporting_to,
    workMode: data.work_mode,
    ctc: data.ctc,
    compliance: data.compliance,

    // Asset & System Configuration Details
    systemAssigned: data.system_assigned,
    simCardAssigned: data.sim_card_assigned,
    emailIdConfigured: data.email_id_configured,
    linkedinConfigured: data.linkedin_configured,
    googleSheetConfigured: data.google_sheet_configured,
    whatsappBusinessConfigured: data.whatsapp_business_configured,
  };
};

// Transforms frontend camelCase to backend snake_case
const mapToBackend = (data) => {
  if (!data) return null;
  const result = {};
  
  const mapping = {
    firstName: 'first_name',
    lastName: 'last_name',
    bloodGroup: 'blood_group',
    gender: 'gender',
    countryCode: 'country_code',
    contactNumber: 'contact_number',
    email: 'email',
    permanentAddress: 'permanent_address',
    currentAddress: 'current_address',
    designation: 'designation',
    dateOfJoining: 'date_of_joining',
    package: 'package',
    status: 'status',
    profileStatusHr: 'profile_status_hr',
    completionPercentageHr: 'completion_percentage_hr',
    profileStatusAdmin: 'profile_status_admin',
    completionPercentageAdmin: 'completion_percentage_admin',
    employeePassword: 'employee_password',
    lastWorkingDate: 'last_working_date',
    dateOfBirth: 'date_of_birth',
    countrycodeOfficeContact: 'countrycode_office_contact',
    contactNumberOffice: 'contact_number_office',
    countrycodeEmergencyContact: 'countrycode_emergency_contact',
    emergencyContactNumber: 'emergency_contact_number',
    aadharNumber: 'aadhar_number',
    aadharUrl: 'aadhar_url',
    panNumber: 'pan_number',
    panUrl: 'pan_url',
    marksheet10thUrl: 'marksheet_10th_url',
    marksheet12thUrl: 'marksheet_12th_url',
    marksheetGraduationUrl: 'marksheet_graduation_url',
    presentAddressProofUrl: 'present_address_proof_url',
    permanentAddressProofUrl: 'permanent_address_proof_url',
    photoUrl: 'photo_url',
    medicalCondition: 'medical_condition',
    bankName: 'bank_name',
    bankAccountNumber: 'bank_account_number',
    bankIfscCode: 'bank_ifsc_code',
    resumeUrl: 'resume_url',
    salarySlipsUrl: 'salary_slips_url',
    offerLetterUrl: 'offer_letter_url',
    lastCompanyName: 'last_company_name',
    assignedBusinessUnit: 'assigned_business_unit',
    reportingTo: 'reporting_to',
    workMode: 'work_mode',
    ctc: 'ctc',
    compliance: 'compliance',
    systemAssigned: 'system_assigned',
    simCardAssigned: 'sim_card_assigned',
    emailIdConfigured: 'email_id_configured',
    linkedinConfigured: 'linkedin_configured',
    googleSheetConfigured: 'google_sheet_configured',
    whatsappBusinessConfigured: 'whatsapp_business_configured'
  };

  Object.entries(mapping).forEach(([frontKey, backKey]) => {
    if (data[frontKey] !== undefined) {
      let val = data[frontKey];
      // Special conversions
      if (frontKey === 'package' || frontKey === 'ctc') {
        val = (val !== null && val !== '') ? parseFloat(val) : null;
      } else if (frontKey === 'dateOfJoining' || frontKey === 'lastWorkingDate' || frontKey === 'dateOfBirth') {
        val = val || null;
      } else if (frontKey === 'medicalCondition') {
        val = val || null;
      }
      result[backKey] = val;
    }
  });

  return result;
};

// upload file helper
export const uploadEmployeeFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/employees/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// ─────────────────────────────────────────────────────────────
// API ENDPOINTS
// ─────────────────────────────────────────────────────────────

// 1. GET ALL
export const fetchEmployees = async (params = {}) => {
  // params might contain { search: "John", status: "Active" }
  const queryParams = { ...params };
  if (params.sortField) {
    queryParams.sort_by = params.sortField;
    delete queryParams.sortField;
  }
  if (params.sortOrder) {
    queryParams.sort_order = params.sortOrder;
    delete queryParams.sortOrder;
  }

  const response = await api.get('/employees', { params: queryParams });

  return {
    ...response.data,
    data: response.data.data.map(mapToFrontend) // Translate the whole list
  };
};

// 2. GET SINGLE
export const fetchEmployeeById = async (id) => {
  const response = await api.get(`/employees/${id}`);
  return {
    ...response.data,
    data: mapToFrontend(response.data.data) // Translate the single object
  };
};

// 3. CREATE
export const createEmployee = async (employeeData) => {
  const payload = mapToBackend(employeeData); // Translate before sending
  const response = await api.post('/employees', payload);
  return response.data;
};

// 4. UPDATE
export const updateEmployee = async (id, employeeData) => {
  const payload = mapToBackend(employeeData); // Translate before sending
  const response = await api.put(`/employees/${id}`, payload);
  return response.data;
};

// 5. DELETE
export const deleteEmployee = async (id) => {
  const response = await api.delete(`/employees/${id}`);
  return response.data;
};

// 6. EXPORT
export const exportEmployees = async (params = {}) => {
  const response = await api.get('/employees/export', {
    params,
    responseType: 'blob' // Important for downloading files
  });

  // Create a download link and trigger it
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;

  // Extract filename from headers if possible, otherwise use a default
  const contentDisposition = response.headers['content-disposition'];
  let filename = 'employees_export.xlsx';
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
    if (filenameMatch && filenameMatch.length === 2) {
      filename = filenameMatch[1];
    }
  }

  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

// 7. FETCH RECRUITERS (for Candidate Form recruiter dropdown)
// Returns employees as dropdown options { value: full_name, label: full_name }
export const fetchRecruiters = async () => {
  const response = await api.get('/employees', { params: { status: 'Active' } });
  const employees = response.data.data || [];
  return employees.map((emp) => ({
    value: `${emp.first_name} ${emp.last_name}`.trim(),
    label: `${emp.first_name} ${emp.last_name}`.trim(),
  }));
};

