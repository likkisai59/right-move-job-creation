import React, { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Upload, CheckCircle2, Loader2, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import Input from '../common/Input';
import Select from '../common/Select';
import SearchableSelect from '../common/SearchableSelect';
import Button from '../common/Button';
import {
  EMPLOYEE_STATUS_OPTIONS,
  EMPLOYEE_GENDER_OPTIONS,
  EMPLOYEE_BLOOD_GROUP_OPTIONS,
  COUNTRY_CODES,
  EMPLOYEE_COMPLIANCE_OPTIONS,
  EMPLOYEE_YES_NO_OPTIONS
} from '../../utils/constants';
import { fetchDesignations } from '../../api/designationsApi';
import { fetchBusinessUnits } from '../../api/businessUnitsApi';
import { fetchWorkModes } from '../../api/workModesApi';
import { uploadEmployeeFile, fetchEmployees } from '../../api/employeesApi';
import { getCurrentUser } from '../../api/authApi';

const SectionTitle = ({ children }) => (
  <div className="mb-5">
    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-gray-100 pb-2.5">
      {children}
    </h3>
  </div>
);

const FormFileUpload = ({ label, required, value, onChange, error, disabled }) => {
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
    if (disabled) return;
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
    if (disabled) return;
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
        onClick={() => !disabled && !uploading && !value && fileInputRef.current?.click()}
        className={`relative flex items-center justify-between p-3 rounded-xl border border-dashed transition-all duration-200 min-h-[48px] ${value
          ? 'border-emerald-300 bg-emerald-50/50'
          : uploading
            ? 'border-blue-300 bg-blue-50/30'
            : disabled
              ? 'border-gray-200 bg-gray-50/50 cursor-not-allowed'
              : 'border-gray-300 bg-gray-50 hover:bg-gray-100/70 cursor-pointer'
          }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
          accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
          disabled={disabled}
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
            {uploading ? 'Uploading document...' : value ? (fileName || 'Document Uploaded ✓') : disabled ? 'No document proof uploaded' : 'Choose document proof'}
          </span>
        </div>

        {value && !disabled && (
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

  const [step, setStep] = useState(1);
  const [designations, setDesignations] = useState([]);
  const [businessUnits, setBusinessUnits] = useState([]);
  const [workModes, setWorkModes] = useState([]);

  // Access check: Admin vs HR
  const currentUser = getCurrentUser();
  const userRoleOrDesignation = (currentUser?.role || '').toLowerCase();
  const isUserAdmin = userRoleOrDesignation === 'admin' || userRoleOrDesignation.includes('admin') || userRoleOrDesignation.includes('director');

  // Restrictions logic
  const isHrDisabled = isUserAdmin;
  const isAdminDisabled = !isUserAdmin;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    control,
    getValues,
    setValue,
    trigger,
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
      countrycodeOfficeContact: '+91',
      contactNumberOffice: '',
      countrycodeEmergencyContact: '+91',
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
      reportingDesignation: '',
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

  // Fetch active business units and format for select options
  useEffect(() => {
    const loadBusinessUnits = async () => {
      try {
        const res = await fetchBusinessUnits({ active_only: true });
        if (res.success) {
          let options = res.data.map(bu => ({
            value: bu.name,
            label: bu.name
          }));

          if (initialData?.assignedBusinessUnit) {
            const hasCurrent = options.some(opt => opt.value === initialData.assignedBusinessUnit);
            if (!hasCurrent) {
              options.push({
                value: initialData.assignedBusinessUnit,
                label: `${initialData.assignedBusinessUnit} (Inactive)`
              });
            }
          }

          setBusinessUnits(options);
        }
      } catch (err) {
        console.error('Failed to load business units for form:', err);
      }
    };

    loadBusinessUnits();
  }, [initialData]);

  // Fetch active work modes and format for select options
  useEffect(() => {
    const loadWorkModes = async () => {
      try {
        const res = await fetchWorkModes({ active_only: true });
        if (res.success) {
          let options = res.data.map(wm => ({
            value: wm.name,
            label: wm.name
          }));

          if (initialData?.workMode) {
            const hasCurrent = options.some(opt => opt.value === initialData.workMode);
            if (!hasCurrent) {
              options.push({
                value: initialData.workMode,
                label: `${initialData.workMode} (Inactive)`
              });
            }
          }

          setWorkModes(options);
        }
      } catch (err) {
        console.error('Failed to load work modes for form:', err);
      }
    };

    loadWorkModes();
  }, [initialData]);

  const [allEmployees, setAllEmployees] = useState([]);

  // Fetch all employees for reporting selection
  useEffect(() => {
    const loadAllEmployees = async () => {
      try {
        const res = await fetchEmployees();
        if (res.success) {
          setAllEmployees(res.data || []);
        }
      } catch (err) {
        console.error('Failed to fetch employees for reporting select:', err);
      }
    };
    loadAllEmployees();
  }, []);

  // Set reportingDesignation once allEmployees and initialData are loaded
  useEffect(() => {
    if (initialData?.reportingTo && allEmployees.length > 0) {
      const managerName = initialData.reportingTo.trim().toLowerCase();
      const foundManager = allEmployees.find(emp => 
        `${emp.firstName} ${emp.lastName}`.trim().toLowerCase() === managerName
      );
      if (foundManager && foundManager.designation) {
        setValue('reportingDesignation', foundManager.designation);
      }
    }
  }, [initialData, allEmployees, setValue]);

  const selectedReportingDesignation = watch('reportingDesignation');

  // Clear reportingTo if it is not in the filtered manager options
  useEffect(() => {
    if (selectedReportingDesignation && allEmployees.length > 0) {
      const options = allEmployees
        .filter(emp => 
          emp.designation === selectedReportingDesignation && 
          (emp.status === 'Active' || `${emp.firstName} ${emp.lastName}`.trim() === initialData?.reportingTo)
        )
        .map(emp => `${emp.firstName} ${emp.lastName}`.trim());
      
      const currentVal = getValues('reportingTo');
      if (currentVal && !options.includes(currentVal)) {
        setValue('reportingTo', '');
      }
    } else if (allEmployees.length > 0) {
      setValue('reportingTo', '');
    }
  }, [selectedReportingDesignation, allEmployees, setValue, getValues, initialData]);

  const reportingManagerOptions = allEmployees
    .filter(emp => 
      emp.designation === selectedReportingDesignation && 
      (emp.status === 'Active' || `${emp.firstName} ${emp.lastName}`.trim() === initialData?.reportingTo)
    )
    .map(emp => {
      const name = `${emp.firstName} ${emp.lastName}`.trim();
      return { value: name, label: name };
    });

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
      if (!formattedData.countrycodeOfficeContact) {
        formattedData.countrycodeOfficeContact = '+91';
      }
      if (!formattedData.countrycodeEmergencyContact) {
        formattedData.countrycodeEmergencyContact = '+91';
      }
      reset(formattedData);
    }
  }, [initialData, reset]);

  const formValues = watch();
  const currentStatus = formValues.status;

  const isHrSectionComplete = () => {
    const hrMandatoryFields = [
      'firstName', 'lastName', 'gender', 'dateOfBirth',
      'contactNumber', 'contactNumberOffice', 'emergencyContactNumber',
      'currentAddress', 'presentAddressProofUrl', 'permanentAddress', 'permanentAddressProofUrl',
      'aadharNumber', 'aadharUrl', 'panNumber', 'panUrl',
      'marksheet10thUrl', 'marksheet12thUrl', 'marksheetGraduationUrl', 'photoUrl',
      'dateOfJoining', 'resumeUrl', 'designation', 'assignedBusinessUnit',
      'reportingDesignation', 'reportingTo', 'workMode', 'ctc', 'compliance',
      'bankName', 'bankAccountNumber', 'bankIfscCode'
    ];
    if (currentStatus === 'Inactive') {
      hrMandatoryFields.push('lastWorkingDate');
    }

    return hrMandatoryFields.every(field => {
      const val = formValues[field];
      return val !== undefined && val !== null && val !== '';
    });
  };

  const isAdminSectionComplete = () => {
    const adminMandatoryFields = [
      'systemAssigned', 'simCardAssigned', 'emailIdConfigured',
      'linkedinConfigured', 'googleSheetConfigured', 'whatsappBusinessConfigured'
    ];
    return adminMandatoryFields.every(field => {
      const val = formValues[field];
      return val !== undefined && val !== null && val !== '';
    });
  };

  const getFilteredPayload = () => {
    const values = getValues();
    const payload = {};

    if (isUserAdmin) {
      // Admin only submits admin fields
      const adminFields = [
        'systemAssigned', 'simCardAssigned', 'emailIdConfigured',
        'linkedinConfigured', 'googleSheetConfigured', 'whatsappBusinessConfigured'
      ];
      adminFields.forEach(field => {
        if (values[field] !== undefined) {
          payload[field] = values[field];
        }
      });
    } else {
      // HR submits all HR fields
      const hrFields = [
        'firstName', 'lastName', 'bloodGroup', 'gender', 'countryCode', 'contactNumber', 'email',
        'permanentAddress', 'currentAddress', 'designation', 'dateOfJoining', 'package', 'status',
        'lastWorkingDate', 'dateOfBirth', 'countrycodeOfficeContact', 'contactNumberOffice',
        'countrycodeEmergencyContact', 'emergencyContactNumber', 'aadharNumber', 'aadharUrl',
        'panNumber', 'panUrl', 'marksheet10thUrl', 'marksheet12thUrl', 'marksheetGraduationUrl',
        'presentAddressProofUrl', 'permanentAddressProofUrl', 'photoUrl', 'medicalCondition',
        'resumeUrl', 'salarySlipsUrl', 'offerLetterUrl', 'lastCompanyName', 'bankName',
        'bankAccountNumber', 'bankIfscCode', 'assignedBusinessUnit', 'reportingTo', 'workMode',
        'ctc', 'compliance'
      ];
      hrFields.forEach(field => {
        if (values[field] !== undefined) {
          payload[field] = values[field];
        }
      });
    }
    return payload;
  };

  const handleHrSubmit = async () => {
    if (isHrDisabled) return;
    const fieldsToValidate = [
      'firstName', 'lastName', 'gender', 'dateOfBirth',
      'contactNumber', 'contactNumberOffice', 'emergencyContactNumber',
      'currentAddress', 'presentAddressProofUrl', 'permanentAddress', 'permanentAddressProofUrl',
      'aadharNumber', 'aadharUrl', 'panNumber', 'panUrl',
      'marksheet10thUrl', 'marksheet12thUrl', 'marksheetGraduationUrl', 'photoUrl',
      'dateOfJoining', 'resumeUrl', 'designation', 'assignedBusinessUnit',
      'reportingDesignation', 'reportingTo', 'workMode', 'ctc', 'compliance',
      'bankName', 'bankAccountNumber', 'bankIfscCode'
    ];
    if (currentStatus === 'Inactive') {
      fieldsToValidate.push('lastWorkingDate');
    }
    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      onSubmit(getFilteredPayload());
    }
  };

  const handleAdminSubmit = async () => {
    if (isAdminDisabled) return;
    const fieldsToValidate = [
      'systemAssigned', 'simCardAssigned', 'emailIdConfigured',
      'linkedinConfigured', 'googleSheetConfigured', 'whatsappBusinessConfigured'
    ];
    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      onSubmit(getFilteredPayload());
    }
  };

  const handleNextStep = async () => {
    let fieldsToValidate = [];
    if (step === 1) {
      fieldsToValidate = [
        'firstName', 'lastName', 'gender', 'dateOfBirth',
        'contactNumber', 'contactNumberOffice', 'emergencyContactNumber',
        'currentAddress', 'presentAddressProofUrl', 'permanentAddress', 'permanentAddressProofUrl',
        'aadharNumber', 'aadharUrl', 'panNumber', 'panUrl',
        'marksheet10thUrl', 'marksheet12thUrl', 'marksheetGraduationUrl', 'photoUrl'
      ];
    } else if (step === 2) {
      fieldsToValidate = [
        'dateOfJoining', 'resumeUrl', 'designation', 'assignedBusinessUnit',
        'reportingDesignation', 'reportingTo', 'workMode', 'ctc', 'compliance',
        'bankName', 'bankAccountNumber', 'bankIfscCode'
      ];
      if (currentStatus === 'Inactive') {
        fieldsToValidate.push('lastWorkingDate');
      }
    }

    // Trigger validation so errors are shown on screen, but do not block navigation to next step
    if (!isHrDisabled) {
      await trigger(fieldsToValidate);
    }
    setStep(prev => prev + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrevStep = () => {
    setStep(prev => prev - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 animate-fade-in">

      {step === 1 && (
        <div className="animate-slide-up">
          <SectionTitle>HR</SectionTitle>
          <SectionTitle>Personal Details</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 mb-8">
            <Input
              label="First Name"
              placeholder="Enter first name"
              required
              error={errors.firstName?.message}
              {...register('firstName', { required: 'First name is required' })}
              disabled={isHrDisabled}
            />

            <Input
              label="Last Name"
              placeholder="Enter last name"
              required
              error={errors.lastName?.message}
              {...register('lastName', { required: 'Last name is required' })}
              disabled={isHrDisabled}
            />

            <Select
              label="Gender"
              options={EMPLOYEE_GENDER_OPTIONS}
              required
              error={errors.gender?.message}
              {...register('gender', { required: 'Gender is required' })}
              disabled={isHrDisabled}
            />

            <Select
              label="Blood Group"
              options={EMPLOYEE_BLOOD_GROUP_OPTIONS}
              {...register('bloodGroup')}
              disabled={isHrDisabled}
            />

            <Input
              label="Date of Birth"
              type="date"
              required
              error={errors.dateOfBirth?.message}
              {...register('dateOfBirth', { required: 'Date of birth is required' })}
              disabled={isHrDisabled}
            />

            <Input
              label="Email Address"
              type="email"
              placeholder="e.g. john.doe@example.com"
              {...register('email')}
              disabled={isHrDisabled}
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Contact Number (Personal) <span className="text-red-500">*</span></label>
              <div className="flex gap-2">
                <div className="w-28">
                  <Select
                    options={COUNTRY_CODES}
                    {...register('countryCode')}
                    disabled={isHrDisabled}
                  />
                </div>
                <div className="flex-1">
                  <Input
                    type="tel"
                    placeholder="Enter personal phone number"
                    error={errors.contactNumber?.message}
                    {...register('contactNumber', { required: 'Personal contact number is required' })}
                    disabled={isHrDisabled}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Contact Number (Office) <span className="text-red-500">*</span></label>
              <div className="flex gap-2">
                <div className="w-28">
                  <Select
                    options={COUNTRY_CODES}
                    {...register('countrycodeOfficeContact')}
                    disabled={isHrDisabled}
                  />
                </div>
                <div className="flex-1">
                  <Input
                    type="tel"
                    placeholder="Enter office phone number"
                    error={errors.contactNumberOffice?.message}
                    {...register('contactNumberOffice', { required: 'Office contact number is required' })}
                    disabled={isHrDisabled}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Emergency Contact Number (Office) <span className="text-red-500">*</span></label>
              <div className="flex gap-2">
                <div className="w-28">
                  <Select
                    options={COUNTRY_CODES}
                    {...register('countrycodeEmergencyContact')}
                    disabled={isHrDisabled}
                  />
                </div>
                <div className="flex-1">
                  <Input
                    type="tel"
                    placeholder="Enter emergency contact number"
                    error={errors.emergencyContactNumber?.message}
                    {...register('emergencyContactNumber', { required: 'Emergency contact number is required' })}
                    disabled={isHrDisabled}
                  />
                </div>
              </div>
            </div>

            <Input
              label="Medical Condition (If Any)"
              placeholder="e.g. Asthma, Diabetes (Optional)"
              {...register('medicalCondition')}
              disabled={isHrDisabled}
            />

            <Input
              label="Aadhar Card Number"
              placeholder="Enter 12-digit Aadhar number"
              required
              error={errors.aadharNumber?.message}
              {...register('aadharNumber', {
                required: 'Aadhar number is required',
                pattern: { value: /^\d{12}$/, message: 'Aadhar number must be exactly 12 digits' }
              })}
              disabled={isHrDisabled}
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
                  disabled={isHrDisabled}
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
              disabled={isHrDisabled}
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
                  disabled={isHrDisabled}
                />
              )}
            />

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
                  disabled={isHrDisabled}
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
                  disabled={isHrDisabled}
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
                  disabled={isHrDisabled}
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
                  disabled={isHrDisabled}
                />
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 mb-8">
            <Input
              label="Present Address"
              placeholder="Enter present address"
              required
              error={errors.currentAddress?.message}
              {...register('currentAddress', { required: 'Present address is required' })}
              disabled={isHrDisabled}
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
                  disabled={isHrDisabled}
                />
              )}
            />

            <Input
              label="Permanent Address"
              placeholder="Enter permanent address"
              required
              error={errors.permanentAddress?.message}
              {...register('permanentAddress', { required: 'Permanent address is required' })}
              disabled={isHrDisabled}
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
                  disabled={isHrDisabled}
                />
              )}
            />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="animate-slide-up">
          <SectionTitle>Employment Details</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 mb-8">
            <Input
              label="Annual Package (LPA)"
              type="number"
              step="0.01"
              placeholder="e.g. 12"
              {...register('package')}
              disabled={isHrDisabled}
            />

            <Input
              label="Date of Joining"
              type="date"
              required
              error={errors.dateOfJoining?.message}
              {...register('dateOfJoining', { required: 'Date of joining is required' })}
              disabled={isHrDisabled}
            />

            <Select
              label="Status"
              options={EMPLOYEE_STATUS_OPTIONS}
              {...register('status')}
              disabled={isHrDisabled}
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
                  disabled={isHrDisabled}
                />
              </div>
            )}

            <Input
              label="Last Company Name"
              placeholder="Enter last company name"
              {...register('lastCompanyName')}
              disabled={isHrDisabled}
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
                  disabled={isHrDisabled}
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
                  disabled={isHrDisabled}
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
                  disabled={isHrDisabled}
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
                  disabled={isHrDisabled}
                />
              )}
            />

            <Select
              label="Assigned Business Unit"
              options={businessUnits}
              required
              error={errors.assignedBusinessUnit?.message}
              {...register('assignedBusinessUnit', { required: 'Assigned business unit is required' })}
              disabled={isHrDisabled}
            />

            <Select
              label="Reporting Designation"
              placeholder="Select designation"
              options={[
                { value: 'Team Lead', label: 'Team Lead' },
                { value: 'Asst Manager', label: 'Asst Manager' },
                { value: 'Manager', label: 'Manager' },
                { value: 'Sr.Manager', label: 'Sr.Manager' },
                { value: 'Director', label: 'Director' }
              ]}
              required
              error={errors.reportingDesignation?.message}
              {...register('reportingDesignation', { required: 'Reporting designation is required' })}
              disabled={isHrDisabled}
            />

            {selectedReportingDesignation && (
              <Select
                label="Reporting To (Manager)"
                placeholder={reportingManagerOptions.length > 0 ? "Select manager" : "No active employees with this designation"}
                options={reportingManagerOptions}
                required
                error={errors.reportingTo?.message}
                {...register('reportingTo', { required: 'Reporting manager is required' })}
                disabled={isHrDisabled || reportingManagerOptions.length === 0}
              />
            )}

            <Select
              label="Work Mode"
              options={workModes}
              required
              error={errors.workMode?.message}
              {...register('workMode', { required: 'Work mode is required' })}
              disabled={isHrDisabled}
            />

            <Input
              label="CTC"
              type="number"
              step="0.01"
              placeholder="Enter CTC"
              required
              error={errors.ctc?.message}
              {...register('ctc', { required: 'CTC is required' })}
              disabled={isHrDisabled}
            />

            <Select
              label="Compliance"
              options={EMPLOYEE_COMPLIANCE_OPTIONS}
              required
              error={errors.compliance?.message}
              {...register('compliance', { required: 'Compliance option is required' })}
              disabled={isHrDisabled}
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
              disabled={isHrDisabled}
            />

            <Input
              label="Bank Account Number"
              placeholder="Enter bank account number"
              required
              error={errors.bankAccountNumber?.message}
              {...register('bankAccountNumber', { required: 'Bank account number is required' })}
              disabled={isHrDisabled}
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
              disabled={isHrDisabled}
            />
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="animate-slide-up">
          <SectionTitle>ADMIN</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 mb-8">
            <Select
              label="System Assigned"
              options={EMPLOYEE_YES_NO_OPTIONS}
              required
              error={errors.systemAssigned?.message}
              {...register('systemAssigned', { required: 'System assignment status is required' })}
              disabled={isAdminDisabled}
            />

            <Select
              label="SIM Card Assigned"
              options={EMPLOYEE_YES_NO_OPTIONS}
              required
              error={errors.simCardAssigned?.message}
              {...register('simCardAssigned', { required: 'SIM card assignment status is required' })}
              disabled={isAdminDisabled}
            />

            <Select
              label="Email ID Configured"
              options={EMPLOYEE_YES_NO_OPTIONS}
              required
              error={errors.emailIdConfigured?.message}
              {...register('emailIdConfigured', { required: 'Email configuration status is required' })}
              disabled={isAdminDisabled}
            />

            <Select
              label="LinkedIn Configured"
              options={EMPLOYEE_YES_NO_OPTIONS}
              required
              error={errors.linkedinConfigured?.message}
              {...register('linkedinConfigured', { required: 'LinkedIn configuration status is required' })}
              disabled={isAdminDisabled}
            />

            <Select
              label="Google Sheet Configured"
              options={EMPLOYEE_YES_NO_OPTIONS}
              required
              error={errors.googleSheetConfigured?.message}
              {...register('googleSheetConfigured', { required: 'Google Sheet configuration status is required' })}
              disabled={isAdminDisabled}
            />

            <Select
              label="Whatsapp Business Configuration"
              options={EMPLOYEE_YES_NO_OPTIONS}
              required
              error={errors.whatsappBusinessConfigured?.message}
              {...register('whatsappBusinessConfigured', { required: 'Whatsapp Business configuration status is required' })}
              disabled={isAdminDisabled}
            />
          </div>
        </div>
      )}

      <div className="flex justify-between items-center pt-6 border-t border-gray-100 mt-8">
        <div>
          {step === 1 ? (
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          ) : (
            <Button
              type="button"
              variant="secondary"
              onClick={handlePrevStep}
              disabled={isSubmitting}
              className="flex items-center gap-1.5"
            >
              <ChevronLeft size={16} />
              Back
            </Button>
          )}
        </div>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="secondary"
            className="border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
            onClick={() => {
              onSubmit(getFilteredPayload());
            }}
            disabled={isSubmitting}
          >
            Save as Draft
          </Button>

          {step === 1 && (
            <Button
              type="button"
              variant="primary"
              onClick={handleNextStep}
              disabled={isSubmitting}
              className="flex items-center gap-1.5"
            >
              Next
              <ChevronRight size={16} />
            </Button>
          )}

          {step === 2 && (
            <>
              <Button
                type="button"
                variant="primary"
                onClick={handleHrSubmit}
                loading={isSubmitting}
                disabled={isHrDisabled || !isHrSectionComplete() || isSubmitting}
              >
                Submit HR Details
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={handleNextStep}
                disabled={isSubmitting}
                className="flex items-center gap-1.5"
              >
                Next
                <ChevronRight size={16} />
              </Button>
            </>
          )}

          {step === 3 && (
            <Button
              type="button"
              variant="primary"
              onClick={handleAdminSubmit}
              loading={isSubmitting}
              disabled={isAdminDisabled || !isAdminSectionComplete() || isSubmitting}
            >
              {isEditing ? 'Save Changes' : 'Submit Admin Details'}
            </Button>
          )}
        </div>
      </div>

    </form>
  );
};

export default EmployeeForm;
