import axios from 'axios';

const api = axios.create({
  // Development mein localhost aur production mein Vercel URL
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
});

// Request Interceptor: Agar local storage mein token hai, toh har request ke header mein bhej do
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

export default api;