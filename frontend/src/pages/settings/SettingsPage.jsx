import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Shield, Users, Grid, Search, Plus, CheckCircle, RefreshCw, Briefcase, Building, Monitor, LogOut, ChevronRight } from 'lucide-react';
import { getEmployeeRoles, assignEmployeeRole, getPermissionMatrix } from '../../api/settingsApi';
import { fetchDesignations, createDesignation, updateDesignation } from '../../api/designationsApi';
import { fetchBusinessUnits, createBusinessUnit, updateBusinessUnit } from '../../api/businessUnitsApi';
import { fetchWorkModes, createWorkMode, updateWorkMode } from '../../api/workModesApi';
import { fetchExitTypes, createExitType, updateExitType } from '../../api/exitTypesApi';
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

const SETTINGS_NAV_ITEMS = [
  { id: 'roles', label: 'Role Assignment', icon: Users, description: 'Assign system roles to employees' },
  { id: 'matrix', label: 'Permission Matrix', icon: Grid, description: 'Review 7-role access privileges' },
  { id: 'designations', label: 'Designations', icon: Briefcase, description: 'Manage employee designations' },
  { id: 'business_units', label: 'Business Units', icon: Building, description: 'Manage department business units' },
  { id: 'work_modes', label: 'Work Modes', icon: Monitor, description: 'Manage work mode options' },
  { id: 'exit_types', label: 'Exit Types', icon: LogOut, description: 'Manage employee exit reasons' },
];

