import React from 'react';
import { Search, Calendar } from 'lucide-react';
import Input from '../common/Input';
import Button from '../common/Button';

const STATUS_OPTIONS = [
  { value: '',         label: 'All Status' },
  { value: 'ACTIVE',   label: 'Active' },
  { value: 'CLOSED',   label: 'Closed' },
  { value: 'ON_HOLD',  label: 'On Hold' },
];

const JobFilters = ({ filters, onChange, onClear }) => {
  const handleChange = (field, value) => {
    onChange({ ...filters, [field]: value });
  };

  const hasFilters = filters.company || filters.startDate || filters.endDate || filters.status;

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Company Search */}
      <Input
        icon={Search}
        placeholder="Search by company..."
        value={filters.company || ''}
        onChange={(e) => handleChange('company', e.target.value)}
        containerClassName="flex-1 min-w-[200px] max-w-sm"
      />

      {/* Start Date */}
      <Input
        type="date"
        icon={Calendar}
        placeholder="Start date"
        value={filters.startDate || ''}
        onChange={(e) => handleChange('startDate', e.target.value)}
        containerClassName="w-48"
      />

      {/* End Date */}
      <Input
        type="date"
        icon={Calendar}
        placeholder="End date"
        value={filters.endDate || ''}
        onChange={(e) => handleChange('endDate', e.target.value)}
        containerClassName="w-48"
      />

      {/* Status Dropdown */}
      <select
        value={filters.status || ''}
        onChange={(e) => handleChange('status', e.target.value)}
        className="h-10 px-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-300 transition-all"
      >
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Clear Button */}
      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={onClear}>
          Clear filters
        </Button>
      )}
    </div>
  );
};

export default JobFilters;
