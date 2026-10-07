/**
 * Generates the secure URL for viewing/downloading a file from S3 via the backend API.
 * The backend intercepts this URL, generates a presigned URL, and redirects the browser.
 * 
 * @param {string} urlOrKey The S3 URL or key stored in the database
 * @returns {string} The secure API URL to be used in href or src
 */
export const getSecureMediaUrl = (urlOrKey) => {
  if (!urlOrKey) return '';
  
  // Base API URL
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
  
  // Make sure it doesn't have double slashes
  const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  
  // Return the API endpoint with the key encoded
  return `${cleanBaseUrl}/media/view?key=${encodeURIComponent(urlOrKey)}`;
};
