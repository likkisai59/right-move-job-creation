import React from 'react';
import { Search, Calendar } from 'lucide-react';
import Input from '../common/Input';
import Button from '../common/Button';
import SortBy from '../common/SortBy';

const SORT_OPTIONS = [
  { label: 'Created Date (Newest)', value: 'created_at:desc' },
  { label: 'Created Date (Oldest)', value: 'created_at:asc' },
  { label: 'Company Name (A-Z)', value: 'company_name:asc' },
  { label: 'Company Name (Z-A)', value: 'company_name:desc' },
  { label: 'Job Code Ascending', value: 'job_code:asc' },
  { label: 'Job Code Descending', value: 'job_code:desc' },
  { label: 'Job ID Ascending', value: 'id:asc' },
  { label: 'Job ID Descending', value: 'id:desc' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'CLOSED', label: 'Closed' },
  { value: 'ON_HOLD', label: 'On Hold' },
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
        type="text"
        onFocus={(e) => {
          e.target.type = 'date';
          try { e.target.showPicker(); } catch (err) { }
        }}
        onBlur={(e) => { if (!e.target.value) e.target.type = 'text'; }}
        // icon={Calendar}
        placeholder="Start date"
        value={filters.startDate || ''}
        onChange={(e) => handleChange('startDate', e.target.value)}
        containerClassName="w-48"
      />

      {/* End Date */}
      <Input
        type="text"
        onFocus={(e) => {
          e.target.type = 'date';
          try { e.target.showPicker(); } catch (err) { }
        }}
        onBlur={(e) => { if (!e.target.value) e.target.type = 'text'; }}
        // icon={Calendar}
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

      {/* Sort By Dropdown */}
      <SortBy
        options={SORT_OPTIONS}
        sortField={filters.sortField}
        sortOrder={filters.sortOrder}
        onChange={({ sortField, sortOrder }) => onChange({ ...filters, sortField, sortOrder })}
      />

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
