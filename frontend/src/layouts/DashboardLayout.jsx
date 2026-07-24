import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { 
  LogOut, LayoutDashboard, FolderKanban, CheckSquare, Users, Search, 
  Settings, HelpCircle, Rocket, Plus, Calendar, Briefcase, Menu, X, Shield,Folder 
} from 'lucide-react';
import api from '../services/api';
import { io } from 'socket.io-client';
import NotificationBell from '../components/NotificationBell';

const DashboardLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const normalizeRole = (role) => {
    const value = role?.toString().trim().toLowerCase();
    if (!value) return '';
    if (['org admin', 'organization admin', 'admin'].includes(value)) return 'admin';
    if (['project manager', 'project-manager'].includes(value)) return 'project manager';
    if (['team member', 'member'].includes(value)) return 'team member';
    if (value === 'client') return 'client';
    return value;
  };
  const role = normalizeRole(user?.role);
  const isSuperAdmin = role === 'super admin';
  const isOrgAdmin = role === 'admin';
  const isProjectManager = role === 'project manager';
  const isTeamMember = role === 'team member';
  const isClient = role === 'client';
  const backendUrl = 'https://projectsphere-dlvv.onrender.com';

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [socketInstance, setSocketInstance] = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

const getProfileImage = () => {
    let imgUrl = user?.profilePicture || user?.avatar; 
    if (!imgUrl) return null;

    imgUrl = imgUrl.replace(/\\/g, '/');

    if (imgUrl.startsWith('http')) return imgUrl;

    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    const baseUrl = isLocal ? 'http://localhost:5000' : 'https://projectsphere-dlvv.onrender.com';

    const formattedPath = imgUrl.startsWith('/') ? imgUrl : `/${imgUrl}`;

    console.log("FINAL IMAGE URL:", `${baseUrl}${formattedPath}`);
    
    return `${baseUrl}${formattedPath}`;
  };

  const profileImgUrl = getProfileImage();

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (user && user.organizationId) {
      const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'https://projectsphere-dlvv.onrender.com';
      const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
      setSocketInstance(socket);
      socket.emit('joinOrganization', user.organizationId);
      if (user._id) {
        socket.emit('joinUserRoom', user._id);
      }
      return () => socket.disconnect();
    }
  }, [user?.organizationId,user?._id]);

  const handleLogout = async () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    setShowLogoutModal(false);
    try { await api.post('/auth/logout'); } catch (error) { console.error('Logout API failed', error); }
    finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
    }
  };

  const isActive = (path) => location.pathname.includes(path);

  return (
    <div className="min-h-screen bg-[#121218] text-white flex font-sans overflow-hidden">
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 w-[260px] bg-[#1a1c26] border-r border-white/5 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        <div className="p-6 mb-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-[#7c7fff] p-1.5 rounded-lg shadow-[0_0_15px_rgba(124,127,255,0.3)]">
              <Rocket size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white leading-tight tracking-wide">ProjectSphere</h2>
              <p className="text-[10px] text-[#84889c] uppercase tracking-widest font-semibold mt-0.5">{isSuperAdmin ? 'Admin Console' : 'Enterprise Tier'}</p>
            </div>
          </div>
          <button className="lg:hidden text-[#606479] hover:text-white transition" onClick={() => setIsMobileMenuOpen(false)}><X size={24} /></button>
        </div>
        
      <nav className="flex-1 px-4 py-2 overflow-y-auto custom-scrollbar">
       <ul className="space-y-1.5">
            
            {/* 🌟 SUPER ADMIN SIDEBAR LINKS */}
            {isSuperAdmin && (
              <>
                <li>
                  <Link to="/admin" 
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition font-medium text-sm ${
                      isActive('/admin') 
                      ? 'bg-[#7c7fff] text-white shadow-lg shadow-[#7c7fff]/20' 
                      : 'text-[#84889c] hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <LayoutDashboard size={18} />
                    <span>Platform Overview</span>
                  </Link>
                </li>
                <li>
                  <Link to="/super-admin/subscriptions" 
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition font-medium text-sm ${
                      isActive('/super-admin/subscriptions') 
                      ? 'bg-[#7c7fff] text-white shadow-lg shadow-[#7c7fff]/20' 
                      : 'text-[#84889c] hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Briefcase size={18} />
                    <span>Subscription Plans</span>
                  </Link>
                </li>
                <li>
                  <Link to="/super-admin/users" 
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition font-medium text-sm ${
                      isActive('/super-admin/users') 
                      ? 'bg-[#7c7fff] text-white shadow-lg shadow-[#7c7fff]/20' 
                      : 'text-[#84889c] hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Users size={18} />
                    <span>Platform Users</span>
                  </Link>
                </li>
              </>
            )}

            {/* 🏢 REGULAR ADMIN / MANAGER / TEAM MEMBER LINKS */}
            {!isSuperAdmin && !isClient && (
              <>
                <li>
                  <Link to="/board" 
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition font-medium text-sm ${
                      isActive('/board') 
                      ? 'bg-[#7c7fff] text-white shadow-lg shadow-[#7c7fff]/20' 
                      : 'text-[#84889c] hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <LayoutDashboard size={18} />
                    <span>Dashboard</span>
                  </Link>
                </li>
              </>
            )}

            {(isOrgAdmin || isProjectManager || isTeamMember) && (
              <>
                <li>
                  <Link to="/projects" className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition font-medium text-sm ${isActive('/projects') ? 'bg-[#7c7fff] text-white' : 'text-[#84889c] hover:text-white hover:bg-white/5'}`}>
                    <FolderKanban size={18} /> <span>Projects</span>
                  </Link>
                </li>
                <li>
                  <Link to="/tasks" className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition font-medium text-sm ${isActive('/tasks') ? 'bg-[#7c7fff] text-white' : 'text-[#84889c] hover:text-white hover:bg-white/5'}`}>
                    <CheckSquare size={18} /> <span>Tasks</span>
                  </Link>
                </li>
                 <li>
                  <Link to="/help-desk" className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition font-medium text-sm ${isActive('/help-desk') ? 'bg-[#7c7fff] text-white shadow-lg shadow-[#7c7fff]/20' : 'text-[#84889c] hover:text-white hover:bg-white/5'}`}>
                    <Calendar size={18} /> <span>Help Desk</span>
                  </Link>
                </li>
              </>
            )}
            
            {!isSuperAdmin && !isClient && (
              <li>
                <Link to="/team"
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition font-medium text-sm ${
                    isActive('/team') 
                    ? 'bg-[#7c7fff] text-white shadow-lg shadow-[#7c7fff]/20' 
                    : 'text-[#84889c] hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Users size={18} /> 
                  <span>Team</span>
                </Link>
              </li>
            )}

            {(isOrgAdmin || isTeamMember) && (
              <>
                <li>
                  <Link to="/calendar" className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition font-medium text-sm ${isActive('/calendar') ? 'bg-[#7c7fff] text-white' : 'text-[#84889c] hover:text-white hover:bg-white/5'}`}>
                    <Calendar size={18} /> <span>Calendar</span>
                  </Link>
                </li>
              </>
            )}

            {/* 👤 CLIENT LINKS */}
            {isClient && (
              <>
                <li>
                  <Link to="/client-dashboard" className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition font-medium text-sm ${isActive('/client-dashboard') ? 'bg-[#7c7fff] text-white shadow-lg shadow-[#7c7fff]/20' : 'text-[#84889c] hover:text-white hover:bg-white/5'}`}>
                    <LayoutDashboard size={18} /> <span>Dashboard</span>
                  </Link>
                </li>
                <li>
                  <Link to="/client-portal" className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition font-medium text-sm ${isActive('/client-portal') && !isActive('/client-dashboard') ? 'bg-[#7c7fff] text-white shadow-lg shadow-[#7c7fff]/20' : 'text-[#84889c] hover:text-white hover:bg-white/5'}`}>
                    <Briefcase size={18} /> <span>My Projects</span>
                  </Link>
                </li>
                <li>
                  <Link to="/client-files" className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition font-medium text-sm ${isActive('/client-files') ? 'bg-[#7c7fff] text-white shadow-lg shadow-[#7c7fff]/20' : 'text-[#84889c] hover:text-white hover:bg-white/5'}`}>
                    <Folder size={18} /> <span>File Hub</span>
                  </Link>
                </li>
                <li>
                  <Link to="/client-calendar" className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition font-medium text-sm ${isActive('/client-calendar') ? 'bg-[#7c7fff] text-white shadow-lg shadow-[#7c7fff]/20' : 'text-[#84889c] hover:text-white hover:bg-white/5'}`}>
                    <Calendar size={18} /> <span>Meetings & Dates</span>
                  </Link>
                </li>
                <li>
                  <Link to="/help-desk" className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition font-medium text-sm ${isActive('/help-desk') ? 'bg-[#7c7fff] text-white shadow-lg shadow-[#7c7fff]/20' : 'text-[#84889c] hover:text-white hover:bg-white/5'}`}>
                    <Calendar size={18} /> <span>Help Desk</span>
                  </Link>
                </li>
              </>
            )}
          </ul>
        </nav>

        <div className="p-5 mt-auto">
          <ul className="space-y-1">
            <li><button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 text-[#84889c] hover:text-red-400 transition font-medium text-sm rounded-lg hover:bg-white/5"><LogOut size={18} /> <span>Logout</span></button></li>
          </ul>
        </div>
      </aside>

      <main className="flex-1 flex flex-col relative bg-[#121218] min-w-0">
        <header className="h-[76px] border-b border-white/5 flex items-center justify-between px-4 md:px-8 bg-[#121218]/95 backdrop-blur-sm sticky top-0 z-50">
          <button className="lg:hidden text-[#606479] hover:text-white p-1.5" onClick={() => setIsMobileMenuOpen(true)}><Menu size={24} /></button>
          <div className="flex items-center gap-5 ml-auto">
            <NotificationBell user={user} socket={socketInstance}/>
            <Link to="/settings" className="text-[#84889c] hover:text-white transition p-2 rounded-full hover:bg-white/[0.04]">
              <Settings size={20} />
            </Link>
           <Link to="/profile" className="flex items-center gap-3 hover:bg-white/[0.04] p-1.5 pr-3 rounded-full transition">
     <div className="w-8 h-8 rounded-full bg-[#7c7fff]/20 text-[#7c7fff] flex items-center justify-center font-bold text-xs overflow-hidden shrink-0 border border-[#7c7fff]/30">
       
       {profileImgUrl ? (
         <img 
           src={profileImgUrl} 
           alt="Profile" 
           className="w-full h-full object-cover" 
           onError={(e) => {        
             e.target.style.display = 'none';
             e.target.parentNode.innerHTML = user?.name?.charAt(0).toUpperCase() || 'U';
           }}
         />
       ) : (
         user?.name?.charAt(0).toUpperCase() || 'U'
       )}

     </div>
     <div className="hidden md:block">
       <span className="text-sm font-semibold block">{user?.name}</span>
       <span className="text-[10px] text-[#84889c] capitalize">{user?.role}</span>
     </div>
  </Link>
          </div>
        </header>
        <div className="flex-1 p-4 md:p-8 overflow-y-auto custom-scrollbar"><Outlet /></div>
      </main>
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-[#2a2d3e] border border-white/10 rounded-2xl w-full max-w-sm shadow-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-3">Confirm Logout</h3>
            <p className="text-sm text-[#a0a4b8] mb-6">Are you sure you want to logout? You'll need to sign in again to continue.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowLogoutModal(false)} className="px-4 py-2 rounded-lg text-sm font-semibold text-[#a0a4b8] hover:text-white">Cancel</button>
              <button onClick={confirmLogout} className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-[#7c7fff] hover:bg-[#6b6de0]">Logout</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardLayout;