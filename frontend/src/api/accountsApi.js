import api from './axios';

// Fetch all employees and their account configurations
export const fetchAccounts = async () => {
  const response = await api.get('/accounts');
  return response.data; // returns array of AccountListResponse
};

// Create a new account record
export const createAccount = async (accountData) => {
  const response = await api.post('/accounts/', accountData);
  return response.data; // returns AccountResponse
};

// Update an existing account record
export const updateAccount = async (employeeId, accountData) => {
  const response = await api.put(`/accounts/employee/${employeeId}`, accountData);
  return response.data; // returns AccountResponse
};
