import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';

// Role-specific login pages
import HODLogin from './pages/HODLogin';
import StaffLogin from './pages/StaffLogin';
import StudentLogin from './pages/StudentLogin';

// Role-specific register pages
import HODRegister from './pages/HODRegister';
import StaffRegister from './pages/StaffRegister';
import StudentRegister from './pages/StudentRegister';

// Role-specific dashboards
import HODDashboard from './pages/HODDashboard';
import StaffDashboard from './pages/StaffDashboard';
import StudentDashboard from './pages/StudentDashboard';
import TeamDashboard from './pages/TeamDashboard';
import MessagesPage from './pages/MessagesPage';
import NotificationsPage from './pages/NotificationsPage';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Home/Landing page */}
          <Route path="/" element={<Home />} />
          
          {/* HOD routes */}
          <Route path="/login/hod" element={<HODLogin />} />
          <Route path="/register/hod" element={<HODRegister />} />
          <Route
            path="/dashboard/hod"
            element={
              <ProtectedRoute allowedRoles={['HOD']}>
                <HODDashboard />
              </ProtectedRoute>
            }
          />
          
          {/* Staff routes */}
          <Route path="/login/staff" element={<StaffLogin />} />
          <Route path="/register/staff" element={<StaffRegister />} />
          <Route
            path="/dashboard/staff"
            element={
              <ProtectedRoute allowedRoles={['Staff']}>
                <StaffDashboard />
              </ProtectedRoute>
            }
          />
          
          {/* Student routes */}
          <Route path="/login/student" element={<StudentLogin />} />
          <Route
            path="/dashboard/student"
            element={
              <ProtectedRoute allowedRoles={['Student']}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          
          {/* Team routes */}
          <Route
            path="/team/:teamId"
            element={
              <ProtectedRoute allowedRoles={['HOD', 'Staff', 'Student']}>
                <TeamDashboard />
              </ProtectedRoute>
            }
          />
          
          {/* Communication routes */}
          <Route
            path="/messages"
            element={
              <ProtectedRoute allowedRoles={['HOD', 'Staff', 'Student']}>
                <MessagesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute allowedRoles={['HOD', 'Staff', 'Student']}>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />
          
          {/* 404 redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
