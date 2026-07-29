import React, { useState, useEffect } from 'react';
import { Building2, Users, AlertCircle, Activity, Loader2, RefreshCw, ShieldCheck, Ban, CheckCircle2, Clock, AlertTriangle, X, Search } from 'lucide-react';
import api from '../services/api';
import { io } from 'socket.io-client';
import { useToast } from '../components/ToastProvider';

const SuperAdminDashboard = () => {
  const [stats, setStats] = useState({ 
    totalOrgs: 0, 
    totalUsers: 0, 
    totalOrgAdmins: 0, 
    activeOrgs: 0, 
    suspendedOrgs: 0 
  });
  const [organizations, setOrganizations] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Search and Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [orgSearchTerm, setOrgSearchTerm] = useState(''); // NEW: Tenant search
  const [orgFilter, setOrgFilter] = useState('All'); // NEW: Tenant status filter

  const [loading, setLoading] = useState(true);
  const [auditLoading, setAuditLoading] = useState(true);
  const [orgLoading, setOrgLoading] = useState(true);
  const [orgError, setOrgError] = useState('');
  const toast = useToast();

  const [confirmModal, setConfirmModal] = useState({ isOpen: false, org: null, nextStatus: '', actionLabel: '' });
  const [isToggling, setIsToggling] = useState(false);

  const fetchPlatformStats = async () => {
    try {
      const res = await api.get('/dashboard/platform-stats');
      setStats({
        totalOrgs: res.data.totalOrgs || 0,
        totalUsers: res.data.totalUsers || 0,
        totalOrgAdmins: res.data.totalOrgAdmins || res.data.totalOrgs || 0,
        activeOrgs: res.data.activeOrgs || 0, 
        suspendedOrgs: res.data.suspendedOrgs || 0 
      });
    } catch (error) {
      console.error('Error fetching platform stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrganizations = async () => {
    try {
      const res = await api.get('/organizations');
      setOrganizations(res.data || []);
      setOrgError('');
    } catch (error) {
      setOrgError('Failed to load organizations.');
    } finally {
      setOrgLoading(false);
    }
  };

  const fetchAuditLogs = async (page = 1, search = '') => {
    setAuditLoading(true);
    try {
      const res = await api.get(`/dashboard/audit-logs?page=${page}&limit=10&search=${search}`);
      setAuditLogs(res.data.logs);
      setTotalPages(res.data.totalPages);
      setCurrentPage(res.data.currentPage);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setAuditLoading(false);
    }
  };

  useEffect(() => {
    fetchPlatformStats();
    fetchOrganizations();
    fetchAuditLogs(); 

    const handler = () => {
      fetchPlatformStats();
      fetchOrganizations();
      fetchAuditLogs(); 
    };
    window.addEventListener('platformStatsUpdated', handler);

    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'https://projectsphere-dlvv.onrender.com';
    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    
    socket.on('organizationUpdated', handler);

    const pollId = setInterval(() => {
      fetchPlatformStats();
      fetchOrganizations();
      fetchAuditLogs(); 
    }, 30000);

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
    fetchOrganizations();
  };

  const handleToggleOrganizationStatus = (org) => {
    const nextStatus = org.status === 'Active' ? 'Suspended' : 'Active';
    const actionLabel = nextStatus === 'Active' ? 'unblock' : 'block';
    
    setConfirmModal({
      isOpen: true,
      org,
      nextStatus,
      actionLabel
    });
  };

  const executeToggleStatus = async () => {
    const { org, nextStatus, actionLabel } = confirmModal;
    setIsToggling(true);

    try {
      const response = await api.patch(`/organizations/${org._id}/status`, { status: nextStatus });
      setOrganizations((prev) => prev.map((item) => item._id === org._id ? response.data : item));
      window.dispatchEvent(new Event('platformStatsUpdated'));
      fetchAuditLogs();
      toast.push(`Organization ${actionLabel}ed successfully.`, { type: 'success' });
      setConfirmModal({ isOpen: false, org: null, nextStatus: '', actionLabel: '' });
    } catch (error) {
      toast.push(error.response?.data?.message || `Failed to ${actionLabel} organization`, { type: 'error' });
    } finally {
      setIsToggling(false);
    }
  };

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <Loader2 className="animate-spin text-[#7c7fff]" size={40} />
      </div>
    );
  }

  const kpiCards = [
    { title: 'Total Organizations', value: stats.totalOrgAdmins, icon: Building2, color: 'text-[#7c7fff]' },
    { title: 'Platform Users', value: stats.totalUsers, icon: Users, color: 'text-emerald-400' },
    { title: 'Active Tenants', value: stats.activeOrgs, icon: ShieldCheck, color: 'text-blue-400' },
    { title: 'Suspended Tenants', value: stats.suspendedOrgs, icon: AlertCircle, color: 'text-red-400' },
  ];

  const formatDate = (dateString) => {
    const options = { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // NEW: Filter logic for organizations
  const filteredOrganizations = organizations.filter(org => {
    const matchesFilter = orgFilter === 'All' || org.status === orgFilter;
    const matchesSearch = org.name.toLowerCase().includes(orgSearchTerm.toLowerCase()) || 
                          (org.domain && org.domain.toLowerCase().includes(orgSearchTerm.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="p-6 font-sans relative max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Platform Overview</h1>
          <p className="text-[#84889c] text-sm">Real-time system health and tenant metrics</p>
        </div>
        <button 
          onClick={handleManualRefresh} 
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2a2d3e] border border-white/5 text-[#a0a4b8] hover:text-white transition-colors hover:bg-white/5 shadow-sm"
        >
          <RefreshCw size={16} /> Refresh Data
        </button>
      </div>
      
      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {kpiCards.map((card, idx) => (
          <div key={idx} className="bg-[#1a1c26] p-6 rounded-2xl border border-white/5 shadow-lg transition-all hover:border-white/10 group">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xs font-semibold text-[#84889c] uppercase tracking-widest">{card.title}</h3>
              <div className={`p-2 rounded-lg bg-[#121218] border border-white/5 group-hover:scale-110 transition-transform ${card.color}`}>
                <card.icon size={18} />
              </div>
            </div>
            <div className="text-3xl font-bold text-white">{card.value}</div>
          </div>
        ))}
      </div>

      {/* Organization Management Section */}
      <div className="bg-[#1a1c26] rounded-2xl border border-white/5 overflow-hidden shadow-lg flex flex-col mb-8">
        <div className="px-6 py-5 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Activity className="text-[#7c7fff]" size={20} />
            <h2 className="text-lg font-bold text-white">Tenant Management</h2>
            <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-white/5 text-[#84889c] text-xs font-medium border border-white/10">
              {filteredOrganizations.length} Total
            </span>
          </div>
          
          {/* NEW: Tenant Search and Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex items-center bg-[#121218] border border-white/10 rounded-lg px-3 py-1.5 focus-within:border-[#7c7fff] transition-colors">
              <Search size={14} className="text-[#606479] mr-2" />
              <input 
                type="text"
                placeholder="Find tenant..."
                value={orgSearchTerm}
                onChange={(e) => setOrgSearchTerm(e.target.value)}
                className="bg-transparent border-none focus:outline-none text-sm text-white w-full sm:w-40"
              />
            </div>
            <div className="flex bg-[#121218] border border-white/10 rounded-lg p-1">
              {['All', 'Active', 'Suspended'].map(status => (
                <button
                  key={status}
                  onClick={() => setOrgFilter(status)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    orgFilter === status ? 'bg-[#2a2d3e] text-white shadow-sm' : 'text-[#606479] hover:text-[#84889c]'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6">
          {orgLoading ? (
            <div className="flex items-center justify-center py-12 text-[#84889c]">
              <Loader2 className="animate-spin mr-2" size={20} />
              Loading organizations...
            </div>
          ) : orgError ? (
            <div className="text-red-400 text-sm p-4 bg-red-500/10 rounded-lg border border-red-500/20 text-center">{orgError}</div>
          ) : filteredOrganizations.length === 0 ? (
            <div className="text-[#606479] text-sm text-center py-12 flex flex-col items-center">
              <Search size={32} className="mb-3 opacity-20" />
              No organizations found matching your criteria.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredOrganizations.map((org) => (
                <div key={org._id} className="bg-[#121218] border border-white/5 rounded-xl p-5 hover:border-white/10 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-white font-bold text-base">{org.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="w-2 h-2 rounded-full bg-[#7c7fff]/50"></span>
                        <p className="text-xs text-[#84889c]">{org.domain || 'No custom domain configured'}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                      org.status === 'Active' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.1)]' : 'border-red-500/30 bg-red-500/10 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.1)]'
                    }`}>
                      {org.status || 'Active'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-5 pt-4 border-t border-white/5">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase tracking-widest text-[#606479] mb-0.5">Plan</span>
                      <span className="text-sm font-semibold text-white capitalize">
                        {org.subscriptionPlan || 'Free'}
                      </span>
                    </div>
                    <button
                      onClick={() => handleToggleOrganizationStatus(org)}
                      className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                        org.status === 'Active'
                          ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/10'
                          : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/10'
                      }`}
                    >
                      {org.status === 'Active' ? <Ban size={16} /> : <CheckCircle2 size={16} />}
                      {org.status === 'Active' ? 'Block Access' : 'Unblock Access'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Platform Activity Feed Module */}
      <div className="bg-[#1a1c26] rounded-2xl border border-white/5 overflow-hidden shadow-lg flex flex-col">
        <div className="px-6 py-5 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="text-[#7c7fff]" size={20} />
            <h2 className="text-lg font-bold text-white">Recent Security & Activity Logs</h2>
          </div>
          <div className="flex items-center bg-[#121218] border border-white/10 rounded-lg px-3 py-1.5 focus-within:border-[#7c7fff] transition-colors">
            <Search size={14} className="text-[#606479] mr-2" />
            <input 
              type="text"
              placeholder="Search logs..."
              className="bg-transparent border-none focus:outline-none text-sm text-white w-full sm:w-48"
              onChange={(e) => {
                setSearchTerm(e.target.value);
                fetchAuditLogs(1, e.target.value); 
              }}
            />
          </div>
        </div>
        
        <div className="p-0">
          {auditLoading ? (
            <div className="flex items-center justify-center py-12 text-[#84889c]">
              <Loader2 className="animate-spin mr-2" size={20} /> Loading security logs...
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-[#606479]">
              <ShieldCheck size={48} className="mb-4 opacity-20" />
              <p className="text-sm font-medium">No recent activity found matching your search.</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5 max-h-[450px] overflow-y-auto custom-scrollbar">
              {auditLogs.map((log) => (
                <div key={log._id} className="p-5 hover:bg-white/[0.02] transition-colors flex items-start gap-4">
                  <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 border ${
                    log.action.includes('Blocked') || log.action.includes('Suspended') 
                      ? 'bg-red-500/10 text-red-400 border-red-500/20' 
                      : log.action.includes('Created') || log.action.includes('Active')
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-[#7c7fff]/10 text-[#7c7fff] border-[#7c7fff]/20'
                  }`}>
                    {log.action.includes('Blocked') ? <Ban size={16} /> : <Activity size={16} />}
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm font-semibold">{log.action}</p>
                    <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-[#84889c]">
                      <span className="flex items-center gap-1.5 bg-[#121218] px-2 py-1 rounded-md border border-white/5">
                        <Users size={12} className="text-[#7c7fff]" /> {log.user?.name || 'System User'}
                      </span>
                      <span className="flex items-center gap-1.5 bg-[#121218] px-2 py-1 rounded-md border border-white/5">
                        <Clock size={12} className="text-[#7c7fff]" /> {formatDate(log.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Pagination */}
        <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between bg-white/[0.01]">
          <span className="text-xs text-[#606479]">Showing page {currentPage} of {totalPages}</span>
          <div className="flex gap-2">
            <button 
              disabled={currentPage === 1}
              onClick={() => fetchAuditLogs(currentPage - 1, searchTerm)}
              className="px-4 py-1.5 rounded-lg bg-[#2a2d3e] border border-white/10 text-white text-sm font-medium disabled:opacity-50 hover:bg-[#32364a] transition-colors"
            >Prev</button>
            <button 
              disabled={currentPage === totalPages}
              onClick={() => fetchAuditLogs(currentPage + 1, searchTerm)}
              className="px-4 py-1.5 rounded-lg bg-[#2a2d3e] border border-white/10 text-white text-sm font-medium disabled:opacity-50 hover:bg-[#32364a] transition-colors"
            >Next</button>
          </div>
        </div>
      </div>

      {/* CUSTOM CONFIRMATION MODAL */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#2a2d3e] border border-white/10 p-6 rounded-2xl shadow-2xl max-w-md w-full flex flex-col gap-4 animate-in zoom-in-95 duration-200">
            <div className={`flex justify-between items-center ${confirmModal.nextStatus === 'Suspended' ? 'text-red-400' : 'text-emerald-400'}`}>
              <div className="flex items-center gap-2">
                <AlertTriangle size={24} />
                <span className="font-bold text-lg text-white">Confirm Action</span>
              </div>
              <button 
                onClick={() => setConfirmModal({ isOpen: false, org: null, nextStatus: '', actionLabel: '' })} 
                className="text-[#84889c] hover:text-white transition"
              >
                <X size={20} />
              </button>
            </div>
            
            <p className="text-sm text-gray-300 leading-relaxed bg-[#121218] p-4 rounded-xl border border-white/5">
              Are you sure you want to <strong className="capitalize">{confirmModal.actionLabel}</strong> the organization <strong className="text-white">{confirmModal.org?.name}</strong>?
            </p>
            
            <div className="flex justify-end gap-3 mt-2">
              <button 
                onClick={() => setConfirmModal({ isOpen: false, org: null, nextStatus: '', actionLabel: '' })}
                className="px-5 py-2.5 text-sm font-semibold text-[#84889c] hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={executeToggleStatus}
                disabled={isToggling}
                className={`px-5 py-2.5 text-sm font-bold text-white rounded-lg transition-colors shadow-lg flex items-center gap-2 disabled:opacity-50 ${
                  confirmModal.nextStatus === 'Suspended' 
                    ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20' 
                    : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20'
                }`}
              >
                {isToggling ? <Loader2 size={16} className="animate-spin" /> : null}
                {isToggling ? 'Processing...' : `Yes, ${confirmModal.actionLabel}`}
              </button>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { height: 6px; width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
      `}} />
    </div>
  );
};

export default SuperAdminDashboard;