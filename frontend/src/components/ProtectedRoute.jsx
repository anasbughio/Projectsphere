import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  
 // if token not found then go to login 
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // to token exist then render to component
  return children;
};

export default ProtectedRoute;