import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPlus } from 'lucide-react';
import PageContainer from '../../components/layout/PageContainer';
import EmployeeForm from '../../components/employees/EmployeeForm';
import { createEmployee } from '../../api/employeesApi';

const AddEmployeePage = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (data) => {
    setIsSubmitting(true);
    setError(null);
    try {
      // Call the API function we wrote earlier
      await createEmployee(data);
      // On success, go back to the employee list
      navigate('/employees');
    } catch (err) {
      console.error('Failed to create employee:', err);
      // If the backend sends a specific error message, show it
      setError(err.response?.data?.message || 'Failed to create employee. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/employees');
  };

  return (
    <PageContainer>
      <div className="flex flex-col gap-6 animate-fade-in max-w-4xl mx-auto">
        
        {/* ── Page Header ── */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <button
              onClick={handleCancel}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors group mb-2 w-fit"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
              Back to Employees
            </button>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-md shadow-blue-200">
                <UserPlus size={22} />
              </div>
              <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Add New Employee</h1>
            </div>
          </div>
        </div>

        {/* ── Error Banner ── */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
            <p className="text-sm font-bold text-red-700">{error}</p>
          </div>
        )}

        {/* ── The Form Component ── */}
        <EmployeeForm 
          onSubmit={handleSubmit} 
          onCancel={handleCancel} 
          isSubmitting={isSubmitting} 
        />
        
      </div>
    </PageContainer>
  );
};

export default AddEmployeePage;
