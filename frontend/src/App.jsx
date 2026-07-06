import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Projects from './pages/Projects';
import Dashboard from './pages/Dashboard';
import KanbanBoard from './pages/KanbanBoard';
import Team from './pages/Team';
import AuthSuccess from './pages/AuthSuccess';
import TaskForm from './pages/TaskForm';
// Placeholder for Kanban Board (added text-white for visibility on dark theme)
// const KanbanBoard = () => <div className="text-xl font-medium text-white">Kanban Board Area</div>;

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth Routes (Public) */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>
<Route path="/auth-success" element={<AuthSuccess />} />
        {/* Dashboard Routes (Protected) */}
        <Route 
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          {/* Agar user authenticated hai aur root '/' par aata hai, toh usay board par bhej do */}
          <Route path="/" element={<Navigate to="/board" replace />} />
          <Route path="/board" element={<Dashboard />} />
      
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:projectId" element={<KanbanBoard />} />
          <Route path="/team" element={<Team />} />
          <Route path="/tasks" element={<TaskForm />} />

        </Route>

        {/* Catch-all route: Agar koi invalid URL type kare, toh usay login par bhej do */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;