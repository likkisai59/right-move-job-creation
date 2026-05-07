import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Briefcase,
  Users,
  Building2,
  ChevronLeft,
  ChevronRight,
  UserCheck,
} from 'lucide-react';
import { APP_NAME, APP_SHORT } from '../../utils/constants';

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Jobs', path: '/jobs', icon: Briefcase },
  { label: 'Candidates', path: '/candidates', icon: Users },
  { label: 'Organizations', path: '/organizations', icon: Building2 },
  { label: 'Employees', path: '/employees', icon: UserCheck },
];

const Sidebar = ({ collapsed, onToggle }) => {
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
        {NAV_ITEMS.map(({ label, path, icon: Icon }) => (
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
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-semibold shrink-0">
            AD
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">Admin</p>
              <p className="text-xs text-slate-400 truncate">admin@rightmove.in</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
