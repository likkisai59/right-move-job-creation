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
import LoginPage from '../pages/LoginPage';
import { isAuthenticated } from '../api/authApi';

// ── Protected Route Component ────────────────────────────────
const ProtectedRoute = ({ children }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const AppRoutes = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const toggleSidebar = () => setSidebarCollapsed((prev) => !prev);

  return (
    <Routes>
      {/* Public Route */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected Routes (Authenticated) */}
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
                    <Route path="/jobs" element={<JobListPage />} />
                    <Route path="/jobs/create" element={<CreateJobPage />} />
                    <Route path="/jobs/:id" element={<JobDetailsPage />} />
                    <Route path="/jobs/edit/:id" element={<EditJobPage />} />
                    <Route path="/candidates" element={<CandidateListPage />} />
                    <Route path="/candidates/create" element={<AddCandidatePage />} />
                    <Route path="/candidates/:id" element={<CandidateDetails />} />
                    <Route path="/search" element={<GlobalSearchPage />} />

                    {/* Organizations */}
                    <Route path="/organizations" element={<OrganizationListPage />} />
                    <Route path="/organizations/create" element={<OrganizationCreatePage />} />
                    <Route path="/organizations/edit/:id" element={<OrganizationEditPage />} />

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
