// frontend/src/pages/AdminPanel.jsx
import React, { useState, useEffect } from 'react';
import { Building2, Plus, Edit2, Trash2, Shield, Loader2, Ban, CheckCircle2 } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../components/ToastProvider';

const AdminPanel = () => {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: '', domain: '', subscriptionPlan: 'Enterprise' });

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const toast = useToast();

  const fetchOrganizations = async () => {
    try {
      const response = await api.get('/organizations');
      setOrganizations(response.data);
    } catch (err) {
      setError('Failed to load organizations. Verify Super Admin permissions.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await api.post('/organizations', formData);
      setOrganizations([response.data, ...organizations]);
        try { window.dispatchEvent(new Event('platformStatsUpdated')); } catch (e) { /* noop */ }
      toast.push('Organization created successfully.', { type: 'info' });
      setIsModalOpen(false);
      setFormData({ name: '', domain: '', subscriptionPlan: 'Enterprise' });
    } catch (err) {
      toast.push(err.response?.data?.message || 'Failed to create organization', { type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (orgId) => {
    if (!window.confirm('Delete this organization permanently? This will remove the organization and its related users from the database.')) return;
    try {
      await api.delete(`/organizations/${orgId}`);
      setOrganizations((prev) => prev.filter((org) => org._id !== orgId));
      try { window.dispatchEvent(new Event('platformStatsUpdated')); } catch (e) { /* noop */ }
      toast.push('Organization deleted permanently.', { type: 'success' });
    } catch (err) {
      toast.push(err.response?.data?.message || 'Failed to delete organization', { type: 'error' });
    }
  };

  const handleToggleStatus = async (org) => {
    const nextStatus = org.status === 'Active' ? 'Suspended' : 'Active';
    const actionLabel = nextStatus === 'Active' ? 'unblock' : 'block';

    if (!window.confirm(`Are you sure you want to ${actionLabel} this organization?`)) return;

    try {
      const response = await api.patch(`/organizations/${org._id}/status`, { status: nextStatus });
      setOrganizations((prev) => prev.map((item) => item._id === org._id ? response.data : item));
      try { window.dispatchEvent(new Event('platformStatsUpdated')); } catch (e) { /* noop */ }
      toast.push(`Organization ${actionLabel}ed successfully.`, { type: 'info' });
    } catch (err) {
      toast.push(err.response?.data?.message || `Failed to ${actionLabel} organization`, { type: 'error' });
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-[#7c7fff]" size={40} />
      </div>
    );
  }

  return (
    <div className="flex flex-col font-sans px-4 sm:px-6 lg:px-8 py-6 w-full max-w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="text-amber-400" size={24} />
            <h2 className="text-2xl font-bold text-white">Super Admin Console</h2>
          </div>
          <p className="text-[#84889c] text-sm">Platform-wide organization and tenant management</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-[#7c7fff] hover:bg-[#6b6de0] text-white px-4 py-2.5 rounded-lg font-semibold transition-all shadow-sm shadow-[#7c7fff]/20"
        >
          <Plus size={18} /> New Organization
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Organizations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {organizations.map((org) => (
          <div key={org._id} className="bg-[#1a1c26] border border-white/5 rounded-xl p-5 hover:border-white/10 transition-all flex flex-col h-full shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
                <Building2 size={20} />
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => handleToggleStatus(org)} className="text-[#606479] hover:text-amber-400 transition" title={org.status === 'Active' ? 'Block Organization' : 'Unblock Organization'}>
                  {org.status === 'Active' ? <Ban size={18} /> : <CheckCircle2 size={18} />}
                </button>
                <button onClick={() => handleDelete(org._id)} className="text-[#606479] hover:text-red-400 transition" title="Delete Organization">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            <h3 className="text-lg font-bold text-white mb-1 truncate">{org.name}</h3>
            <p className="text-[#84889c] text-sm mb-4 truncate">{org.domain || 'No custom domain'}</p>
            
            <div className="flex justify-between items-center pt-4 border-t border-white/5 mt-auto">
              <span className={`text-[10px] sm:text-xs font-semibold px-2.5 py-1 rounded-full border ${
                org.status === 'Active' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-red-500/30 bg-red-500/10 text-red-400'
              }`}>
                {org.status}
              </span>
              <span className="text-[10px] sm:text-xs font-semibold px-2.5 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400">
                {org.subscriptionPlan}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Create Organization Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#2a2d3e] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-white/5">
              <h3 className="text-xl font-bold text-white">Onboard New Organization</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="flex flex-col gap-5 mb-8">
                <div>
                  <label className="block text-xs font-semibold text-[#84889c] mb-2 uppercase">Organization Name</label>
                  <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2.5 bg-[#1a1c26] border border-white/5 rounded-lg text-white focus:border-[#7c7fff] focus:outline-none" placeholder="Acme Corp" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#84889c] mb-2 uppercase">Domain (Optional)</label>
                  <input type="text" value={formData.domain} onChange={(e) => setFormData({...formData, domain: e.target.value})} className="w-full px-4 py-2.5 bg-[#1a1c26] border border-white/5 rounded-lg text-white focus:border-[#7c7fff] focus:outline-none" placeholder="acme.com" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#84889c] mb-2 uppercase">Subscription Plan</label>
                  <select value={formData.subscriptionPlan} onChange={(e) => setFormData({...formData, subscriptionPlan: e.target.value})} className="w-full px-4 py-2.5 bg-[#1a1c26] border border-white/5 rounded-lg text-white focus:border-[#7c7fff] focus:outline-none cursor-pointer">
                    <option value="Free">Free</option>
                    <option value="Professional">Professional</option>
                    <option value="Enterprise">Enterprise</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg text-sm font-semibold text-[#a0a4b8] hover:text-white transition-all">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-6 py-2 rounded-lg text-sm font-semibold text-white bg-[#7c7fff] hover:bg-[#6b6de0] transition-all flex items-center min-w-[120px] justify-center">
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Create Tenant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;