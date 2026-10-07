import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Home,
  LayoutDashboard,
  Briefcase,
  Users,
  Building2,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  CalendarCheck,
  Settings,
} from 'lucide-react';
import { APP_NAME, APP_SHORT } from '../../utils/constants';
import { getSystemRole, getCurrentEmployee } from '../../api/authApi';
import { getSecureMediaUrl } from '../../utils/mediaUtils';

const NAV_ITEMS = [
  { label: 'Home', path: '/home', icon: Home },
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Jobs', path: '/jobs', icon: Briefcase },
  { label: 'Candidates', path: '/candidates', icon: Users },
  { label: 'Organizations', path: '/organizations', icon: Building2 },
  { label: 'Employees', path: '/employees', icon: UserCheck },
  { label: 'RMEP', path: '/attendance/portal', icon: CalendarCheck },
  { label: 'Accounts', path: '/accounts', icon: UserCheck },
  { label: 'Settings', path: '/settings', icon: Settings },
];

const Sidebar = ({ collapsed, onToggle }) => {
  const role = getSystemRole();
  const employee = getCurrentEmployee() || {};
  const employeeName = employee.name || 'Admin';
  const employeeEmail = employee.official_email_id || employee.email || 'admin@rightmove.in';
  const initials = employeeName.substring(0, 2).toUpperCase();

  const filteredNavItems = NAV_ITEMS.filter(({ label }) => {
    // Everyone sees Home (or Dashboard instead, but we'll leave Home for basics)
    if (label === 'Home') return true;

    // Based on the user's explicit instructions:
    if (role === 'super_admin') return true;
    
    if (role === 'admin_admin') {
      return ['Organization', 'Organizations', 'Employees', 'RMEP', 'Settings', 'Accounts', 'Home'].includes(label);
    }
    
    if (role === 'admin_user') {
      return ['Employees', 'Organization', 'Organizations', 'RMEP', 'Home'].includes(label);
    }
    
    if (role === 'hr') {
      return ['Employees', 'RMEP', 'Home'].includes(label);
    }
    
    if (role === 'account_user') {
      return ['Employees', 'Organization', 'Organizations', 'RMEP', 'Accounts', 'Home'].includes(label);
    }
    
    if (role === 'leader' || role === 'user') {
      return ['Candidates', 'Jobs', 'RMEP', 'Home'].includes(label);
    }

    if (role === 'temporary') return ['Candidates'].includes(label);

    return false;
  });

  return (
    <aside
      className={[
        'flex flex-col h-screen bg-slate-900 text-white transition-all duration-300 ease-in-out shrink-0',
        collapsed ? 'w-16' : 'w-60',
      ].join(' ')}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-slate-700/60">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
            {APP_SHORT}
          </div>
          {!collapsed && (
            <span className="font-semibold text-sm text-white truncate">
              {APP_NAME}
            </span>
          )}
        </div>
      </div>

      {/* Toggle button */}
      <div className="flex justify-end px-3 py-3">
        <button
          onClick={onToggle}
          className="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Nav section label */}
      {!collapsed && (
        <div className="px-4 mb-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
            Menu
          </span>
        </div>
      )}

      {/* Nav items */}
      <nav className="flex flex-col gap-1 px-2 flex-1">
        {filteredNavItems.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              [
                'relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800',
                collapsed ? 'justify-center' : '',
              ]
                .filter(Boolean)
                .join(' ')
            }
          >
            <Icon size={18} className="shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="p-3 border-t border-slate-700/60">
        <div
          className={[
            'flex items-center gap-3 rounded-lg p-2',
            collapsed ? 'justify-center' : '',
          ].join(' ')}
        >
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-semibold shrink-0 overflow-hidden" title={employeeName}>
            {employee?.photo_url ? (
              <img src={getSecureMediaUrl(employee.photo_url)} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              initials
            )}
          </div>
          {!collapsed && (
            <div className="min-w-0" title={employeeEmail}>
              <p className="text-sm font-medium text-white truncate">{employeeName}</p>
              <p className="text-xs text-slate-400 truncate">{employeeEmail}</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
