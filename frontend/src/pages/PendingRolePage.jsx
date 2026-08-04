import React from 'react';
import { Lock, ShieldAlert, LogOut } from 'lucide-react';
import { logout } from '../api/authApi';

const PendingRolePage = () => {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center space-y-6 shadow-xl border border-gray-100">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto text-amber-600">
          <Lock className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pending Role Assignment</h1>
          <p className="text-sm text-gray-600 mt-2">
            Your employee account is active, but a <span className="font-semibold text-gray-900">System Role</span> has not been assigned yet.
          </p>
        </div>

        <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 text-left flex items-start gap-2.5">
          <ShieldAlert className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
          <div>
            <span className="font-bold">Administrator Action Required:</span> Please contact your Super Admin or Admin Admin to assign your system access permissions in the Settings panel.
          </div>
        </div>

        <button
          onClick={logout}
          className="inline-flex items-center justify-center gap-2 w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl transition-colors shadow-md"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </div>
  );
};

export default PendingRolePage;
