import api from './axios';

// Fetch all business units (optionally filtered by active_only)
export const fetchBusinessUnits = async (params = {}) => {
  const response = await api.get('/business-units', { params });
  return response.data; // { success: true, message: "...", data: [...] }
};

// Create a new business unit
export const createBusinessUnit = async (name) => {
  const response = await api.post('/business-units', { name });
  return response.data;
};

// Update business unit name or status
export const updateBusinessUnit = async (id, data) => {
  const response = await api.put(`/business-units/${id}`, data);
  return response.data;
};
