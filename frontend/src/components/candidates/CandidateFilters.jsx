import React from 'react';
import { Search } from 'lucide-react';
import Input from '../common/Input';
import Button from '../common/Button';

const BUSINESS_UNIT_FILTER_OPTIONS = [
  { value: '', label: 'All Units' },
  { value: 'IT', label: 'IT' },
  { value: 'ITES', label: 'ITES' },
  { value: 'BPO', label: 'BPO' },
  { value: 'Lateral', label: 'Lateral' },
  { value: 'FLP', label: 'FLP' },
  { value: 'F&A', label: 'F&A' },
];

const NOTICE_PERIOD_OPTIONS = [
  { value: '', label: 'All Notice Periods' },
  { value: 'Immediate', label: 'Immediate' },
  { value: 'Currently Serving', label: 'Currently Serving' },
  { value: '30 Days', label: '30 Days' },
  { value: '45 Days', label: '45 Days' },
  { value: '60 Days', label: '60 Days' },
  { value: '90 Days', label: '90 Days' },
];

const CandidateFilters = ({ filters, onChange, onClear }) => {
  const handleChange = (field, value) => {
    onChange({ ...filters, [field]: value });
  };

  const hasFilters = filters.search || filters.businessUnit || filters.skills || filters.currentLocation || filters.noticePeriod;

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Search Bar */}
      <Input
        icon={Search}
        placeholder="Search by name, email, phone..."
        value={filters.search || ''}
        onChange={(e) => handleChange('search', e.target.value)}
        containerClassName="flex-1 min-w-[200px]"
      />

      {/* Business Unit Dropdown */}
      <select
        value={filters.businessUnit || ''}
        onChange={(e) => handleChange('businessUnit', e.target.value)}
        className="h-10 px-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-300 transition-all"
      >
        {BUSINESS_UNIT_FILTER_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Skills */}
      <Input
        placeholder="Skills (e.g. React)..."
        value={filters.skills || ''}
        onChange={(e) => handleChange('skills', e.target.value)}
        containerClassName="w-36"
      />

      {/* Location */}
      <Input
        placeholder="Location..."
        value={filters.currentLocation || ''}
        onChange={(e) => handleChange('currentLocation', e.target.value)}
        containerClassName="w-32"
      />

      {/* Notice Period Dropdown */}
      <select
        value={filters.noticePeriod || ''}
        onChange={(e) => handleChange('noticePeriod', e.target.value)}
        className="h-10 px-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-300 transition-all"
      >
        {NOTICE_PERIOD_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Clear Filters */}
      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={onClear}>
          Clear filters
        </Button>
      )}
    </div>
  );
};

export default CandidateFilters;
