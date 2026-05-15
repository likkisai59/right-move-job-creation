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
import CandidateDetails from '../pages/candidates/CandidateDetails';
import GlobalSearchPage from '../pages/GlobalSearchPage';
import OrganizationCreatePage from '../pages/organizations/OrganizationCreatePage';
import OrganizationListPage from '../pages/organizations/OrganizationListPage';
import OrganizationEditPage from '../pages/organizations/OrganizationEditPage';
import EmployeeListPage from '../pages/employees/EmployeeListPage';
import AddEmployeePage from '../pages/employees/AddEmployeePage';
import EditEmployeePage from '../pages/employees/EditEmployeePage';
import LoginPage from '../pages/LoginPage';
import { isAuthenticated } from '../api/authApi';

// ── Attendance Portal Imports ────────────────────────────────
import AttendanceLoginPage from '../pages/attendance/AttendanceLoginPage';
import AttendancePortalLayout from '../components/attendance/AttendancePortalLayout';
import AttendanceMarking from '../pages/attendance/AttendanceMarking';
import ShiftManagement from '../pages/attendance/ShiftManagement';
import LeaveManagement from '../pages/attendance/LeaveManagement';
import AttendanceStatus from '../pages/attendance/AttendanceStatus';

// ── Protected Route Component ────────────────────────────────
const ProtectedRoute = ({ children }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
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

const AppRoutes = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const toggleSidebar = () => setSidebarCollapsed((prev) => !prev);

  return (
    <Routes>
      {/* Admin Login */}
      <Route path="/login" element={<LoginPage />} />

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
        <Route path="shifts" element={<ShiftManagement />} />
        <Route path="leaves" element={<LeaveManagement />} />
        <Route path="status" element={<AttendanceStatus />} />
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
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    
                    {/* Jobs */}
                    <Route path="/jobs" element={<JobListPage />} />
                    <Route path="/jobs/create" element={<CreateJobPage />} />
                    <Route path="/jobs/:id" element={<JobDetailsPage />} />
                    <Route path="/jobs/edit/:id" element={<EditJobPage />} />
                    
                    {/* Candidates */}
                    <Route path="/candidates" element={<CandidateListPage />} />
                    <Route path="/candidates/create" element={<AddCandidatePage />} />
                    <Route path="/candidates/:id" element={<CandidateDetails />} />
                    
                    {/* Global Search */}
                    <Route path="/search" element={<GlobalSearchPage />} />

                    {/* Organizations */}
                    <Route path="/organizations" element={<OrganizationListPage />} />
                    <Route path="/organizations/create" element={<OrganizationCreatePage />} />
                    <Route path="/organizations/edit/:id" element={<OrganizationEditPage />} />

                    {/* Employees */}
                    <Route path="/employees" element={<EmployeeListPage />} />
                    <Route path="/employees/create" element={<AddEmployeePage />} />
                    <Route path="/employees/edit/:id" element={<EditEmployeePage />} />

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
