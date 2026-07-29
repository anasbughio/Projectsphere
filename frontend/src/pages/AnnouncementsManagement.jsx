import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Megaphone, Send, Trash2, Loader2, AlertTriangle, X } from 'lucide-react';
import { useToast } from '../components/ToastProvider'; // Added Toast integration

const AnnouncementsManagement = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info',
    targetAudience: 'all'
  });
  
  const toast = useToast();
  
  // NEW: State for safe deletion modal
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null });
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const res = await api.get('/announcements');
      setAnnouncements(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching announcements:", err);
      toast.push("Failed to load announcements.", { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.message) return;

    try {
      setSending(true);
      await api.post('/announcements', formData);
      setFormData({ title: '', message: '', type: 'info', targetAudience: 'all' });
      fetchAnnouncements();
      toast.push("Broadcast sent successfully!", { type: 'success' });
    } catch (err) {
      console.error("Error sending broadcast:", err);
      toast.push(err.response?.data?.message || "Failed to send broadcast.", { type: 'error' });
    } finally {
      setSending(false);
    }
  };

  const executeDelete = async () => {
    if (!confirmModal.id) return;
    setIsDeleting(true);
    try {
      await api.delete(`/announcements/${confirmModal.id}`);
      setAnnouncements(announcements.filter(a => a._id !== confirmModal.id));
      toast.push("Announcement removed.", { type: 'info' });
      setConfirmModal({ isOpen: false, id: null });
    } catch (err) {
      console.error("Error deleting announcement:", err);
      toast.push("Failed to delete announcement.", { type: 'error' });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Global Announcements & Broadcasts</h1>
        <p className="text-gray-400">Send system-wide alerts, maintenance updates, or news banners to all platform users.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Create Broadcast Form */}
        <div className="bg-[#1a1c26] p-6 rounded-2xl border border-white/5 shadow-lg space-y-4 lg:col-span-1 h-fit">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Megaphone size={20} className="text-[#7c7fff]" /> New Broadcast
          </h2>

          <form onSubmit={handleBroadcast} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., System Maintenance"
                required
                maxLength={60}
                className="w-full bg-[#232530] border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[#7c7fff] transition-colors"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-medium text-gray-400">Message</label>
                {/* NEW: Character Counter */}
                <span className={`text-[10px] ${formData.message.length > 250 ? 'text-red-400' : 'text-gray-500'}`}>
                  {formData.message.length}/300
                </span>
              </div>
              <textarea
                rows={4}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Write your announcement details here..."
                required
                maxLength={300}
                className="w-full bg-[#232530] border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[#7c7fff] resize-none transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full bg-[#232530] border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[#7c7fff] cursor-pointer"
                >
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="success">Success</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Audience</label>
                <select
                  value={formData.targetAudience}
                  onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                  className="w-full bg-[#232530] border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[#7c7fff] cursor-pointer"
                >
                  <option value="all">All Users</option>
                  <option value="tenants">Tenants Only</option>
                  <option value="clients">Clients Only</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={sending || !formData.title.trim() || !formData.message.trim()}
              className="w-full mt-2 bg-[#7c7fff] hover:bg-[#6b6ee6] disabled:opacity-50 disabled:hover:bg-[#7c7fff] text-white py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#7c7fff]/20"
            >
              {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              {sending ? 'Broadcasting...' : 'Broadcast Now'}
            </button>
          </form>
        </div>

        {/* Active Broadcasts List */}
        <div className="bg-[#1a1c26] p-6 rounded-2xl border border-white/5 shadow-lg lg:col-span-2 space-y-4 flex flex-col h-full">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <h2 className="text-lg font-bold text-white">Recent Active Broadcasts</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-white/5 text-[#84889c] text-xs font-medium border border-white/10">
              {announcements.length} Total
            </span>
          </div>

          {loading ? (
            <div className="flex-1 flex justify-center items-center py-12">
              <Loader2 className="animate-spin text-[#7c7fff]" size={32} />
            </div>
          ) : announcements.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-12 text-gray-500">
              <Megaphone size={40} className="mb-3 opacity-20" />
              <p className="text-sm">No active broadcasts found. Send one using the form!</p>
            </div>
          ) : (
            <div className="space-y-3 overflow-y-auto custom-scrollbar flex-1 pr-2 max-h-[500px]">
              {announcements.map((item) => (
                <div key={item._id} className="bg-[#121218] p-4 rounded-xl border border-white/5 flex items-start justify-between gap-4 hover:border-white/10 transition-colors">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        item.type === 'urgent' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                        item.type === 'warning' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                        item.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        'bg-[#7c7fff]/10 text-[#7c7fff] border border-[#7c7fff]/20'
                      }`}>
                        {item.type}
                      </span>
                      <h3 className="text-sm font-bold text-white">{item.title}</h3>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed break-words">{item.message}</p>
                    <div className="flex items-center gap-3 pt-2">
                      <span className="text-[10px] uppercase font-semibold tracking-widest text-[#606479]">
                        Target: <span className="text-gray-300">{item.targetAudience}</span>
                      </span>
                      <span className="text-[10px] text-[#606479]">•</span>
                      <span className="text-[10px] font-medium text-[#606479]">
                        {new Date(item.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setConfirmModal({ isOpen: true, id: item._id })}
                    className="text-gray-500 hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10 transition-colors shrink-0"
                    title="Remove Broadcast"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* NEW: Safe Deletion Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#2a2d3e] border border-white/10 p-6 rounded-2xl shadow-2xl max-w-sm w-full flex flex-col gap-4 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center text-red-400">
              <div className="flex items-center gap-2">
                <AlertTriangle size={20} />
                <span className="font-bold text-base text-white">Delete Broadcast?</span>
              </div>
              <button 
                onClick={() => setConfirmModal({ isOpen: false, id: null })} 
                className="text-[#84889c] hover:text-white transition"
              >
                <X size={18} />
              </button>
            </div>
            
            <p className="text-sm text-gray-300">
              Are you sure you want to remove this announcement? It will immediately disappear from all user dashboards.
            </p>
            
            <div className="flex justify-end gap-3 mt-2">
              <button 
                onClick={() => setConfirmModal({ isOpen: false, id: null })}
                className="px-4 py-2 text-sm font-semibold text-[#84889c] hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={executeDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors shadow-lg shadow-red-500/20 flex items-center gap-2 disabled:opacity-50"
              >
                {isDeleting ? <Loader2 size={16} className="animate-spin" /> : null}
                {isDeleting ? 'Deleting...' : 'Yes, Delete'}
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

export default AnnouncementsManagement;