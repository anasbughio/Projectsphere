import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Megaphone, Send, Trash2, Loader2 } from 'lucide-react';

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

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const res = await api.get('/announcements');
      setAnnouncements(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching announcements:", err);
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
    } catch (err) {
      console.error("Error sending broadcast:", err);
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/announcements/${id}`);
      setAnnouncements(announcements.filter(a => a._id !== id));
    } catch (err) {
      console.error("Error deleting announcement:", err);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Global Announcements & Broadcasts</h1>
        <p className="text-gray-400">Send system-wide alerts, maintenance updates, or news banners to all platform users.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Create Broadcast Form */}
        <div className="bg-[#1a1c26] p-6 rounded-2xl border border-white/5 shadow-lg space-y-4 lg:col-span-1">
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
                className="w-full bg-[#232530] border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[#7c7fff]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Message</label>
              <textarea
                rows={4}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Write your announcement details here..."
                required
                className="w-full bg-[#232530] border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[#7c7fff] resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full bg-[#232530] border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[#7c7fff]"
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
                  className="w-full bg-[#232530] border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[#7c7fff]"
                >
                  <option value="all">All Users</option>
                  <option value="tenants">Tenants Only</option>
                  <option value="clients">Clients Only</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={sending}
              className="w-full bg-[#7c7fff] hover:bg-[#6b6ee6] text-white py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#7c7fff]/20"
            >
              {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              Broadcast Now
            </button>
          </form>
        </div>

        {/* Active Broadcasts List */}
        <div className="bg-[#1a1c26] p-6 rounded-2xl border border-white/5 shadow-lg lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-white">Recent Active Broadcasts</h2>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-[#7c7fff]" size={32} />
            </div>
          ) : announcements.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">
              No active broadcasts found. Send one using the form!
            </div>
          ) : (
            <div className="space-y-3">
              {announcements.map((item) => (
                <div key={item._id} className="bg-[#232530] p-4 rounded-xl border border-white/5 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                        item.type === 'urgent' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                        item.type === 'warning' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                        'bg-[#7c7fff]/10 text-[#7c7fff] border border-[#7c7fff]/20'
                      }`}>
                        {item.type}
                      </span>
                      <h3 className="text-sm font-bold text-white">{item.title}</h3>
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed">{item.message}</p>
                    <span className="text-[10px] text-gray-500 block pt-1">
                      Target: <span className="uppercase text-gray-400">{item.targetAudience}</span> • {new Date(item.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <button
                    onClick={() => handleDelete(item._id)}
                    className="text-gray-500 hover:text-red-400 p-2 rounded-lg hover:bg-white/5 transition-colors"
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
    </div>
  );
};

export default AnnouncementsManagement;