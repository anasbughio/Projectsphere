import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const AuthSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("Checking data...");

  useEffect(() => {
    const token = searchParams.get('token');
    let userData = searchParams.get('userData');

    console.log("1. Token URL se mila:", token);
    console.log("2. UserData URL se mila:", userData);

    if (token && userData) {
      try {
        // save data on local storage
        localStorage.setItem('token', token);
        
        // Decode the URL-encoded JSON data before parsing
        const decodedUserData = decodeURIComponent(userData);
        const parsedUser = JSON.parse(decodedUserData);
        localStorage.setItem('user', JSON.stringify(parsedUser));
        
        console.log("3. LocalStorage mein save ho gaya:", parsedUser);
        setStatus("Login Successful! Redirecting in 3 seconds...");

        const normalizedRole = parsedUser.role?.toString().trim().toLowerCase();
        const targetRoute = normalizedRole === 'super admin' ? '/admin' : '/board';

        setTimeout(() => {
          navigate(targetRoute, { replace: true });
        }, 3000);

      } catch (error) {
        console.error("Data parse karne mein error:", error);
        setStatus("Error parsing user data.");
      }
    } else {
      console.log("Token ya UserData URL mein missing hai!");
      setStatus("Authentication failed. Missing data.");
    }
  }, [navigate, searchParams]);

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#121218] text-white">
      <div className="mb-4 text-xl font-bold">{status}</div>
      <p className="text-gray-400">Right click  Inspect  Console check karein</p>
    </div>
  );
};

export default AuthSuccess;