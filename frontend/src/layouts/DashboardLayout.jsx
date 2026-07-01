import { Outlet, useNavigate } from 'react-router-dom';
import { LogOut, LayoutDashboard, FolderKanban } from 'lucide-react';
import { Link } from 'react-router-dom';
const DashboardLayout = () => {
  const navigate = useNavigate();
  // Local storage se user ka data nikal rahe hain taake sidebar mein naam show kar sakein
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#121218] text-white flex font-sans overflow-hidden">
      
      {/* Sidebar */}
      <aside className="w-64 bg-[#1a1c26] border-r border-white/5 flex flex-col z-20">
        <div className="p-6 border-b border-white/5">
          <h2 className="text-xl font-bold text-[#d2d4ff] tracking-wide">ProjectSphere</h2>
        </div>
        
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            <li>
              <a href="#" className="flex items-center gap-3 px-4 py-3 bg-[#7c7fff]/10 text-[#7c7fff] rounded-lg transition">
                <LayoutDashboard size={18} />
                <span className="font-medium text-sm">Overview</span>
              </a>
            </li>
            <li>
              <Link to="/projects" className="flex items-center gap-3 px-4 py-3 text-[#84889c] hover:text-white hover:bg-white/5 rounded-lg transition">
                <FolderKanban size={18} />
                <span className="font-medium text-sm">Projects</span>
              </Link>
            </li>
          </ul>
        </nav>

        {/* User Profile & Logout */}
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-[#7c7fff]/20 text-[#7c7fff] flex items-center justify-center text-sm font-bold uppercase">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name || 'User Name'}</p>
              <p className="text-xs text-[#606479] truncate">{user?.role || 'Role'}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition text-sm font-medium"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative">
        {/* Background visual effect */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#7c7fff] opacity-5 blur-[120px] rounded-full pointer-events-none"></div>

        <header className="h-16 border-b border-white/5 flex items-center px-8 bg-[#1a1c26]/80 backdrop-blur-md z-10">
          <h1 className="text-lg font-semibold text-white tracking-wide">Dashboard</h1>
        </header>
        
        <div className="flex-1 p-8 overflow-y-auto z-10">
          {/* Yahan aapke andar ke pages (Board, Projects etc.) render honge */}
          <Outlet /> 
        </div>
      </main>
      
    </div>
  );
};

export default DashboardLayout;