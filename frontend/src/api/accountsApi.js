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

// Fetch global PF and TDS configuration percentages
export const fetchPayrollConfig = async () => {
  const response = await api.get('/accounts/config');
  return response.data;
};

// Update global PF and TDS configuration percentages
export const updatePayrollConfig = async (configData) => {
  const response = await api.put('/accounts/config', configData);
  return response.data;
};

// Fetch placements data
export const fetchPlacements = async () => {
  const response = await api.get('/accounts/placements');
  return response.data;
};

// Fetch invoice/billing records
export const fetchInvoices = async () => {
  const response = await api.get('/accounts/invoices');
  return response.data;
};

// Update invoice/billing record
export const updateInvoice = async (mappingId, invoiceData) => {
  const response = await api.put(`/accounts/invoices/${mappingId}`, invoiceData);
  return response.data;
};
