import React, { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import { fetchEmployees } from '../../api/employeesApi';
import { fetchOrganizations } from '../../api/organizationsApi';
import { uploadJobDescription } from '../../api/jobsApi';
import { NOTICE_PERIODS, EDUCATION_OPTIONS, JOB_SHIFTS } from '../../utils/constants';
import { fetchBusinessUnits } from '../../api/businessUnitsApi';
import { fetchWorkModes } from '../../api/workModesApi';
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
      businessUnit: 'IT',
      externalSpoc: '',
      externalSpocEmailId: '',
      requirements: [{ job_title: '', budget: '', experience: '', number_of_open_positions: '', min_experience: 0, max_experience: 10, location: '', required_skills: '', status: 'ACTIVE', mandatorySkill: '', noticePeriod: '', qualification: '', shifts: '', workMode: '', jobDescription: '' }],
      assignedTo: '',
    },
  });

  const [organizations, setOrganizations] = React.useState([]);
  const [businessUnits, setBusinessUnits] = React.useState([]);
  const [workModes, setWorkModes] = React.useState([]);
  const [recruiters, setRecruiters] = React.useState([]);

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

  useEffect(() => {
    const loadBUsAndWorkModes = async () => {
      try {
        const buRes = await fetchBusinessUnits({ active_only: true });
        if (buRes.success) {
          let options = buRes.data.map(bu => ({ value: bu.name, label: bu.name }));
          if (defaultValues?.businessUnit) {
            const hasCurrent = options.some(opt => opt.value === defaultValues.businessUnit);
            if (!hasCurrent) {
              options.push({
                value: defaultValues.businessUnit,
                label: `${defaultValues.businessUnit} (Inactive)`
              });
            }
          }
          setBusinessUnits(options);
        }

        const wmRes = await fetchWorkModes({ active_only: true });
        if (wmRes.success) {
          let options = wmRes.data.map(wm => ({ value: wm.name, label: wm.name }));
          if (defaultValues?.requirements) {
            defaultValues.requirements.forEach(req => {
              if (req.workMode) {
                const hasCurrent = options.some(opt => opt.value === req.workMode);
                if (!hasCurrent) {
                  options.push({
                    value: req.workMode,
                    label: `${req.workMode} (Inactive)`
                  });
                }
              }
            });
          }
          setWorkModes(options);
        }
      } catch (err) {
        console.error('Failed to load business units or work modes for job form:', err);
      }
    };
    loadBUsAndWorkModes();
  }, [defaultValues]);

  useEffect(() => {
    const loadRecruiters = async () => {
      try {
        const res = await fetchEmployees({ status: 'Active' });
        if (res && res.data) {
          const allowedAssignees = res.data.filter(emp => {
            if (!emp.designation) return false;
            const norm = emp.designation.toLowerCase().trim().replace(/[\s\.-]+/g, '');
            return ['atl', 'seniorexecutive', 'executive', 'trainee', 'intern'].includes(norm);
          });
          setRecruiters(allowedAssignees.map(emp => ({
            value: `${emp.firstName} ${emp.lastName}`.trim(),
            label: `${emp.firstName} ${emp.lastName}`.trim()
          })));
        }
      } catch (err) {
        console.error('Failed to load recruiters:', err);
      }
    };
    loadRecruiters();
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
      reset({
        ...defaultValues,
        assignedTo: defaultValues.assignedTo || ''
      });
    }
  }, [defaultValues, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
        {/* Date */}
        <Input
          label="Requisition Open Date"
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

        {/* Business Unit */}
        <Select
          label="Business Unit"
          required
          options={businessUnits}
          error={errors.businessUnit?.message}
          {...register('businessUnit', { required: 'Business unit is required' })}
        />

        {/* Recruiter */}
        <Select
          label="Assign Owner"
          placeholder="Select Owner"
          required
          options={recruiters}
          error={errors.assignedTo?.message}
          {...register('assignedTo', {
            required: 'Please select an owner',
          })}
        />

        {/* External SPOC */}
        <Input
          label="External SPOC"
          placeholder="Enter External SPOC Name"
          error={errors.externalSpoc?.message}
          {...register('externalSpoc')}
        />

        {/* External SPOC Email */}
        <Input
          label="External SPOC Email ID"
          type="email"
          placeholder="e.g. spoc@company.com"
          error={errors.externalSpocEmailId?.message}
          {...register('externalSpocEmailId', {
            pattern: {
              value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
              message: 'Invalid email format'
            }
          })}
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
            onClick={() => append({ job_title: '', budget: '', experience: '', number_of_open_positions: '', status: 'ACTIVE', mandatorySkill: '', noticePeriod: '', qualification: '', shifts: '', workMode: '', jobDescription: '' })}
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
                  label="Number of Open Positions"
                  type="number"
                  placeholder="e.g. 10"
                  required
                  error={errors.requirements?.[index]?.number_of_open_positions?.message}
                  {...register(`requirements.${index}.number_of_open_positions`, {
                    required: 'Required',
                    min: { value: 1, message: 'Min 1' }
                  })}
                />

                {/* Status */}
                <Select
                  label="Status"
                  options={JOB_STATUS_OPTIONS}
                  {...register(`requirements.${index}.status`)}
                />

                {/* Mandatory Skill */}
                <Input
                  label="Mandatory Skill"
                  placeholder="e.g. React, Python"
                  required
                  error={errors.requirements?.[index]?.mandatorySkill?.message}
                  {...register(`requirements.${index}.mandatorySkill`, { required: 'Mandatory skill is required' })}
                />

                {/* Notice Period */}
                <Select
                  label="Notice Period"
                  placeholder="Select Notice Period"
                  options={NOTICE_PERIODS}
                  {...register(`requirements.${index}.noticePeriod`)}
                />

                {/* Qualification */}
                <Select
                  label="Qualification"
                  placeholder="Select Qualification"
                  options={EDUCATION_OPTIONS}
                  {...register(`requirements.${index}.qualification`)}
                />

                {/* Shifts */}
                <Select
                  label="Shifts"
                  placeholder="Select Shift"
                  options={JOB_SHIFTS}
                  {...register(`requirements.${index}.shifts`)}
                />

                {/* Work Mode */}
                <Select
                  label="Work Mode"
                  placeholder="Select Work Mode"
                  options={workModes}
                  {...register(`requirements.${index}.workMode`)}
                />

                {/* Job Description Upload */}
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">Job Description (Upload)</label>
                  <input
                    type="file"
                    className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    onChange={async (e) => {
                      if (e.target.files && e.target.files[0]) {
                        try {
                          const res = await uploadJobDescription(e.target.files[0]);
                          setValue(`requirements.${index}.jobDescription`, res.data.file_url, { shouldValidate: true });
                          alert('Job description uploaded successfully!');
                        } catch (err) {
                          alert('Failed to upload job description.');
                          console.error(err);
                        }
                      }
                    }}
                  />
                  <input type="hidden" {...register(`requirements.${index}.jobDescription`)} />
                  {watch(`requirements.${index}.jobDescription`) && (
                    <a href={`http://localhost:8000${watch(`requirements.${index}.jobDescription`)}`} target="_blank" rel="noreferrer" className="text-xs text-blue-600 underline mt-1">
                      View Uploaded File
                    </a>
                  )}
                </div>

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

