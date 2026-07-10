import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, ArrowRight, ArrowLeft } from 'lucide-react';
import api from '../services/api'; // Make sure path is correct

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await api.post('/auth/forgot-password', { email });
      setMessage(response.data.message);
      // Success ke baad user ko reset screen par bhej dein, sath email bhi pass kar dein
      setTimeout(() => {
        navigate('/reset-password', { state: { email } });
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-b from-[#3a3b4e] via-[#2a2a35] to-[#121218] p-4 relative overflow-hidden font-sans">
      
      {/* Background visual effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-[#7c7fff] opacity-10 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-0 w-full h-[30%] bg-gradient-to-t from-[#10101a] to-transparent pointer-events-none border-t border-white/5"></div>

      {/* Header outside the card */}
      <div className="text-center mb-8 z-10">
        <h1 className="text-3xl font-extrabold text-[#d2d4ff] tracking-wide mb-1">ProjectSphere</h1>
      </div>

      {/* Main Card */}
      <div className="bg-[#2a2d3e]/90 backdrop-blur-xl border border-white/5 p-8 rounded-2xl shadow-2xl w-full max-w-[420px] z-10">
        <div className="text-center mb-8">
          <h2 className="text-xl font-bold text-white mb-1">Forgot Password</h2>
          <p className="text-[#84889c] text-sm">Enter your email to receive an OTP</p>
        </div>
        
        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg text-center font-medium">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-6 p-3 bg-green-500/10 border border-green-500/20 text-green-400 text-sm rounded-lg text-center font-medium">
            {message}
          </div>
        )}

        <form onSubmit={handleSendOtp}>
          {/* =========================================
              INPUTS BLOCK 
          ========================================= */}
          <div className="flex flex-col gap-5 mb-6">
            
            {/* Email Input */}
            <div>
              <label className="block text-xs font-semibold text-[#84889c] mb-2 tracking-wide">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={16} className="text-[#606479]" />
                </div>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-[#1a1c26] border border-white/5 rounded-lg text-white placeholder-[#4b4e63] focus:border-[#7c7fff] focus:ring-1 focus:ring-[#7c7fff] focus:outline-none transition"
                  placeholder="name@company.com"
                />
              </div>
            </div>
            
          </div>

          {/* =========================================
              BUTTONS BLOCK 
          ========================================= */}
          <div className="flex flex-col gap-5 mt-8">
            
            {/* Send OTP Button */}
            <button 
              type="submit" 
              disabled={loading}
              className={`w-full flex items-center justify-center gap-2 text-white font-semibold py-2.5 rounded-lg transition ${
                loading ? 'bg-[#5b5eb8] cursor-not-allowed' : 'bg-[#7c7fff] hover:bg-[#6b6de0]'
              }`}
            >
              {loading ? 'Sending...' : 'Send OTP'}
              {!loading && <ArrowRight size={16} />}
            </button>

            {/* Back to Login Button */}
            <Link 
              to="/login"
              className="w-full flex items-center justify-center gap-2 text-[#a0a4b8] font-medium py-2.5 rounded-lg border border-white/10 hover:bg-white/5 transition"
            >
              <ArrowLeft size={16} />
              Back to Sign In
            </Link>
            
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;