import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

/* ── Public / Auth ── */
import HomePage            from './pages/HomePage';
import LoginPage           from './pages/LoginPage';
import RegistrationExample from './pages/RegistrationExample';
import ForgotPasswordPage  from './pages/ForgotPasswordPage';
import ResetPasswordPage   from './pages/ResetPasswordPage';

/* ── Dashboard ── */
import DashboardPage       from './pages/DashboardPage';
import QuizPage            from './pages/QuizPage';
import QuizAttemptLivePage from './pages/QuizAttemptLivePage';
import AssessmentPage      from './pages/AssessmentPage';
import IDEPage             from './pages/IDEPage';
import TaskManagerPage     from './pages/TaskManagerPage';
import HRPrepPage          from './pages/HRPrepPage';
import CareerRoadmapPage   from './pages/CareerRoadmapPage';

/* ── DSA Platform ── */
import DSAProblemsPage     from './pages/DSAProblemsPage';
import DSACodingPage       from './pages/DSACodingPage';
import DSAProgressPage     from './pages/DSAProgressPage';
import DSALeaderboardPage  from './pages/DSALeaderboardPage';
import DSASubmissionsPage  from './pages/DSASubmissionsPage';
import QuizAttemptPage     from './pages/QuizAttemptPage';

/* ── Aptitude Platform ── */
import AptitudeHubPage      from './pages/AptitudeHubPage';
import AptitudePracticePage from './pages/AptitudePracticePage';
import AptitudeTestPage     from './pages/AptitudeTestPage';
import AptitudeResultPage   from './pages/AptitudeResultPage';
import AptitudeHistoryPage  from './pages/AptitudeHistoryPage';
import AptitudeDailyPage    from './pages/AptitudeDailyPage';

/* ── Attendance Module ── */
import AttendanceDashboard from './pages/attendance/AttendanceDashboard';
import MarkAttendance      from './pages/attendance/MarkAttendance';
import AttendanceHistory   from './pages/attendance/AttendanceHistory';
import AttendanceReports   from './pages/attendance/AttendanceReports';
import LowAttendance       from './pages/attendance/LowAttendance';

/* ── Placement Module ── */
import PlacementDashboard from './pages/placement/PlacementDashboard';
import Companies          from './pages/placement/Companies';
import UpcomingDrives     from './pages/placement/UpcomingDrives';
import DriveDetails       from './pages/placement/DriveDetails';
import Telecalling        from './pages/placement/Telecalling';

/* ── Admin ── */
import AdminPage from './pages/AdminPage';
/* ── Mock Tests (student) ── */
import MockTestsPage       from './pages/student/MockTestsPage';
import MockTestExamPage    from './pages/student/MockTestExamPage';
import MockTestResultPage  from './pages/student/MockTestResultPage';
import MockTestHistoryPage from './pages/student/MockTestHistoryPage';
/* ── Notifications (student) ── */
import NotificationsPage   from './pages/student/NotificationsPage';

import './App.css';

