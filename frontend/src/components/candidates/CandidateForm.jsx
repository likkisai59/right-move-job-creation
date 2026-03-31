import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import FileUpload from '../common/FileUpload';
import SkillsInput from './SkillsInput';
import { NOTICE_PERIODS, EXPERIENCE_OPTIONS, EDUCATION_OPTIONS, COUNTRY_CODES } from '../../utils/constants';

const SectionTitle = ({ children }) => (
  <div className="mb-5">
    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-gray-100 pb-2.5">
      {children}
    </h3>
  </div>
);

const DEFAULT_FORM_VALUES = {
  id: '',
  firstName: '',
  lastName: '',
  countryCode: '+91',
  businessCategory: 'IT',
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
  skills_draft: '', // Track unsaved skill text
};

const CandidateForm = ({ defaultValues, onSubmit, onCancel, loading = false }) => {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
    setValue,
    getValues,
    watch,
  } = useForm({
    defaultValues: { ...DEFAULT_FORM_VALUES, ...defaultValues },
  });

  const [resumeFile, setResumeFile] = useState(null);

  useEffect(() => {
    if (defaultValues) {
      reset({ ...DEFAULT_FORM_VALUES, ...defaultValues });
    }
  }, [defaultValues, reset]);

  const handleFormSubmit = (data) => {
    // Collect final skills: existing chips + any unsaved draft text
    const finalSkills = [...(data.skills || [])];
    const draftText = data.skills_draft?.trim();

    if (draftText) {
      // Support comma-separated draft text if any
      const splitDraft = draftText.split(',').map(s => s.trim()).filter(Boolean);
      splitDraft.forEach(skill => {
        if (!finalSkills.includes(skill)) {
          finalSkills.push(skill);
        }
      });
    }

    // Pass the finalized data upward
    const submissionData = { ...data, skills: finalSkills };
    delete submissionData.skills_draft; // Clean up the helper field
    
    onSubmit({ ...submissionData, resumeFile });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} noValidate>
      {/* SECTION 1: Personal Details */}
      <SectionTitle>Personal Details</SectionTitle>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
        <Input
          label="First Name"
          placeholder="Enter first name"
          required
          error={errors.firstName?.message}
          {...register('firstName', { required: 'First name is required' })}
        />
        <Input
          label="Last Name"
          placeholder="Enter last name"
          required
          error={errors.lastName?.message}
          {...register('lastName', { required: 'Last name is required' })}
        />
        
        <Input
          label="Candidate ID"
          placeholder="Generating..."
          readOnly
          error={errors.id?.message}
          {...register('id')}
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
            Phone Number <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            <div className="w-28">
              <Select
                options={COUNTRY_CODES}
                error={errors.countryCode?.message}
                {...register('countryCode', { required: true })}
              />
            </div>
            <div className="flex-1">
              <Input
                type="tel"
                placeholder="Enter phone number"
                error={errors.phone?.message}
                {...register('phone', {
                  required: 'Phone number is required',
                  pattern: {
                    value: /^[0-9]{8,15}$/,
                    message: 'Enter 8-15 digits',
                  },
                })}
              />
            </div>
          </div>
        </div>

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
              validate: (val) => {
                const draft = getValues('skills_draft')?.trim();
                return (val && val.length > 0) || (draft && draft.length > 0) || 'At least one skill is required';
              }
            }}
            render={({ field }) => (
              <SkillsInput
                value={field.value || []}
                onChange={field.onChange}
                draftValue={watch('skills_draft')}
                onDraftChange={(val) => setValue('skills_draft', val, { shouldValidate: true })}
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
