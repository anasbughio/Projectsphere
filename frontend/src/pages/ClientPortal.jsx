import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Loader2, Folder, CheckCircle, Clock, ChevronRight, BarChart, Activity, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '../components/ToastProvider'; // Added toast for error handling

const ClientPortal = () => {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // NEW: Search and Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  const toast = useToast();

  useEffect(() => {
    const fetchClientProjects = async () => {
      try {
        const res = await api.get('/projects');
        const projectList = Array.isArray(res.data) ? res.data : (res.data.data || res.data.projects || []);
        setProjects(projectList);
      } catch (error) {
        console.error("Error fetching client projects:", error);
        toast.push("Failed to load your projects.", { type: 'error' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchClientProjects();
  }, []);

  // NEW: Filter Logic
  const filteredProjects = projects.filter((project) => {
    const title = project.name || project.title || '';
    const status = project.status || 'Active';
    
    const matchesSearch = title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // NEW: Quick Stats
  const activeCount = projects.filter(p => (p.status || 'Active') === 'Active').length;
  const completedCount = projects.filter(p => p.status === 'Completed').length;

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#121218]">
        <Loader2 className="animate-spin text-[#7c7fff]" size={40} />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 bg-[#121218] min-h-screen text-white max-w-[1600px] mx-auto">
      {/* Header Section */}
      <div className="mb-8 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              Client Portal
            </h1>
            {/* Quick KPI Badges */}
            {projects.length > 0 && (
              <div className="hidden sm:flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-md bg-[#10b981]/10 text-[#10b981] text-xs font-bold border border-[#10b981]/20">
                  {activeCount} Active
                </span>
                <span className="px-2.5 py-1 rounded-md bg-white/5 text-gray-400 text-xs font-bold border border-white/10">
                  {completedCount} Completed
                </span>
              </div>
            )}
          </div>
          <p className="text-gray-400 text-sm flex items-center gap-2">
            <Activity size={16} className="text-[#10b981]" />
            Live tracking of your deliverables and project health.
          </p>
        </div>

        {/* NEW: Search & Filter Toolbar */}
        {projects.length > 0 && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full xl:w-auto">
            <div className="flex items-center bg-[#1a1c26] border border-white/10 rounded-lg px-3 py-2 focus-within:border-[#7c7fff] transition-colors flex-1 sm:w-64">
              <Search size={16} className="text-[#606479] mr-2" />
              <input 
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent border-none focus:outline-none text-sm text-white w-full"
              />
            </div>
            
            <div className="flex bg-[#1a1c26] border border-white/10 rounded-lg p-1 shrink-0">
              {['All', 'Active', 'Completed'].map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    statusFilter === status 
                      ? 'bg-[#7c7fff] text-white shadow-md' 
                      : 'text-[#606479] hover:text-white hover:bg-white/5'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {projects.length === 0 ? (
        // Absolute Zero State (No projects at all)
        <div className="bg-[#1a1c26] p-12 rounded-2xl border border-white/5 text-center shadow-2xl flex flex-col items-center justify-center min-h-[400px]">
          <div className="bg-white/5 p-5 rounded-full mb-5 border border-white/10">
            <Folder className="text-[#7c7fff]" size={48} />
          </div>
          <h2 className="text-2xl font-bold mb-2">No Active Projects</h2>
          <p className="text-gray-400 max-w-md text-sm leading-relaxed">
            You currently have no projects assigned to your account. When our team initiates your project, it will appear here.
          </p>
        </div>
      ) : filteredProjects.length === 0 ? (
        // Search Empty State (Projects exist, but search missed)
        <div className="bg-[#1a1c26] p-12 rounded-2xl border border-white/5 text-center flex flex-col items-center justify-center min-h-[300px]">
          <Search className="text-[#606479] mb-4" size={40} />
          <h2 className="text-lg font-bold mb-2 text-white">No projects found</h2>
          <p className="text-gray-500 text-sm">
            We couldn't find any projects matching "{searchTerm}" or your current filters.
          </p>
          <button 
            onClick={() => { setSearchTerm(''); setStatusFilter('All'); }}
            className="mt-4 text-[#7c7fff] text-sm hover:underline font-medium"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        // Projects Grid
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProjects.map((project) => {
            const progress = project.progress || 0; 
            const isCompleted = (project.status === 'Completed' || progress === 100);
            
            return (
              <div key={project._id} className="bg-[#1a1c26] p-6 rounded-2xl border border-white/5 shadow-xl hover:border-[#7c7fff]/30 transition-all duration-300 flex flex-col group relative overflow-hidden">
                
                {/* Background Glow Effect on Hover */}
                <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-10 -mt-10 transition-opacity opacity-0 group-hover:opacity-100 ${isCompleted ? 'bg-[#10b981]/5' : 'bg-[#7c7fff]/5'}`}></div>

                <div className="flex justify-between items-start mb-3 relative z-10">
                  <h2 className="text-xl font-bold text-white group-hover:text-[#7c7fff] transition-colors line-clamp-1">
                    {project.name || project.title}
                  </h2>
                  <span className={`text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full font-bold border whitespace-nowrap ml-2 ${
                    isCompleted 
                      ? 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20' 
                      : 'bg-[#7c7fff]/10 text-[#7c7fff] border-[#7c7fff]/20'
                  }`}>
                    {project.status || 'Active'}
                  </span>
                </div>
                
                <p className="text-gray-400 text-sm mb-6 line-clamp-2 flex-grow relative z-10 leading-relaxed">
                  {project.description || 'No description provided for this project.'}
                </p>

                {/* VISUAL PROGRESS BAR */}
                <div className="mb-6 relative z-10">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400 flex items-center gap-1.5"><BarChart size={14}/> Overall Progress</span>
                    <span className="font-bold text-white">{progress}%</span>
                  </div>
                  <div className="w-full bg-[#121218] rounded-full h-2 border border-white/5 overflow-hidden">
                    <div 
                      className={`h-2 rounded-full transition-all duration-1000 ${isCompleted ? 'bg-[#10b981]' : 'bg-gradient-to-r from-[#7c7fff] to-[#6b6eed]'}`} 
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-6 relative z-10">
                  <div className="bg-[#121218] p-3 rounded-xl border border-white/5 flex flex-col justify-center">
                    <span className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-1 flex items-center gap-1.5"><Clock size={12}/> Started</span>
                    <span className="text-sm font-semibold text-gray-200">
                      {new Date(project.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="bg-[#121218] p-3 rounded-xl border border-white/5 flex flex-col justify-center">
                    <span className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-1 flex items-center gap-1.5"><CheckCircle size={12}/> Deadline</span>
                    <span className="text-sm font-semibold text-gray-200">
                      {project.dueDate ? new Date(project.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD'}
                    </span>
                  </div>
                </div>

                {/* View Deliverables Button */}
                <Link 
                  to={`/client-portal/${project._id}`} 
                  className={`mt-auto w-full flex items-center justify-center gap-2 border py-3 rounded-xl text-sm font-bold transition-all relative z-10 ${
                    isCompleted
                      ? 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20 hover:bg-[#10b981] hover:text-white'
                      : 'bg-white/5 text-white border-white/10 hover:bg-[#7c7fff] hover:border-[#7c7fff]'
                  }`}
                >
                  View Deliverables <ChevronRight size={16} />
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ClientPortal;