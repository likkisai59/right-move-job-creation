import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import Dashboard from '../pages/Dashboard';
import JobListPage from '../pages/jobs/JobListPage';
import CreateJobPage from '../pages/jobs/CreateJobPage';
import EditJobPage from '../pages/jobs/EditJobPage';
import CandidateListPage from '../pages/candidates/CandidateListPage';
import AddCandidatePage from '../pages/candidates/AddCandidatePage';
import GlobalSearchPage from '../pages/GlobalSearchPage';

const AppRoutes = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = () => setSidebarCollapsed((prev) => !prev);

  return (
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
            <Route path="/jobs/edit/:id" element={<EditJobPage />} />
            <Route path="/candidates" element={<CandidateListPage />} />
            <Route path="/candidates/create" element={<AddCandidatePage />} />
            <Route path="/search" element={<GlobalSearchPage />} />
            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default AppRoutes;
