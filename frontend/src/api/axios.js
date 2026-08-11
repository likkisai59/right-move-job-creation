import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Request Interceptor: Attach JWT token to every request ────────────────
api.interceptors.request.use(
  (config) => {
    // Admin login stores token under 'token', Employee login under 'employee_token'
    const token = localStorage.getItem('token') || localStorage.getItem('employee_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Friendly Error Message Map by HTTP Status Code ──────────────────────────
const HTTP_ERROR_MESSAGES = {
  400: 'Invalid data. Please check the form fields and try again.',
  401: 'Session expired. Please login again.',
  403: "You don't have permission to perform this action.",
  404: 'The requested record was not found.',
  409: 'A conflict occurred. This record may already exist.',
  422: 'Validation failed. Please review the submitted data.',
  500: 'Server error. Please try again in a moment.',
  502: 'Server is temporarily unavailable. Please try again later.',
  503: 'Service is under maintenance. Please try again soon.',
};

// Helper: dispatch a toast event that any component can listen to
const dispatchToast = (message, type = 'error') => {
  window.dispatchEvent(new CustomEvent('app:toast', { detail: { message, type } }));
};

// ─── Response Interceptor: Show user-friendly errors ──────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      // Clear all auth tokens on session expiry
      localStorage.removeItem('token');
      localStorage.removeItem('employee_token');
      localStorage.removeItem('user');
      localStorage.removeItem('employee_data');
    }

    // Use backend message if available, otherwise fall back to status-code mapping
    let backendMessage = error.response?.data?.message || error.response?.data?.detail;
    
    // Safely convert arrays (e.g. FastAPI validation lists) or objects to strings
    if (Array.isArray(backendMessage)) {
      backendMessage = backendMessage.map(err => err.msg || JSON.stringify(err)).join(', ');
    } else if (typeof backendMessage === 'object' && backendMessage !== null) {
      backendMessage = JSON.stringify(backendMessage);
    }

    const friendlyMessage = backendMessage || HTTP_ERROR_MESSAGES[status] || 'Something went wrong. Please try again.';

    // Dispatch toast for all non-401 errors (401 handled by login page)
    if (status !== 401) {
      dispatchToast(friendlyMessage, 'error');
    }

    return Promise.reject(error);
  }
);

export default api;
