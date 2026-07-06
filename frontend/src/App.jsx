import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import LandingPage from './pages/LandingPage'; // <-- Naya Landing Page Import kiya
import Login from './pages/Login';
import Register from './pages/Register';
import Projects from './pages/Projects';
import Dashboard from './pages/Dashboard';
import KanbanBoard from './pages/KanbanBoard';
import Team from './pages/Team';
import AuthSuccess from './pages/AuthSuccess';
import TaskForm from './pages/TaskForm';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        
        {/* ================= PUBLIC ROUTES ================= */}
        {/* Landing Page: Bina login kiye sab se pehle yeh nazar aayega */}
        <Route path="/" element={<LandingPage />} />
        
        <Route path="/auth-success" element={<AuthSuccess />} />

        {/* Auth Routes (Login / Register) */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>


        {/* ================= PROTECTED ROUTES ================= */}
        {/* Sirf logged-in users yahan ja sakte hain */}
        <Route 
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          {/* Ab main dashboard ka rasta /board hai */}
          <Route path="/board" element={<Dashboard />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:projectId" element={<KanbanBoard />} />
          <Route path="/team" element={<Team />} />
          <Route path="/tasks" element={<TaskForm />} />
        </Route>


        {/* ================= CATCH-ALL ROUTE ================= */}
        {/* Agar koi invalid URL type kare, toh usay wapas root/landing par bhej do */}
        <Route path="*" element={<Navigate to="/" replace />} />
        
      </Routes>
    </BrowserRouter>
  );
}

export default App;