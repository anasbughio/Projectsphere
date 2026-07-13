import { useState, useEffect } from 'react';
import { Plus, FolderKanban, Calendar, Loader2, Trash2, Edit2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const Projects = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('Active'); // Naya status state

  const normalizeRole = (role) => {
    if (!role) return '';
    const normalized = role.toString().trim().toLowerCase();
    if (['admin', 'org admin', 'organization admin'].includes(normalized)) return 'admin';
    if (['member', 'team member'].includes(normalized)) return 'member';
    return normalized;
  };

  const storedUser = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || 'null') : null;
  const isAdmin = normalizeRole(storedUser?.role) === 'admin';

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
  }, []);

  // Modal handlers
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProject(null);
    setName('');
    setDescription('');
    setStatus('Active'); // Reset status on close
  };

  const handleEditClick = (e, project) => {
    e.stopPropagation(); 
    setEditingProject(project);
    setName(project.name);
    setDescription(project.description || '');
    setStatus(project.status || 'Active'); // Edit karte waqt current status set karein
    setIsModalOpen(true);
  };

  const handleSubmitProject = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingProject) {
        // Update Project Payload mein status add kiya gaya
        const response = await api.put(`/projects/${editingProject._id}`, { name, description, status });
        setProjects((prevProjects) => 
          prevProjects.map((p) => p._id === editingProject._id ? response.data : p)
        );
      } else {
        // Create Project Payload mein status add kiya gaya
        const response = await api.post('/projects', { name, description, status });
        setProjects((prevProjects) => [response.data, ...prevProjects]);
      }
      handleCloseModal();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save project');
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

  return (
    <div className="min-h-full flex flex-col font-sans px-4 sm:px-6 lg:px-8 py-6 w-full max-w-full box-border overflow-x-hidden">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">Projects</h2>
          <p className="text-[#84889c] text-xs sm:text-sm">Manage your workspace projects</p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => {
              handleCloseModal();
              setIsModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 bg-[#7c7fff] hover:bg-[#6b6de0] text-white px-4 py-2.5 rounded-lg font-semibold transition-all w-full sm:w-auto shadow-sm shadow-[#7c7fff]/20"
          >
            <Plus size={18} />
            New Project
          </button>
        )}
      </div>

      {/* Content Section */}
      {loading ? (
        <div className="flex-1 flex justify-center items-center min-h-[400px]">
          <Loader2 className="animate-spin text-[#7c7fff]" size={32} />
        </div>
      ) : error ? (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm sm:text-base">
          {error}
        </div>
      ) : projects.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-2xl bg-[#1a1c26]/50 p-6 sm:p-12 text-center min-h-[400px]">
          <FolderKanban size={48} className="text-[#606479] mb-4" />
          <h3 className="text-base sm:text-lg font-medium text-white mb-2">No projects found</h3>
          <p className="text-[#84889c] text-sm mb-6">Get started by creating your first project.</p>
          {isAdmin && (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-[#1a1c26] border border-white/10 hover:bg-[#222533] text-white px-5 py-2.5 rounded-lg font-medium transition-all"
            >
              <Plus size={16} /> Create Project
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {projects.map((project) => (
            <div 
              key={project._id} 
              className="bg-[#1a1c26] border border-white/5 rounded-xl p-4 sm:p-5 hover:border-white/10 transition-all group cursor-pointer flex flex-col h-full min-w-0 shadow-sm"
              onClick={() => navigate(`/projects/${project._id}`)}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-lg bg-[#7c7fff]/10 flex items-center justify-center text-[#7c7fff] shrink-0">
                  <FolderKanban size={20} />
                </div>
                {isAdmin && (
                  <div className="flex items-center gap-2 sm:gap-3 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
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
                  </div>
                )}
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white mb-2 truncate" title={project.name}>{project.name}</h3>
              <p className="text-[#84889c] text-xs sm:text-sm mb-6 line-clamp-2 min-h-[32px] sm:min-h-[40px] flex-1">
                {project.description || 'No description provided.'}
              </p>
              <div className="flex justify-between items-center pt-4 border-t border-white/5 mt-auto">
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
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm">
          <div 
            className="bg-[#2a2d3e] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 sm:p-6 border-b border-white/5 shrink-0">
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
                    className="w-full px-3 sm:px-4 py-2.5 bg-[#1a1c26] border border-white/5 rounded-lg text-sm sm:text-base text-white placeholder-[#4b4e63] focus:border-[#7c7fff] focus:ring-1 focus:ring-[#7c7fff] focus:outline-none transition-all"
                    placeholder="E.g. E-commerce Redesign"
                  />
                </div>
                
                {/* Status Dropdown added here */}
                <div>
                  <label className="block text-[10px] sm:text-xs font-semibold text-[#84889c] mb-1.5 sm:mb-2 uppercase tracking-wide">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2.5 bg-[#1a1c26] border border-white/5 rounded-lg text-sm sm:text-base text-white focus:border-[#7c7fff] focus:ring-1 focus:ring-[#7c7fff] focus:outline-none transition-all cursor-pointer"
                  >
                    <option value="Active">Active</option>
                    <option value="Planning">Planning</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] sm:text-xs font-semibold text-[#84889c] mb-1.5 sm:mb-2 uppercase tracking-wide">Description (Optional)</label>
                  <textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2.5 bg-[#1a1c26] border border-white/5 rounded-lg text-sm sm:text-base text-white placeholder-[#4b4e63] focus:border-[#7c7fff] focus:ring-1 focus:ring-[#7c7fff] focus:outline-none transition-all resize-none h-20 sm:h-24 custom-scrollbar"
                    placeholder="Briefly describe the project goals..."
                  />
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
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full sm:w-auto px-6 py-2.5 sm:py-2 rounded-lg text-sm font-semibold text-white transition-all flex items-center justify-center min-w-[120px] ${
                    isSubmitting ? 'bg-[#5b5eb8] cursor-not-allowed' : 'bg-[#7c7fff] hover:bg-[#6b6de0] shadow-md shadow-[#7c7fff]/20'
                  }`}
                >
                  {isSubmitting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : editingProject ? (
                    'Save Changes'
                  ) : (
                    'Create Project'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Scrollbar Styles for the Modal Textarea if needed */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}} />
    </div>
  );
};

export default Projects;