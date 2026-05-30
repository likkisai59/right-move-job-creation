import React from 'react';
import { ArrowUpDown } from 'lucide-react';

const SortBy = ({ options, sortField, sortOrder, onChange, className = '' }) => {
  const handleSortChange = (e) => {
    const value = e.target.value;
    if (value === '') {
      onChange({ sortField: '', sortOrder: 'desc' });
      return;
    }
    const [field, order] = value.split(':');
    onChange({ sortField: field, sortOrder: order });
  };

  const currentValue = sortField ? `${sortField}:${sortOrder || 'desc'}` : '';

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
          <ArrowUpDown size={14} />
        </div>
        <select
          value={currentValue}
          onChange={handleSortChange}
          className="h-10 pl-9 pr-8 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-300 transition-all appearance-none"
        >
          <option value="">Sort By: Default</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </div>
      </div>
    </div>
  );
};

export default SortBy;
