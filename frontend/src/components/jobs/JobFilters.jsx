import React from 'react';
import { Search, Calendar } from 'lucide-react';
import Input from '../common/Input';
import Button from '../common/Button';

const JobFilters = ({ filters, onChange, onClear }) => {
  const handleChange = (field, value) => {
    onChange({ ...filters, [field]: value });
  };

  const hasFilters = filters.company || filters.date;

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <Input
        icon={Search}
        placeholder="Search by company..."
        value={filters.company || ''}
        onChange={(e) => handleChange('company', e.target.value)}
        containerClassName="flex-1 min-w-[200px] max-w-sm"
      />
      <Input
        type="date"
        icon={Calendar}
        placeholder="Filter by date"
        value={filters.date || ''}
        onChange={(e) => handleChange('date', e.target.value)}
        containerClassName="w-48"
      />
      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={onClear}>
          Clear filters
        </Button>
      )}
    </div>
  );
};

export default JobFilters;
