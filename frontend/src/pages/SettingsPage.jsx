import React, { useState, useEffect } from 'react';
import PageContainer from '../components/layout/PageContainer';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import {
  Settings,
  Briefcase,
  Plus,
  Save,
  Edit2,
  X,
  Check,
  Shield,
  Sliders,
  Activity,
  LogOut
} from 'lucide-react';
import { fetchDesignations, createDesignation, updateDesignation } from '../api/designationsApi';
import { fetchBusinessUnits, createBusinessUnit, updateBusinessUnit } from '../api/businessUnitsApi';
import { fetchWorkModes, createWorkMode, updateWorkMode } from '../api/workModesApi';
import { fetchExitTypes, createExitType, updateExitType } from '../api/exitTypesApi';

const getApiHelpers = (tab) => {
  switch (tab) {
    case 'business_units':
      return {
        fetch: fetchBusinessUnits,
        create: createBusinessUnit,
        update: updateBusinessUnit,
        entityLabel: 'Business Unit',
        placeholder: 'e.g. IT, HR, Sales...'
      };
    case 'work_modes':
      return {
        fetch: fetchWorkModes,
        create: createWorkMode,
        update: updateWorkMode,
        entityLabel: 'Work Mode',
        placeholder: 'e.g. WFH, Office, Hybrid...'
      };
    case 'exit_types':
      return {
        fetch: fetchExitTypes,
        create: createExitType,
        update: updateExitType,
        entityLabel: 'Exit Type',
        placeholder: 'e.g. Resignation, Termination...'
      };
    case 'designations':
    default:
      return {
        fetch: fetchDesignations,
        create: createDesignation,
        update: updateDesignation,
        entityLabel: 'Designation',
        placeholder: 'e.g. Lead Developer, QA Lead...'
      };
  }
};

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('designations');
  const [items, setItems] = useState([]);
  const [newItemName, setNewItemName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Tab configurations
  const tabs = [
    { id: 'designations', label: 'Designations', icon: Briefcase, active: true },
    { id: 'business_units', label: 'Business Unit', icon: Sliders, active: true },
    { id: 'work_modes', label: 'Work Mode', icon: Activity, active: true },
    { id: 'exit_types', label: 'Exit Type', icon: LogOut, active: true },
  ];

  // Fetch items for current active tab
  const loadItems = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setError(null);
    const api = getApiHelpers(activeTab);
    try {
      const res = await api.fetch();
      if (res.success) {
        setItems(res.data);
      } else {
        setError(res.message || `Failed to load ${api.entityLabel.toLowerCase()}s`);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || `Error fetching ${api.entityLabel.toLowerCase()}s`);
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    setNewItemName('');
    setEditingId(null);
    loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Show success alert temporarily
  const triggerSuccess = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Show error alert temporarily
  const triggerError = (msg) => {
    setError(msg);
    setTimeout(() => setError(null), 3000);
  };

  // Add new item
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    setActionLoading(true);
    setError(null);
    const api = getApiHelpers(activeTab);
    try {
      const res = await api.create(newItemName.trim());
      if (res.success) {
        setNewItemName('');
        triggerSuccess(`${api.entityLabel} added successfully!`);
        loadItems(true);
      } else {
        triggerError(res.message);
      }
    } catch (err) {
      triggerError(err.response?.data?.message || `Failed to add ${api.entityLabel.toLowerCase()}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Start inline editing
  const startEdit = (id, name) => {
    setEditingId(id);
    setEditingName(name);
    setError(null);
  };

  // Save renamed item
  const saveRename = async (id) => {
    if (!editingName.trim()) return;
    setActionLoading(true);
    setError(null);
    const api = getApiHelpers(activeTab);
    try {
      const res = await api.update(id, { name: editingName.trim() });
      if (res.success) {
        setEditingId(null);
        triggerSuccess(`${api.entityLabel} renamed successfully!`);
        loadItems(true);
      } else {
        triggerError(res.message);
      }
    } catch (err) {
      triggerError(err.response?.data?.message || `Failed to update ${api.entityLabel.toLowerCase()}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle item active/inactive status
  const toggleStatus = async (id, currentStatus) => {
    setError(null);
    const api = getApiHelpers(activeTab);
    try {
      const res = await api.update(id, { is_active: !currentStatus });
      if (res.success) {
        loadItems(true);
      } else {
        triggerError(res.message);
      }
    } catch (err) {
      triggerError(err.response?.data?.message || 'Failed to toggle status');
    }
  };

  const currentApi = getApiHelpers(activeTab);

  return (
    <PageContainer>
      {/* Page Title (Sticky/Fixed Header) */}
      <div className="sticky top-0 z-30 bg-gray-50/95 backdrop-blur-md pt-6 pb-4 -mt-6 mb-0 border-b border-gray-200/30 flex items-center gap-3">
        <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
          <Settings size={22} className="animate-spin-slow" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Application Settings</h1>
          <p className="text-sm text-gray-500">Configure global parameters and master data lists</p>
        </div>
      </div>

      <div className="flex flex-col gap-6 animate-fade-in">

        {/* Dynamic Alerts */}
        {successMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm font-semibold rounded-xl flex items-center gap-2 animate-slide-up">
            <Check size={16} />
            {successMessage}
          </div>
        )}

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 text-sm font-semibold rounded-xl flex items-center gap-2 animate-slide-up">
            <X size={16} />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">

          {/* Left Navigation Sidebar */}
          <Card className="lg:col-span-1 p-2 space-y-1 sticky top-[84px] z-20 shadow-sm transition-all duration-200">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-3 py-2 border-b border-gray-50 mb-2">
              Settings Menu
            </h2>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => tab.active && setActiveTab(tab.id)}
                  disabled={!tab.active}
                  className={[
                    'w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                    activeTab === tab.id
                      ? 'bg-blue-50 text-blue-600 font-semibold'
                      : tab.active
                        ? 'text-gray-600 hover:bg-gray-50'
                        : 'text-gray-300 cursor-not-allowed bg-transparent'
                  ].join(' ')}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon size={16} className={activeTab === tab.id ? 'text-blue-600' : 'text-gray-400'} />
                    <span>{tab.label}</span>
                  </div>
                  {tab.badge && (
                    <span className="text-[10px] px-1.5 py-0.5 font-bold uppercase rounded-md bg-gray-100 text-gray-400 scale-90">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </Card>

          {/* Right Main Configuration Window */}
          <div className="lg:col-span-3 space-y-6">

            <div className="space-y-6">

              {/* Add New Box */}
              <Card className="sticky top-[84px] z-20 bg-white shadow-md border border-gray-100/80 transition-all duration-200">
                <h3 className="text-sm font-bold text-gray-800 mb-4">Add Custom {currentApi.entityLabel}</h3>
                <form onSubmit={handleAdd} className="flex gap-3 items-end">
                  <div className="flex-1">
                    <Input
                      placeholder={currentApi.placeholder}
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      disabled={actionLoading}
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    variant="primary"
                    loading={actionLoading}
                    disabled={actionLoading || !newItemName.trim()}
                  >
                    <div className="flex items-center gap-1">
                      <Plus size={16} />
                      <span>Add</span>
                    </div>
                  </Button>
                </form>
              </Card>

              {/* List Table */}
              <Card className="overflow-hidden relative z-0">
                <div className="p-5 border-b border-gray-50 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-800">Existing {currentApi.entityLabel}s</h3>
                  <span className="text-xs font-bold text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-100">
                    Total: {items.length}
                  </span>
                </div>

                {loading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="w-8 h-8 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
                  </div>
                ) : items.length === 0 ? (
                  <div className="text-center py-12 text-gray-400 text-sm">
                    No {currentApi.entityLabel.toLowerCase()}s configured in the database.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50/50">
                          <th className="px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">{currentApi.entityLabel} Name</th>
                          <th className="px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 text-center">Status</th>
                          <th className="px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {items.map((item) => (
                          <tr key={item.id} className="hover:bg-gray-50/30 transition-colors">
                            <td className="px-6 py-4">
                              {editingId === item.id ? (
                                <div className="flex items-center gap-2 max-w-sm">
                                  <Input
                                    value={editingName}
                                    onChange={(e) => setEditingName(e.target.value)}
                                    size="sm"
                                    disabled={actionLoading}
                                  />
                                  <button
                                    onClick={() => saveRename(item.id)}
                                    className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors"
                                    title="Save"
                                  >
                                    <Check size={16} />
                                  </button>
                                  <button
                                    onClick={() => setEditingId(null)}
                                    className="p-1.5 bg-gray-50 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
                                    title="Cancel"
                                  >
                                    <X size={16} />
                                  </button>
                                </div>
                              ) : (
                                <span className={`font-semibold text-sm ${item.is_active ? 'text-gray-700' : 'text-gray-400 line-through'}`}>
                                  {item.name}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className="flex items-center justify-center">
                                <button
                                  role="switch"
                                  aria-checked={item.is_active}
                                  title={item.is_active ? "Click to Deactivate" : "Click to Activate"}
                                  onClick={() => toggleStatus(item.id, item.is_active)}
                                  className={[
                                    'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                                    item.is_active ? 'bg-emerald-500' : 'bg-rose-500'
                                  ].join(' ')}
                                >
                                  <span
                                    className={[
                                      'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out',
                                      item.is_active ? 'translate-x-5' : 'translate-x-0'
                                    ].join(' ')}
                                  />
                                </button>
                              </div>
                            </td>

                            <td className="px-6 py-4 text-right">
                              {editingId !== item.id && (
                                <button
                                  onClick={() => startEdit(item.id, item.name)}
                                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                  title={`Rename ${currentApi.entityLabel}`}
                                >
                                  <Edit2 size={15} />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>

            </div>

          </div>

        </div>

      </div>
    </PageContainer>
  );
};

export default SettingsPage;
