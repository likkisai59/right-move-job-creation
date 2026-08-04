import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Shield, Users, Grid, Search, CheckCircle, RefreshCw } from 'lucide-react';
import { getEmployeeRoles, assignEmployeeRole, getPermissionMatrix } from '../../api/settingsApi';
import { getSystemRole } from '../../api/authApi';

const ROLE_OPTIONS = [
  { value: 'user', label: 'User (Recruiter)' },
  { value: 'leader', label: 'Leader (Team Lead)' },
  { value: 'hr', label: 'HR' },
  { value: 'admin_user', label: 'Admin User' },
  { value: 'admin_admin', label: 'Admin Admin' },
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'unassigned', label: 'Unassigned (Zero Access)' },
];

const SettingsPage = () => {
  const currentRole = getSystemRole();
  const [activeTab, setActiveTab] = useState('roles');
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [savingId, setSavingId] = useState(null);
  const [matrix, setMatrix] = useState({});

  const canManage = ['admin_admin', 'super_admin'].includes(currentRole);

  const fetchRolesData = async () => {
    setLoading(true);
    try {
      const res = await getEmployeeRoles();
      if (res.success) {
        setEmployees(res.data || []);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch employee roles');
    } finally {
      setLoading(false);
    }
  };

  const fetchMatrixData = async () => {
    try {
      const res = await getPermissionMatrix();
      if (res.success) {
        setMatrix(res.data || {});
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRolesData();
    fetchMatrixData();
  }, []);

  const handleRoleChange = (empId, newRole) => {
    setEmployees(prev =>
      prev.map(emp => (emp.id === empId ? { ...emp, system_role: newRole } : emp))
    );
  };

  const handleSaveRole = async (emp) => {
    setSavingId(emp.id);
    try {
      const res = await assignEmployeeRole(emp.id, emp.system_role);
      if (res.success) {
        toast.success(`Role '${emp.system_role}' assigned to ${emp.name}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign role');
      fetchRolesData();
    } finally {
      setSavingId(null);
    }
  };

  const filteredEmployees = employees.filter(emp =>
    (emp.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (emp.employee_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (emp.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (emp.designation || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-blue-600 font-semibold text-sm">
            <Shield className="w-5 h-5" /> System Settings & Access Control
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">Role Permissions Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Assign system roles to employees and review module access permissions matching company RBAC rules.
          </p>
        </div>
        <button
          onClick={fetchRolesData}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Refresh Data
        </button>
      </div>

      {/* Tabs Header */}
      <div className="flex border-b border-gray-200 bg-white px-4 rounded-t-xl">
        <button
          onClick={() => setActiveTab('roles')}
          className={`flex items-center gap-2 py-3 px-6 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'roles'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Users className="w-4 h-4" /> Employee Role Assignment
        </button>
        <button
          onClick={() => setActiveTab('matrix')}
          className={`flex items-center gap-2 py-3 px-6 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'matrix'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Grid className="w-4 h-4" /> Permission Matrix Grid
        </button>
      </div>

      {/* Tab 1: Employee Role Assignment */}
      {activeTab === 'roles' && (
        <div className="bg-white rounded-b-xl border border-t-0 border-gray-200 p-6 space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search employee, designation, email..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div className="text-sm text-gray-500">
              Showing <span className="font-semibold text-gray-900">{filteredEmployees.length}</span> employees
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading employee roles...</div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-4">Emp ID</th>
                    <th className="py-3 px-4">Employee Name</th>
                    <th className="py-3 px-4">Designation</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Current System Role</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredEmployees.map(emp => (
                    <tr key={emp.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-blue-600">{emp.employee_id}</td>
                      <td className="py-3 px-4 font-semibold text-gray-900">{emp.name}</td>
                      <td className="py-3 px-4">{emp.designation}</td>
                      <td className="py-3 px-4 text-gray-500">{emp.email}</td>
                      <td className="py-3 px-4">
                        <select
                          value={emp.system_role || 'unassigned'}
                          onChange={e => handleRoleChange(emp.id, e.target.value)}
                          disabled={!canManage}
                          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none font-medium text-gray-800"
                        >
                          {ROLE_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleSaveRole(emp)}
                          disabled={!canManage || savingId === emp.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          {savingId === emp.id ? 'Saving...' : 'Save Role'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Permission Matrix Grid */}
      {activeTab === 'matrix' && (
        <div className="bg-white rounded-b-xl border border-t-0 border-gray-200 p-6 space-y-4 overflow-x-auto">
          <h2 className="text-lg font-bold text-gray-900">7-Role x 7-Module Permission Matrix</h2>
          <p className="text-sm text-gray-500 mb-4">
            Live permission definitions mapped directly to your Excel specification sheet.
          </p>

          <table className="w-full text-left text-xs border-collapse border border-gray-300">
            <thead className="bg-gray-100 text-gray-800 font-bold border-b border-gray-300">
              <tr>
                <th className="p-3 border border-gray-300">Module</th>
                <th className="p-3 border border-gray-300">User</th>
                <th className="p-3 border border-gray-300">Leader</th>
                <th className="p-3 border border-gray-300">HR</th>
                <th className="p-3 border border-gray-300">Admin User</th>
                <th className="p-3 border border-gray-300">Admin Admin</th>
                <th className="p-3 border border-gray-300">Super Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-gray-700 font-medium">
              <tr>
                <td className="p-3 border border-gray-300 font-bold bg-gray-50">Candidate</td>
                <td className="p-3 border border-gray-300 bg-green-50 text-green-800">All Access</td>
                <td className="p-3 border border-gray-300 bg-green-50 text-green-800">All Access</td>
                <td className="p-3 border border-gray-300 bg-blue-50 text-blue-800">View</td>
                <td className="p-3 border border-gray-300 bg-purple-50 text-purple-800">Dashboard Access</td>
                <td className="p-3 border border-gray-300 bg-blue-50 text-blue-800">View</td>
                <td className="p-3 border border-gray-300 bg-blue-50 text-blue-800">View</td>
              </tr>
              <tr>
                <td className="p-3 border border-gray-300 font-bold bg-gray-50">Job</td>
                <td className="p-3 border border-gray-300 bg-green-50 text-green-800">All Access</td>
                <td className="p-3 border border-gray-300 bg-green-50 text-green-800">All Access</td>
                <td className="p-3 border border-gray-300 bg-blue-50 text-blue-800">View</td>
                <td className="p-3 border border-gray-300 bg-green-50 text-green-800">All Access</td>
                <td className="p-3 border border-gray-300 bg-teal-50 text-teal-800">View + Add Rate Card & Incentive</td>
                <td className="p-3 border border-gray-300 bg-blue-50 text-blue-800">View</td>
              </tr>
              <tr>
                <td className="p-3 border border-gray-300 font-bold bg-gray-50">Organization</td>
                <td className="p-3 border border-gray-300 bg-red-50 text-red-700">Not Visible</td>
                <td className="p-3 border border-gray-300 bg-red-50 text-red-700">Not Visible</td>
                <td className="p-3 border border-gray-300 bg-blue-50 text-blue-800">View</td>
                <td className="p-3 border border-gray-300 bg-amber-50 text-amber-800">Add</td>
                <td className="p-3 border border-gray-300 bg-green-50 text-green-800">All Access</td>
                <td className="p-3 border border-gray-300 bg-purple-50 text-purple-800">Dashboard Access</td>
              </tr>
              <tr>
                <td className="p-3 border border-gray-300 font-bold bg-gray-50">RMEP</td>
                <td className="p-3 border border-gray-300 bg-amber-50 text-amber-800">Add</td>
                <td className="p-3 border border-gray-300 bg-indigo-50 text-indigo-800">Add, Edit, Approval</td>
                <td className="p-3 border border-gray-300 bg-amber-50 text-amber-800">Add</td>
                <td className="p-3 border border-gray-300 bg-indigo-50 text-indigo-800">Add, Edit, Approval</td>
                <td className="p-3 border border-gray-300 bg-emerald-50 text-emerald-800">Add, Edit, Approval & Holidays</td>
                <td className="p-3 border border-gray-300 bg-emerald-50 text-emerald-800">Add, Edit, Approval & Holidays</td>
              </tr>
              <tr>
                <td className="p-3 border border-gray-300 font-bold bg-gray-50">Employee</td>
                <td className="p-3 border border-gray-300 bg-red-50 text-red-700">Not Visible</td>
                <td className="p-3 border border-gray-300 bg-red-50 text-red-700">Not Visible</td>
                <td className="p-3 border border-gray-300 bg-amber-50 text-amber-800">Add, Edit (HR Form)</td>
                <td className="p-3 border border-gray-300 bg-amber-50 text-amber-800">Add, Edit (Admin Form)</td>
                <td className="p-3 border border-gray-300 bg-purple-50 text-purple-800">Dashboard Access</td>
                <td className="p-3 border border-gray-300 bg-cyan-50 text-cyan-800">View, Passwords & Access</td>
              </tr>
              <tr>
                <td className="p-3 border border-gray-300 font-bold bg-gray-50">Accounts</td>
                <td className="p-3 border border-gray-300 bg-red-50 text-red-700">Not Visible</td>
                <td className="p-3 border border-gray-300 bg-red-50 text-red-700">Not Visible</td>
                <td className="p-3 border border-gray-300 bg-red-50 text-red-700">Not Visible</td>
                <td className="p-3 border border-gray-300 bg-green-50 text-green-800">All Access</td>
                <td className="p-3 border border-gray-300 bg-green-50 text-green-800">All Access</td>
                <td className="p-3 border border-gray-300 bg-green-50 text-green-800">All Access</td>
              </tr>
              <tr>
                <td className="p-3 border border-gray-300 font-bold bg-gray-50">Settings</td>
                <td className="p-3 border border-gray-300 bg-red-50 text-red-700">Not Visible</td>
                <td className="p-3 border border-gray-300 bg-red-50 text-red-700">Not Visible</td>
                <td className="p-3 border border-gray-300 bg-red-50 text-red-700">Not Visible</td>
                <td className="p-3 border border-gray-300 bg-red-50 text-red-700">Not Visible</td>
                <td className="p-3 border border-gray-300 bg-blue-50 text-blue-800">View & Assign Roles</td>
                <td className="p-3 border border-gray-300 bg-green-50 text-green-800">All Access</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
