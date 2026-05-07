import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import PageContainer from '../../components/layout/PageContainer';
import Card from '../../components/common/Card';
import EmployeeForm from '../../components/employees/EmployeeForm';
import { createEmployee } from '../../api/employeesApi';

const AddEmployeePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (data) => {
    setLoading(true);
    setError(null);
    try {
      await createEmployee(data);
      setSuccess(true);
      setTimeout(() => navigate('/employees'), 1500);
    } catch (err) {
      console.error('Failed to add employee:', err);
      const message = err.response?.data?.message || err.message || 'An unexpected error occurred';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => navigate('/employees');

  return (
    <PageContainer>
      <div className="max-w-4xl mx-auto animate-fade-in">
        {/* Back button */}
        <button
          onClick={() => navigate('/employees')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-5 transition-colors group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          Back
        </button>

        <Card>
          <div className="mb-6">
            <h1 className="text-lg font-semibold text-gray-900">
              Employee Registration
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Register a new employee in the database
            </p>
          </div>

          {success && (
            <div className="mb-5 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium flex items-center gap-2 animate-slide-up">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Employee registered successfully. Redirecting...
            </div>
          )}

          {error && (
            <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm font-medium flex items-center gap-2 animate-slide-up">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              {error}
            </div>
          )}

          <EmployeeForm 
            onSubmit={handleSubmit} 
            onCancel={handleCancel} 
            isSubmitting={loading} 
          />

        </Card>
      </div>
    </PageContainer>
  );
};

export default AddEmployeePage;
