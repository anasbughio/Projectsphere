import { Navigate } from 'react-router-dom';

const SuperAdminRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  
  // Check if user exists and explicitly has the Super Admin role
  if (!user || user.role !== 'Super Admin') {
    // Redirect unauthorized users to the standard dashboard
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

export default SuperAdminRoute;