import api from './axios';

// Fetch all designations (optionally filtered by active_only)
export const fetchDesignations = async (params = {}) => {
  const response = await api.get('/designations', { params });
  return response.data; // { success: true, message: "...", data: [...] }
};

// Create a new designation
export const createDesignation = async (name) => {
  const response = await api.post('/designations', { name });
  return response.data;
};

// Update designation name or status
export const updateDesignation = async (id, data) => {
  const response = await api.put(`/designations/${id}`, data);
  return response.data;
};
