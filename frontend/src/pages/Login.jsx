import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import api from '../services/api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password });
      
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      navigate('/board');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
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
        <p className="text-[#a0a4b8] text-sm">Enterprise-grade productivity, redefined.</p>
      </div>

      {/* Main Card */}
      <div className="bg-[#2a2d3e]/90 backdrop-blur-xl border border-white/5 p-8 rounded-2xl shadow-2xl w-full max-w-[420px] z-10">
        <div className="text-center mb-8">
          <h2 className="text-xl font-bold text-white mb-1">Welcome Back</h2>
          <p className="text-[#84889c] text-sm">Please enter your details to sign in</p>
        </div>
        
        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          {/* =========================================
              INPUTS BLOCK 
              (Inputs grouped strictly separate)
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

            {/* Password Input */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-semibold text-[#84889c] tracking-wide">Password</label>
                <a href="#" className="text-xs font-medium text-[#7c7fff] hover:text-[#979aff] transition">Forgot password?</a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={16} className="text-[#606479]" />
                </div>
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-10 py-2.5 bg-[#1a1c26] border border-white/5 rounded-lg text-white placeholder-[#4b4e63] focus:border-[#7c7fff] focus:ring-1 focus:ring-[#7c7fff] focus:outline-none transition"
                  placeholder="••••••••"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[#606479] hover:text-[#a0a4b8] focus:outline-none transition flex items-center justify-center"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Checkbox */}
            <div className="flex items-center mt-1">
              <input 
                type="checkbox" 
                id="remember" 
                className="w-4 h-4 rounded border-white/10 bg-[#1a1c26] text-[#7c7fff] focus:ring-[#7c7fff] focus:ring-offset-0 focus:ring-offset-transparent cursor-pointer"
              />
              <label htmlFor="remember" className="ml-2 text-xs font-medium text-[#84889c] cursor-pointer">
                Stay logged in for 30 days
              </label>
            </div>
            
          </div>

          {/* =========================================
              BUTTONS BLOCK 
              (Actions grouped strictly separate)
          ========================================= */}
          <div className="flex flex-col gap-5 mt-8">
            
            {/* Primary Sign In Button */}
            <button 
              type="submit" 
              disabled={loading}
              className={`w-full flex items-center justify-center gap-2 text-white font-semibold py-2.5 rounded-lg transition ${
                loading ? 'bg-[#5b5eb8] cursor-not-allowed' : 'bg-[#7c7fff] hover:bg-[#6b6de0]'
              }`}
            >
              {loading ? 'Signing in...' : 'Sign In'}
              {!loading && <ArrowRight size={16} />}
            </button>

            {/* Divider */}
            <div className="flex items-center justify-center gap-3">
              <div className="h-px w-full bg-white/5"></div>
              <span className="text-[10px] font-semibold text-[#606479] tracking-widest whitespace-nowrap">OR CONTINUE WITH</span>
              <div className="h-px w-full bg-white/5"></div>
            </div>

            {/* SSO Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button type="button" className="flex items-center justify-center gap-2 bg-[#1a1c26] border border-white/5 hover:bg-[#222533] transition text-[#a0a4b8] text-sm font-medium py-2.5 rounded-lg">
                <svg width="16" height="16" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google
              </button>
              <button type="button" className="flex items-center justify-center gap-2 bg-[#1a1c26] border border-white/5 hover:bg-[#222533] transition text-[#a0a4b8] text-sm font-medium py-2.5 rounded-lg">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                SAML SSO
              </button>
            </div>
            
          </div>
        </form>
      </div>

      {/* Footer text outside the card */}
      <div className="mt-8 z-10 text-center">
        <p className="text-sm text-[#606479]">
          Don't have an account?{' '}
          <Link to="/register" className="text-[#7c7fff] hover:text-[#979aff] font-medium transition">
            Request Access
          </Link>
        </p>
      </div>
      
    </div>
  );
};

export default Login;