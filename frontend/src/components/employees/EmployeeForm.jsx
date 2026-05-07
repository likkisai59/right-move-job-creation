import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Save, X, User, Briefcase, Calendar, DollarSign, Tag } from 'lucide-react';
import { EMPLOYEE_STATUS_OPTIONS, EMPLOYEE_DESIGNATION_OPTIONS } from '../../utils/constants';

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

  // Reset form when initialData loads (e.g., during Edit)
  useEffect(() => {
    if (initialData) {
      reset(initialData);
    }
  }, [initialData, reset]);

  const currentStatus = watch('status');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 animate-fade-in">
      
      {/* ── Personal Details Section ── */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-6 border-b pb-4">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
            <User size={20} />
          </div>
          <h2 className="text-lg font-bold text-gray-800">Personal Details</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* First Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('firstName', { required: 'First name is required' })}
              className={`w-full px-4 py-2.5 rounded-xl border focus:ring-2 focus:ring-blue-100 transition-all ${
                errors.firstName ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'
              }`}
              placeholder="Enter first name"
            />
            {errors.firstName && <p className="mt-1 text-xs text-red-500">{errors.firstName.message}</p>}
          </div>

          {/* Last Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Last Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('lastName', { required: 'Last name is required' })}
              className={`w-full px-4 py-2.5 rounded-xl border focus:ring-2 focus:ring-blue-100 transition-all ${
                errors.lastName ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'
              }`}
              placeholder="Enter last name"
            />
            {errors.lastName && <p className="mt-1 text-xs text-red-500">{errors.lastName.message}</p>}
          </div>

          {/* Preferred Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Preferred Name</label>
            <input
              type="text"
              {...register('preferredName')}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
              placeholder="e.g. John"
            />
          </div>
        </div>
      </div>

      {/* ── Job & Employment Details Section ── */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-6 border-b pb-4">
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
            <Briefcase size={20} />
          </div>
          <h2 className="text-lg font-bold text-gray-800">Employment Details</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Designation */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Designation <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Tag size={16} className="absolute left-3.5 top-3 text-gray-400" />
              <select
                {...register('designation', { required: 'Designation is required' })}
                className={`w-full pl-10 pr-4 py-2.5 appearance-none rounded-xl border focus:ring-2 focus:ring-emerald-100 transition-all ${
                  errors.designation ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-emerald-500'
                }`}
              >
                <option value="">Select Designation</option>
                {EMPLOYEE_DESIGNATION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            {errors.designation && <p className="mt-1 text-xs text-red-500">{errors.designation.message}</p>}
          </div>

          {/* Package */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Annual Package</label>
            <div className="relative">
              <DollarSign size={16} className="absolute left-3.5 top-3 text-gray-400" />
              <input
                type="number"
                step="0.01"
                {...register('package')}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all"
                placeholder="e.g. 1200000"
              />
            </div>
          </div>

          {/* Date of Joining */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Date of Joining <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Calendar size={16} className="absolute left-3.5 top-3 text-gray-400 pointer-events-none" />
              <input
                type="date"
                {...register('dateOfJoining', { required: 'Date of joining is required' })}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border focus:ring-2 focus:ring-emerald-100 transition-all ${
                  errors.dateOfJoining ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-emerald-500'
                }`}
              />
            </div>
            {errors.dateOfJoining && <p className="mt-1 text-xs text-red-500">{errors.dateOfJoining.message}</p>}
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Status</label>
            <select
              {...register('status')}
              className="w-full px-4 py-2.5 appearance-none rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all"
            >
              {EMPLOYEE_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Last Working Date (Only show if Inactive) */}
          {currentStatus === 'Inactive' && (
            <div className="animate-fade-in md:col-span-2">
              <label className="block text-sm font-semibold text-red-600 mb-1.5">
                Last Working Date <span className="text-red-500">*</span>
              </label>
              <div className="relative md:w-1/2 pr-3">
                <Calendar size={16} className="absolute left-3.5 top-3 text-red-400 pointer-events-none" />
                <input
                  type="date"
                  {...register('lastWorkingDate', { 
                    required: currentStatus === 'Inactive' ? 'Last working date is required for inactive employees' : false 
                  })}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border border-red-200 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all`}
                />
              </div>
              {errors.lastWorkingDate && <p className="mt-1 text-xs text-red-500">{errors.lastWorkingDate.message}</p>}
            </div>
          )}
        </div>
      </div>

      {/* ── Action Buttons ── */}
      <div className="flex items-center justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-6 py-2.5 text-sm font-bold text-gray-600 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 focus:ring-4 focus:ring-gray-100 transition-all flex items-center gap-2"
        >
          <X size={16} />
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className={`px-6 py-2.5 text-sm font-bold text-white rounded-xl shadow-md transition-all flex items-center gap-2 ${
            isSubmitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg focus:ring-4 focus:ring-blue-200'
          }`}
        >
          <Save size={16} />
          {isSubmitting ? 'Saving...' : isEditing ? 'Update Employee' : 'Save Employee'}
        </button>
      </div>

    </form>
  );
};

export default EmployeeForm;
