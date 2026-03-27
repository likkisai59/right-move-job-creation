import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import FileUpload from '../common/FileUpload';
import SkillsInput from './SkillsInput';
import { NOTICE_PERIODS, EXPERIENCE_OPTIONS, EDUCATION_OPTIONS } from '../../utils/constants';

const SectionTitle = ({ children }) => (
  <div className="mb-5">
    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-gray-100 pb-2.5">
      {children}
    </h3>
  </div>
);

const CandidateForm = ({ defaultValues, onSubmit, onCancel, loading = false }) => {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm({
    defaultValues: defaultValues || {
      id: '',
      fullName: '',
      phone: '',
      email: '',
      currentLocation: '',
      currentCompany: '',
      totalExperience: '',
      relevantExperience: '',
      highestEducation: '',
      skills: [],
      currentCTC: '',
      expectedCTC: '',
      noticePeriod: '',
      reasonForChange: '',
      resumeFile: null,
    },
  });

  const [resumeFile, setResumeFile] = useState(null);

  useEffect(() => {
    if (defaultValues) {
      reset(defaultValues);
    }
  }, [defaultValues, reset]);

  const handleFormSubmit = (data) => {
    onSubmit({ ...data, resumeFile });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} noValidate>
      {/* SECTION 1: Personal Details */}
      <SectionTitle>Personal Details</SectionTitle>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
        <Input
          label="Candidate ID"
          placeholder="Enter candidate ID"
          required
          error={errors.id?.message}
          {...register('id', { required: 'Candidate ID is required' })}
        />
        <Input
          label="Full Name"
          placeholder="Enter full name"
          required
          error={errors.fullName?.message}
          {...register('fullName', { required: 'Full name is required' })}
        />
        <Input
          label="Phone Number"
          type="tel"
          placeholder="Enter phone number"
          required
          error={errors.phone?.message}
          {...register('phone', {
            required: 'Phone number is required',
            pattern: {
              value: /^[+]?[\d\s\-()]{8,15}$/,
              message: 'Enter a valid phone number',
            },
          })}
        />
        <Input
          label="Email Address"
          type="email"
          placeholder="Enter email address"
          required
          error={errors.email?.message}
          {...register('email', {
            required: 'Email is required',
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: 'Enter a valid email address',
            },
          })}
        />
        <Input
          label="Current Location"
          placeholder="Enter location"
          error={errors.currentLocation?.message}
          {...register('currentLocation')}
        />
      </div>

      {/* SECTION 2: Professional Details */}
      <SectionTitle>Professional Details</SectionTitle>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
        <Input
          label="Current / Last Company"
          placeholder="Enter company name"
          error={errors.currentCompany?.message}
          {...register('currentCompany')}
        />
        <Select
          label="Total Experience"
          placeholder="Select experience"
          required
          options={EXPERIENCE_OPTIONS}
          error={errors.totalExperience?.message}
          {...register('totalExperience', {
            required: 'Total experience is required',
          })}
        />
        <Input
          label="Relevant Experience (Years)"
          type="number"
          placeholder="e.g. 3"
          error={errors.relevantExperience?.message}
          {...register('relevantExperience', {
            min: { value: 0, message: 'Cannot be negative' },
          })}
        />
        <Select
          label="Highest Education"
          placeholder="Select education"
          options={EDUCATION_OPTIONS}
          error={errors.highestEducation?.message}
          {...register('highestEducation')}
        />

        {/* Skills - spans full width */}
        <div className="md:col-span-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-1 mb-1.5">
            Skills <span className="text-red-500">*</span>
          </label>
          <Controller
            name="skills"
            control={control}
            rules={{
              validate: (val) =>
                (val && val.length > 0) || 'At least one skill is required',
            }}
            render={({ field }) => (
              <SkillsInput
                value={field.value || []}
                onChange={field.onChange}
                placeholder="Type a skill and press Enter"
                error={errors.skills?.message}
              />
            )}
          />
        </div>
      </div>

      {/* SECTION 3: Compensation & Availability */}
      <SectionTitle>Compensation & Availability</SectionTitle>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
        <Input
          label="Current CTC (₹ LPA)"
          type="number"
          placeholder="e.g. 8.5"
          required
          error={errors.currentCTC?.message}
          {...register('currentCTC', {
            required: 'Current CTC is required',
            min: { value: 0, message: 'Cannot be negative' },
          })}
        />
        <Input
          label="Expected CTC (₹ LPA)"
          type="number"
          placeholder="e.g. 12"
          error={errors.expectedCTC?.message}
          {...register('expectedCTC', {
            min: { value: 0, message: 'Cannot be negative' },
          })}
        />
        <Select
          label="Notice Period"
          placeholder="Select notice period"
          required
          options={NOTICE_PERIODS}
          error={errors.noticePeriod?.message}
          {...register('noticePeriod', {
            required: 'Notice period is required',
          })}
        />
        <div className="md:col-span-2">
          <label className="text-sm font-medium text-gray-700 block mb-1.5">
            Reason for Job Change
          </label>
          <textarea
            placeholder="Enter reason for job change..."
            rows={3}
            className="w-full rounded-lg border border-gray-200 bg-white text-sm text-gray-900 placeholder-gray-400 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-300 transition-all resize-none"
            {...register('reasonForChange')}
          />
        </div>
      </div>

      {/* SECTION 4: Resume Upload */}
      <SectionTitle>Resume Upload</SectionTitle>
      <div className="mb-8">
        <FileUpload
          onFileSelect={setResumeFile}
          value={resumeFile}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-5 border-t border-gray-100">
        {onCancel && (
          <Button type="button" variant="secondary" size="lg" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={loading}
        >
          Submit Application
        </Button>
      </div>
    </form>
  );
};

export default CandidateForm;
