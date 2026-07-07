import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  // 👉 NAYA: Cookies ko backend tak bhejne ke liye laazmi hai
  withCredentials: true, 
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

// 👉 NAYA: Response Interceptor (Token expire hone par Refresh handle karne ke liye)
api.interceptors.response.use(
  (response) => {
    return response; // Agar request theek hai toh response wapas bhej do
  },
  async (error) => {
    const originalRequest = error.config;

    // Agar 401 error aaya hai aur humne pehle retry nahi kiya
    // (Aur make sure karein ke error khud /refresh route ka nahi hai warna infinite loop ban jayega)
    if (
      error.response && 
      error.response.status === 401 && 
      !originalRequest._retry &&
      originalRequest.url !== '/auth/refresh'
    ) {
      originalRequest._retry = true; // Retry flag true kar dein

      try {
        // Backend se naya token mangwayen using HTTP-only cookie
        const res = await api.get('/auth/refresh');
        
        // Naya access token save karein
        const newAccessToken = res.data.token;
        localStorage.setItem('token', newAccessToken);

        // Purani fail hone wali request ke header mein naya token lagayen aur dobara bhejein
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
        
      } catch (refreshError) {
        // Agar Refresh Token bhi expire ya invalid ho gaya hai, toh User ko strictly logout kar dein
        console.error('Session expired, logging out...');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // window.location ko use karke strictly login page par bhej dein
        window.location.href = '/login'; 
        
        return Promise.reject(refreshError);
      }
    }

    // Kisi aur error (404, 500 etc.) ki soorat mein waise hi error pass kar dein
    return Promise.reject(error);
  }
);

export default api;