import { useState, useEffect } from 'react';
import { Plus, FolderKanban, Calendar, Loader2, Trash2, Edit2, Search, Copy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import UpgradeModal from '../components/UpgradeModal';

// ================= MOTION VARIANTS =================
const customEase = [0.16, 1, 0.3, 1];

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 }
  }
};

const fadeUpVariant = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: customEase } }
};

const cardVariant = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  show: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.5, ease: customEase } }
};

const modalBackdropVariant = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.2 } }
};

const modalContentVariant = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  show: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', damping: 25, stiffness: 300 } },
  exit: { opacity: 0, scale: 0.95, y: -20, transition: { duration: 0.2 } }
};

const Projects = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [limitType, setLimitType] = useState('projects');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('Active'); 
  const [clients, setClients] = useState([]);
  const [clientId, setClientId] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [sendWeeklyReports, setSendWeeklyReports] = useState(false);

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const normalizeRole = (role) => {
    if (!role) return '';
    const normalized = role.toString().trim().toLowerCase();
    if (['admin', 'org admin', 'organization admin'].includes(normalized)) return 'admin';
    if (['member', 'team member'].includes(normalized)) return 'member';
    return normalized;
  };

  const storedUser = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || 'null') : null;
  const userRole = normalizeRole(storedUser?.role);
  const isAdmin = userRole === 'admin';
  const canCreateProject = isAdmin || userRole === 'project manager';
  const canEditProject = isAdmin || userRole === 'project manager';

  // Fetch Projects from API
  const fetchProjects = async () => {
    try {
      const response = await api.get('/projects');
      setProjects(response.data);
    } catch (err) {
      setError('Failed to load projects.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();

   const fetchClients = async () => {
    try {
      const res = await api.get('/team'); 
      const usersList = Array.isArray(res.data) ? res.data : (res.data.data || res.data.users || []);
      const clientUsers = usersList.filter(u => 
        u.role && u.role.toString().trim().toLowerCase() === 'client'
      );
      setClients(clientUsers);
    } catch (err) {
      console.error("Failed to load clients:", err);
    }
  };
  fetchClients();
  }, []);

  // Modal handlers
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProject(null);
    setName('');
    setDescription('');
    setStatus('Active');
    setClientEmail('');
    setSendWeeklyReports(false); 
  };

  const handleEditClick = (e, project) => {
    e.stopPropagation(); 
    setEditingProject(project);
    setName(project.name);
    setDescription(project.description || '');
    setStatus(project.status || 'Active'); 
    setIsModalOpen(true);
    setClientEmail(project.clientEmail || '');
    setSendWeeklyReports(project.sendWeeklyReports || false);
    setIsModalOpen(true);
  };

  const handleSubmitProject = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // 🔥 UPDATE THE PAYLOADS:
      if (editingProject) {
        const response = await api.put(`/projects/${editingProject._id}`, { 
          name, description, status, client: clientId || null, 
          clientEmail, sendWeeklyReports // <-- Added here
        });
        setProjects((prevProjects) => 
          prevProjects.map((p) => p._id === editingProject._id ? response.data : p)
        );
      } else {
        const payload = { 
          name, description, status, client: clientId || null, 
          clientEmail, sendWeeklyReports // <-- Added here
        };
        const response = await api.post('/projects', payload);
        setProjects((prevProjects) => [response.data, ...prevProjects]);
      }
      handleCloseModal();
    } catch (err) {
      if (err.response && err.response.status === 403 && err.response.data.code === 'LIMIT_REACHED') {
        handleCloseModal(); 
        setLimitType(err.response.data.type || 'projects'); 
        setShowUpgradeModal(true); 
      } else {
        alert(err.response?.data?.message || 'Failed to save project');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    try {
      await api.delete(`/projects/${projectId}`);
      setProjects((prevProjects) => prevProjects.filter((project) => project._id !== projectId));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete project');
    }
  };

  // Copy Project Link Handler
  const handleCopyLink = (e, projectId) => {
    e.stopPropagation();
    const projectUrl = `${window.location.origin}/projects/${projectId}`;
    navigator.clipboard.writeText(projectUrl);
    alert("Project link copied to clipboard!");
  };

  // FILTER LOGIC
  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <motion.div 
      initial="hidden"
      animate="show"
      variants={staggerContainer}
      className="min-h-full flex flex-col font-sans px-4 sm:px-6 lg:px-8 py-6 w-full max-w-full box-border overflow-x-hidden relative"
    >
      {/* Subtle Background Glow */}
      <div className="absolute top-0 left-[20%] w-[500px] h-[500px] bg-[#7c7fff]/5 blur-[120px] rounded-full pointer-events-none -z-10"></div>

      {/* Header Section */}
      <motion.div variants={fadeUpVariant} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">Projects</h2>
          <p className="text-[#84889c] text-xs sm:text-sm">Manage your workspace projects</p>
        </div>
        {canCreateProject && (
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              handleCloseModal();
              setIsModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#7c7fff] to-[#6b6de0] text-white px-5 py-2.5 rounded-lg font-semibold transition-all w-full sm:w-auto shadow-[0_0_20px_rgba(124,127,255,0.2)]"
          >
            <Plus size={18} />
            New Project
          </motion.button>
        )}
      </motion.div>

      {/* Content Section */}
      {loading ? (
        <div className="flex-1 flex justify-center items-center min-h-[400px]">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
            <Loader2 className="text-[#7c7fff]" size={32} />
          </motion.div>
        </div>
      ) : error ? (
        <motion.div variants={fadeUpVariant} className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm sm:text-base">
          {error}
        </motion.div>
      ) : projects.length === 0 ? (
        <motion.div variants={fadeUpVariant} className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-2xl bg-[#1a1c26]/50 p-6 sm:p-12 text-center min-h-[400px]">
          <FolderKanban size={48} className="text-[#606479] mb-4" />
          <h3 className="text-base sm:text-lg font-medium text-white mb-2">No projects found</h3>
          <p className="text-[#84889c] text-sm mb-6">Get started by creating your first project.</p>
          {canCreateProject && (
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-[#1a1c26] border border-white/10 hover:bg-[#222533] text-white px-5 py-2.5 rounded-lg font-medium transition-all"
            >
              <Plus size={16} /> Create Project
            </motion.button>
          )}
        </motion.div>
      ) : (
        <>
          {/* Search & Filter Bar */}
          <motion.div variants={fadeUpVariant} className="bg-[#121218] p-4 rounded-xl border border-white/5 mb-6 flex flex-col md:flex-row gap-4 items-center shadow-sm">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-2.5 text-gray-500" size={18} />
              <input 
                type="text" 
                placeholder="Search projects..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                className="w-full bg-[#1a1c26] border border-white/5 rounded-lg py-2 pl-10 pr-4 text-white focus:border-[#7c7fff] focus:outline-none transition-colors" 
              />
            </div>
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)} 
              className="w-full md:w-auto bg-[#1a1c26] text-white border border-white/5 rounded-lg px-4 py-2 text-sm focus:border-[#7c7fff] focus:outline-none cursor-pointer transition-colors"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Planning">Planning</option>
              <option value="Completed">Completed</option>
            </select>
          </motion.div>

          {/* Grid Layout - Staggered Animation */}
          <motion.div variants={staggerContainer} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredProjects.map((project) => (
              <motion.div 
                variants={cardVariant}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                key={project._id} 
                className="bg-[#1a1c26] border border-white/5 rounded-xl p-4 sm:p-5 hover:border-white/10 transition-colors group cursor-pointer flex flex-col h-full min-w-0 shadow-sm relative overflow-hidden"
                onClick={() => navigate(`/projects/${project._id}`)}
              >
                {/* Subtle internal glow on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#7c7fff]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>

                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div className="w-10 h-10 rounded-lg bg-[#7c7fff]/10 flex items-center justify-center text-[#7c7fff] shrink-0">
                    <FolderKanban size={20} />
                  </div>
                  
                  <div className="flex items-center gap-2 sm:gap-3 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleCopyLink(e, project._id)}
                      className="text-[#606479] hover:text-emerald-400 transition p-1 sm:p-0"
                      title="Copy Link to Clipboard"
                    >
                      <Copy size={16} className="sm:w-[18px] sm:h-[18px]" />
                    </button>
                    
                    {canEditProject && (
                      <>
                        <button
                          onClick={(e) => handleEditClick(e, project)}
                          className="text-[#606479] hover:text-[#7c7fff] transition p-1 sm:p-0"
                          title="Edit project"
                        >
                          <Edit2 size={16} className="sm:w-[18px] sm:h-[18px]" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProject(project._id);
                          }}
                          className="text-[#606479] hover:text-red-400 transition p-1 sm:p-0"
                          title="Delete project"
                        >
                          <Trash2 size={16} className="sm:w-[18px] sm:h-[18px]" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white mb-2 truncate relative z-10" title={project.name}>{project.name}</h3>
                <p className="text-[#84889c] text-xs sm:text-sm mb-6 line-clamp-2 min-h-[32px] sm:min-h-[40px] flex-1 relative z-10">
                  {project.description || 'No description provided.'}
                </p>
                <div className="flex justify-between items-center pt-4 border-t border-white/5 mt-auto relative z-10">
                  <span className={`text-[10px] sm:text-xs font-semibold px-2.5 py-1 rounded-full border ${
                    project.status === 'Active' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' :
                    project.status === 'Completed' ? 'border-blue-500/30 bg-blue-500/10 text-blue-400' :
                    'border-amber-500/30 bg-amber-500/10 text-amber-400'
                  }`}>
                    {project.status || 'Active'}
                  </span>
                  <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-[#606479]">
                    <Calendar size={12} className="sm:w-3.5 sm:h-3.5" />
                    <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </>
      )}

      {/* Create/Edit Project Modal with AnimatePresence */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            variants={modalBackdropVariant}
            initial="hidden"
            animate="show"
            exit="exit"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md"
          >
            <motion.div 
              variants={modalContentVariant}
              className="bg-[#1a1c26] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 sm:p-6 border-b border-white/5 shrink-0 bg-[#121218]">
                <h3 className="text-lg sm:text-xl font-bold text-white">
                  {editingProject ? 'Edit Project' : 'Create New Project'}
                </h3>
                <p className="text-[#84889c] text-xs sm:text-sm mt-1">
                  {editingProject ? 'Update your workspace project details.' : 'Set up a new workspace for your team.'}
                </p>
              </div>
              
              <form onSubmit={handleSubmitProject} className="p-5 sm:p-6 overflow-y-auto custom-scrollbar">
                <div className="flex flex-col gap-4 sm:gap-5 mb-6 sm:mb-8">
                  <div>
                    <label className="block text-[10px] sm:text-xs font-semibold text-[#84889c] mb-1.5 sm:mb-2 uppercase tracking-wide">Project Name</label>
                    <input 
                      type="text" 
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 sm:px-4 py-2.5 bg-[#121218] border border-white/5 rounded-lg text-sm sm:text-base text-white placeholder-[#4b4e63] focus:border-[#7c7fff] focus:ring-1 focus:ring-[#7c7fff] focus:outline-none transition-all"
                      placeholder="E.g. E-commerce Redesign"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-[10px] sm:text-xs font-semibold text-[#84889c] mb-1.5 sm:mb-2 uppercase tracking-wide">Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full px-3 sm:px-4 py-2.5 bg-[#121218] border border-white/5 rounded-lg text-sm sm:text-base text-white focus:border-[#7c7fff] focus:ring-1 focus:ring-[#7c7fff] focus:outline-none transition-all cursor-pointer"
                    >
                      <option value="Active">Active</option>
                      <option value="Planning">Planning</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] sm:text-xs font-semibold text-[#84889c] mb-1.5 sm:mb-2 uppercase tracking-wide">Assign Client (Optional)</label>
                    <select
                      value={clientId}
                      onChange={(e) => setClientId(e.target.value)}
                      className="w-full px-3 sm:px-4 py-2.5 bg-[#121218] border border-white/5 rounded-lg text-sm sm:text-base text-white focus:border-[#7c7fff] focus:ring-1 focus:ring-[#7c7fff] focus:outline-none transition-all cursor-pointer"
                    >
                      <option value="">No Client (Internal Project)</option>
                      {clients.map(client => (
                        <option key={client._id} value={client._id}>
                          {client.name} ({client.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] sm:text-xs font-semibold text-[#84889c] mb-1.5 sm:mb-2 uppercase tracking-wide">Description (Optional)</label>
                    <textarea 
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-3 sm:px-4 py-2.5 bg-[#121218] border border-white/5 rounded-lg text-sm sm:text-base text-white placeholder-[#4b4e63] focus:border-[#7c7fff] focus:ring-1 focus:ring-[#7c7fff] focus:outline-none transition-all resize-none h-20 sm:h-24 custom-scrollbar"
                      placeholder="Briefly describe the project goals..."
                    />
                  </div>
                  <div className="bg-[#121218] p-4 rounded-xl border border-white/5 space-y-4 mt-2">
                    <h4 className="text-sm font-bold text-white mb-2">Automated Client Reporting</h4>
                    
                    <div>
                      <label className="block text-[10px] sm:text-xs font-semibold text-[#84889c] mb-1.5 uppercase">Client Email Address</label>
                      <input 
                        type="email" 
                        placeholder="client@company.com"
                        value={clientEmail} 
                        onChange={(e) => setClientEmail(e.target.value)} 
                        className="w-full px-3 py-2.5 bg-[#1a1c26] border border-white/5 rounded-lg text-sm text-white focus:outline-none focus:border-[#7c7fff] focus:ring-1 focus:ring-[#7c7fff] transition-all" 
                      />
                    </div>

                    <label className="flex items-start gap-3 cursor-pointer p-3 bg-[#1a1c26] border border-white/5 rounded-lg hover:border-[#7c7fff]/50 transition mt-3">
                      <input 
                        type="checkbox" 
                        checked={sendWeeklyReports}
                        onChange={(e) => setSendWeeklyReports(e.target.checked)}
                        className="w-4 h-4 mt-0.5 rounded bg-[#1a1c26] border-white/10 text-[#7c7fff] focus:ring-[#7c7fff] focus:ring-offset-0 cursor-pointer"
                      />
                      <div>
                        <span className="block text-sm font-semibold text-white">Enable Weekly Automated Emails</span>
                        <span className="block text-[10px] sm:text-xs text-[#84889c] mt-0.5 leading-snug">Automatically email the client a summary of completed tasks and billable hours every Friday.</span>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-white/5">
                  <button 
                    type="button"
                    onClick={handleCloseModal}
                    className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-lg text-sm font-semibold text-[#a0a4b8] hover:text-white hover:bg-white/5 transition-all text-center"
                  >
                    Cancel
                  </button>
                  <motion.button 
                    whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                    whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full sm:w-auto px-6 py-2.5 sm:py-2 rounded-lg text-sm font-semibold text-white transition-all flex items-center justify-center min-w-[120px] ${
                      isSubmitting ? 'bg-[#5b5eb8] cursor-not-allowed' : 'bg-gradient-to-r from-[#7c7fff] to-[#6b6de0] shadow-[0_0_15px_rgba(124,127,255,0.2)]'
                    }`}
                  >
                    {isSubmitting ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : editingProject ? (
                      'Save Changes'
                    ) : (
                      'Create Project'
                    )}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Scrollbar Styles */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}} />

      {/* RENDER THE UPGRADE MODAL HERE */}
      <UpgradeModal 
        isOpen={showUpgradeModal} 
        onClose={() => setShowUpgradeModal(false)} 
        type={limitType} 
      />
    </motion.div>
  );
};

export default Projects;