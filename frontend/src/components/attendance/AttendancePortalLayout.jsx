import React from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { 
  LogOut, CalendarCheck, Clock, 
  ClipboardList, PieChart, UserCircle 
} from 'lucide-react';

const AttendancePortalLayout = () => {
  const navigate = useNavigate();
  const employee = JSON.parse(localStorage.getItem('employee_data') || '{}');

  const handleSignOut = () => {
    localStorage.removeItem('employee_token');
    localStorage.removeItem('employee_data');
    navigate('/attendance-login');
  };

  const navItems = [
    { name: 'Attendance Marking', path: '/attendance/portal/mark', icon: CalendarCheck },
    { name: 'Shift Management',   path: '/attendance/portal/shifts', icon: Clock },
    { name: 'Leave Management',   path: '/attendance/portal/leaves', icon: ClipboardList },
    { name: 'Attendance Status',   path: '/attendance/portal/status', icon: PieChart },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      
      {/* ── TOP NAVBAR ── */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          
          {/* Logo / Title */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
              RM
            </div>
            <span className="font-bold text-slate-800 hidden md:inline">Employee Portal</span>
          </div>

          {/* Nav Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `
                  flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                  ${isActive 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}
                `}
              >
                <item.icon size={16} />
                {item.name}
              </NavLink>
            ))}
          </nav>

          {/* User & Signout */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-sm font-bold text-slate-800">{employee.name}</span>
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                {employee.designation}
              </span>
            </div>
            
            <div className="h-8 w-px bg-slate-200 hidden sm:block" />
            
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 text-slate-500 hover:text-red-600 transition-colors px-3 py-2 rounded-lg hover:bg-red-50"
              title="Sign Out"
            >
              <LogOut size={18} />
              <span className="text-sm font-medium hidden md:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── MOBILE NAVBAR (Bottom) ── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 h-16 flex items-center justify-around px-2 z-50">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              flex flex-col items-center gap-1 p-2 rounded-lg transition-all
              ${isActive ? 'text-blue-600' : 'text-slate-400'}
            `}
          >
            <item.icon size={20} />
            <span className="text-[10px] font-bold truncate max-w-[70px]">
              {item.name.split(' ')[0]}
            </span>
          </NavLink>
        ))}
      </nav>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 pb-24 lg:pb-8">
        
        {/* Basic Info Header */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border-4 border-slate-50">
              <UserCircle size={40} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">{employee.name}</h2>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                <span className="text-sm text-slate-500 font-medium">ID: {employee.employee_id}</span>
                <span className="text-sm text-slate-500 font-medium">Designation: {employee.designation}</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-0.5">Contact</p>
              <p className="text-slate-700 font-medium">{employee.contact || 'N/A'}</p>
            </div>
            <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-0.5">Email</p>
              <p className="text-slate-700 font-medium">{employee.email || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <Outlet />
      </main>
    </div>
  );
};

export default AttendancePortalLayout;
