import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import {
  LogOut, CalendarCheck,
  ClipboardList, PieChart, UserCircle, ArrowLeft, CheckSquare, Clock, Briefcase
} from 'lucide-react';
import { FEATURE_FLAGS } from '../../config/features';

const AttendancePortalLayout = () => {
  const navigate = useNavigate();
  const employee = JSON.parse(localStorage.getItem('employee_data') || '{}');
  const [showToast, setShowToast] = useState(false);

  const handleComingSoon = () => {
    setShowToast(true);
  };

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  const handleSignOut = () => {
    localStorage.removeItem('employee_token');
    localStorage.removeItem('employee_data');
    navigate('/attendance-login');
  };

  const isManager = (emp) => {
    if (!emp) return false;
    const nameNormalized = (emp.name || '').toLowerCase().trim();
    if (nameNormalized === 'sunmeet singh') return true;
    const designation = emp.designation || '';
    const normalized = designation.toLowerCase().trim().replace(/[\s\.-]+/g, '');
    return ['teamlead', 'assistantmanager', 'asstmanager', 'manager', 'seniormanager', 'srmanager', 'director'].includes(normalized);
  };

  const navItems = [
    { name: 'Assigned Tasks', path: '/attendance/portal/tasks', icon: Briefcase },
    { name: 'Leave Management', path: '/attendance/portal/leaves', icon: ClipboardList },
    { name: 'Attendance Status', path: '/attendance/portal/status', icon: PieChart },
  ];

  if (isManager(employee)) {
    navItems.push({ name: 'Manage Approvals', path: '/attendance/portal/approvals', icon: CheckSquare });
  }

  navItems.push({
    name: 'Attendance Marking',
    path: '/attendance/portal/mark',
    icon: CalendarCheck,
    disabled: !FEATURE_FLAGS.enableAttendanceMarking
  });


  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* ── TOP NAVBAR ── */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">

          {/* Logo / Title */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
              RM
            </div>
            <span className="font-bold text-gray-800 hidden md:inline">Employee Portal</span>
          </div>

          {/* Nav Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              if (item.disabled) {
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={handleComingSoon}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all text-gray-300 opacity-60 hover:bg-transparent"
                  >
                    <item.icon size={16} />
                    {item.name}
                  </NavLink>
                );
              }
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => `
                    flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                    ${isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'}
                  `}
                >
                  <item.icon size={16} />
                  {item.name}
                </NavLink>
              );
            })}
          </nav>

          {/* User & Signout */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-sm font-bold text-gray-800">{employee.name}</span>
              <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
                {employee.designation}
              </span>
            </div>

            <div className="h-8 w-px bg-gray-200 hidden sm:block" />

            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 text-gray-500 hover:text-red-600 transition-colors px-3 py-2 rounded-lg hover:bg-red-50"
              title="Sign Out"
            >
              <LogOut size={18} />
              <span className="text-sm font-medium hidden md:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── MOBILE NAVBAR (Bottom) ── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 h-16 flex items-center justify-around px-2 z-50">
        {navItems.map((item) => {
          if (item.disabled) {
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={handleComingSoon}
                className="flex flex-col items-center gap-1 p-2 rounded-lg transition-all text-gray-300 opacity-60"
              >
                <item.icon size={20} />
                <span className="text-[10px] font-bold truncate max-w-[70px]">
                  {item.name.split(' ')[0]}
                </span>
              </NavLink>
            );
          }
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                flex flex-col items-center gap-1 p-2 rounded-lg transition-all
                ${isActive ? 'text-blue-600' : 'text-gray-400'}
              `}
            >
              <item.icon size={20} />
              <span className="text-[10px] font-bold truncate max-w-[70px]">
                {item.name.split(' ')[0]}
              </span>
            </NavLink>
          );
        })}
      </nav>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 pb-24 lg:pb-8">

        <div className="flex flex-col md:flex-row items-center gap-4 mb-8 w-full">
          {/* Compact Return to Dashboard Button beside/left to profile card */}
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-5 transition-colors group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
            Back
          </button>

          {/* Basic Info Header (Profile Card) */}
          <div className="flex-1 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6 w-full">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 border-4 border-gray-50">
                <UserCircle size={40} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">{employee.name}</h2>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                  <span className="text-sm text-gray-500 font-medium">ID: {employee.employee_id}</span>
                  <span className="text-sm text-gray-500 font-medium">Designation: {employee.designation}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-0.5">Contact</p>
                <p className="text-gray-700 font-medium">{employee.contact || 'N/A'}</p>
              </div>
              <div className="bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-0.5">Email</p>
                <p className="text-gray-700 font-medium">{employee.email || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <Outlet />
      </main>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-20 md:bottom-6 right-6 bg-gray-900 text-white px-5 py-3 rounded-xl shadow-xl z-50 flex items-center gap-2.5 animate-fade-in border border-gray-800 text-xs font-bold">
          <Clock size={16} className="text-amber-400 animate-pulse" />
          <span>Attendance Marking is coming soon!</span>
        </div>
      )}
    </div>
  );
};

export default AttendancePortalLayout;
