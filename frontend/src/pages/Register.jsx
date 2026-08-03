import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, User, Mail, Lock, Eye, EyeOff, ArrowRight, LayoutGrid } from 'lucide-react';
import api from '../services/api';

const Register = () => {
  const [orgName, setOrgName] = useState('');
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/register', {
        orgName,
        userName,
        email,
        password
      });
      
      //send user to OTP screen
      navigate('/verify', { state: { email: email } });
      
    } catch (err) {
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        setError('Server is unreachable. Please try again later.');
      } else {
        setError(err.response?.data?.message || err.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    /* Outer container with flex-col and justify-between for Top, Center, and Bottom layout */
    <div className="min-h-screen w-full flex flex-col justify-between items-center bg-[#09090b] relative overflow-hidden font-sans">
      
      {/* Background glow effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[500px] bg-[#5a5fe0] opacity-[0.08] blur-[120px] rounded-full pointer-events-none"></div>

      {/* TOP HEADER */}
      <div className="flex flex-col items-center mt-8 sm:mt-12 z-10">
        <div className="flex items-center gap-2.5 mb-1.5">
          <LayoutGrid className="text-[#a5a7fa]" size={22} fill="currentColor" fillOpacity={0.2} />
          <h1 className="text-2xl font-bold text-white tracking-wide">ProjectSphere</h1>
        </div>
        <p className="text-[10px] font-bold tracking-[0.2em] text-[#606479] uppercase">Enterprise Tier</p>
      </div>

      {/* MAIN CARD (Centered) - Width barha kar 520px kar di gayi hai */}
      <div className="w-full max-w-[520px] z-10 px-4 my-auto py-6">
        <div className="bg-[#16171d] border border-white/[0.04] p-8 sm:p-10 rounded-[1.25rem] shadow-2xl w-full">
          
          {/* Card Header - Left Aligned */}
          <div className="mb-8 text-left">
            <h2 className="text-2xl font-semibold text-white mb-1.5 tracking-tight">Create Organization</h2>
            <p className="text-[#84889c] text-sm">Setup your multi-tenant workspace.</p>
          </div>
          
          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg text-center font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister}>
            
            {/* =========================================
                INPUTS BLOCK
            ========================================= */}
            <div className="flex flex-col gap-4">
              
              {/* Organization Name Input */}
              <div className="block text-left">
                <label className="block text-xs font-semibold text-[#84889c] mb-2">Organization Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Building2 size={15} className="text-[#606479]" />
                  </div>
                  <input 
                    type="text" 
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 bg-[#0c0d12] border border-transparent rounded-lg text-white text-sm placeholder-[#4b4e63] focus:border-[#5a5fe0] focus:ring-1 focus:ring-[#5a5fe0] focus:outline-none transition-all"
                    placeholder="E.g. MLBench Pvt Ltd"
                  />
                </div>
              </div>

              {/* Admin Name Input */}
              <div className="block text-left">
                <label className="block text-xs font-semibold text-[#84889c] mb-2">Admin Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <User size={15} className="text-[#606479]" />
                  </div>
                  <input 
                    type="text" 
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 bg-[#0c0d12] border border-transparent rounded-lg text-white text-sm placeholder-[#4b4e63] focus:border-[#5a5fe0] focus:ring-1 focus:ring-[#5a5fe0] focus:outline-none transition-all"
                    placeholder="Anas Bughio"
                  />
                </div>
              </div>

              {/* Admin Email Input */}
              <div className="block text-left">
                <label className="block text-xs font-semibold text-[#84889c] mb-2">Admin Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail size={15} className="text-[#606479]" />
                  </div>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 bg-[#0c0d12] border border-transparent rounded-lg text-white text-sm placeholder-[#4b4e63] focus:border-[#5a5fe0] focus:ring-1 focus:ring-[#5a5fe0] focus:outline-none transition-all"
                    placeholder="admin@organization.com"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="block text-left">
                <label className="block text-xs font-semibold text-[#84889c] mb-2">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock size={15} className="text-[#606479]" />
                  </div>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-10 pr-10 py-3 bg-[#0c0d12] border border-transparent rounded-lg text-white text-sm placeholder-[#4b4e63] focus:border-[#5a5fe0] focus:ring-1 focus:ring-[#5a5fe0] focus:outline-none transition-all"
                    placeholder="••••••••"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center">
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[#606479] hover:text-[#a0a4b8] focus:outline-none transition flex items-center justify-center"
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              </div>
              
            </div>

            {/* =========================================
                BUTTONS BLOCK
            ========================================= */}
            <div className="flex flex-col gap-4 mt-8">
              
              {/* Primary Submit Button */}
              <div className="block">
                <button 
                  type="submit" 
                  disabled={loading}
                  className={`w-full flex items-center justify-center gap-2 text-white font-semibold py-3 rounded-lg text-sm transition-all shadow-md ${
                    loading ? 'bg-[#4b4d99] cursor-not-allowed shadow-none' : 'bg-[#5a5fe0] hover:bg-[#6c70f0]'
                  }`}
                >
                  {loading ? 'Creating workspace...' : 'Register Workspace'}
                  {!loading && <ArrowRight size={15} />}
                </button>
              </div>

              {/* Divider */}
              <div className="flex items-center justify-center gap-3 mt-1 mb-1">
                <div className="h-px w-full bg-white/[0.04]"></div>
                <span className="text-[10px] font-semibold text-[#4b4e63] tracking-widest whitespace-nowrap">OR CONTINUE WITH</span>
                <div className="h-px w-full bg-white/[0.04]"></div>
              </div>

              {/* Google Button */}
              <div className="block">
                <button
                  onClick={() => window.location.href = `${import.meta.env.VITE_API_URL || ''}/auth/google`}
                  type="button" 
                  className="w-full flex items-center justify-center gap-2.5 bg-transparent border border-white/[0.08] hover:bg-white/[0.02] transition text-[#a0a4b8] text-sm font-semibold py-3 rounded-lg"
                >
                  <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google" className="w-4 h-4 opacity-80" />
                  Continue with Google
                </button>
              </div>

              {/* Sign In Link */}
              <div className="block text-center mt-2">
                <p className="text-xs text-[#84889c]">
                  Already have an account?{' '}
                  <Link to="/login" className="text-[#a5a7fa] hover:text-white font-semibold transition">
                    Sign in
                  </Link>
                </p>
              </div>
              
            </div>
          </form>
        </div>
      </div>

      {/* BOTTOM FOOTER */}
      <div className="flex items-center justify-center gap-6 mb-8 z-10 text-[11px] font-semibold text-[#4b4e63]">
        <Link to="/privacy" className="hover:text-[#84889c] transition">Privacy Policy</Link>
        <Link to="/terms" className="hover:text-[#84889c] transition">Terms of Service</Link>
        <Link to="/security" className="hover:text-[#84889c] transition">Contact Security</Link>
      </div>
      
    </div>
  );
};

export default Register;