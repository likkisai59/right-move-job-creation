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

export const getAttendanceHistory = async (employeeId) => {
  const response = await axios.get(`/attendance/history/${employeeId}`);
  return response.data;
};

/**
 * Shift management
 */
export const getEmployeeShift = async (employeeId) => {
  const response = await axios.get(`/attendance/shift/${employeeId}`);
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
