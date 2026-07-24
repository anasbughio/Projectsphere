import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Loader2, CreditCard, ShieldCheck, Users, Layers, Edit3, CheckCircle, AlertTriangle } from 'lucide-react';

const SubscriptionManagement = () => {
  const [loading, setLoading] = useState(true);
  const [tenants, setTenants] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State for editing modal
  const [formData, setFormData] = useState({
    plan: 'Free',
    status: 'Active',
    maxUsers: 5,
    maxProjects: 3,
    expiresAt: ''
  });

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/superadmin/subscriptions');
      setTenants(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to load subscription data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
    const interval = setInterval(() => {
      fetchSubscriptions();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

const handleEditClick = (tenant) => {
    setSelectedTenant(tenant);
    
    let formattedDate = '';
    if (tenant.expiresAt) {
      const dateObj = new Date(tenant.expiresAt);
      if (!isNaN(dateObj.getTime())) {
        formattedDate = dateObj.toISOString().split('T')[0];
      }
    }

    setFormData({
      plan: tenant.plan || 'Free',
      status: tenant.status || 'Active',
      maxUsers: tenant.maxUsers || 5,
      maxProjects: tenant.maxProjects || 3,
      expiresAt: formattedDate
    });
    setIsModalOpen(true);
  };
  const handleSaveSubscription = async (e) => {
    e.preventDefault();
    if (!selectedTenant) return;

    try {
      setSaving(true);
      await api.put(`/superadmin/subscriptions/${selectedTenant._id}`, formData);
      setIsModalOpen(false);
      fetchSubscriptions(); // Refresh table
    } catch (err) {
      console.error("Error updating subscription:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-80px)] items-center justify-center">
        <Loader2 className="animate-spin text-[#7c7fff]" size={40} />
      </div>
    );
  }

  // Summary Metrics
  const freeCount = tenants.filter(t => t.plan?.toUpperCase() === 'FREE').length;
  const proCount = tenants.filter(t => t.plan?.toUpperCase() === 'PRO').length;
  const enterpriseCount = tenants.filter(t => t.plan?.toUpperCase() === 'ENTERPRISE').length;

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Subscription & Tenant Plans</h1>
        <p className="text-gray-400">Manage SaaS subscription plans, user limits, and tenant access statuses.</p>
      </div>

      {/* Plan Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#1a1c26] p-6 rounded-2xl border border-white/5 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm font-medium">Free Tier Tenants</p>
            <h3 className="text-3xl font-bold text-white mt-1">{freeCount}</h3>
          </div>
          <div className="bg-gray-500/10 p-3 rounded-xl text-gray-400">
            <CreditCard size={24} />
          </div>
        </div>

        <div className="bg-[#1a1c26] p-6 rounded-2xl border border-white/5 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm font-medium">Pro Plan Tenants</p>
            <h3 className="text-3xl font-bold text-[#7c7fff] mt-1">{proCount}</h3>
          </div>
          <div className="bg-[#7c7fff]/10 p-3 rounded-xl text-[#7c7fff]">
            <ShieldCheck size={24} />
          </div>
        </div>

        <div className="bg-[#1a1c26] p-6 rounded-2xl border border-white/5 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm font-medium">Enterprise Tenants</p>
            <h3 className="text-3xl font-bold text-[#10b981] mt-1">{enterpriseCount}</h3>
          </div>
          <div className="bg-[#10b981]/10 p-3 rounded-xl text-[#10b981]">
            <CheckCircle size={24} />
          </div>
        </div>
      </div>

      {/* Tenants Subscription Table */}
      <div className="bg-[#1a1c26] rounded-2xl border border-white/5 shadow-lg overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <h2 className="text-lg font-bold text-white">Active Tenant Subscriptions</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02] text-gray-400 text-xs uppercase tracking-wider">
                <th className="p-4 pl-6">Tenant / Org</th>
                <th className="p-4">Current Plan</th>
                <th className="p-4">Status</th>
                <th className="p-4">Users Usage</th>
                <th className="p-4">Projects Usage</th>
                <th className="p-4 text-right pr-6">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm text-gray-200">
              {tenants.map((tenant) => (
                <tr key={tenant._id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-4 pl-6 font-semibold text-white">{tenant.name}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      tenant.plan === 'Enterprise' ? 'bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20' :
                      tenant.plan === 'Pro' ? 'bg-[#7c7fff]/10 text-[#7c7fff] border border-[#7c7fff]/20' :
                      'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                    }`}>
                      {tenant.plan}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1.5 text-xs ${
                      tenant.status === 'Active' ? 'text-[#10b981]' : 'text-red-400'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${tenant.status === 'Active' ? 'bg-[#10b981]' : 'bg-red-400'}`}></span>
                      {tenant.status}
                    </span>
                  </td>
                  <td className="p-4 text-gray-300">
                    <span className="font-medium text-white">{tenant.userCount}</span> / {tenant.maxUsers} Users
                  </td>
                  <td className="p-4 text-gray-300">
                    <span className="font-medium text-white">{tenant.projectCount}</span> / {tenant.maxProjects} Projects
                  </td>
                  <td className="p-4 text-right pr-6">
                    <button
                      onClick={() => handleEditClick(tenant)}
                      className="inline-flex items-center gap-1.5 bg-white/5 hover:bg-white/10 text-white px-3 py-1.5 rounded-xl text-xs transition-all border border-white/10"
                    >
                      <Edit3 size={14} /> Edit Plan
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Plan Modal */}
      {isModalOpen && selectedTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#1a1c26] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-5">
            <h3 className="text-xl font-bold text-white">Manage Plan: {selectedTenant.name}</h3>

            <form onSubmit={handleSaveSubscription} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Subscription Plan</label>
                <select
                  value={formData.plan}
                  onChange={(e) => {
                    const plan = e.target.value;
                    setFormData({
                      ...formData,
                      plan,
                      maxUsers: plan === 'Enterprise' ? 999 : plan === 'Pro' ? 25 : 5,
                      maxProjects: plan === 'Enterprise' ? 999 : plan === 'Pro' ? 15 : 3
                    });
                  }}
                  className="w-full bg-[#232530] border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[#7c7fff]"
                >
                  <option value="Free">Free</option>
                  <option value="Pro">Pro</option>
                  <option value="Enterprise">Enterprise</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full bg-[#232530] border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[#7c7fff]"
                >
                  <option value="Active">Active</option>
                  <option value="Suspended">Suspended</option>
                  <option value="Expired">Expired</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Max Users Limit</label>
                  <input
                    type="number"
                    value={formData.maxUsers}
                    onChange={(e) => setFormData({ ...formData, maxUsers: parseInt(e.target.value) })}
                    className="w-full bg-[#232530] border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[#7c7fff]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Max Projects Limit</label>
                  <input
                    type="number"
                    value={formData.maxProjects}
                    onChange={(e) => setFormData({ ...formData, maxProjects: parseInt(e.target.value) })}
                    className="w-full bg-[#232530] border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[#7c7fff]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-gray-400 hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-[#7c7fff] hover:bg-[#6b6ee6] text-white px-4 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-2"
                >
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionManagement;