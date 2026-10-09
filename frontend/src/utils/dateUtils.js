/**
 * Formats a given date string or Date object into 'DD-MMM-YYYY' format.
 * Example: '2026-08-15' -> '15-Aug-2026'
 *
 * @param {string|Date} dateInput - The date to format
 * @returns {string} The formatted date string, or a fallback character if invalid
 */
export const formatDate = (dateInput) => {
  if (!dateInput) return '-';

  const date = new Date(dateInput);
  
  // Check if date is invalid
  if (isNaN(date.getTime())) return '-';

  const day = date.getDate().toString().padStart(2, '0');
  
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[date.getMonth()];
  
  const year = date.getFullYear();

  return `${day}-${month}-${year}`;
};
