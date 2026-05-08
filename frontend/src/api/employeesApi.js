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
    preferredName: data.preferred_name,
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
  };
};

// Transforms frontend camelCase to backend snake_case
const mapToBackend = (data) => {
  if (!data) return null;
  return {
    first_name: data.firstName,
    last_name: data.lastName,
    preferred_name: data.preferredName,
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
  };
};

// ─────────────────────────────────────────────────────────────
// API ENDPOINTS
// ─────────────────────────────────────────────────────────────

// 1. GET ALL
export const fetchEmployees = async (params = {}) => {
  // params might contain { search: "John", status: "Active" }
  const response = await api.get('/employees', { params });
  
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
