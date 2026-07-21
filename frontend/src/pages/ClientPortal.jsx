import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Loader2, Folder, CheckCircle, Clock, ChevronRight, BarChart, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';

const ClientPortal = () => {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchClientProjects = async () => {
      try {
        const res = await api.get('/projects');
        const projectList = Array.isArray(res.data) ? res.data : (res.data.data || res.data.projects || []);
        setProjects(projectList);
      } catch (error) {
        console.error("Error fetching client projects:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClientProjects();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#121218]">
        <Loader2 className="animate-spin text-[#7c7fff]" size={40} />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 bg-[#121218] min-h-screen text-white">
      {/* Header Section */}
      <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            Client Portal
          </h1>
          <p className="text-gray-400 mt-2 text-sm flex items-center gap-2">
            <Activity size={16} className="text-[#10b981]" />
            Live tracking of your deliverables and project health.
          </p>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="bg-[#1a1c26] p-12 rounded-2xl border border-white/5 text-center shadow-2xl flex flex-col items-center justify-center">
          <div className="bg-black/30 p-4 rounded-full mb-4">
            <Folder className="text-[#7c7fff]" size={48} />
          </div>
          <h2 className="text-xl font-semibold mb-2">No Active Projects</h2>
          <p className="text-gray-500 max-w-md">
            You currently have no projects assigned to your account. When our team initiates your project, it will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {projects.map((project) => {
            // Agar backend se progress nahi aa rahi, toh default 0 set kar dein
            const progress = project.progress || 0; 
            
            return (
              <div key={project._id} className="bg-[#1a1c26] p-6 rounded-2xl border border-white/5 shadow-xl hover:border-[#7c7fff]/30 transition-all duration-300 flex flex-col group relative overflow-hidden">
                
                {/* Background Glow Effect on Hover */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#7c7fff]/5 rounded-full blur-3xl -mr-10 -mt-10 transition-opacity opacity-0 group-hover:opacity-100"></div>

                <div className="flex justify-between items-start mb-3 relative z-10">
                  <h2 className="text-xl font-bold text-white group-hover:text-[#7c7fff] transition-colors line-clamp-1">
                    {project.name || project.title}
                  </h2>
                  <span className="bg-[#10b981]/10 text-[#10b981] text-xs px-3 py-1 rounded-full font-semibold border border-[#10b981]/20 whitespace-nowrap ml-2">
                    {project.status || 'Active'}
                  </span>
                </div>
                
                <p className="text-gray-400 text-sm mb-6 line-clamp-2 flex-grow relative z-10">
                  {project.description || 'No description provided for this project.'}
                </p>

                {/* VISUAL PROGRESS BAR */}
                <div className="mb-6 relative z-10">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400 flex items-center gap-1"><BarChart size={14}/> Overall Progress</span>
                    <span className="font-semibold text-white">{progress}%</span>
                  </div>
                  <div className="w-full bg-black/40 rounded-full h-2 border border-white/5 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-[#7c7fff] to-[#6b6eed] h-2 rounded-full transition-all duration-1000" 
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-6 relative z-10">
                  <div className="bg-black/20 p-3 rounded-xl border border-white/5 flex flex-col justify-center">
                    <span className="text-gray-500 text-xs mb-1 flex items-center gap-1"><Clock size={12}/> Started</span>
                    <span className="text-sm font-medium text-gray-200">
                      {new Date(project.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="bg-black/20 p-3 rounded-xl border border-white/5 flex flex-col justify-center">
                    <span className="text-gray-500 text-xs mb-1 flex items-center gap-1"><CheckCircle size={12}/> Deadline</span>
                    <span className="text-sm font-medium text-gray-200">
                      {project.dueDate ? new Date(project.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD'}
                    </span>
                  </div>
                </div>

                {/* View Deliverables Button */}
            <Link 
          to={`/client-portal/${project._id}`} 
        className="mt-auto w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-[#7c7fff] border border-white/10 hover:border-[#7c7fff] text-white py-3 rounded-xl text-sm font-semibold transition-all relative z-10"
        >
        View Deliverables <ChevronRight size={18} />
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