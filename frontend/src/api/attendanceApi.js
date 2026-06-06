import axios from './axios';

/**
 * Employee portal authentication
 */
export const employeeLogin = async (username, password) => {
  const response = await axios.post('/attendance/login', { username, password });
  return response.data;
};

/**
 * Attendance marking
 */
export const markAttendance = async (employeeId, data) => {
  const response = await axios.post(`/attendance/mark?employee_id=${employeeId}`, data);
  return response.data;
};

export const getAttendanceHistory = async (employeeId, sortField, sortOrder) => {
  const params = {};
  if (sortField) params.sort_by = sortField;
  if (sortOrder) params.sort_order = sortOrder;
  const response = await axios.get(`/attendance/history/${employeeId}`, { params });
  return response.data;
};


/**
 * Leave management
 */
export const applyLeave = async (data) => {
  const response = await axios.post('/attendance/leave/apply', data);
  return response.data;
};

export const getLeaveHistory = async (employeeId) => {
  const response = await axios.get(`/attendance/leave/history/${employeeId}`);
  return response.data;
};

/**
 * Approvals and Team Management
 */
export const getPendingLeaves = async (managerName) => {
  const response = await axios.get(`/attendance/approvals/leaves?manager_name=${encodeURIComponent(managerName)}`);
  return response.data;
};

export const updateLeaveStatus = async (leaveId, status, managerName) => {
  const response = await axios.post(`/attendance/approvals/leaves/${leaveId}/action`, {
    status,
    manager_name: managerName
  });
  return response.data;
};

export const getTeamAttendance = async (managerName) => {
  const response = await axios.get(`/attendance/approvals/team-attendance?manager_name=${encodeURIComponent(managerName)}`);
  return response.data;
};

export const getLeaveConfig = async (employeeId) => {
  const response = await axios.get(`/attendance/leave/config/${employeeId}`);
  return response.data;
};

export const saveApprovalsConfig = async (configData) => {
  const response = await axios.post('/attendance/approvals/config', configData);
  return response.data;
};


