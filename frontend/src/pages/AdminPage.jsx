import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AdminLayout        from '../admin/AdminLayout';
import AdminOverview      from '../admin/AdminOverview';
import AdminQuizzes       from '../admin/AdminQuizzes';
import AdminQuestions     from '../admin/AdminQuestions';
import AdminStudents      from '../admin/AdminStudents';
import AdminReports       from '../admin/AdminReports';
import AdminMockTests     from '../admin/AdminMockTests';
import AdminNotifications from '../admin/AdminNotifications';

/* ── Guard: only admin role can see this ── */
const AdminGuard = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <svg className="animate-spin h-7 w-7 text-amber-400" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
      </div>
    );
  }

  if (!user)            return <Navigate to="/login"     replace />;
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace />;

  return children;
};

const AdminPage = () => (
  <AdminGuard>
    <AdminLayout>
      <Routes>
        <Route index                  element={<AdminOverview      />} />
        <Route path="quizzes"         element={<AdminQuizzes       />} />
        <Route path="questions"       element={<AdminQuestions     />} />
        <Route path="students"        element={<AdminStudents      />} />
        <Route path="reports"         element={<AdminReports       />} />
        <Route path="mock-tests"      element={<AdminMockTests     />} />
        <Route path="mock-tests/*"    element={<AdminMockTests     />} />
        <Route path="notifications"   element={<AdminNotifications />} />
        <Route path="*"               element={<Navigate to="/admin" replace />} />
      </Routes>
    </AdminLayout>
  </AdminGuard>
);

export default AdminPage;
