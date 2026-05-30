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
    lastWorkingDate: data.last_working_date,
    
    // New fields
    dateOfBirth: data.date_of_birth,
    contactNumberOffice: data.contact_number_office,
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
  return {
    first_name: data.firstName,
    last_name: data.lastName,
    blood_group: data.bloodGroup,
    gender: data.gender,
    country_code: data.countryCode,
    contact_number: data.contactNumber,
    email: data.email,
    permanent_address: data.permanentAddress,
    current_address: data.currentAddress,
    designation: data.designation,
    date_of_joining: data.dateOfJoining,
    package: data.package ? parseFloat(data.package) : null, // Ensure package is a number
    status: data.status,
    last_working_date: data.lastWorkingDate || null,         // Convert empty strings to null
    
    // New fields
    date_of_birth: data.dateOfBirth,
    contact_number_office: data.contactNumberOffice,
    emergency_contact_number: data.emergencyContactNumber,
    aadhar_number: data.aadharNumber,
    aadhar_url: data.aadharUrl,
    pan_number: data.panNumber,
    pan_url: data.panUrl,
    marksheet_10th_url: data.marksheet10thUrl,
    marksheet_12th_url: data.marksheet12thUrl,
    marksheet_graduation_url: data.marksheetGraduationUrl,
    present_address_proof_url: data.presentAddressProofUrl,
    permanent_address_proof_url: data.permanentAddressProofUrl,
    photo_url: data.photoUrl,
    medical_condition: data.medicalCondition || null,

    // Bank Details
    bank_name: data.bankName,
    bank_account_number: data.bankAccountNumber,
    bank_ifsc_code: data.bankIfscCode,

    // Document & Other fields
    resume_url: data.resumeUrl,
    salary_slips_url: data.salarySlipsUrl,
    offer_letter_url: data.offerLetterUrl,
    last_company_name: data.lastCompanyName,

    // Reporting & Compliance Details
    assigned_business_unit: data.assignedBusinessUnit,
    reporting_to: data.reportingTo,
    work_mode: data.workMode,
    ctc: data.ctc ? parseFloat(data.ctc) : null,
    compliance: data.compliance,

    // Asset & System Configuration Details
    system_assigned: data.systemAssigned,
    sim_card_assigned: data.simCardAssigned,
    email_id_configured: data.emailIdConfigured,
    linkedin_configured: data.linkedinConfigured,
    google_sheet_configured: data.googleSheetConfigured,
    whatsapp_business_configured: data.whatsappBusinessConfigured,
  };
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

