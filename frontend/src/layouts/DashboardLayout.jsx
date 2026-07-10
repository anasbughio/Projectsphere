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
  Plus
} from 'lucide-react';

import api from '../services/api';
const DashboardLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
const backendUrl = 'https://projectsphere-dlvv.onrender.com';

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
      <aside className="w-[260px] bg-[#1a1c26] border-r border-white/5 flex flex-col z-20">
        
        {/* Logo Section */}
        <div className="p-6 mb-2">
          <div className="flex items-center gap-3">
            <div className="bg-[#7c7fff] p-1.5 rounded-lg shadow-[0_0_15px_rgba(124,127,255,0.3)]">
              <Rocket size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white leading-tight tracking-wide">ProjectSphere</h2>
              <p className="text-[10px] text-[#84889c] uppercase tracking-widest font-semibold mt-0.5">Enterprise Tier</p>
            </div>
          </div>
        </div>
        
        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-2">
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
          </ul>
        </nav>

        {/* Bottom Actions */}
        <div className="p-5">
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
      <main className="flex-1 flex flex-col relative bg-[#121218]">
        
        {/* Topbar */}
        <header className="h-[76px] border-b border-white/5 flex items-center justify-between px-8 z-10">
          
          {/* Search Bar */}
          <div className="relative w-[400px]">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search size={16} className="text-[#606479]" />
            </div>
            <input
              type="text"
              placeholder="Search projects, tasks, or teammates..."
              className="w-full pl-10 pr-4 py-2 bg-[#1a1c26] border border-white/5 rounded-lg text-sm text-white placeholder-[#606479] focus:outline-none focus:border-[#7c7fff]/50 focus:ring-1 focus:ring-[#7c7fff]/50 transition"
            />
          </div>

          {/* Right Actions & Profile */}
          <div className="flex items-center gap-5">
            <button className="text-[#606479] hover:text-white transition relative p-1.5 hover:bg-white/5 rounded-lg">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#7c7fff] rounded-full border-2 border-[#121218]"></span>
            </button>
            <button className="text-[#606479] hover:text-white transition p-1.5 hover:bg-white/5 rounded-lg">
              <Settings size={18} />
            </button>
            
            <div className="h-6 w-px bg-white/10 mx-1"></div>

          
          <Link 
              to="/profile" 
              className="flex items-center gap-3 p-1.5 pr-3 rounded-full hover:bg-white/[0.04] transition-all duration-200 group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-transparent group-hover:border-[#7c7fff]/50 transition-all flex items-center justify-center shrink-0 bg-[#1a1c26]">
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
                
                <div className={`w-full h-full bg-[#7c7fff]/20 text-[#7c7fff] flex items-center justify-center font-bold text-sm ${user?.profilePicture ? 'hidden' : 'flex'}`}>
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
              </div>

              <div className="hidden md:flex flex-col items-start">
                <span className="text-sm font-semibold text-white leading-none group-hover:text-[#7c7fff] transition-colors">
                  {user?.name || 'User Name'}
                </span>
                <span className="text-[10px] text-[#84889c] capitalize mt-1 leading-none">
                  {user?.role || 'Member'}
                </span>
              </div>
            </Link>
          </div>
        </header>
        {/* Content Outlet */}
        <div className="flex-1 p-8 overflow-y-auto z-10">
          {/* Yahan aapke andar ke pages (Overview widgets, Projects list etc.) render honge */}
          <Outlet /> 
        </div>
      </main>
      
    </div>
  );
};

export default DashboardLayout;