import React, { useState } from 'react';
import { X, Loader2, Calendar } from 'lucide-react';
import api from '../services/api'; 
import { useToast } from '../components/ToastProvider';

const AddMilestoneModal = ({ projectId, projects, onClose, onAdded }) => {
  // Local state taake user modal ke andar project select kar sake
  const [localProjectId, setLocalProjectId] = useState(projectId || '');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!localProjectId) {
      toast.push("Please select a project first to add a milestone.", { type: 'error' });
      return;
    }

    setIsSubmitting(true);
    try {
      // Backend ko data aur selected project ID bhej rahe hain
      await api.post('/milestones', { ...formData, projectId: localProjectId });
      toast.push("Milestone added successfully", { type: 'success' });
      onAdded(); 
    } catch (error) {
      toast.push(error.response?.data?.message || "Failed to add milestone", { type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-[#121218] border border-white/10 rounded-xl w-full max-w-md shadow-2xl relative overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-white/5">
          <h2 className="text-lg font-bold text-white">Create New Milestone</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5">
          <div className="space-y-4">
            
            {/* 🔥 NEW: Project Selection Dropdown */}
            <div>
              <label className="text-xs text-gray-400 mb-1 block uppercase tracking-wider">Select Project *</label>
              <select 
                value={localProjectId}
                onChange={(e) => setLocalProjectId(e.target.value)}
                className="w-full bg-[#1a1c26] border border-white/10 rounded-lg p-3 text-white focus:border-[#7c7fff] focus:outline-none transition-all"
              >
                <option value="">-- Choose a Project --</option>
                {projects?.map(p => (
                  <option key={p._id} value={p._id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Title */}
            <div>
              <label className="text-xs text-gray-400 mb-1 block uppercase tracking-wider">Milestone Title *</label>
              <input 
                autoFocus
                required
                type="text" 
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="e.g., Phase 1: Database Design"
                className="w-full bg-[#1a1c26] border border-white/10 rounded-lg p-3 text-white focus:border-[#7c7fff] focus:outline-none transition-all"
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-xs text-gray-400 mb-1 block uppercase tracking-wider">Description (Optional)</label>
              <textarea 
                rows="2"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Briefly describe this milestone..."
                className="w-full bg-[#1a1c26] border border-white/10 rounded-lg p-3 text-white focus:border-[#7c7fff] focus:outline-none transition-all resize-none"
              />
            </div>

            {/* Due Date */}
            <div>
              <label className="text-xs text-gray-400 mb-1 block uppercase tracking-wider">Target Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 text-gray-500" size={18} />
                <input 
                  type="date" 
                  value={formData.dueDate}
                  onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                  className="w-full bg-[#1a1c26] border border-white/10 rounded-lg p-2.5 pl-10 text-white focus:border-[#7c7fff] focus:outline-none cursor-pointer [color-scheme:dark]"
                />
              </div>
            </div>

          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-8">
            <button 
              type="button" 
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting || !formData.title.trim() || !localProjectId}
              className="px-5 py-2 bg-[#7c7fff] hover:bg-[#6b6de0] text-white rounded-lg text-sm font-medium transition flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <><Loader2 size={16} className="animate-spin" /> Saving...</>
              ) : (
                'Create Milestone'
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default AddMilestoneModal;