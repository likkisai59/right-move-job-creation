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

// Export accounts data as Excel
export const exportAccounts = async (params = {}) => {
  const response = await api.get('/accounts/export', {
    params,
    responseType: 'blob'
  });

  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;

  const contentDisposition = response.headers['content-disposition'];
  let filename = `accounts_${params.tab || 'data'}_export.xlsx`;
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

// Close current month and reset calculations
export const closeMonth = async () => {
  const response = await api.post('/accounts/close-month');
  return response.data;
};

// Fetch list of historically closed months
export const fetchHistoryMonths = async () => {
  const response = await api.get('/accounts/history/months');
  return response.data;
};

// Export a past month's payroll history as Excel
export const exportHistory = async (month) => {
  const response = await api.get('/accounts/history/export', {
    params: { month },
    responseType: 'blob'
  });

  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;

  const contentDisposition = response.headers['content-disposition'];
  let filename = `payroll_history_${month.replace(/\s+/g, '_')}.xlsx`;
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

// Export a past month's organization billing history as Excel
export const exportBillingHistory = async (month) => {
  const response = await api.get('/accounts/history/billing/export', {
    params: { month },
    responseType: 'blob'
  });

  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;

  const contentDisposition = response.headers['content-disposition'];
  let filename = `billing_history_${month.replace(/\s+/g, '_')}.xlsx`;
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

// Export bank credit details as Excel (HDFC or ICICI)
export const exportCreditDetails = async (bankName) => {
  const response = await api.get('/accounts/credit/export', {
    params: { bank_name: bankName },
    responseType: 'blob'
  });

  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;

  const contentDisposition = response.headers['content-disposition'];
  let filename = `${bankName.toUpperCase()}_credit_details.xlsx`;
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
