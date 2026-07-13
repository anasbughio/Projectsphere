import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { 
  LogOut, 
  LayoutDashboard, 
  FolderKanban, 
  CheckSquare, 
  Users, 
  Search, 
  Bell, 
  Settings, 
  HelpCircle, 
  Rocket,
  Plus,
  Calendar,
  Briefcase,
  Menu,
  X
} from 'lucide-react';
import api from '../services/api';

const DashboardLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const backendUrl = 'https://projectsphere-dlvv.onrender.com';

  // Mobile menu state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu automatically when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error("Logout API failed", error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
    }
  };

  // Active route check karne ke liye helper
  const isActive = (path) => location.pathname.includes(path);

  return (
    <div className="min-h-screen bg-[#121218] text-white flex font-sans overflow-hidden">
      
      {/* Mobile Overlay Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-[260px] bg-[#1a1c26] border-r border-white/5 flex flex-col transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:w-[260px]
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        
        {/* Logo Section */}
        <div className="p-6 mb-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-[#7c7fff] p-1.5 rounded-lg shadow-[0_0_15px_rgba(124,127,255,0.3)]">
              <Rocket size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white leading-tight tracking-wide">ProjectSphere</h2>
              <p className="text-[10px] text-[#84889c] uppercase tracking-widest font-semibold mt-0.5">Enterprise Tier</p>
            </div>
          </div>
          {/* Close button for mobile */}
          <button 
            className="lg:hidden text-[#606479] hover:text-white transition"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X size={24} />
          </button>
        </div>
        
        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-2 overflow-y-auto custom-scrollbar">
          <ul className="space-y-1.5">
            <li>
              <Link 
                to="/board" 
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition font-medium text-sm ${
                  isActive('/board') ? 'bg-[#7c7fff] text-white shadow-lg shadow-[#7c7fff]/20' : 'text-[#84889c] hover:text-white hover:bg-white/5'
                }`}
              >
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
              </Link>
            </li>
            <li>
              <Link 
                to="/projects" 
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition font-medium text-sm ${
                  isActive('/projects') ? 'bg-[#7c7fff] text-white shadow-lg shadow-[#7c7fff]/20' : 'text-[#84889c] hover:text-white hover:bg-white/5'
                }`}
              >
                <FolderKanban size={18} />
                <span>Projects</span>
              </Link>
            </li>
            <li>
              <Link to="/tasks" className="flex items-center gap-3 px-4 py-2.5 text-[#84889c] hover:text-white hover:bg-white/5 rounded-xl transition font-medium text-sm">
                <CheckSquare size={18} />
                <span>Tasks</span>
              </Link>
            </li>
            <li>
              <Link to="/team" className="flex items-center gap-3 px-4 py-2.5 text-[#84889c] hover:text-white hover:bg-white/5 rounded-xl transition font-medium text-sm">
                <Users size={18} />
                <span>Team</span>
              </Link>
            </li>
            <li>
             <Link 
                to="/calendar" 
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition font-medium text-sm ${
                  isActive('/calendar') ? 'bg-[#7c7fff] text-white shadow-lg shadow-[#7c7fff]/20' : 'text-[#84889c] hover:text-white hover:bg-white/5'
                }`}
              >
                <Calendar size={18} />
                <span>Calendar</span>
              </Link>
            </li>
            
            {/* Conditional Client Portal Link */}
            {user?.role === 'Client' || user?.role === 'Org Admin' || user?.role === 'Super Admin' ? (
              <li>
                <Link 
                  to="/client-portal" 
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition font-medium text-sm ${
                    isActive('/client-portal') ? 'bg-[#7c7fff] text-white shadow-lg shadow-[#7c7fff]/20' : 'text-[#84889c] hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Briefcase size={18} />
                  <span>Client Portal</span>
                </Link>
              </li>
            ) : null}
          </ul>
        </nav>

        {/* Bottom Actions */}
        <div className="p-5 mt-auto">
          <button className="w-full flex items-center justify-center gap-2 bg-[#7c7fff]/10 hover:bg-[#7c7fff] text-[#7c7fff] hover:text-white border border-[#7c7fff]/20 py-2.5 rounded-xl font-medium text-sm transition mb-6 group">
            <Plus size={18} className="group-hover:scale-110 transition-transform" />
            New Project
          </button>

          <ul className="space-y-1">
            <li>
              <a href="#" className="flex items-center gap-3 px-3 py-2 text-[#84889c] hover:text-white transition font-medium text-sm rounded-lg hover:bg-white/5">
                <HelpCircle size={18} />
                <span>Help</span>
              </a>
            </li>
            <li>
              <button 
                onClick={handleLogout} 
                className="w-full flex items-center gap-3 px-3 py-2 text-[#84889c] hover:text-red-400 transition font-medium text-sm rounded-lg hover:bg-white/5"
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </li>
          </ul>
        </div>
      </aside>

      {/* =========================================
          MAIN CONTENT & TOPBAR BLOCK
      ========================================= */}
      <main className="flex-1 flex flex-col relative bg-[#121218] min-w-0">
        
        {/* Topbar */}
        <header className="h-[76px] border-b border-white/5 flex items-center justify-between px-4 md:px-8 z-10 bg-[#121218]/95 backdrop-blur-sm sticky top-0">
          
          <div className="flex items-center gap-4 flex-1">
            {/* Mobile Menu Toggle Button */}
            <button 
              className="lg:hidden text-[#606479] hover:text-white transition p-1.5 hover:bg-white/5 rounded-lg"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu size={24} />
            </button>

            {/* Search Bar - Hidden on very small screens, responsive on others */}
            <div className="relative w-full max-w-[400px] hidden sm:block">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Search size={16} className="text-[#606479]" />
              </div>
              <input
                type="text"
                placeholder="Search projects, tasks..."
                className="w-full pl-10 pr-4 py-2 bg-[#1a1c26] border border-white/5 rounded-lg text-sm text-white placeholder-[#606479] focus:outline-none focus:border-[#7c7fff]/50 focus:ring-1 focus:ring-[#7c7fff]/50 transition"
              />
            </div>
          </div>

          {/* Right Actions & Profile */}
          <div className="flex items-center gap-2 sm:gap-5 shrink-0">
            {/* Search icon for mobile only */}
            <button className="sm:hidden text-[#606479] hover:text-white transition p-1.5 hover:bg-white/5 rounded-lg">
              <Search size={20} />
            </button>

            <button className="text-[#606479] hover:text-white transition relative p-1.5 hover:bg-white/5 rounded-lg">
              <Bell size={20} className="sm:w-[18px] sm:h-[18px]" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#7c7fff] rounded-full border-2 border-[#121218]"></span>
            </button>

            <Link to="/settings">
              <button className="text-[#606479] hover:text-white transition p-1.5 hover:bg-white/5 rounded-lg">
                <Settings size={20} className="sm:w-[18px] sm:h-[18px]" />
              </button>
            </Link>
            
            <div className="hidden sm:block h-6 w-px bg-white/10 mx-1"></div>

            <Link 
              to="/profile" 
              className="flex items-center gap-2 sm:gap-3 sm:p-1.5 sm:pr-3 rounded-full hover:bg-white/[0.04] transition-all duration-200 group cursor-pointer"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden border-2 border-transparent group-hover:border-[#7c7fff]/50 transition-all flex items-center justify-center shrink-0 bg-[#1a1c26]">
                {user?.profilePicture ? (
                  <img 
                    src={`${backendUrl}${user.profilePicture}`} 
                    alt={user?.name} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                
                <div className={`w-full h-full bg-[#7c7fff]/20 text-[#7c7fff] flex items-center justify-center font-bold text-xs sm:text-sm ${user?.profilePicture ? 'hidden' : 'flex'}`}>
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
              </div>

              <div className="hidden md:flex flex-col items-start">
                <span className="text-sm font-semibold text-white leading-none group-hover:text-[#7c7fff] transition-colors truncate max-w-[120px]">
                  {user?.name || 'User Name'}
                </span>
                <span className="text-[10px] text-[#84889c] capitalize mt-1 leading-none truncate max-w-[120px]">
                  {user?.role || 'Member'}
                </span>
              </div>
            </Link>
          </div>
        </header>

        {/* Content Outlet */}
        <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto z-10 custom-scrollbar">
          {/* Yahan aapke andar ke pages (Overview widgets, Projects list etc.) render honge */}
          <Outlet /> 
        </div>
      </main>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.1); }
      `}} />
    </div>
  );
};

export default DashboardLayout;