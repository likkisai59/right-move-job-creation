// Formatting utility functions

export const formatDate = (dateString) => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const formatFullDateTime = (dateString) => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).replace(/, /g, ', ');
};

export const formatRelativeTime = (dateString) => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 0) return 'just now'; // Handle slight clock skew
  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} mins ago`;
  const hours = Math.floor(diffInSeconds / 3600);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(diffInSeconds / 86400);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  
  return formatDate(dateString);
};

export const formatCurrency = (amount) => {
  if (!amount) return '—';
  return `₹${amount} LPA`;
};

export const formatExperience = (years) => {
  if (!years) return '—';
  return `${years} yr${years === 1 ? '' : 's'}`;
};

export const truncateText = (text, maxLength = 30) => {
  if (!text) return '—';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '…';
};

export const generateCandidateId = () => {
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `CAN-${rand}`;
};

export const generateJobId = () => {
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `JR-${rand}`;
};

export const getInitials = (name) => {
  if (!name) return '?';
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
};

export const getStatusColorClasses = (status) => {
  const normalizedStatus = (status || '').toLowerCase().replace('_', '-');
  const map = {
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    closed: 'bg-red-50 text-red-700 border-red-200',
    'on-hold': 'bg-amber-50 text-amber-700 border-amber-200',
    draft: 'bg-gray-100 text-gray-600 border-gray-200',
    sourcing: 'bg-blue-50 text-blue-700 border-blue-200',
    screening: 'bg-amber-50 text-amber-700 border-amber-200',
    interview: 'bg-violet-50 text-violet-700 border-violet-200',
    offer: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rejected: 'bg-red-50 text-red-700 border-red-200',
    hired: 'bg-teal-50 text-teal-700 border-teal-200',
  };
  return map[normalizedStatus] || 'bg-gray-100 text-gray-600 border-gray-200';
};


export const getPipelineBarColor = (index) => {
  const colors = [
    'bg-blue-500',
    'bg-violet-500',
    'bg-amber-500',
    'bg-emerald-500',
  ];
  return colors[index % colors.length];
};
