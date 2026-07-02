import { useState, useEffect } from 'react';
import { Plus, FolderKanban, MoreVertical, Calendar, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const Projects = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

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

  // Create New Project
  const handleCreateProject = async (e) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const response = await api.post('/projects', { name, description });
      // Naya project list mein sab se upar add kar dein
      setProjects([response.data, ...projects]);
      setIsModalOpen(false);
      setName('');
      setDescription('');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create project');
    } finally {
      setIsCreating(false);
    }
  };
      const user = JSON.parse(localStorage.getItem('user'));

  return (
    <div className="h-full flex flex-col font-sans">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Projects</h2>
          <p className="text-[#84889c] text-sm">Manage your workspace projects</p>
        </div>
        {user?.role === 'Admin' && (
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-[#7c7fff] hover:bg-[#6b6de0] text-white px-4 py-2.5 rounded-lg font-semibold transition"
        >
          <Plus size={18} />
          New Project
        </button>
        )}
      </div>

      {/* Content Section */}
      {loading ? (
        <div className="flex-1 flex justify-center items-center">
          <Loader2 className="animate-spin text-[#7c7fff]" size={32} />
        </div>
      ) : error ? (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg">
          {error}
        </div>
      ) : projects.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-2xl bg-[#1a1c26]/50">
          <FolderKanban size={48} className="text-[#606479] mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No projects found</h3>
          <p className="text-[#84889c] mb-6">Get started by creating your first project.</p>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-[#1a1c26] border border-white/10 hover:bg-[#222533] text-white px-4 py-2 rounded-lg font-medium transition"
          >
            <Plus size={16} /> Create Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div key={project._id} className="bg-[#1a1c26] border border-white/5 rounded-xl p-5 hover:border-white/10 transition group cursor-pointer"
            onClick={() => navigate(`/projects/${project._id}`)}>
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-lg bg-[#7c7fff]/10 flex items-center justify-center text-[#7c7fff]">
                  <FolderKanban size={20} />
                </div>
                <button className="text-[#606479] hover:text-white transition opacity-0 group-hover:opacity-100">
                  <MoreVertical size={18} />
                </button>
              </div>
              <h3 className="text-lg font-bold text-white mb-2 truncate">{project.name}</h3>
              <p className="text-[#84889c] text-sm mb-6 line-clamp-2 min-h-[40px]">
                {project.description || 'No description provided.'}
              </p>
              <div className="flex justify-between items-center pt-4 border-t border-white/5">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  project.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' :
                  project.status === 'Completed' ? 'bg-blue-500/10 text-blue-400' :
                  'bg-amber-500/10 text-amber-400'
                }`}>
                  {project.status}
                </span>
                <div className="flex items-center gap-1.5 text-xs text-[#606479]">
                  <Calendar size={14} />
                  <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#2a2d3e] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-white/5">
              <h3 className="text-xl font-bold text-white">Create New Project</h3>
              <p className="text-[#84889c] text-sm mt-1">Set up a new workspace for your team.</p>
            </div>
            
            <form onSubmit={handleCreateProject} className="p-6">
              {/* =========================================
                  INPUTS BLOCK 
                  (Inputs grouped strictly separate)
              ========================================= */}
              <div className="flex flex-col gap-5 mb-8">
                <div>
                  <label className="block text-xs font-semibold text-[#84889c] mb-2 uppercase tracking-wide">Project Name</label>
                  <input 
                    type="text" 
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#1a1c26] border border-white/5 rounded-lg text-white placeholder-[#4b4e63] focus:border-[#7c7fff] focus:ring-1 focus:ring-[#7c7fff] focus:outline-none transition"
                    placeholder="E.g. E-commerce Redesign"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#84889c] mb-2 uppercase tracking-wide">Description (Optional)</label>
                  <textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#1a1c26] border border-white/5 rounded-lg text-white placeholder-[#4b4e63] focus:border-[#7c7fff] focus:ring-1 focus:ring-[#7c7fff] focus:outline-none transition resize-none h-24"
                    placeholder="Briefly describe the project goals..."
                  />
                </div>
              </div>

              {/* =========================================
                  BUTTONS BLOCK 
                  (Actions grouped strictly separate)
              ========================================= */}
              <div className="flex justify-end gap-3 pt-2 border-t border-white/5">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-[#a0a4b8] hover:text-white hover:bg-white/5 transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isCreating}
                  className={`px-6 py-2 rounded-lg text-sm font-semibold text-white transition flex items-center justify-center min-w-[120px] ${
                    isCreating ? 'bg-[#5b5eb8] cursor-not-allowed' : 'bg-[#7c7fff] hover:bg-[#6b6de0]'
                  }`}
                >
                  {isCreating ? <Loader2 size={16} className="animate-spin" /> : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;