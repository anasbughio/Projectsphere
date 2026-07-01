import axios from 'axios';

const api = axios.create({
  // Local development proxy and deployed same-origin API path
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
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