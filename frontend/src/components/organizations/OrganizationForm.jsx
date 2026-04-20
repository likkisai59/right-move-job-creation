import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Save, AlertTriangle, Building2, Calendar, Percent } from 'lucide-react';
import Input from '../common/Input';
import Button from '../common/Button';
import Select from '../common/Select';
import { checkDuplicateOrganization } from '../../api/organizationsApi';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'complete', label: 'Complete' },
  { value: 'cancel', label: 'Cancel' },
];

const OrganizationForm = ({ initialData = {}, onSubmit, loading = false }) => {
  const [warning, setWarning] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setError,
    clearErrors,
    reset,
  } = useForm({
    defaultValues: {
      organization_name: initialData.organization_name || '',
      status: initialData.status || 'active',
      contract_signed_date: initialData.contract_signed_date || '',
      contract_end_date: initialData.contract_end_date || '',
      commission_percentage: initialData.commission_percentage || '',
    },
    mode: 'onChange'
  });

  // Only reset form if initialData actually changes (e.g. from an API load)
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      reset(initialData);
    }
  }, [JSON.stringify(initialData), reset]);

  const organizationName = watch('organization_name');
  const signedDate = watch('contract_signed_date');

  const handleCheckDuplicates = async () => {
    if (!organizationName || organizationName.trim().length === 0) {
      setWarning(false);
      return;
    }

    try {
      const exists = await checkDuplicateOrganization(organizationName);
      setWarning(exists);
      if (exists) {
        setError('organization_name', { 
          type: 'manual', 
          message: 'Organization already exists' 
        });
      } else {
        clearErrors('organization_name');
      }
    } catch (err) {
      console.error('Duplicate check failed', err);
    }
  };

  const handleFormSubmit = (data) => {
    if (warning) {
      setError('organization_name', { type: 'manual', message: 'Organization already exists' });
      return;
    }
    onSubmit(data);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in shadow-sm">
        {/* Header */}
        <div className="bg-gray-50/50 px-8 py-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
              <Building2 size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Organization Profile</h2>
              <p className="text-sm text-gray-500">Manage partnership details and contract terms.</p>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* SECTION 1: Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <Input
                label="Organization Name"
                placeholder="e.g. Acme Corporation"
                required
                error={errors.organization_name?.message}
                {...register('organization_name', {
                  required: 'Organization name is required',
                  onBlur: handleCheckDuplicates
                })}
              />
              {warning && !errors.organization_name && (
                <div className="mt-2 flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-xl border border-red-100 animate-pulse">
                  <AlertTriangle size={16} />
                  <span className="text-sm font-medium">Organization already exists</span>
                </div>
              )}
            </div>

            <Select
              label="Status"
              required
              options={STATUS_OPTIONS}
              error={errors.status?.message}
              {...register('status', { required: 'Status is required' })}
            />

            <Input
              label="Commission Percentage (%)"
              type="number"
              step="0.01"
              required
              placeholder="e.g. 15.50"
              icon={Percent}
              error={errors.commission_percentage?.message}
              {...register('commission_percentage', {
                required: 'Commission is required',
                min: { value: 0, message: 'Commission must be between 0 and 100' },
                max: { value: 100, message: 'Commission must be between 0 and 100' },
                valueAsNumber: true,
                validate: (value) => !isNaN(value) || 'Commission must be a valid number'
              })}
            />
          </div>

          <div className="h-px bg-gray-100 w-full" />

          {/* SECTION 2: Contract Details */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-5 flex items-center gap-2">
              <Calendar size={16} className="text-blue-500" />
              Contract Duration
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Contract Signed Date"
                type="date"
                error={errors.contract_signed_date?.message}
                {...register('contract_signed_date')}
              />
              <Input
                label="Contract End Date"
                type="date"
                error={errors.contract_end_date?.message}
                {...register('contract_end_date', {
                  validate: (value) => {
                    if (!value || !signedDate) return true;
                    return new Date(value) > new Date(signedDate) || 'End date must be after signed date';
                  }
                })}
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 px-8 py-6 border-t border-gray-100 flex justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => window.history.back()}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            icon={Save}
            loading={loading}
            disabled={loading || !!errors.organization_name}
          >
            {initialData.id ? 'Update Organization' : 'Register Organization'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default OrganizationForm;
