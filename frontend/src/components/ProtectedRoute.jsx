import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  
  // Agar token nahi hai, toh wapas login par redirect kar do
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Agar token hai, toh requested component render kar do
  return children;
};

export default ProtectedRoute;