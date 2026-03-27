import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import { mockRecruiters } from '../../utils/mockData';

const JOB_STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'on-hold', label: 'On Hold' },
  { value: 'closed', label: 'Closed' },
  { value: 'draft', label: 'Draft' },
];

const JobForm = ({ defaultValues, onSubmit, loading = false, isEdit = false }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: defaultValues || {
      date: '',
      companyName: '',
      jobTitle: '',
      numberOfCandidates: '',
      experience: '',
      budget: '',
      assignedRecruiter: '',
      status: 'active',
    },
  });

  useEffect(() => {
    if (defaultValues) {
      reset(defaultValues);
    }
  }, [defaultValues, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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

        {/* Job Title */}
        <Input
          label="Job Title"
          placeholder="Enter job title"
          required
          error={errors.jobTitle?.message}
          {...register('jobTitle', { required: 'Job title is required' })}
        />

        {/* Number of Candidates */}
        <Input
          label="Number of Candidates"
          type="number"
          placeholder="Enter number of candidates"
          required
          error={errors.numberOfCandidates?.message}
          {...register('numberOfCandidates', {
            required: 'Required',
            min: { value: 1, message: 'Must be at least 1' },
          })}
        />

        {/* Experience */}
        <Input
          label="Experience"
          placeholder="e.g. 3-5 years"
          required
          error={errors.experience?.message}
          {...register('experience', { required: 'Experience is required' })}
        />

        {/* Budget */}
        <Input
          label="Budget"
          placeholder="e.g. ₹15-20 LPA"
          error={errors.budget?.message}
          {...register('budget')}
        />

        {/* Recruiter */}
        <Select
          label="Assign Recruiter"
          placeholder="Select recruiter"
          required
          options={mockRecruiters}
          error={errors.assignedRecruiter?.message}
          {...register('assignedRecruiter', {
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
