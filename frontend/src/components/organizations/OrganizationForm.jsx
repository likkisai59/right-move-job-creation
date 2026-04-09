import React, { useState } from 'react';
import Input from '../common/Input';
import Button from '../common/Button';
import { Save } from 'lucide-react';

const OrganizationForm = ({ initialData = {}, onSubmit, loading = false }) => {
  const [formData, setFormData] = useState({
    name: initialData.name || '',
    status: initialData.status || 'ACTIVE'
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 w-full max-w-2xl animate-fade-in shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900 mb-6 border-b border-gray-50 pb-4">
        Organization Profile
      </h2>
      
      <div className="space-y-5">
        {/* Organization Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Organization Name <span className="text-red-500">*</span>
          </label>
          <Input 
            placeholder="e.g. Acme Corp" 
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            required
            containerClassName="w-full"
          />
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Operating Status
          </label>
          <select
            value={formData.status}
            onChange={(e) => handleChange('status', e.target.value)}
            className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-300 transition-all"
          >
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </div>

      {/* Submit Actions */}
      <div className="mt-8 pt-5 border-t border-gray-50 flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => window.history.back()}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          icon={Save}
          loading={loading}
          disabled={!formData.name}
        >
          {loading ? 'Saving...' : 'Save Organization'}
        </Button>
      </div>
    </form>
  );
};

export default OrganizationForm;
