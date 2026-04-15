import React, { useState, useEffect } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import FileUpload from '../common/FileUpload';
import SkillsInput from './SkillsInput';
import { fetchJobs } from '../../api/jobsApi';
import { NOTICE_PERIODS, EXPERIENCE_OPTIONS, EDUCATION_OPTIONS, COUNTRY_CODES } from '../../utils/constants';
import { checkDuplicateCandidate } from '../../api/candidatesApi';
import { AlertTriangle } from 'lucide-react';


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
  skills_draft: '',
  mappedJobId: '',
  relevantExperienceBySkill: [],
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
    setError,
  } = useForm({
    defaultValues: { ...DEFAULT_FORM_VALUES, ...defaultValues },
    mode: 'onChange',
  });

  const { fields: expFields, append: appendExp, remove: removeExp } = useFieldArray({
    control,
    name: 'relevantExperienceBySkill',
  });

  const [resumeFile, setResumeFile] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [warnings, setWarnings] = useState({ name: false, phone: false, email: false });
  const selectedCategory = watch('businessCategory');
  const totalExperience = watch('totalExperience');

  // Fresher logic: Clear relevant experience if total experience is changed to 'fresher'
  useEffect(() => {
    if (totalExperience === 'fresher') {
      setValue('relevantExperience', '0');
      setValue('relevantExperienceBySkill', []);
    }
  }, [totalExperience, setValue]);


  useEffect(() => {
    if (defaultValues) {
      reset({ ...DEFAULT_FORM_VALUES, ...defaultValues });
      setWarnings({ name: false, phone: false, email: false }); // Reset warnings on form reset
    }
  }, [defaultValues, reset]);


  useEffect(() => {
    const loadJobs = async () => {
      try {
        const { data } = await fetchJobs({ businessCategory: selectedCategory });
        setJobs(data);
      } catch (err) {
        console.error('Failed to load jobs', err);
      }
    };
    loadJobs();
  }, [selectedCategory]);

  const jobOptions = [
    { value: '', label: 'Select mapped job (Optional)' },
    ...jobs.map(j => ({ value: j.id, label: `${j.jobCode} | ${j.companyName} | ${j.jobTitle}` }))
  ];
  
  const handleCheckDuplicates = async (field) => {
    const values = getValues();
    const params = {};
    
    if (field === 'name') {
      const fullName = `${values.firstName || ''} ${values.lastName || ''}`.trim();
      if (!fullName) {
        setWarnings(prev => ({ ...prev, name: false }));
        return;
      }
      params.full_name = fullName;
    } else if (field === 'phone') {
      if (!values.phone) {
        setWarnings(prev => ({ ...prev, phone: false }));
        return;
      }
      params.phone_number = values.phone;
    } else if (field === 'email') {
      if (!values.email) {
        setWarnings(prev => ({ ...prev, email: false }));
        return;
      }
      params.email_address = values.email;
    }


    try {
      const results = await checkDuplicateCandidate(params);
      setWarnings(prev => ({
        ...prev,
        name: field === 'name' ? results.name_exists : prev.name,
        phone: field === 'phone' ? results.phone_exists : prev.phone,
        email: field === 'email' ? results.email_exists : prev.email,
      }));

      // Strict blocking for Email and Phone
      if (field === 'email' && results.email_exists) {
        setError('email', { type: 'manual', message: 'This email is already registered.' });
      }
      if (field === 'phone' && results.phone_exists) {
        setError('phone', { type: 'manual', message: 'This phone number is already registered.' });
      }
    } catch (err) {
      console.error('Duplicate check failed', err);
    }
  };


  const handleFormSubmit = (data) => {
    // Final check for strict duplicates
    if (warnings.email || warnings.phone) {
      if (warnings.email) setError('email', { type: 'manual', message: 'This email is already registered.' });
      if (warnings.phone) setError('phone', { type: 'manual', message: 'This phone number is already registered.' });
      return;
    }

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
      {/* SECTION 1: Job Mapping (New) */}
      <SectionTitle>Sourcing & Job Mapping</SectionTitle>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
        <Select
          label="Mapped Job Requirement"
          options={jobOptions}
          error={errors.mappedJobId?.message}
          {...register('mappedJobId')}
        />
      </div>

      {/* SECTION 2: Personal Details */}
      <SectionTitle>Personal Details</SectionTitle>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
        <Input
          label="First Name"
          placeholder="Enter first name"
          required
          error={errors.firstName?.message}
          {...register('firstName', { 
            required: 'First name is required',
            pattern: {
              value: /^[A-Za-z ]+$/,
              message: 'Name should contain only alphabets'
            },
            validate: value => value.trim().length > 0 || 'Name should contain only alphabets',
            onBlur: () => handleCheckDuplicates('name')
          })}
        />
        <div>
          <Input
            label="Last Name"
            placeholder="Enter last name"
            required
            error={errors.lastName?.message}
            {...register('lastName', { 
              required: 'Last name is required',
              pattern: {
                value: /^[A-Za-z ]+$/,
                message: 'Name should contain only alphabets'
              },
              validate: value => value.trim().length > 0 || 'Name should contain only alphabets',
              onBlur: () => handleCheckDuplicates('name')
            })}
          />
          {warnings.name && (
            <div className="mt-1.5 flex items-center gap-1.5 text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100 animate-pulse">
              <AlertTriangle size={14} />
              <span className="text-[11px] font-medium leading-none">A candidate with a similar name already exists. Please verify.</span>
            </div>
          )}
        </div>
        
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
                  onBlur: () => handleCheckDuplicates('phone')
                })}
              />
              {warnings.phone && !errors.phone && (
                <div className="mt-1.5 flex items-center gap-1.5 text-red-600 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100">
                  <AlertTriangle size={14} />
                  <span className="text-[11px] font-medium leading-none">This phone number is already registered.</span>
                </div>
              )}
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

        <div className="flex flex-col">
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
              onBlur: () => handleCheckDuplicates('email')
            })}
          />
          {warnings.email && !errors.email && (
            <div className="mt-1.5 flex items-center gap-1.5 text-red-600 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100">
              <AlertTriangle size={14} />
              <span className="text-[11px] font-medium leading-none">This email is already registered.</span>
            </div>
          )}
        </div>
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
          disabled={totalExperience === 'fresher'}
          error={errors.relevantExperience?.message}
          {...register('relevantExperience', {
            validate: value => {
              if (totalExperience === 'fresher' && parseFloat(value) > 0) {
                return 'Freshers cannot have relevant experience';
              }
              return true;
            },
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
      </div>

      {/* SECTION 3: Relevant Experience by Skill (New) */}
      <SectionTitle>Relevant Experience by Skill (Optional)</SectionTitle>
      <div className={`mb-8 ${totalExperience === 'fresher' ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">Add detailed experience for specific tools or skills.</p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => appendExp({ skill: '', experience: '' })}
            icon={Plus}
            disabled={totalExperience === 'fresher'}
          >
            Add Skill
          </Button>
        </div>
        <div className="space-y-4">
          {expFields.map((field, index) => (
            <div key={field.id} className="p-5 bg-gray-50 rounded-xl border border-gray-200 relative flex flex-col md:flex-row gap-4 items-start md:items-center">
              <div className="flex-1 w-full">
                <Input
                  label="Skill / Technology"
                  placeholder="e.g. React"
                  required
                  error={errors.relevantExperienceBySkill?.[index]?.skill?.message}
                  {...register(`relevantExperienceBySkill.${index}.skill`, { required: 'Skill is required' })}
                />
              </div>
              <div className="flex-1 w-full">
                <Input
                  label="Experience (in years)"
                  type="number"
                  placeholder="e.g. 3"
                  required
                  error={errors.relevantExperienceBySkill?.[index]?.experience?.message}
                  {...register(`relevantExperienceBySkill.${index}.experience`, { 
                    required: 'Experience is required',
                    min: { value: 0, message: 'Must be 0 or greater' }
                  })}
                />
              </div>
              <button
                type="button"
                onClick={() => removeExp(index)}
                className="w-10 h-10 mt-6 shrink-0 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-all"
                title="Remove skill"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 4: Other Skills */}
      <div className="mb-8">
        <label className="text-sm font-medium text-gray-700 flex items-center gap-1 mb-1.5">
          Other Skills <span className="text-red-500">*</span>
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

      {/* SECTION 4: Compensation & Availability */}
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

      {/* SECTION 5: Resume Upload */}
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
