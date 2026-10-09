import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Lock, User, LogIn, AlertCircle, CheckCircle2, ShieldCheck, Mail } from 'lucide-react';
import { login as loginApi, verifyOtpAndResetPassword } from '../api/authApi';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

const LoginPage = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // OTP Mode State
  const [isOtpMode, setIsOtpMode] = useState(false);
  const [otpEmail, setOtpEmail] = useState('');
  const [empId, setEmpId] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      username: '',
      password: '',
      rememberMe: false
    }
  });

  const {
    register: registerOtp,
    handleSubmit: handleOtpSubmit,
    formState: { errors: otpErrors },
    watch: watchOtp
  } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    setError('');
    try {
      const response = await loginApi(data.username, data.password);
      
      if (response.success) {
        if (response.data && response.data.require_password_change) {
            setIsOtpMode(true);
            setOtpEmail(response.data.email);
            setEmpId(response.data.employee_id);
            setSuccessMessage('OTP sent! Please check your email to continue.');
            return;
        }

        setSuccess(true);
        setSuccessMessage('Login successful! Redirecting...');
        const { role, token } = response.data;
        
        if (role === 'admin') {
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(response.data.user));
          setTimeout(() => {
            navigate('/dashboard');
          }, 800);
        } else {
          localStorage.setItem('employee_token', token);
          localStorage.setItem('employee_data', JSON.stringify(response.data.employee));
          setTimeout(() => {
            navigate('/dashboard');
          }, 800);
        }
      } else {
        setError(response.message || 'Invalid credentials');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Invalid credentials. Please check your username and password.');
    } finally {
      setLoading(false);
    }
  };

  const onOtpSubmit = async (data) => {
      setLoading(true);
      setError('');
      try {
          const response = await verifyOtpAndResetPassword(empId, data.otp, data.newPassword);
          if (response.success) {
              setSuccess(true);
              setSuccessMessage('Password updated successfully! Redirecting to login...');
              setTimeout(() => {
                  setIsOtpMode(false);
                  setSuccess(false);
                  setSuccessMessage('');
                  reset();
              }, 2000);
          } else {
              setError(response.message || 'Invalid OTP');
          }
      } catch (err) {
          setError(err.response?.data?.message || 'Failed to verify OTP. Please try again.');
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 relative overflow-hidden font-inter">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100/50 rounded-full blur-3xl opacity-60 animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-100/50 rounded-full blur-3xl opacity-60 animate-pulse" />

      <div className="w-full max-w-md animate-fade-in relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl shadow-xl shadow-blue-200 text-white mb-4 transform hover:rotate-6 transition-transform duration-300">
            {isOtpMode ? <ShieldCheck size={32} /> : <LogIn size={32} />}
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
            Right Move <span className="text-blue-600">CRM</span>
          </h1>
          <p className="text-slate-500 font-medium">
              {isOtpMode ? 'Security verification required' : 'Welcome back! Please enter your details.'}
          </p>
        </div>

        <div className="bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-slate-100 overflow-hidden">
          <div className="p-8 md:p-10">
            {error && (
              <div className="mb-6 flex items-center gap-3 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl animate-shake">
                <AlertCircle size={20} className="shrink-0" />
                <p className="text-sm font-semibold">{error}</p>
              </div>
            )}

            {successMessage && (
              <div className="mb-6 flex items-center gap-3 bg-emerald-50 border border-emerald-100 text-emerald-600 px-4 py-3 rounded-xl animate-bounce-in">
                <CheckCircle2 size={20} className="shrink-0" />
                <p className="text-sm font-semibold">{successMessage}</p>
              </div>
            )}

            {!isOtpMode ? (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <Input
                    label="Employee ID"
                    placeholder="Enter Employee ID (e.g. RM0011)"
                    icon={User}
                    required
                    error={errors.username?.message}
                    {...register('username', { 
                    required: 'Employee ID is required'
                    })}
                />

                <div className="relative">
                    <Input
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    icon={Lock}
                    required
                    error={errors.password?.message}
                    {...register('password', { required: 'Password is required' })}
                    />
                    <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-[38px] text-slate-400 hover:text-slate-600 transition-colors p-1"
                    >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>

                <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer group">
                    <div className="relative">
                        <input
                        type="checkbox"
                        className="peer sr-only"
                        {...register('rememberMe')}
                        />
                        <div className="w-5 h-5 border-2 border-slate-200 rounded-md bg-white peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-all duration-200" />
                        <svg
                        className="absolute top-0.5 left-0.5 w-4 h-4 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="3"
                        >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <span className="text-sm font-medium text-slate-600 group-hover:text-slate-800 transition-colors">
                        Remember Me
                    </span>
                    </label>

                    <button
                    type="button"
                    className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors"
                    >
                    Forgot Password?
                    </button>
                </div>

                <Button
                    type="submit"
                    className="w-full py-3.5 rounded-xl text-lg font-bold shadow-lg shadow-blue-200"
                    loading={loading}
                    disabled={loading || success}
                >
                    {loading ? 'Processing...' : 'Sign In'}
                </Button>
                </form>
            ) : (
                <form onSubmit={handleOtpSubmit(onOtpSubmit)} className="space-y-6">
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
                        <p className="text-sm text-blue-800">
                            We've sent a One-Time Password to your registered email <span className="font-bold">{otpEmail || 'your email'}</span>.
                            Please enter it below to set your new password.
                        </p>
                    </div>

                    <Input
                        label="6-Digit OTP"
                        placeholder="Enter the 6-digit OTP"
                        icon={Mail}
                        required
                        error={otpErrors.otp?.message}
                        maxLength={6}
                        {...registerOtp('otp', { 
                            required: 'OTP is required',
                            minLength: { value: 6, message: 'OTP must be 6 digits' }
                        })}
                    />

                    <div className="relative">
                        <Input
                            label="New Secure Password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Create a strong password"
                            icon={Lock}
                            required
                            error={otpErrors.newPassword?.message}
                            {...registerOtp('newPassword', { 
                                required: 'New password is required',
                                minLength: { value: 8, message: 'Password must be at least 8 characters' }
                            })}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-[38px] text-slate-400 hover:text-slate-600 transition-colors p-1"
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>

                    <div className="relative">
                        <Input
                            label="Confirm New Password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Re-enter your password"
                            icon={CheckCircle2}
                            required
                            error={otpErrors.confirmPassword?.message}
                            {...registerOtp('confirmPassword', { 
                                required: 'Please confirm your password',
                                validate: value => value === watchOtp('newPassword') || 'Passwords do not match'
                            })}
                        />
                    </div>

                    <Button
                        type="submit"
                        className="w-full py-3.5 rounded-xl text-lg font-bold shadow-lg shadow-blue-200"
                        loading={loading}
                        disabled={loading || success}
                    >
                        {loading ? 'Verifying...' : 'Set Password & Continue'}
                    </Button>
                </form>
            )}
          </div>
          
          <div className="bg-slate-50 border-t border-slate-100 px-10 py-4 text-center">
             <p className="text-xs text-slate-400 font-medium italic">
                Securely managing your recruitment operations.
             </p>
          </div>
        </div>

        <p className="mt-8 text-center text-slate-400 text-sm font-medium">
          &copy; 2026 Right Move CRM. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
