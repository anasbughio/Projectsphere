import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute'; // Agar use karna ho future mein
import Profile from './pages/Profile';

// Pages
import LandingPage from './pages/LandingPage'; 
import Login from './pages/Login';
import Register from './pages/Register';
import Projects from './pages/Projects';
import Dashboard from './pages/Dashboard';
import KanbanBoard from './pages/KanbanBoard'; // Puraana agar use karna ho
import Team from './pages/Team';
import AuthSuccess from './pages/AuthSuccess';
import TaskForm from './pages/TaskForm';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword'; 
import ResetPassword from './pages/ResetPassword';
import AcceptInvite from './pages/AcceptInvite'; 
import AuditLogs from './pages/AuditLogs'; // Import available
import CalendarView from './components/CalendarView';
import ClientPortal from './pages/ClientPortal';
import ProfileSettings from './pages/ProfileSettings';
import AdminPanel from './pages/AdminPanel'; // Import available
import SuperAdminDashboard from './pages/SuperAdminDashboard';

function App() {
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  
  // 🔥 BUG FIX 1: Safe case-insensitive check lagaya hai
  const isSuperAdmin = user?.role?.toLowerCase() === 'super admin';

  return (
    <BrowserRouter>
      <Routes>
        
        {/* 🔥 BUG FIX 2: SMART ROOT ROUTE */}
        {/* Agar user logged in hai, toh seedha dashboard par bhej do, warna LandingPage dikhao */}
        <Route 
          path="/" 
          element={
            user ? (
              <Navigate to={isSuperAdmin ? "/admin" : "/board"} replace />
            ) : (
              <LandingPage />
            )
          } 
        />
        
        <Route path="/auth-success" element={<AuthSuccess />} />

        {/* Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Route>

        <Route path="/accept-invite" element={<AcceptInvite />} />

        {/* 🔥 BUG FIX 3: DashboardLayout ko bina "path" ke layout wrapper banaya */}
        <Route element={<DashboardLayout />}>
          
          {/* Super Admin Routes */}
          {isSuperAdmin ? (
            <>
              <Route path="/admin" element={<SuperAdminDashboard />} />
              <Route path="/team" element={<Team />} /> 
            </>
          ) : (
            // Normal User Routes
            <>
              <Route path="/board" element={<Dashboard />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/projects/:projectId" element={<KanbanBoard />} />
              <Route path="/tasks" element={<TaskForm />} />
              <Route path="/calendar" element={<CalendarView />} />
              <Route path="/client-portal" element={<ClientPortal />} />
              <Route path="/team" element={<Team />} /> 
              <Route path="/activity" element={<AuditLogs />} />
            </>
          )}
          
          {/* Common Routes inside Dashboard */}
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<ProfileSettings />} />
        </Route>

        {/* ================= CATCH-ALL ROUTE ================= */}
        <Route path="*" element={<Navigate to="/" replace />} />
        
      </Routes>
    </BrowserRouter>
  );
}

export default App;