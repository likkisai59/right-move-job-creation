import api from './axios';

export const fetchLeaveTypes = async (params = {}) => {
  try {
    const response = await api.get('/leave-types', { params });
    return response.data; // Ensure this directly returns the array or wrapper
  } catch (error) {
    throw error;
  }
};

export const createLeaveType = async (name) => {
  try {
    const response = await api.post('/leave-types', { name });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateLeaveType = async (id, data) => {
  try {
    const response = await api.put(`/leave-types/${id}`, data);
    return response.data;
  } catch (error) {
    throw error;
  }
};
