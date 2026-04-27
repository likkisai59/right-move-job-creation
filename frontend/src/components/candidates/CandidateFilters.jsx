import React from 'react';
import { Search } from 'lucide-react';
import Input from '../common/Input';
import Button from '../common/Button';

const CATEGORY_OPTIONS = [
  { value: '', label: 'All Categories' },
  { value: 'IT', label: 'IT' },
  { value: 'ITSM', label: 'ITSM' },
  { value: 'BPO', label: 'BPO' },
];

const NOTICE_PERIOD_OPTIONS = [
  { value: '', label: 'All Notice Periods' },
  { value: 'Immediate', label: 'Immediate' },
  { value: '15 Days', label: '15 Days' },
  { value: '1 Month', label: '1 Month' },
  { value: '2 Months', label: '2 Months' },
  { value: '3 Months', label: '3 Months' },
];

const CandidateFilters = ({ filters, onChange, onClear }) => {
  const handleChange = (field, value) => {
    onChange({ ...filters, [field]: value });
  };

  const hasFilters = filters.search || filters.businessCategory || filters.skills || filters.totalExperience || filters.noticePeriod;

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Search Bar */}
      <Input
        icon={Search}
        placeholder="Search by name..."
        value={filters.search || ''}
        onChange={(e) => handleChange('search', e.target.value)}
        containerClassName="flex-1 min-w-[200px]"
      />

      {/* Category Dropdown */}
      <select
        value={filters.businessCategory || ''}
        onChange={(e) => handleChange('businessCategory', e.target.value)}
        className="h-10 px-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-300 transition-all"
      >
        {CATEGORY_OPTIONS.map((opt) => (
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

      {/* Experience */}
      <Input
        placeholder="Experience..."
        value={filters.totalExperience || ''}
        onChange={(e) => handleChange('totalExperience', e.target.value)}
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
