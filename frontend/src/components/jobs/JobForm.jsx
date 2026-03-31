import React, { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import { mockRecruiters } from '../../utils/mockData';

const JOB_STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'ON_HOLD', label: 'On Hold' },
  { value: 'CLOSED', label: 'Closed' },
  { value: 'DRAFT', label: 'Draft' },
];

const JobForm = ({ defaultValues, onSubmit, loading = false, isEdit = false }) => {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: defaultValues || {
      date: '',
      companyName: '',
      businessCategory: 'IT',
      requirements: [{ job_title: '', budget: '', experience: '', num_candidates: '' }],
      assignedTo: '',
      status: 'ACTIVE',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'requirements',
  });

  useEffect(() => {
    if (defaultValues) {
      reset(defaultValues);
    }
  }, [defaultValues, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
        {/* Date */}
        <Input
          label="Date"
          type="date"
          required
          error={errors.date?.message}
          {...register('date', { required: 'Date is required' })}
        />

        {/* Company Name */}
        <Input
          label="Company Name"
          placeholder="Enter company name"
          required
          error={errors.companyName?.message}
          {...register('companyName', {
            required: 'Company name is required',
            minLength: { value: 2, message: 'Must be at least 2 characters' },
          })}
        />

        {/* Business Category */}
        <Select
          label="Business Category"
          required
          options={[
            { value: 'IT', label: 'IT' },
            { value: 'ITSM', label: 'ITSM' },
            { value: 'BPO', label: 'BPO' },
          ]}
          error={errors.businessCategory?.message}
          {...register('businessCategory', { required: 'Business category is required' })}
        />

        {/* Recruiter */}
        <Select
          label="Assign Recruiter"
          placeholder="Select recruiter"
          required
          options={mockRecruiters}
          error={errors.assignedTo?.message}
          {...register('assignedTo', {
            required: 'Please select a recruiter',
          })}
        />

        {/* Status */}
        <Select
          label="Status"
          options={JOB_STATUS_OPTIONS}
          {...register('status')}
        />
      </div>

      {/* Hiring Requirements Table */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Hiring Requirements</h3>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => append({ job_title: '', budget: '', experience: '', num_candidates: '' })}
            icon={Plus}
          >
            Add Requirement
          </Button>
        </div>

        <div className="space-y-6">
          {fields.map((field, index) => (
            <div key={field.id} className="p-6 bg-gray-50 rounded-xl border border-gray-200 relative animate-slide-up">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4">
                {/* Job Title */}
                <Input
                  label={`Job Title (Requirement ${index + 1})`}
                  placeholder="Enter job title"
                  required
                  error={errors.requirements?.[index]?.job_title?.message}
                  {...register(`requirements.${index}.job_title`, { required: 'Job title is required' })}
                />

                {/* Budget */}
                <Input
                  label="Budget"
                  placeholder="e.g. ₹15-20 LPA"
                  required
                  error={errors.requirements?.[index]?.budget?.message}
                  {...register(`requirements.${index}.budget`, { required: 'Budget is required' })}
                />

                {/* Experience */}
                <Input
                  label="Experience"
                  placeholder="e.g. 5+ years"
                  required
                  error={errors.requirements?.[index]?.experience?.message}
                  {...register(`requirements.${index}.experience`, { required: 'Experience is required' })}
                />

                {/* Num Candidates */}
                <Input
                  label="Num Candidates"
                  type="number"
                  placeholder="e.g. 10"
                  required
                  error={errors.requirements?.[index]?.num_candidates?.message}
                  {...register(`requirements.${index}.num_candidates`, { 
                    required: 'Required',
                    min: { value: 1, message: 'Min 1' }
                  })}
                />
              </div>

              {fields.length > 1 && (
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="absolute -top-3 -right-3 w-8 h-8 flex items-center justify-center rounded-full bg-red-100 text-red-600 hover:bg-red-200 shadow-sm transition-all hover:scale-110 active:scale-95"
                  title="Remove requirement"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>


      {/* Submit */}
      <div className="flex items-center justify-end gap-3 mt-8 pt-5 border-t border-gray-100">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={loading}
        >
          {isEdit ? 'Update Job Requirement' : 'Create Job Requirement'}
        </Button>
      </div>
    </form>
  );
};

export default JobForm;

