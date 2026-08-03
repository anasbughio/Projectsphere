import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import api from '../services/api'; // Apni api file ka path theek kar lijiyega

const AcceptInvite = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/team/accept-invite', {
        token,
        email,
        name,
        password
      });
      alert('Account created successfully! Please login.');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to accept invitation');
    } finally {
      setLoading(false);
    }
  };

  if (!token || !email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#13151f] text-white">
        <h2>Invalid Invitation Link</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#13151f] p-4 font-sans">
      <div className="bg-[#1a1c26] border border-white/10 rounded-2xl w-full max-w-md p-8 shadow-2xl">
        <h2 className="text-2xl font-bold text-white mb-2 text-center">Accept Invitation</h2>
        <p className="text-[#84889c] text-sm text-center mb-6">
          Setting up account for <strong>{email}</strong>
        </p>

        {error && <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg text-sm mb-4">{error}</div>}

        <form onSubmit={handleSubmit}>
          {/*  INPUTS BLOCK (Strictly Separate) */}
          <div className="flex flex-col gap-5 mb-8">
            <div>
              <label className="block text-xs font-semibold text-[#84889c] mb-2 uppercase">Your Full Name</label>
              <input 
                type="text" required value={name} onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#13151f] border border-white/5 rounded-lg text-white focus:outline-none focus:border-[#7c7fff]"
                placeholder="E.g. Haseeb Bhai"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#84889c] mb-2 uppercase">Set Password</label>
              <input 
                type="password" required value={password} onChange={(e) => setPassword(e.target.value)} minLength="6"
                className="w-full px-4 py-2.5 bg-[#13151f] border border-white/5 rounded-lg text-white focus:outline-none focus:border-[#7c7fff]"
                placeholder="Min 6 characters"
              />
            </div>
          </div>

          {/* BUTTONS BLOCK (Strictly Separate) */}
          <div className="flex justify-end pt-4 border-t border-white/5">
            <button 
              type="submit" disabled={loading} 
              className="w-full py-3 rounded-lg font-bold text-white bg-[#7c7fff] hover:bg-[#6b6de0] transition flex justify-center items-center"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AcceptInvite;