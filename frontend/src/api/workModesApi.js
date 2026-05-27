import api from './axios';

// Fetch all work modes (optionally filtered by active_only)
export const fetchWorkModes = async (params = {}) => {
  const response = await api.get('/work-modes', { params });
  return response.data; // { success: true, message: "...", data: [...] }
};

// Create a new work mode
export const createWorkMode = async (name) => {
  const response = await api.post('/work-modes', { name });
  return response.data;
};

// Update work mode name or status
export const updateWorkMode = async (id, data) => {
  const response = await api.put(`/work-modes/${id}`, data);
  return response.data;
};
