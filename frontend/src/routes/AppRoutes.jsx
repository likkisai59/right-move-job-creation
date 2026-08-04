import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import Dashboard from '../pages/Dashboard';
import JobListPage from '../pages/jobs/JobListPage';
import CreateJobPage from '../pages/jobs/CreateJobPage';
import EditJobPage from '../pages/jobs/EditJobPage';
import JobDetailsPage from '../pages/jobs/JobDetailsPage';
import CandidateListPage from '../pages/candidates/CandidateListPage';
import AddCandidatePage from '../pages/candidates/AddCandidatePage';
import EditCandidatePage from '../pages/candidates/EditCandidatePage';
import CandidateDetails from '../pages/candidates/CandidateDetails';
import GlobalSearchPage from '../pages/GlobalSearchPage';
import OrganizationCreatePage from '../pages/organizations/OrganizationCreatePage';
import OrganizationListPage from '../pages/organizations/OrganizationListPage';
import OrganizationEditPage from '../pages/organizations/OrganizationEditPage';
import EmployeeListPage from '../pages/employees/EmployeeListPage';
import AddEmployeePage from '../pages/employees/AddEmployeePage';
import EditEmployeePage from '../pages/employees/EditEmployeePage';
import SettingsPage from '../pages/settings/SettingsPage';
import PendingRolePage from '../pages/PendingRolePage';
import LoginPage from '../pages/LoginPage';
import AccountsPage from '../pages/accounts/AccountsPage';
import EditAccountPage from '../pages/accounts/EditAccountPage';
import HomePage from '../pages/HomePage';
import { isAuthenticated, checkPermission, getSystemRole } from '../api/authApi';

// ── Attendance Portal Imports ────────────────────────────────
import AttendanceLoginPage from '../pages/attendance/AttendanceLoginPage';
import AttendancePortalLayout from '../components/attendance/AttendancePortalLayout';
import AttendanceMarking from '../pages/attendance/AttendanceMarking';
import LeaveManagement from '../pages/attendance/LeaveManagement';
import AttendanceStatus from '../pages/attendance/AttendanceStatus';
import ManageApprovals from '../pages/attendance/ManageApprovals';
import AssignedTasks from '../pages/attendance/AssignedTasks';

// ── Protected Route Component ────────────────────────────────
const ProtectedRoute = ({ children }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  const role = getSystemRole();
  if (role === 'unassigned') {
    return <PendingRolePage />;
  }
  return children;
};

// ── Permission Protected Route Component ─────────────────────
const PermissionProtectedRoute = ({ children, action }) => {
  if (!checkPermission(action)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

// ── Employee Protected Route ─────────────────────────────────
const EmployeeProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('employee_token');
  if (!token) {
    return <Navigate to="/attendance-login" replace />;
  }
  return children;
};

// ── Manager Protected Route ──────────────────────────────────
const ManagerProtectedRoute = ({ children }) => {
  const employee = JSON.parse(localStorage.getItem('employee_data') || '{}');
  const designation = employee.designation || '';
  const normalized = designation.toLowerCase().trim().replace(/[\s\.-]+/g, '');
  const nameNormalized = (employee.name || '').toLowerCase().trim();
  const isManager = ['teamlead', 'assistantmanager', 'asstmanager', 'manager', 'seniormanager', 'srmanager', 'director'].includes(normalized) || nameNormalized === 'sunmeet singh';

  if (!isManager) {
    return <Navigate to="/attendance/portal/mark" replace />;
  }
  return children;
};

const AppRoutes = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const toggleSidebar = () => setSidebarCollapsed((prev) => !prev);

  return (
    <Routes>
      {/* Admin Login */}
      <Route path="/login" element={<LoginPage />} />

      {/* Employee Portal Login */}
      <Route path="/attendance-login" element={<AttendanceLoginPage />} />

      {/* Employee Portal (Protected) */}
      <Route
        path="/attendance/portal"
        element={
          <EmployeeProtectedRoute>
            <AttendancePortalLayout />
          </EmployeeProtectedRoute>
        }
      >
        <Route index element={<Navigate to="mark" replace />} />
        <Route path="mark" element={<AttendanceMarking />} />
        <Route path="tasks" element={<AssignedTasks />} />
        <Route path="leaves" element={<LeaveManagement />} />
        <Route path="status" element={<AttendanceStatus />} />
        <Route
          path="approvals"
          element={
            <ManagerProtectedRoute>
              <ManageApprovals />
            </ManagerProtectedRoute>
          }
        />
      </Route>

      {/* Admin Dashboard & CRM Routes */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <div className="flex h-screen overflow-hidden bg-gray-50">
              {/* Sidebar */}
              <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />

              {/* Main content */}
              <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
                {/* Header */}
                <Header onSidebarToggle={toggleSidebar} />

                {/* Page content */}
                <div className="flex-1 overflow-hidden flex flex-col">
                  <Routes>
                    <Route path="/" element={<Navigate to="/home" replace />} />
                    <Route path="/home" element={<HomePage />} />
                    <Route path="/dashboard" element={<Dashboard />} />

                     {/* Jobs */}
                     <Route path="/jobs" element={<JobListPage />} />
                     <Route path="/jobs/create" element={<PermissionProtectedRoute action="add_job"><CreateJobPage /></PermissionProtectedRoute>} />
                     <Route path="/jobs/:id" element={<JobDetailsPage />} />
                     <Route path="/jobs/edit/:id" element={<EditJobPage />} />
 
                     {/* Candidates */}
                     <Route path="/candidates" element={<CandidateListPage />} />
                     <Route path="/candidates/create" element={<PermissionProtectedRoute action="add_candidate"><AddCandidatePage /></PermissionProtectedRoute>} />
                     <Route path="/candidates/edit/:id" element={<EditCandidatePage />} />
                     <Route path="/candidates/:id" element={<CandidateDetails />} />
 
                     {/* Global Search */}
                     <Route path="/search" element={<GlobalSearchPage />} />
 
                     {/* Organizations */}
                     <Route path="/organizations" element={<OrganizationListPage />} />
                     <Route path="/organizations/create" element={<PermissionProtectedRoute action="add_organization"><OrganizationCreatePage /></PermissionProtectedRoute>} />
                     <Route path="/organizations/edit/:id" element={<OrganizationEditPage />} />
 
                     {/* Employees */}
                     <Route path="/employees" element={<EmployeeListPage />} />
                     <Route path="/employees/create" element={<PermissionProtectedRoute action="add_employee"><AddEmployeePage /></PermissionProtectedRoute>} />
                     <Route path="/employees/edit/:id" element={<EditEmployeePage />} />

                     {/* Accounts */}
                     <Route path="/accounts" element={<AccountsPage />} />
                     <Route path="/accounts/edit/:employeeId" element={<EditAccountPage />} />

                    {/* Settings */}
                    <Route path="/settings" element={<SettingsPage />} />

                    {/* Catch-all within protected area */}
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </div>
              </div>
            </div>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

export default AppRoutes;
