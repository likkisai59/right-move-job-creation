import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import PageContainer from '../../components/layout/PageContainer';
import Card from '../../components/common/Card';
import EmployeeForm from '../../components/employees/EmployeeForm';
import { updateEmployee, fetchEmployeeById } from '../../api/employeesApi';

const EditEmployeePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [employee, setEmployee] = useState(null);
  const [loadingInitial, setLoadingInitial] = useState(true);
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const getEmployee = async () => {
      try {
        const response = await fetchEmployeeById(id);
        setEmployee(response.data);
      } catch (err) {
        console.error('Failed to fetch employee details:', err);
        setError('Failed to load employee details. They may have been deleted.');
      } finally {
        setLoadingInitial(false);
      }
    };
    
    getEmployee();
  }, [id]);

  const handleSubmit = async (data) => {
    setLoading(true);
    setError(null);
    try {
      await updateEmployee(id, data);
      setSuccess(true);
      setTimeout(() => navigate('/employees'), 1500);
    } catch (err) {
      console.error('Failed to update employee:', err);
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
              Update Employee Details 
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Update the details for this employee
            </p>
          </div>

          {success && (
            <div className="mb-5 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium flex items-center gap-2 animate-slide-up">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Employee updated successfully. Redirecting...
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

          {loadingInitial ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
              <p className="text-gray-500 font-medium">Loading employee details...</p>
            </div>
          ) : employee ? (
            <EmployeeForm 
              initialData={employee}
              onSubmit={handleSubmit} 
              onCancel={handleCancel} 
              isSubmitting={loading} 
            />
          ) : (
            <div className="py-8 text-center text-gray-500">
              Employee data could not be loaded.
            </div>
          )}
        </Card>
      </div>
    </PageContainer>
  );
};

export default EditEmployeePage;