const toastStyle = {
  style: {
    background: '#fff', color: '#1f2937', fontSize: '14px',
    fontWeight: '500', padding: '12px 16px', borderRadius: '8px',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
  },
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Toaster
            position="top-right"
            reverseOrder={false}
            gutter={8}
            toastOptions={{
              duration: 3000,
              ...toastStyle,
              success: { duration: 3000, iconTheme: { primary: '#10b981', secondary: '#fff' }, style: { ...toastStyle.style, border: '1px solid #d1fae5' } },
              error:   { duration: 4000, iconTheme: { primary: '#ef4444', secondary: '#fff' }, style: { ...toastStyle.style, border: '1px solid #fee2e2' } },
              loading: { iconTheme: { primary: '#0c5273', secondary: '#fff' } },
            }}
          />

          <Routes>

            {/* ── Public ── */}
            <Route path="/"               element={<Navigate to="/home" replace />} />
            <Route path="/home"           element={<HomePage />} />
            <Route path="/login"          element={<LoginPage />} />
            <Route path="/register"       element={<RegistrationExample />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

            {/* ── Dashboard ── */}
            <Route path="/dashboard"                  element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/dashboard/quizzes"          element={<ProtectedRoute><QuizPage /></ProtectedRoute>} />
            <Route path="/dashboard/quizzes/*"        element={<ProtectedRoute><QuizPage /></ProtectedRoute>} />
            <Route path="/dashboard/quiz-attempt/:id" element={<ProtectedRoute><QuizAttemptLivePage /></ProtectedRoute>} />
            <Route path="/dashboard/assessments"      element={<ProtectedRoute><AssessmentPage /></ProtectedRoute>} />
            <Route path="/dashboard/assessments/*"    element={<ProtectedRoute><AssessmentPage /></ProtectedRoute>} />
            <Route path="/dashboard/tasks"            element={<ProtectedRoute><TaskManagerPage /></ProtectedRoute>} />
            <Route path="/dashboard/roadmap"          element={<ProtectedRoute><CareerRoadmapPage /></ProtectedRoute>} />
            <Route path="/dashboard/hr-prep"          element={<ProtectedRoute><HRPrepPage /></ProtectedRoute>} />
            <Route path="/hr-prep"                    element={<ProtectedRoute><HRPrepPage /></ProtectedRoute>} />
            <Route path="/dashboard/ide"              element={<ProtectedRoute><IDEPage /></ProtectedRoute>} />

            {/* ── DSA Platform ── */}
            <Route path="/dsa"              element={<ProtectedRoute><DSAProblemsPage /></ProtectedRoute>} />
            <Route path="/dsa/progress"     element={<ProtectedRoute><DSAProgressPage /></ProtectedRoute>} />
            <Route path="/dsa/leaderboard"  element={<ProtectedRoute><DSALeaderboardPage /></ProtectedRoute>} />
            <Route path="/dsa/submissions"  element={<ProtectedRoute><DSASubmissionsPage /></ProtectedRoute>} />
            <Route path="/dsa/:slug"        element={<ProtectedRoute><DSACodingPage /></ProtectedRoute>} />
            <Route path="/dashboard/aptitude/quiz/:id" element={<ProtectedRoute><QuizAttemptPage /></ProtectedRoute>} />

            {/* ── Aptitude Platform ── */}
            <Route path="/aptitude"                   element={<ProtectedRoute><AptitudeHubPage /></ProtectedRoute>} />
            <Route path="/dashboard/aptitude"         element={<Navigate to="/aptitude" replace />} />
            <Route path="/aptitude/practice"          element={<ProtectedRoute><AptitudePracticePage /></ProtectedRoute>} />
            <Route path="/aptitude/test/:id"          element={<ProtectedRoute><AptitudeTestPage /></ProtectedRoute>} />
            <Route path="/aptitude/result/:attemptId" element={<ProtectedRoute><AptitudeResultPage /></ProtectedRoute>} />
            <Route path="/aptitude/history"           element={<ProtectedRoute><AptitudeHistoryPage /></ProtectedRoute>} />
            <Route path="/aptitude/daily"             element={<ProtectedRoute><AptitudeDailyPage /></ProtectedRoute>} />

            {/* ── Attendance Module ── */}
            <Route path="/attendance"          element={<ProtectedRoute><AttendanceDashboard /></ProtectedRoute>} />
            <Route path="/attendance/mark"     element={<ProtectedRoute><MarkAttendance /></ProtectedRoute>} />
            <Route path="/attendance/history"  element={<ProtectedRoute><AttendanceHistory /></ProtectedRoute>} />
            <Route path="/attendance/reports"  element={<ProtectedRoute><AttendanceReports /></ProtectedRoute>} />
            <Route path="/attendance/low"      element={<ProtectedRoute><LowAttendance /></ProtectedRoute>} />

            {/* ── Placement Module ── */}
            <Route path="/placement"                element={<ProtectedRoute><PlacementDashboard /></ProtectedRoute>} />
            <Route path="/placement/companies"      element={<ProtectedRoute><Companies /></ProtectedRoute>} />
            <Route path="/placement/companies/:id"  element={<ProtectedRoute><Companies /></ProtectedRoute>} />
            <Route path="/placement/drives"         element={<ProtectedRoute><UpcomingDrives /></ProtectedRoute>} />
            <Route path="/placement/drives/new"     element={<ProtectedRoute><UpcomingDrives /></ProtectedRoute>} />
            <Route path="/placement/drives/:id"     element={<ProtectedRoute><DriveDetails /></ProtectedRoute>} />
            <Route path="/placement/telecalling"    element={<ProtectedRoute><Telecalling /></ProtectedRoute>} />

            {/* ── Admin ── */}
            <Route path="/admin"   element={<AdminPage />} />
            <Route path="/admin/*" element={<AdminPage />} />
            {/* ── Mock Tests (student) ── */}
            <Route path="/student/mock-tests"         element={<ProtectedRoute><MockTestsPage /></ProtectedRoute>} />
            <Route path="/student/mock-tests/history" element={<ProtectedRoute><MockTestHistoryPage /></ProtectedRoute>} />
            <Route path="/student/mock-tests/:id"     element={<ProtectedRoute><MockTestExamPage /></ProtectedRoute>} />
            <Route path="/student/mock-tests/:id/result" element={<ProtectedRoute><MockTestResultPage /></ProtectedRoute>} />
            {/* ── Notifications (student) ── */}
            <Route path="/student/notifications"      element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />

            {/* ── 404 ── */}
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
