import React, { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import { mockRecruiters } from '../../utils/mockData';
import { fetchOrganizations } from '../../api/organizationsApi';
import SearchableSelect from '../common/SearchableSelect';



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
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: defaultValues || {
      date: '',
      organizationId: '',
      companyName: '',
      businessCategory: 'IT',
      mandatorySkill: '',
      requirements: [{ job_title: '', budget: '', experience: '', num_candidates: '', min_experience: 0, max_experience: 10, location: '', required_skills: '' }],
      assignedTo: '',
      status: 'ACTIVE',
    },
  });

  const [organizations, setOrganizations] = React.useState([]);

  useEffect(() => {
    const loadOrgs = async () => {
      try {
        const response = await fetchOrganizations();
        setOrganizations(response.data || []);
      } catch (err) {
        console.error('Failed to load orgs', err);
      }
    };
    loadOrgs();
  }, []);

  const handleOrgChange = (e) => {
    const orgId = Number(e.target.value);
    const org = organizations.find(o => o.id === orgId);
    if (org) {
      // Set the hidden fallback string
      import('react-hook-form').then(m => m.useFormContext?.().setValue('companyName', org.name));
    }
  };

  const orgOptions = [
    { value: '', label: 'Select Organization' },
    ...organizations.map(o => ({ value: o.id, label: o.organization_name }))
  ];

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

        {/* Organization Name */}
        {/* <Select
          label="Organization"
          required
          options={orgOptions}
          error={errors.organizationId?.message}
          {...register('organizationId', {
            required: 'Organization is required',
            onChange: (e) => {
              const orgId = Number(e.target.value);
              const org = organizations.find(o => o.id === orgId);
              if (org) {
                setValue('companyName', org.organization_name, { shouldValidate: true });
              }
            }
          })}
        /> */}

        {/* Organization Name */}
        <SearchableSelect
          label="Organization"
          required
          placeholder="Select Organization"
          options={organizations.map(o => ({ value: o.id, label: o.organization_name }))}
          value={watch('organizationId')}
          onChange={(val) => {
            setValue('organizationId', val, { shouldValidate: true });
            const org = organizations.find(o => o.id === Number(val));
            if (org) {
              setValue('companyName', org.organization_name, { shouldValidate: true });
            } else {
              setValue('companyName', '', { shouldValidate: true });
            }
          }}
          error={errors.organizationId?.message}
        />
        <input type="hidden" {...register('organizationId', { required: 'Organization is required' })} />
        <input type="hidden" {...register('companyName', { required: 'Company name is required' })} />

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

        {/* Mandatory Skill */}
        <Input
          label="Mandatory Skill"
          placeholder="e.g. React, Python"
          required
          error={errors.mandatorySkill?.message}
          {...register('mandatorySkill', { required: 'Mandatory skill is required' })}
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

                {/* Matching Criteria Section */}
                <div className="md:col-span-2 mt-2 pt-2 border-t border-gray-100">
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Matching Criteria</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                    <Input
                      label="Min Exp (Years)"
                      type="number"
                      placeholder="0"
                      {...register(`requirements.${index}.min_experience`)}
                    />
                    <Input
                      label="Max Exp (Years)"
                      type="number"
                      placeholder="10"
                      {...register(`requirements.${index}.max_experience`)}
                    />
                    <Input
                      label="Job Location"
                      placeholder="e.g. Bangalore"
                      {...register(`requirements.${index}.location`)}
                    />
                    <Input
                      label="Required Skills"
                      placeholder="e.g. React, Node.js"
                      {...register(`requirements.${index}.required_skills`)}
                    />
                  </div>
                </div>
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

