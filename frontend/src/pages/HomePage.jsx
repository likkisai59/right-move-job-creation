import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Briefcase, 
  Users, 
  Building2, 
  UserCheck, 
  CalendarCheck, 
  Wallet,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import PageContainer from '../components/layout/PageContainer';
import { getSystemRole } from '../api/authApi';

const HomePage = () => {
  const navigate = useNavigate();
  const role = getSystemRole();

  const modules = [
    {
      title: 'Jobs',
      label: 'Jobs',
      description: 'Manage corporate client job requirements, target openings, candidate shortlists, and BU details.',
      path: '/jobs',
      icon: Briefcase,
      color: 'from-blue-500 to-indigo-600',
      shadow: 'shadow-blue-500/10',
      badge: 'Recruitment Needs'
    },
    {
      title: 'Candidates',
      label: 'Candidates',
      description: 'Onboard talent, monitor screening progress, trace interview schedules, and track joined statuses.',
      path: '/candidates',
      icon: Users,
      color: 'from-indigo-500 to-purple-600',
      shadow: 'shadow-indigo-500/10',
      badge: 'Talent Pool'
    },
    {
      title: 'Organizations',
      label: 'Organizations',
      description: 'Review corporate client organization profiles, locations, and system-wide GST registration settings.',
      path: '/organizations',
      icon: Building2,
      color: 'from-emerald-500 to-teal-600',
      shadow: 'shadow-emerald-500/10',
      badge: 'Client Registry'
    },
    {
      title: 'Employees',
      label: 'Employees',
      description: 'Onboard internally hired personnel, assign designations, business units, and compliance details.',
      path: '/employees',
      icon: UserCheck,
      color: 'from-amber-500 to-orange-600',
      shadow: 'shadow-orange-500/10',
      badge: 'Internal Directory'
    },
    {
      title: 'RMEP (Employee Portal)',
      label: 'RMEP',
      description: 'Direct portal for internally active employees. Mark attendance logs, file leave requests, and view tasks.',
      path: '/attendance/portal',
      icon: CalendarCheck,
      color: 'from-fuchsia-500 to-pink-600',
      shadow: 'shadow-fuchsia-500/10',
      badge: 'Attendance & Leaves'
    },
    {
      title: 'Accounts',
      label: 'Accounts',
      description: 'Manage baseline compensation structures, process monthly payroll calculations, and print tax invoices.',
      path: '/accounts',
      icon: Wallet,
      color: 'from-slate-700 to-slate-900',
      shadow: 'shadow-slate-800/10',
      badge: 'Payroll & Invoices'
    }
  ];

  const filteredModules = modules.filter(({ label }) => {
    if (role === 'super_admin') return true;
    if (role === 'admin_admin') return true;
    if (role === 'admin_user') return ['Jobs', 'Candidates', 'Organizations', 'Employees', 'RMEP', 'Accounts'].includes(label);
    if (role === 'hr') return ['Jobs', 'Candidates', 'Organizations', 'Employees', 'RMEP'].includes(label);
    if (role === 'leader') return ['Jobs', 'Candidates', 'RMEP'].includes(label);
    if (role === 'user') return ['Jobs', 'Candidates', 'RMEP'].includes(label);
    return ['Jobs', 'Candidates', 'RMEP'].includes(label);
  });

  return (
    <PageContainer
      title="Home"
      subtitle="Overview of all Right Move systems, tools, and operations modules"
    >
      <div className="flex flex-col gap-8 animate-fade-in max-w-7xl mx-auto pb-12 w-full justify-center flex-1">
        
        {/* Welcome Premium Header Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-8 md:p-10 text-white shadow-xl shadow-indigo-950/15 border border-indigo-900/40">
          <div className="absolute right-0 top-0 -translate-y-6 translate-x-6 opacity-10 blur-sm pointer-events-none">
            <Sparkles size={250} className="text-indigo-400" />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2.5">
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/30 border border-blue-400/20 text-xs font-black uppercase tracking-wider text-blue-200">
                  Operations Control
                </span>
                <span className="text-xs text-blue-300 font-semibold">•</span>
                <span className="text-xs text-blue-300 font-medium">Right Move Staffing Solutions</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Operations Management System</h1>
              <p className="text-base text-indigo-100/80 mt-2 max-w-2xl font-medium leading-relaxed">
                Welcome back! Select a module below to quickly access client settings, candidates, internal employee logs, and financial calculations.
              </p>
            </div>
          </div>
        </div>

        {/* Center Grid Body Section */}
        <div className="flex flex-col items-center justify-center w-full mt-4">
          <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 self-start flex items-center gap-2">
            <Sparkles size={14} className="text-blue-500" /> System Control Panels
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
            {filteredModules.map((m, idx) => {
              const Icon = m.icon;
              return (
                <div
                  key={idx}
                  onClick={() => navigate(m.path)}
                  className="bg-white rounded-2xl border border-gray-150 shadow-sm hover:shadow-lg hover:border-blue-200 transition-all duration-300 p-6 flex flex-col justify-between group cursor-pointer relative overflow-hidden"
                >
                  {/* Subtle top border color glow */}
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${m.color}`} />
                  
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-md bg-slate-50 text-[10px] font-bold text-gray-400 group-hover:text-blue-600 group-hover:bg-blue-50 transition-colors uppercase tracking-wider border border-gray-100">
                        {m.badge}
                      </span>
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${m.color} text-white flex items-center justify-center shadow-md ${m.shadow} group-hover:scale-110 transition-transform duration-300`}>
                        <Icon size={20} />
                      </div>
                    </div>
                    
                    <h3 className="text-lg font-bold text-gray-800 mt-4 group-hover:text-blue-600 transition-colors">
                      {m.title}
                    </h3>
                    <p className="text-xs text-gray-500 font-medium leading-relaxed mt-2">
                      {m.description}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between text-xs font-bold text-blue-600 group-hover:text-blue-700">
                    <span>Open Module</span>
                    <ArrowRight size={14} className="transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </PageContainer>
  );
};

export default HomePage;
