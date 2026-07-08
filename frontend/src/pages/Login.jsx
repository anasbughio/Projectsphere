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
                <Link to="/forgot-password" className="text-xs font-medium text-[#7c7fff] hover:text-[#979aff] transition">Forgot password?</Link>
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

            <div className="grid gap-3">
              <button
            onClick={() => window.location.href = '/api/v1/auth/google'}
              type="button" className="flex items-center justify-center gap-2 bg-[#1a1c26] border border-white/5 hover:bg-[#222533] transition text-[#a0a4b8] text-sm font-medium py-2.5 rounded-lg">
               <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google" className="w-4 h-4" />
                Google
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