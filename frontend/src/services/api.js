import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  withCredentials: true, 
  // Fail fast in production when backend is unreachable
  timeout: Number(import.meta.env.VITE_API_TIMEOUT) || 10000,
});

// Request Interceptor (Access token add karne ke liye)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
    return response; // if  request is right then send back the response
  },
  async (error) => {
    const originalRequest = error.config;
const isAuthRoute = originalRequest.url.includes('/auth/login') || originalRequest.url.includes('/auth/register');
    if (
      error.response && 
      error.response.status === 401 && 
      !originalRequest._retry &&
      originalRequest.url !== '/auth/refresh' &&
      !isAuthRoute
    ) {
      originalRequest._retry = true; // true retry flag

      try {
      
        const res = await api.get('/auth/refresh');
        
        // save new access
        const newAccessToken = res.data.token;
        localStorage.setItem('token', newAccessToken);

     
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
        
      } catch (refreshError) {
     
        console.error('Session expired, logging out...');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
    
        window.location.href = '/login'; 
        
        return Promise.reject(refreshError);
      }
    }

   
    return Promise.reject(error);
  }
);

export default api;