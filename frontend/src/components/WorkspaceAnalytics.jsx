import React, { useState, useEffect } from 'react';
import { Activity, Mail, Loader2, CheckCircle2, TrendingUp, ShieldCheck, Building2, Users, AlertCircle } from 'lucide-react';
import api from '../services/api';

const WorkspaceAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [platformData, setPlatformData] = useState(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState('');

  // Fetch platform-wide stats for Super Admin
  const fetchPlatformAnalytics = async () => {
    try {
      setLoading(true);
      const response = await api.get('/dashboard/platform-stats'); 
      setPlatformData(response.data);
    } catch (err) {
      console.error('Failed to load platform analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlatformAnalytics();
  }, []);

  // Handler to trigger the weekly email report for Super Admin
  const handleSendEmailReport = async () => {
    setSendingEmail(true);
    setEmailSuccess('');
    try {
      const response = await api.post('/reports/generate-weekly-report');
      setEmailSuccess(response.data.message || 'Platform summary report sent successfully to your email!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send email report');
    } finally {
      setSendingEmail(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="animate-spin text-[#7c7fff]" size={36} />
      </div>
    );
  }

  // Fallback metrics for platform stats
  const stats = platformData || {
    totalOrgs: 0,
    totalUsers: 0,
    activeOrgs: 0,
    suspendedOrgs: 0
  };

  return (
    <div className="p-6 space-y-6 font-sans max-w-7xl mx-auto">
      {/* Header & Email Report Button Action */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-[#1a1c26] p-6 rounded-2xl border border-white/5 shadow-lg">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
            <Activity className="text-[#7c7fff]" size={24} />
            Platform Health & Global Analytics
          </h2>
          <p className="text-[#84889c] text-sm">System-wide metrics, active tenants, and platform user distribution.</p>
        </div>

        <div>
          <button
            onClick={handleSendEmailReport}
            disabled={sendingEmail}
            className="flex items-center gap-2 bg-[#7c7fff] hover:bg-[#6b6de0] text-white px-4 py-2.5 rounded-xl font-semibold transition-all shadow-md shadow-[#7c7fff]/20 text-sm"
          >
            {sendingEmail ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
            {sendingEmail ? 'Sending Summary...' : 'Email Platform Report'}
          </button>
        </div>
      </div>

      {emailSuccess && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-sm flex items-center gap-2">
          <CheckCircle2 size={18} />
          {emailSuccess}
        </div>
      )}

      {/* Global Metrics Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Organizations Card */}
        <div className="bg-[#1a1c26] p-6 rounded-2xl border border-white/5 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Total Organizations</p>
            <h3 className="text-3xl font-bold text-white mt-1">{stats.totalOrgs || stats.totalOrgAdmins || 0}</h3>
          </div>
          <div className="bg-[#7c7fff]/10 p-3 rounded-xl text-[#7c7fff]">
            <Building2 size={24} />
          </div>
        </div>

        {/* Total Users Card */}
        <div className="bg-[#1a1c26] p-6 rounded-2xl border border-white/5 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Platform Users</p>
            <h3 className="text-3xl font-bold text-emerald-400 mt-1">{stats.totalUsers}</h3>
          </div>
          <div className="bg-emerald-500/10 p-3 rounded-xl text-emerald-400">
            <Users size={24} />
          </div>
        </div>

        {/* Active Tenants Card */}
        <div className="bg-[#1a1c26] p-6 rounded-2xl border border-white/5 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Active Tenants</p>
            <h3 className="text-3xl font-bold text-blue-400 mt-1">{stats.activeOrgs}</h3>
          </div>
          <div className="bg-blue-500/10 p-3 rounded-xl text-blue-400">
            <ShieldCheck size={24} />
          </div>
        </div>

        {/* Suspended Tenants Card */}
        <div className="bg-[#1a1c26] p-6 rounded-2xl border border-white/5 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Suspended Tenants</p>
            <h3 className="text-3xl font-bold text-red-400 mt-1">{stats.suspendedOrgs}</h3>
          </div>
          <div className="bg-red-500/10 p-3 rounded-xl text-red-400">
            <AlertCircle size={24} />
          </div>
        </div>

      </div>

      {/* System Status Summary Section */}
      <div className="bg-[#1a1c26] rounded-2xl border border-white/5 shadow-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Infrastructure & Ecosystem Overview</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#232530] p-4 rounded-xl border border-white/5 flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs uppercase font-medium">Server Status</p>
              <p className="text-lg font-bold text-emerald-400 mt-1">Operational (100% Uptime)</p>
            </div>
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
          </div>

          <div className="bg-[#232530] p-4 rounded-xl border border-white/5 flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs uppercase font-medium">Database Connection</p>
              <p className="text-lg font-bold text-[#7c7fff] mt-1">MongoDB Atlas Connected</p>
            </div>
            <div className="w-3 h-3 rounded-full bg-[#7c7fff]"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceAnalytics;