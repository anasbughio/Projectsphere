import React, { useState, useEffect } from 'react';
import { 
  DollarSign, Briefcase, CheckSquare, Activity, 
  MoreVertical, Calendar, Clock, AlertCircle, 
  Database, LayoutTemplate, ArrowUpRight, AlertTriangle,
  Loader2, FolderKanban
} from 'lucide-react';
import api from '../services/api';

const Dashboard = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // =========================================
  // FETCH DYNAMIC DATA
  // =========================================
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Backend se user ke projects fetch kar rahe hain
        const projectRes = await api.get('/projects');
        setProjects(projectRes.data);
      } catch (error) {
        console.error('Dashboard data load karne mein masla:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="animate-spin text-[#7c7fff]" size={40} />
      </div>
    );
  }

  // Active aur Completed projects calculate kar rahe hain
  const activeProjectsCount = projects.filter(p => p.status === 'Active' || p.status === 'Planning').length;
  const completedProjectsCount = projects.filter(p => p.status === 'Completed').length;

  return (
    <div className="flex flex-col gap-6 font-sans pb-8">
      
      {/* =========================================
          1. TOP KPI CARDS BLOCK
      ========================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Revenue Card (Static placeholder for now) */}
        <div className="bg-[#1a1c26] p-5 rounded-xl border border-white/5 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xs font-semibold text-[#84889c] tracking-widest uppercase">Total Revenue</h3>
            <div className="p-1.5 bg-[#7c7fff]/10 text-[#7c7fff] rounded-lg">
              <DollarSign size={16} />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-1">$1.2M</div>
          <div className="flex items-center gap-1 text-xs font-medium text-emerald-400">
            <ArrowUpRight size={14} />
            <span>+12.5% vs last month</span>
          </div>
        </div>

        {/* DYNAMIC: Active Projects Card */}
        <div className="bg-[#1a1c26] p-5 rounded-xl border border-white/5 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xs font-semibold text-[#84889c] tracking-widest uppercase">Total Projects</h3>
            <div className="p-1.5 bg-[#7c7fff]/10 text-[#7c7fff] rounded-lg">
              <Briefcase size={16} />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-1">{projects.length}</div>
          <div className="text-xs font-medium text-[#7c7fff]">
            {activeProjectsCount} Active, {completedProjectsCount} Completed
          </div>
        </div>

        {/* Pending Tasks Card (Static for now) */}
        <div className="bg-[#1a1c26] p-5 rounded-xl border border-white/5 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xs font-semibold text-[#84889c] tracking-widest uppercase">Pending Tasks</h3>
            <div className="p-1.5 bg-[#7c7fff]/10 text-[#7c7fff] rounded-lg">
              <CheckSquare size={16} />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-1">142</div>
          <div className="flex items-center gap-1 text-xs font-medium text-amber-400">
            <AlertTriangle size={14} />
            <span>18 overdue</span>
          </div>
        </div>

        {/* Team Velocity Card (Static for now) */}
        <div className="bg-[#1a1c26] p-5 rounded-xl border border-white/5 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xs font-semibold text-[#84889c] tracking-widest uppercase">Team Velocity</h3>
            <div className="p-1.5 bg-[#7c7fff]/10 text-[#7c7fff] rounded-lg">
              <Activity size={16} />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-1">94%</div>
          <div className="text-xs font-medium text-[#84889c]">
            Optimal efficiency
          </div>
        </div>
      </div>

      {/* =========================================
          MAIN CONTENT GRID 
      ========================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* 2. DYNAMIC: PROJECT PORTFOLIO BLOCK */}
          <div className="bg-[#1a1c26] rounded-xl border border-white/5 shadow-sm flex flex-col">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <h2 className="text-lg font-bold text-white">Recent Projects</h2>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 text-xs font-semibold text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition">Filters</button>
              </div>
            </div>
            
            <div className="p-0 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="px-6 py-4 text-xs font-semibold text-[#84889c] uppercase tracking-wider">Project Name</th>
                    <th className="px-6 py-4 text-xs font-semibold text-[#84889c] uppercase tracking-wider">Date Created</th>
                    <th className="px-6 py-4 text-xs font-semibold text-[#84889c] uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-semibold text-[#84889c] uppercase tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {projects.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-8 text-center text-[#84889c] text-sm">
                        No projects found. Create one to see it here!
                      </td>
                    </tr>
                  ) : (
                    // Sirf latest 5 projects show kar rahe hain dashboard par
                    projects.slice(0, 5).map((project) => (
                      <tr key={project._id} className="hover:bg-white/[0.02] transition">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-[#7c7fff]/10 text-[#7c7fff] rounded-lg">
                              <FolderKanban size={16} />
                            </div>
                            <span className="font-semibold text-sm text-white truncate max-w-[200px]">{project.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-[#a0a4b8]">
                          {new Date(project.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border ${
                            project.status === 'Active' ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' :
                            project.status === 'Completed' ? 'border-blue-500/30 text-blue-400 bg-blue-500/10' :
                            'border-amber-500/30 text-amber-500 bg-amber-500/10'
                          }`}>
                            {project.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="text-[#606479] hover:text-white transition"><MoreVertical size={16} /></button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 3. TEAM WORKLOAD BLOCK (Static) */}
          <div className="bg-[#1a1c26] rounded-xl border border-white/5 shadow-sm p-6">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-lg font-bold text-white">Team Workload</h2>
                <p className="text-xs text-[#84889c] mt-1">Allocation across core engineering teams.</p>
              </div>
            </div>
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-4">
                <span className="w-20 text-sm font-medium text-white">Design</span>
                <div className="flex-1 h-6 bg-[#121218] rounded-md overflow-hidden flex border border-white/5">
                  <div className="bg-[#7c7fff] h-full flex items-center px-2 text-[10px] font-bold text-[#121218]" style={{ width: '65%' }}>65%</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="w-20 text-sm font-medium text-white">Frontend</span>
                <div className="flex-1 h-6 bg-[#121218] rounded-md overflow-hidden flex border border-white/5">
                  <div className="bg-[#7c7fff] h-full flex items-center px-2 text-[10px] font-bold text-[#121218]" style={{ width: '85%' }}>85%</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex flex-col gap-6">
          
          {/* 4. CRITICAL DEADLINES BLOCK (Static) */}
          <div className="bg-[#1a1c26] rounded-xl border border-white/5 shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-white">Critical Deadlines</h2>
              <div className="w-6 h-6 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center">
                <AlertCircle size={14} />
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="bg-[#241a22] border border-red-500/20 rounded-xl p-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
                <div className="flex justify-between items-center mb-3">
                  <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-red-500 text-white rounded">Urgent</span>
                  <span className="text-xs font-semibold text-[#a0a4b8]">Today</span>
                </div>
                <h4 className="text-sm font-bold text-white mb-2">API Authentication Audit</h4>
              </div>
            </div>
          </div>

          {/* 5. SYSTEM HEALTH BLOCK (Static) */}
          <div className="bg-[#1a1c26] rounded-xl border border-white/5 shadow-sm p-6 relative overflow-hidden">
            <h2 className="text-lg font-bold text-white mb-1 relative z-10">System Health</h2>
            <p className="text-xs text-[#84889c] mb-6 relative z-10">Real-time node performance monitor</p>
            <div className="flex items-end justify-between relative z-10">
              <div>
                <div className="text-4xl font-bold text-white tracking-tight">99.9%</div>
                <div className="text-[10px] font-semibold text-[#7c7fff] uppercase tracking-widest mt-1">Uptime maintained</div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;