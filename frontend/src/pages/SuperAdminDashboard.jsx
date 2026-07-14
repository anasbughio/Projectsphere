import React, { useState, useEffect } from 'react';
import { Building2, Users, AlertCircle, Activity, Loader2, RefreshCw, ShieldCheck } from 'lucide-react';
import api from '../services/api';
import { io } from 'socket.io-client';

const SuperAdminDashboard = () => {
  const [stats, setStats] = useState({ 
    totalOrgs: 0, 
    totalUsers: 0, 
    totalOrgAdmins: 0, 
    activeOrgs: 0, 
    suspendedOrgs: 0 
  });
  const [loading, setLoading] = useState(true);

  const fetchPlatformStats = async () => {
    try {
      const res = await api.get('/dashboard/platform-stats');
      setStats({
        totalOrgs: res.data.totalOrgs || 0,
        totalUsers: res.data.totalUsers || 0,
        totalOrgAdmins: res.data.totalOrgAdmins || res.data.totalOrgs || 0, // Fallback applied safely
        activeOrgs: res.data.activeOrgs || 0, 
        suspendedOrgs: res.data.suspendedOrgs || 0 
      });
    } catch (error) {
      console.error('Error fetching platform stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlatformStats();

    const handler = () => fetchPlatformStats();
    window.addEventListener('platformStatsUpdated', handler);

    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'https://projectsphere-dlvv.onrender.com';
    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    
    // Real-time tenant updates listener
    socket.on('organizationUpdated', handler);

    // Polling fallback
    const pollId = setInterval(fetchPlatformStats, 30000);

    return () => {
      window.removeEventListener('platformStatsUpdated', handler);
      socket.off('organizationUpdated', handler);
      socket.disconnect();
      clearInterval(pollId);
    };
  }, []);

  const handleManualRefresh = () => {
    setLoading(true);
    fetchPlatformStats();
  };

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <Loader2 className="animate-spin text-[#7c7fff]" size={40} />
      </div>
    );
  }

  // 🔥 KPI Cards Updated: Keeping totalOrgAdmins for Total Organizations
  const kpiCards = [
    { title: 'Total Organizations', value: stats.totalOrgAdmins, icon: Building2, color: 'text-[#7c7fff]' },
    { title: 'Platform Users', value: stats.totalUsers, icon: Users, color: 'text-emerald-400' },
    { title: 'Active Tenants', value: stats.activeOrgs, icon: ShieldCheck, color: 'text-blue-400' },
    { title: 'Suspended Tenants', value: stats.suspendedOrgs, icon: AlertCircle, color: 'text-red-400' },
  ];

  return (
    <div className="p-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Platform Overview</h1>
          <p className="text-[#84889c] text-sm">Real-time system health and tenant metrics</p>
        </div>
        <button 
          onClick={handleManualRefresh} 
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#2a2d3e] border border-white/5 text-[#a0a4b8] hover:text-white transition-colors"
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </div>
      
      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {kpiCards.map((card, idx) => (
          <div key={idx} className="bg-[#1a1c26] p-6 rounded-xl border border-white/5 shadow-sm transition-all hover:border-white/10">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xs font-semibold text-[#84889c] uppercase tracking-widest">{card.title}</h3>
              <card.icon className={card.color} size={20} />
            </div>
            <div className="text-3xl font-bold text-white">{card.value}</div>
          </div>
        ))}
      </div>

      {/* Platform Activity Feed Module */}
      <div className="bg-[#1a1c26] rounded-xl border border-white/5 overflow-hidden shadow-sm flex flex-col">
        <div className="px-6 py-5 border-b border-white/5 flex items-center gap-3">
          <Activity className="text-[#7c7fff]" size={20} />
          <h2 className="text-lg font-bold text-white">Recent Platform Activity</h2>
        </div>
        
        <div className="p-6">
          <div className="flex flex-col items-center justify-center py-10 text-[#606479]">
            <ShieldCheck size={48} className="mb-4 opacity-30" />
            <p className="text-sm font-medium">Audit logging system is pending backend integration.</p>
            <p className="text-xs mt-1 opacity-70">Soon you will see tenant creation, suspension, and super admin login events here.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;