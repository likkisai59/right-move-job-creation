import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { Save, AlertTriangle, Building2, Calendar, Phone, Mail, Plus, Trash2 } from 'lucide-react';
import Input from '../common/Input';
import Button from '../common/Button';
import Select from '../common/Select';
import FileUpload from '../common/FileUpload';
import { checkDuplicateOrganization, uploadOrganizationContract } from '../../api/organizationsApi';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

const COUNTRY_CODES = [
  { value: '+91', label: '🇮🇳 India (+91)' },
  { value: '+1', label: '🇺🇸 USA (+1)' },
  { value: '+44', label: '🇬🇧 UK (+44)' },
  { value: '+61', label: '🇦🇺 Australia (+61)' },
  { value: '+1', label: '🇨🇦 Canada (+1)' },
  { value: '+49', label: '🇩🇪 Germany (+49)' },
  { value: '+33', label: '🇫🇷 France (+33)' },
  { value: '+81', label: '🇯🇵 Japan (+81)' },
  { value: '+86', label: '🇨🇳 China (+86)' },
  { value: '+971', label: '🇦🇪 UAE (+971)' },
];

const OrganizationForm = ({ initialData = {}, onSubmit, loading = false }) => {
  const [warning, setWarning] = useState(false);
  const [uploadingContract, setUploadingContract] = useState(false);

  const {
    register,
    handleSubmit,
    control,
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
      contact_number: initialData.contact_number || '',
      country_code: initialData.country_code || '+91',
      rate_cards: [{ band: '', rate: '' }],
      poc_country_code: initialData.poc_country_code || '+91',
      poc_contact: initialData.poc_contact || '',
      poc_email_id: initialData.poc_email_id || '',
      contract_document_url: initialData.contract_document_url || '',
    },
    mode: 'onChange'
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'rate_cards',
  });

  // Only reset form if initialData actually changes (e.g. from an API load)
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      const bands = initialData.band ? initialData.band.split(',') : [];
      const rates = initialData.rate ? initialData.rate.split(',') : [];
      const rate_cards = [];
      const maxLength = Math.max(bands.length, rates.length);
      for (let i = 0; i < maxLength; i++) {
        rate_cards.push({
          band: bands[i] || '',
          rate: rates[i] || '',
        });
      }
      reset({
        ...initialData,
        rate_cards: rate_cards.length > 0 ? rate_cards : [{ band: '', rate: '' }],
        poc_country_code: initialData.poc_country_code || '+91',
        poc_contact: initialData.poc_contact || '',
        poc_email_id: initialData.poc_email_id || '',
        contract_document_url: initialData.contract_document_url || '',
      });
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

  const handleContractUpload = async (file, onChange) => {
    if (!file) {
      onChange('');
      return;
    }
    try {
      setUploadingContract(true);
      clearErrors('contract_document_url');
      const res = await uploadOrganizationContract(file);
      if (res && res.data && res.data.file_url) {
        onChange(res.data.file_url);
      } else {
        setError('contract_document_url', { type: 'manual', message: 'Upload failed' });
      }
    } catch (err) {
      setError('contract_document_url', { type: 'manual', message: 'Upload failed' });
    } finally {
      setUploadingContract(false);
    }
  };

  const handleFormSubmit = (data) => {
    if (warning) {
      setError('organization_name', { type: 'manual', message: 'Organization already exists' });
      return;
    }
    
    // Convert rate_cards back to comma-separated strings
    const validRateCards = (data.rate_cards || []).filter(rc => rc.band?.trim() || rc.rate?.trim());
    const bands = validRateCards.map(rc => rc.band?.trim() || '').join(',');
    const rates = validRateCards.map(rc => rc.rate?.trim() || '').join(',');

    const payload = {
      ...data,
      band: bands || null,
      rate: rates || null,
    };
    delete payload.rate_cards;

    onSubmit(payload);
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

            {/* New Fields: Contact */}
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-1">
                <Select
                  label="Code"
                  options={COUNTRY_CODES}
                  error={errors.country_code?.message}
                  {...register('country_code')}
                />
              </div>
              <div className="md:col-span-3">
                <Input
                  label="Contact Number"
                  placeholder="Enter phone number"
                  icon={Phone}
                  error={errors.contact_number?.message}
                  {...register('contact_number', {
                    pattern: { value: /^\d+$/, message: 'Only numeric input allowed' },
                    minLength: { value: 10, message: 'Minimum 10 digits required' }
                  })}
                />
              </div>
            </div>

            <Select
              label="Status"
              required
              options={STATUS_OPTIONS}
              error={errors.status?.message}
              {...register('status', { required: 'Status is required' })}
            />
          </div>

          {/* SECTION 1.5: Rated Card Details */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                  <Building2 size={16} className="text-blue-500" />
                  Add Rated card
                </h3>
                <p className="text-xs text-gray-500 mt-1">Configure band levels and billing rates for this organization.</p>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => append({ band: '', rate: '' })}
                icon={Plus}
              >
                Add Card
              </Button>
            </div>

            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start bg-gray-50 p-4 rounded-xl border border-gray-100 relative animate-slide-up">
                  <Input
                    label={`Band (Row ${index + 1})`}
                    placeholder="e.g. L1, Senior"
                    required
                    error={errors.rate_cards?.[index]?.band?.message}
                    {...register(`rate_cards.${index}.band`, { required: 'Band is required' })}
                  />
                  
                  <div className="relative pr-10">
                    <Input
                      label="Rate"
                      placeholder="e.g. ₹1000/hr, $50"
                      required
                      error={errors.rate_cards?.[index]?.rate?.message}
                      {...register(`rate_cards.${index}.rate`, { required: 'Rate is required' })}
                    />
                    
                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="absolute right-0 bottom-3 w-8 h-8 flex items-center justify-center rounded-full bg-red-50 text-red-600 hover:bg-red-100 shadow-sm transition-all hover:scale-110 active:scale-95"
                        title="Remove rate card"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 2: POC Details */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-5 flex items-center gap-2">
              <Phone size={16} className="text-blue-500" />
              POC Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="md:col-span-1">
                <Select
                  label="Code"
                  options={COUNTRY_CODES}
                  error={errors.poc_country_code?.message}
                  {...register('poc_country_code')}
                />
              </div>
              <div className="md:col-span-3">
                <Input
                  label="POC Contact"
                  placeholder="Enter POC phone number"
                  icon={Phone}
                  error={errors.poc_contact?.message}
                  {...register('poc_contact', {
                    pattern: { value: /^\d+$/, message: 'Only numeric input allowed' },
                    minLength: { value: 10, message: 'Minimum 10 digits required' }
                  })}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <Input
                label="POC Email ID"
                type="email"
                placeholder="e.g. poc@company.com"
                icon={Mail}
                error={errors.poc_email_id?.message}
                {...register('poc_email_id', {
                  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email address' }
                })}
              />
            </div>
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
              <Controller
                name="contract_document_url"
                control={control}
                render={({ field }) => (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Upload Contract
                    </label>
                    <FileUpload
                      value={field.value ? { name: field.value.split('/').pop(), url: field.value } : null}
                      accept=".pdf,.doc,.docx"
                      title="Drag & drop your contract document here"
                      subtitle="or click to browse"
                      onFileSelect={(file) => handleContractUpload(file, field.onChange)}
                    />
                    {uploadingContract && <p className="text-sm text-blue-500 mt-2 font-medium">Uploading contract document...</p>}
                    {errors.contract_document_url && <p className="text-sm text-red-500 mt-2">{errors.contract_document_url.message}</p>}
                  </div>
                )}
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
