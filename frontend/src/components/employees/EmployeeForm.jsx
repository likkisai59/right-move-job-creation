import React, { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Upload, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import Input from '../common/Input';
import Select from '../common/Select';
import SearchableSelect from '../common/SearchableSelect';
import Button from '../common/Button';
import { 
  EMPLOYEE_STATUS_OPTIONS, 
  EMPLOYEE_GENDER_OPTIONS,
  EMPLOYEE_BLOOD_GROUP_OPTIONS,
  COUNTRY_CODES,
  EMPLOYEE_BUSINESS_UNIT_OPTIONS,
  EMPLOYEE_WORK_MODE_OPTIONS,
  EMPLOYEE_COMPLIANCE_OPTIONS,
  EMPLOYEE_YES_NO_OPTIONS
} from '../../utils/constants';
import { fetchDesignations } from '../../api/designationsApi';
import { uploadEmployeeFile } from '../../api/employeesApi';

const SectionTitle = ({ children }) => (
  <div className="mb-5">
    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-gray-100 pb-2.5">
      {children}
    </h3>
  </div>
);

const FormFileUpload = ({ label, required, value, onChange, error }) => {
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState('');
  const [localError, setLocalError] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (value) {
      // Extract filename from URL path if it exists
      const parts = value.split('/');
      const rawName = parts[parts.length - 1];
      // Remove the unique timestamp prefix (e.g. 1779372207_)
      const cleanName = rawName.replace(/^\d+_(.*)$/, '$1');
      setFileName(cleanName);
    } else {
      setFileName('');
    }
  }, [value]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setLocalError('File size must not exceed 5MB.');
      return;
    }

    setUploading(true);
    setLocalError('');
    try {
      const res = await uploadEmployeeFile(file);
      if (res.success && res.data?.url) {
        onChange(res.data.url);
        setFileName(file.name);
      } else {
        setLocalError('Upload failed.');
      }
    } catch (err) {
      console.error(err);
      setLocalError('Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    onChange('');
    setFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      <div 
        onClick={() => !uploading && !value && fileInputRef.current?.click()}
        className={`relative flex items-center justify-between p-3 rounded-xl border border-dashed transition-all duration-200 min-h-[48px] ${
          value 
            ? 'border-emerald-300 bg-emerald-50/50' 
            : uploading 
              ? 'border-blue-300 bg-blue-50/30' 
              : 'border-gray-300 bg-gray-50 hover:bg-gray-100/70 cursor-pointer'
        }`}
      >
        <input 
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
          accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
        />

        <div className="flex items-center gap-2.5 overflow-hidden flex-1 mr-2">
          {uploading ? (
            <Loader2 size={16} className="text-blue-500 animate-spin flex-shrink-0" />
          ) : value ? (
            <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
          ) : (
            <Upload size={16} className="text-gray-400 flex-shrink-0" />
          )}

          <span className={`text-sm truncate ${value ? 'text-emerald-700 font-medium' : uploading ? 'text-blue-600' : 'text-gray-500'}`}>
            {uploading ? 'Uploading document...' : value ? (fileName || 'Document Uploaded ✓') : 'Choose document proof'}
          </span>
        </div>

        {value && (
          <button 
            type="button"
            onClick={handleRemove}
            className="text-xs font-semibold text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded transition-colors"
          >
            Remove
          </button>
        )}
      </div>

      {(error || localError) && (
        <span className="text-xs text-red-500 flex items-center gap-1">
          <AlertCircle size={12} />
          {error || localError}
        </span>
      )}
    </div>
  );
};

