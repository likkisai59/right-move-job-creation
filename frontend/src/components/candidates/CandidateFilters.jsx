import React from 'react';
import { Search } from 'lucide-react';
import Input from '../common/Input';
import Button from '../common/Button';

const CandidateFilters = ({ filters, onChange, onClear }) => {
  const handleChange = (field, value) => {
    onChange({ ...filters, [field]: value });
  };

  const hasFilters = filters.search;

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <Input
        icon={Search}
        placeholder="Search by name, skill, or experience..."
        value={filters.search || ''}
        onChange={(e) => handleChange('search', e.target.value)}
        containerClassName="flex-1 min-w-[200px] max-w-md"
      />
      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={onClear}>
          Clear filters
        </Button>
      )}
    </div>
  );
};

export default CandidateFilters;
