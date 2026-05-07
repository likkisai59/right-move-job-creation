import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import { EMPLOYEE_STATUS_OPTIONS, EMPLOYEE_DESIGNATION_OPTIONS } from '../../utils/constants';

const SectionTitle = ({ children }) => (
  <div className="mb-5">
    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-gray-100 pb-2.5">
      {children}
    </h3>
  </div>
);

const EmployeeForm = ({ initialData, onSubmit, onCancel, isSubmitting }) => {
  const isEditing = !!initialData;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors }
  } = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      preferredName: '',
      designation: '',
      dateOfJoining: '',
      package: '',
      status: 'Active',
      lastWorkingDate: '',
      ...initialData
    }
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

        <Input
          label="Preferred Name"
          placeholder="e.g. John"
          {...register('preferredName')}
        />
      </div>

      <SectionTitle>Employment Details</SectionTitle>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 mb-8">
        <Select
          label="Designation"
          options={EMPLOYEE_DESIGNATION_OPTIONS}
          required
          error={errors.designation?.message}
          {...register('designation', { required: 'Designation is required' })}
        />

        <Input
          label="Annual Package (LPA)"
          type="number"
          step="0.01"
          placeholder="e.g. 1200000"
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
          <div className="md:col-span-2">
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
          {isEditing ? 'Update Employee' : 'Save Employee'}
        </Button>
      </div>
    </form>
  );
};

export default EmployeeForm;