const EmployeeForm = ({ initialData, onSubmit, onCancel, isSubmitting }) => {
  const isEditing = !!initialData;

  const [designations, setDesignations] = useState([]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    control,
    formState: { errors }
  } = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      bloodGroup: '',
      gender: '',
      countryCode: '+91',
      contactNumber: '',
      email: '',
      permanentAddress: '',
      currentAddress: '',
      designation: '',
      dateOfJoining: '',
      package: '',
      status: 'Active',
      lastWorkingDate: '',
      
      // New fields
      dateOfBirth: '',
      contactNumberOffice: '',
      emergencyContactNumber: '',
      aadharNumber: '',
      aadharUrl: '',
      panNumber: '',
      panUrl: '',
      marksheet10thUrl: '',
      marksheet12thUrl: '',
      marksheetGraduationUrl: '',
      presentAddressProofUrl: '',
      permanentAddressProofUrl: '',
      photoUrl: '',
      medicalCondition: '',
      resumeUrl: '',
      salarySlipsUrl: '',
      offerLetterUrl: '',
      lastCompanyName: '',
      
      // Bank Details
      bankName: '',
      bankAccountNumber: '',
      bankIfscCode: '',
      
      // Reporting & Compliance Details
      assignedBusinessUnit: '',
      reportingTo: '',
      workMode: '',
      ctc: '',
      compliance: '',

      // Asset & System Configuration Details
      systemAssigned: '',
      simCardAssigned: '',
      emailIdConfigured: '',
      linkedinConfigured: '',
      googleSheetConfigured: '',
      whatsappBusinessConfigured: '',
      ...initialData
    }
  });

  // Fetch active designations and format for select options
  useEffect(() => {
    const loadDesignations = async () => {
      try {
        const res = await fetchDesignations({ active_only: true });
        if (res.success) {
          let options = res.data.map(des => ({
            value: des.name,
            label: des.name
          }));

          if (initialData?.designation) {
            const hasCurrent = options.some(opt => opt.value === initialData.designation);
            if (!hasCurrent) {
              options.push({
                value: initialData.designation,
                label: `${initialData.designation} (Inactive)`
              });
            }
          }

          setDesignations(options);
        }
      } catch (err) {
        console.error('Failed to load designations for form:', err);
      }
    };

    loadDesignations();
  }, [initialData]);

  // Format dates correctly for input type="date" if initialData is passed
  useEffect(() => {
    if (initialData) {
      const formattedData = { ...initialData };
      if (formattedData.dateOfJoining && formattedData.dateOfJoining.includes('T')) {
        formattedData.dateOfJoining = formattedData.dateOfJoining.split('T')[0];
      }
      if (formattedData.lastWorkingDate && formattedData.lastWorkingDate.includes('T')) {
        formattedData.lastWorkingDate = formattedData.lastWorkingDate.split('T')[0];
      }
      if (formattedData.dateOfBirth && formattedData.dateOfBirth.includes('T')) {
        formattedData.dateOfBirth = formattedData.dateOfBirth.split('T')[0];
      }
      reset(formattedData);
    }
  }, [initialData, reset]);

  const currentStatus = watch('status');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
      
      <SectionTitle>Personal Details</SectionTitle>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 mb-8">
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

        <Select
          label="Gender"
          options={EMPLOYEE_GENDER_OPTIONS}
          required
          error={errors.gender?.message}
          {...register('gender', { required: 'Gender is required' })}
        />

        <Select
          label="Blood Group"
          options={EMPLOYEE_BLOOD_GROUP_OPTIONS}
          {...register('bloodGroup')}
        />

        <Input
          label="Date of Birth"
          type="date"
          required
          error={errors.dateOfBirth?.message}
          {...register('dateOfBirth', { required: 'Date of birth is required' })}
        />

        <Input
          label="Email Address"
          type="email"
          placeholder="e.g. john.doe@example.com"
          {...register('email')}
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">Contact Number (Personal) <span className="text-red-500">*</span></label>
          <div className="flex gap-2">
            <div className="w-28">
              <Select
                options={COUNTRY_CODES}
                {...register('countryCode')}
              />
            </div>
            <div className="flex-1">
              <Input
                type="tel"
                placeholder="Enter personal phone number"
                error={errors.contactNumber?.message}
                {...register('contactNumber', { required: 'Personal contact number is required' })}
              />
            </div>
          </div>
        </div>

        <Input
          label="Contact Number (Office)"
          type="tel"
          placeholder="Enter office phone number"
          required
          error={errors.contactNumberOffice?.message}
          {...register('contactNumberOffice', { required: 'Office contact number is required' })}
        />

        <Input
          label="Emergency Contact Number (Office)"
          type="tel"
          placeholder="Enter emergency contact number"
          required
          error={errors.emergencyContactNumber?.message}
          {...register('emergencyContactNumber', { required: 'Emergency contact number is required' })}
        />

        <Input
          label="Medical Condition (If Any)"
          placeholder="e.g. Asthma, Diabetes (Optional)"
          {...register('medicalCondition')}
        />

        {/* --- Address & Upload --- */}
        <Input
          label="Present Address"
          placeholder="Enter present address"
          required
          error={errors.currentAddress?.message}
          {...register('currentAddress', { required: 'Present address is required' })}
        />

        <Controller
          name="presentAddressProofUrl"
          control={control}
          rules={{ required: 'Present address proof upload is required' }}
          render={({ field }) => (
            <FormFileUpload
              label="Present Address Proof (Upload)"
              required
              value={field.value}
              onChange={field.onChange}
              error={errors.presentAddressProofUrl?.message}
            />
          )}
        />

        <Input
          label="Permanent Address"
          placeholder="Enter permanent address"
          required
          error={errors.permanentAddress?.message}
          {...register('permanentAddress', { required: 'Permanent address is required' })}
        />

        <Controller
          name="permanentAddressProofUrl"
          control={control}
          rules={{ required: 'Permanent address proof upload is required' }}
          render={({ field }) => (
            <FormFileUpload
              label="Permanent Address Proof (Upload)"
              required
              value={field.value}
              onChange={field.onChange}
              error={errors.permanentAddressProofUrl?.message}
            />
          )}
        />

        {/* --- Identity Docs & Upload --- */}
        <Input
          label="Aadhar Card Number"
          placeholder="Enter 12-digit Aadhar number"
          required
          error={errors.aadharNumber?.message}
          {...register('aadharNumber', { 
            required: 'Aadhar number is required',
            pattern: { value: /^\d{12}$/, message: 'Aadhar number must be exactly 12 digits' }
          })}
        />

        <Controller
          name="aadharUrl"
          control={control}
          rules={{ required: 'Aadhar card upload is required' }}
          render={({ field }) => (
            <FormFileUpload
              label="Aadhar Card (Upload PDF/Image)"
              required
              value={field.value}
              onChange={field.onChange}
              error={errors.aadharUrl?.message}
            />
          )}
        />

        <Input
          label="PAN Card Number"
          placeholder="Enter 10-character PAN number"
          required
          error={errors.panNumber?.message}
          {...register('panNumber', { 
            required: 'PAN number is required',
            pattern: { value: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i, message: 'Invalid PAN card format' }
          })}
        />

        <Controller
          name="panUrl"
          control={control}
          rules={{ required: 'PAN card upload is required' }}
          render={({ field }) => (
            <FormFileUpload
              label="PAN Card (Upload PDF/Image)"
              required
              value={field.value}
              onChange={field.onChange}
              error={errors.panUrl?.message}
            />
          )}
        />

        {/* --- Marksheets & Photo --- */}
        <Controller
          name="marksheet10thUrl"
          control={control}
          rules={{ required: '10th Marksheet upload is required' }}
          render={({ field }) => (
            <FormFileUpload
              label="10th Marksheet (Upload PDF/Image)"
              required
              value={field.value}
              onChange={field.onChange}
              error={errors.marksheet10thUrl?.message}
            />
          )}
        />

        <Controller
          name="marksheet12thUrl"
          control={control}
          rules={{ required: '12th Marksheet upload is required' }}
          render={({ field }) => (
            <FormFileUpload
              label="12th Marksheet (Upload PDF/Image)"
              required
              value={field.value}
              onChange={field.onChange}
              error={errors.marksheet12thUrl?.message}
            />
          )}
        />

        <Controller
          name="marksheetGraduationUrl"
          control={control}
          rules={{ required: 'Graduation Marksheet upload is required' }}
          render={({ field }) => (
            <FormFileUpload
              label="Graduation Marksheet (Upload PDF/Image)"
              required
              value={field.value}
              onChange={field.onChange}
              error={errors.marksheetGraduationUrl?.message}
            />
          )}
        />

        <Controller
          name="photoUrl"
          control={control}
          rules={{ required: 'Front facing photo is required' }}
          render={({ field }) => (
            <FormFileUpload
              label="Front facing Photo (Upload Image)"
              required
              value={field.value}
              onChange={field.onChange}
              error={errors.photoUrl?.message}
            />
          )}
        />
      </div>

      <SectionTitle>Employment Details</SectionTitle>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 mb-8">
        <Input
          label="Annual Package (LPA)"
          type="number"
          step="0.01"
          placeholder="e.g. 12"
          {...register('package')}
        />

        <Input
          label="Date of Joining"
          type="date"
          required
          error={errors.dateOfJoining?.message}
          {...register('dateOfJoining', { required: 'Date of joining is required' })}
        />

        <Select
          label="Status"
          options={EMPLOYEE_STATUS_OPTIONS}
          {...register('status')}
        />

         {currentStatus === 'Inactive' && (
          <div className="animate-slide-up">
            <Input
              label="Last Working Date"
              type="date"
              required={currentStatus === 'Inactive'}
              error={errors.lastWorkingDate?.message}
              {...register('lastWorkingDate', { 
                required: currentStatus === 'Inactive' ? 'Last working date is required for inactive employees' : false 
              })}
            />
          </div>
        )}

        {/* New employment verification fields */}
        <Input
          label="Last Company Name"
          placeholder="Enter last company name"
          {...register('lastCompanyName')}
        />

        <Controller
          name="resumeUrl"
          control={control}
          rules={{ required: 'Resume upload is required' }}
          render={({ field }) => (
            <FormFileUpload
              label="Resume"
              required
              value={field.value}
              onChange={field.onChange}
              error={errors.resumeUrl?.message}
            />
          )}
        />

        <Controller
          name="salarySlipsUrl"
          control={control}
          render={({ field }) => (
            <FormFileUpload
              label="Salary Slips - Last three (Upload)"
              value={field.value}
              onChange={field.onChange}
              error={errors.salarySlipsUrl?.message}
            />
          )}
        />

        <Controller
          name="offerLetterUrl"
          control={control}
          render={({ field }) => (
            <FormFileUpload
              label="Last Employment Offer Letter (Upload)"
              value={field.value}
              onChange={field.onChange}
              error={errors.offerLetterUrl?.message}
            />
          )}
        />
      </div>

      <SectionTitle>Reporting Details</SectionTitle>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 mb-8">
        <Controller
          name="designation"
          control={control}
          rules={{ required: 'Designation is required' }}
          render={({ field }) => (
            <SearchableSelect
              label="Designation"
              options={designations}
              required
              error={errors.designation?.message}
              value={field.value}
              onChange={field.onChange}
              placeholder="Select designation"
              showSearch={false}
              maxHeight={200}
            />
          )}
        />

        <Select
          label="Assigned Business Unit"
          options={EMPLOYEE_BUSINESS_UNIT_OPTIONS}
          required
          error={errors.assignedBusinessUnit?.message}
          {...register('assignedBusinessUnit', { required: 'Assigned business unit is required' })}
        />

        <Input
          label="Reporting To (Manager Name)"
          placeholder="Enter manager name"
          required
          error={errors.reportingTo?.message}
          {...register('reportingTo', { required: 'Reporting manager name is required' })}
        />

        <Select
          label="Work Mode"
          options={EMPLOYEE_WORK_MODE_OPTIONS}
          required
          error={errors.workMode?.message}
          {...register('workMode', { required: 'Work mode is required' })}
        />

        <Input
          label="CTC"
          type="number"
          step="0.01"
          placeholder="Enter CTC"
          required
          error={errors.ctc?.message}
          {...register('ctc', { required: 'CTC is required' })}
        />

        <Select
          label="Compliance"
          options={EMPLOYEE_COMPLIANCE_OPTIONS}
          required
          error={errors.compliance?.message}
          {...register('compliance', { required: 'Compliance option is required' })}
        />
      </div>

      <SectionTitle>Bank Details</SectionTitle>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 mb-8">
        <Input
          label="Bank Name"
          placeholder="Enter bank name"
          required
          error={errors.bankName?.message}
          {...register('bankName', { required: 'Bank name is required' })}
        />
        
        <Input
          label="Bank Account Number"
          placeholder="Enter bank account number"
          required
          error={errors.bankAccountNumber?.message}
          {...register('bankAccountNumber', { required: 'Bank account number is required' })}
        />

        <Input
          label="Bank IFSC Code"
          placeholder="Enter bank IFSC code"
          required
          error={errors.bankIfscCode?.message}
          {...register('bankIfscCode', { 
            required: 'Bank IFSC code is required',
            pattern: { 
              value: /^[A-Z]{4}0[A-Z0-9]{6}$/i, 
              message: 'Invalid IFSC code format (e.g. SBIN0001234)' 
            }
          })}
        />
      </div>

      <SectionTitle>Asset & System Configuration</SectionTitle>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 mb-8">
        <Select
          label="System Assigned"
          options={EMPLOYEE_YES_NO_OPTIONS}
          required
          error={errors.systemAssigned?.message}
          {...register('systemAssigned', { required: 'System assignment status is required' })}
        />

        <Select
          label="SIM Card Assigned"
          options={EMPLOYEE_YES_NO_OPTIONS}
          required
          error={errors.simCardAssigned?.message}
          {...register('simCardAssigned', { required: 'SIM card assignment status is required' })}
        />

        <Select
          label="Email ID Configured"
          options={EMPLOYEE_YES_NO_OPTIONS}
          required
          error={errors.emailIdConfigured?.message}
          {...register('emailIdConfigured', { required: 'Email configuration status is required' })}
        />

        <Select
          label="LinkedIn Configured"
          options={EMPLOYEE_YES_NO_OPTIONS}
          required
          error={errors.linkedinConfigured?.message}
          {...register('linkedinConfigured', { required: 'LinkedIn configuration status is required' })}
        />

        <Select
          label="Google Sheet Configured"
          options={EMPLOYEE_YES_NO_OPTIONS}
          required
          error={errors.googleSheetConfigured?.message}
          {...register('googleSheetConfigured', { required: 'Google Sheet configuration status is required' })}
        />

        <Select
          label="Whatsapp Business Configuration"
          options={EMPLOYEE_YES_NO_OPTIONS}
          required
          error={errors.whatsappBusinessConfigured?.message}
          {...register('whatsappBusinessConfigured', { required: 'Whatsapp Business configuration status is required' })}
        />
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 mt-8">
        <Button 
          type="button" 
          variant="secondary" 
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          variant="primary" 
          loading={isSubmitting}
          disabled={isSubmitting}
        >
          {isEditing ? 'Save Changes' : 'Save Employee'}
        </Button>
      </div>

    </form>
  );
};

export default EmployeeForm;
