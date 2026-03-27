import React from 'react';
import { getStatusColorClasses } from '../../utils/formatters';

const Badge = ({ label, status, color, className = '' }) => {
  const colorClass = status
    ? getStatusColorClasses(status)
    : colorMap[color] || 'bg-gray-100 text-gray-600 border-gray-200';

  return (
    <span
      className={[
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize',
        colorClass,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {label || status}
    </span>
  );
};

const colorMap = {
  green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  red: 'bg-red-50 text-red-700 border-red-200',
  yellow: 'bg-amber-50 text-amber-700 border-amber-200',
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  purple: 'bg-violet-50 text-violet-700 border-violet-200',
  gray: 'bg-gray-100 text-gray-600 border-gray-200',
  teal: 'bg-teal-50 text-teal-700 border-teal-200',
};

export default Badge;