const SettingsPage = () => {
  const currentRole = getSystemRole();
  const [activeTab, setActiveTab] = useState('roles');
  
  // Role & Matrix States
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [savingId, setSavingId] = useState(null);
  const [matrix, setMatrix] = useState({});

  // Master Data States
  const [masterData, setMasterData] = useState([]);
  const [masterLoading, setMasterLoading] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [adding, setAdding] = useState(false);

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

  const fetchMasterTab = async (tab) => {
    setMasterLoading(true);
    setNewItemName('');
    try {
      let res;
      if (tab === 'designations') res = await fetchDesignations();
      else if (tab === 'business_units') res = await fetchBusinessUnits();
      else if (tab === 'work_modes') res = await fetchWorkModes();
      else if (tab === 'exit_types') res = await fetchExitTypes();

      if (res && res.success !== false) {
        setMasterData(res.data || res || []);
      }
    } catch (err) {
      toast.error('Failed to load master data');
    } finally {
      setMasterLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'roles') fetchRolesData();
    else if (activeTab === 'matrix') fetchMatrixData();
    else fetchMasterTab(activeTab);
  }, [activeTab]);

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

  // Master Data Add/Update
  const handleAddMasterItem = async (e) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    setAdding(true);
    try {
      if (activeTab === 'designations') await createDesignation(newItemName.trim());
      else if (activeTab === 'business_units') await createBusinessUnit(newItemName.trim());
      else if (activeTab === 'work_modes') await createWorkMode(newItemName.trim());
      else if (activeTab === 'exit_types') await createExitType(newItemName.trim());

      toast.success('Item added successfully');
      setNewItemName('');
      fetchMasterTab(activeTab);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add item');
    } finally {
      setAdding(false);
    }
  };

  const handleToggleActive = async (item) => {
    try {
      const updated = { is_active: !item.is_active };
      if (activeTab === 'designations') await updateDesignation(item.id, updated);
      else if (activeTab === 'business_units') await updateBusinessUnit(item.id, updated);
      else if (activeTab === 'work_modes') await updateWorkMode(item.id, updated);
      else if (activeTab === 'exit_types') await updateExitType(item.id, updated);

      toast.success('Status updated');
      fetchMasterTab(activeTab);
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const filteredEmployees = employees.filter(emp =>
    (emp.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (emp.employee_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (emp.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (emp.designation || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-inter">
      {/* Header - Strictly Anchored & Fixed Height */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between shrink-0 h-[100px]">
        <div>
          <div className="flex items-center gap-2 text-blue-600 font-semibold text-sm">
            <Shield className="w-5 h-5" /> Settings & Administration
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">System Configurations</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage employee access roles, permission matrix, and system master data configurations.
          </p>
        </div>
      </div>

      {/* Main Layout: Fixed 580px Height Grid - ZERO Shifting or Jumping */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[580px]">
        
        {/* Left Sub-Sidebar Navigation - Strictly Anchored 580px High */}
        <div className="lg:col-span-1 h-[580px] shrink-0">
          <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm h-[580px] flex flex-col justify-between">
            <div className="space-y-1">
              <div className="px-3 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                Settings Navigation
              </div>
              {SETTINGS_NAV_ITEMS.map((item) => {
                const IconComp = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg text-left text-sm transition-all group ${
                      isActive
                        ? 'bg-blue-600 text-white font-semibold shadow-md'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <IconComp className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'}`} />
                      <span>{item.label}</span>
                    </div>
                    <ChevronRight className={`w-4 h-4 opacity-50 ${isActive ? 'text-white' : 'text-gray-300'}`} />
                  </button>
                );
              })}
            </div>
            
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 text-xs text-gray-500 shrink-0">
              <span className="font-semibold text-gray-700">Right Move CRM v2.4</span>
              <div className="mt-0.5">Role-Based Access Control</div>
            </div>
          </div>
        </div>

        {/* Right Content Area - Strictly Anchored 580px High Container */}
        <div className="lg:col-span-3 h-[580px] shrink-0">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 h-[580px] flex flex-col overflow-hidden">

            {/* Tab Content 1: Roles Assignment */}
            {activeTab === 'roles' && (
              <div className="flex-1 flex flex-col h-full min-h-0">
                <div className="p-3 border-b border-gray-200 bg-gray-50 rounded-t-lg flex items-center justify-between gap-4 mb-4 shrink-0">
                  <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search employee by name, ID, or designation..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-500">
                    Total Employees: {filteredEmployees.length}
                  </span>
                </div>

                {loading ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                    Loading employee roles...
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg">
                    <table className="w-full text-left text-sm text-gray-700">
                      <thead className="bg-gray-100 text-gray-900 font-semibold border-b border-gray-200 sticky top-0 z-10">
                        <tr>
                          <th className="py-3 px-4">Employee ID</th>
                          <th className="py-3 px-4">Employee Name</th>
                          <th className="py-3 px-4">Designation</th>
                          <th className="py-3 px-4">Current System Role</th>
                          <th className="py-3 px-4">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredEmployees.map(emp => (
                          <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                            <td className="py-3 px-4 font-semibold text-gray-900">{emp.employee_id}</td>
                            <td className="py-3 px-4">
                              <div className="font-medium text-gray-900">{emp.name}</div>
                              <div className="text-xs text-gray-500">{emp.email}</div>
                            </td>
                            <td className="py-3 px-4">{emp.designation || 'N/A'}</td>
                            <td className="py-3 px-4">
                              <select
                                value={emp.system_role}
                                onChange={e => handleRoleChange(emp.id, e.target.value)}
                                disabled={!canManage}
                                className="py-1.5 px-3 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                {ROLE_OPTIONS.map(opt => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="py-3 px-4">
                              <button
                                onClick={() => handleSaveRole(emp)}
                                disabled={!canManage || savingId === emp.id}
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
                              >
                                {savingId === emp.id ? (
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <CheckCircle className="w-3.5 h-3.5" />
                                )}
                                Save
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

            {/* Tab Content 2: Permission Matrix */}
            {activeTab === 'matrix' && (
              <div className="flex-1 flex flex-col h-full min-h-0 space-y-4">
                <h2 className="text-lg font-bold text-gray-900 shrink-0">7-Role System Permission Matrix (Excel Specification)</h2>
                <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-900 text-white font-semibold sticky top-0 z-10">
                        <th className="p-3 border border-gray-700">System Role</th>
                        <th className="p-3 border border-gray-700">Candidate</th>
                        <th className="p-3 border border-gray-700">Job Requirement</th>
                        <th className="p-3 border border-gray-700">Organization</th>
                        <th className="p-3 border border-gray-700">RMEP</th>
                        <th className="p-3 border border-gray-700">Employee Operations</th>
                        <th className="p-3 border border-gray-700">Accounts</th>
                        <th className="p-3 border border-gray-700">Settings</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {Object.entries(matrix).map(([roleKey, data]) => (
                        <tr key={roleKey} className="hover:bg-blue-50/50">
                          <td className="p-3 font-bold text-gray-900 border border-gray-200 bg-gray-50">{data.display_name}</td>
                          <td className="p-3 border border-gray-200">{data.candidate}</td>
                          <td className="p-3 border border-gray-200">{data.job}</td>
                          <td className="p-3 border border-gray-200">{data.organization}</td>
                          <td className="p-3 border border-gray-200">{data.rmep}</td>
                          <td className="p-3 border border-gray-200">{data.employee}</td>
                          <td className="p-3 border border-gray-200">{data.accounts}</td>
                          <td className="p-3 border border-gray-200 font-semibold text-blue-600">{data.settings}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab Content 3, 4, 5, 6: Master Data Tabs */}
            {['designations', 'business_units', 'work_modes', 'exit_types'].includes(activeTab) && (
              <div className="flex-1 flex flex-col h-full min-h-0 space-y-4">
                <div className="flex items-center justify-between border-b border-gray-200 pb-4 shrink-0">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 capitalize">
                      Manage {activeTab.replace('_', ' ')}
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Add new items or toggle status for dropdown selections across the CRM system.
                    </p>
                  </div>

                  <form onSubmit={handleAddMasterItem} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder={`New ${activeTab.replace('_', ' ')} name...`}
                      value={newItemName}
                      onChange={e => setNewItemName(e.target.value)}
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                    <button
                      type="submit"
                      disabled={adding || !newItemName.trim()}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50"
                    >
                      <Plus className="w-4 h-4" /> Add
                    </button>
                  </form>
                </div>

                {masterLoading ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                    Loading master configuration...
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto pr-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {masterData.map(item => (
                        <div key={item.id} className="p-4 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-between gap-2 shadow-xs hover:border-gray-300 transition-colors">
                          <div>
                            <div className="font-bold text-gray-900 text-sm">{item.name}</div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              Status: <span className={item.is_active ? 'text-emerald-600 font-semibold' : 'text-red-500 font-semibold'}>{item.is_active ? 'Active' : 'Inactive'}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleToggleActive(item)}
                            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                              item.is_active
                                ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
                                : 'bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100'
                            }`}
                          >
                            {item.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
};

export default SettingsPage;
