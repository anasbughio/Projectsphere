import React, { useState, useEffect } from 'react';
import { Building2, Users, AlertCircle, Activity, Loader2, RefreshCw, ShieldCheck, Ban, CheckCircle2, Clock, AlertTriangle, X } from 'lucide-react';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [auditLoading, setAuditLoading] = useState(true);
  const [orgLoading, setOrgLoading] = useState(true);
  const [orgError, setOrgError] = useState('');
  const toast = useToast();

  //  States for the custom confirmation modal
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

  //  Opens the modal instead of window.confirm
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

  // Executes the API call after user confirms inside the modal
  const executeToggleStatus = async () => {
    const { org, nextStatus, actionLabel } = confirmModal;
    setIsToggling(true);

    try {
      const response = await api.patch(`/organizations/${org._id}/status`, { status: nextStatus });
      setOrganizations((prev) => prev.map((item) => item._id === org._id ? response.data : item));
      window.dispatchEvent(new Event('platformStatsUpdated'));
      fetchAuditLogs();
      toast.push(`Organization ${actionLabel}ed successfully.`, { type: 'info' });
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

  return (
    <div className="p-6 font-sans relative">
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

      {/* Organization Management Section */}
      <div className="bg-[#1a1c26] rounded-xl border border-white/5 overflow-hidden shadow-sm flex flex-col mb-8">
        <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Activity className="text-[#7c7fff]" size={20} />
            <h2 className="text-lg font-bold text-white">Tenant Management</h2>
          </div>
          <span className="text-[11px] uppercase tracking-[0.2em] text-[#84889c]">
            {organizations.filter((org) => org.status === 'Active').length} Active / {organizations.filter((org) => org.status === 'Suspended').length} Suspended
          </span>
        </div>

        <div className="p-6">
          {orgLoading ? (
            <div className="flex items-center justify-center py-8 text-[#84889c]">
              <Loader2 className="animate-spin mr-2" size={18} />
              Loading organizations...
            </div>
          ) : orgError ? (
            <div className="text-red-400 text-sm">{orgError}</div>
          ) : organizations.length === 0 ? (
            <div className="text-[#84889c] text-sm">No organizations available.</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {organizations.map((org) => (
                <div key={org._id} className="bg-[#16171d] border border-white/5 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-white font-semibold">{org.name}</h3>
                      <p className="text-sm text-[#84889c] mt-1">{org.domain || 'No custom domain'}</p>
                    </div>
                    <span className={`text-[10px] sm:text-xs font-semibold px-2.5 py-1 rounded-full border ${
                      org.status === 'Active' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-red-500/30 bg-red-500/10 text-red-400'
                    }`}>
                      {org.status || 'Active'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
                    <span className="text-xs uppercase tracking-[0.2em] text-[#606479]">
                      {org.subscriptionPlan || 'Free'}
                    </span>
                    <button
                      onClick={() => handleToggleOrganizationStatus(org)}
                      className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                        org.status === 'Active'
                          ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                      }`}
                    >
                      {org.status === 'Active' ? <Ban size={16} /> : <CheckCircle2 size={16} />}
                      {org.status === 'Active' ? 'Block' : 'Unblock'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Platform Activity Feed Module */}
      <div className="bg-[#1a1c26] rounded-xl border border-white/5 overflow-hidden shadow-sm flex flex-col">
        <div className="px-6 py-5 border-b border-white/5 flex items-center gap-3">
          <ShieldCheck className="text-[#7c7fff]" size={20} />
          <h2 className="text-lg font-bold text-white">Recent Platform Activity</h2>
          <input 
            type="text"
            placeholder="Search logs..."
            className="bg-[#2a2d3e] text-white text-sm px-3 py-1.5 rounded-lg border border-white/10 focus:outline-none focus:border-[#7c7fff] ml-auto"
            onChange={(e) => {
              setSearchTerm(e.target.value);
              fetchAuditLogs(1, e.target.value); 
            }}
          />
        </div>
        
        <div className="p-0">
          {auditLoading ? (
            <div className="flex items-center justify-center py-10 text-[#84889c]">
              <Loader2 className="animate-spin mr-2" size={18} /> Loading activity logs...
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-[#606479]">
              <ShieldCheck size={48} className="mb-4 opacity-30" />
              <p className="text-sm font-medium">No recent activity found.</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5 max-h-[400px] overflow-y-auto custom-scrollbar">
              {auditLogs.map((log) => (
                <div key={log._id} className="p-4 hover:bg-white/[0.02] transition-colors flex items-start gap-4">
                  <div className={`p-2 rounded-lg shrink-0 mt-1 ${
                    log.action.includes('Blocked') || log.action.includes('Suspended') 
                      ? 'bg-red-500/10 text-red-400' 
                      : log.action.includes('Created') || log.action.includes('Active')
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-[#7c7fff]/10 text-[#7c7fff]'
                  }`}>
                    {log.action.includes('Blocked') ? <Ban size={16} /> : <Activity size={16} />}
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">{log.action}</p>
                    <div className="flex items-center gap-4 mt-1.5 text-xs text-[#606479]">
                      <span className="flex items-center gap-1">
                        <Users size={12} /> {log.user?.name || 'System User'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} /> {formatDate(log.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-white/5 flex justify-center gap-2">
          <button 
            disabled={currentPage === 1}
            onClick={() => fetchAuditLogs(currentPage - 1, searchTerm)}
            className="px-3 py-1 rounded bg-[#2a2d3e] text-white disabled:opacity-50 transition-opacity"
          >Prev</button>
          <span className="text-[#84889c] py-1">{currentPage} / {totalPages}</span>
          <button 
            disabled={currentPage === totalPages}
            onClick={() => fetchAuditLogs(currentPage + 1, searchTerm)}
            className="px-3 py-1 rounded bg-[#2a2d3e] text-white disabled:opacity-50 transition-opacity"
          >Next</button>
        </div>
      </div>

      {/*  CUSTOM CONFIRMATION MODAL */}
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
              Are you sure you want to <strong className="capitalize">{confirmModal.actionLabel}</strong> the organization <strong>{confirmModal.org?.name}</strong>?
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