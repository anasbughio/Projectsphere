import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';

const VerifyEmail = () => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email; // Register se email yahan mil gayi

  const handleVerify = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/auth/verify-email', { email, code });
      
      // Token aur user data save karein
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      navigate('/board'); // Verification complete, ab board par bhej dein
    } catch (err) {
      alert(err.response?.data?.message || 'Verification failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#121218] text-white">
      <form onSubmit={handleVerify} className="bg-[#2a2d3e] p-8 rounded-2xl w-full max-w-sm">
        <h2 className="text-xl font-bold mb-4">Verify your email</h2>
        <p className="text-[#84889c] text-sm mb-6">We sent a code to {email}</p>
        <input 
          type="text" 
          maxLength="6"
          placeholder="Enter 6-digit code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full p-3 mb-4 bg-[#1a1c26] rounded-lg border border-white/10"
        />
      <button 
          type="submit" 
          disabled={loading} // 🔥 FIX: Loading ke dauran button disable karein
          className={`w-full py-2.5 rounded-lg font-semibold transition ${
            loading ? 'bg-[#4b4d99] cursor-not-allowed text-white/70' : 'bg-[#7c7fff] hover:bg-[#6b6de0]'
          }`}
        >
          {loading ? 'Verifying...' : 'Verify'}
        </button>
      </form>
    </div>
  );
};

export default VerifyEmail;