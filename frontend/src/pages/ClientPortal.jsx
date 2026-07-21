import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Loader2, Folder, CheckCircle, Clock, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const ClientPortal = () => {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchClientProjects = async () => {
      try {
        // Backend RBAC only return this client projects
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
    <div className="p-6 bg-[#121218] min-h-screen text-white">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Client Portal</h1>
        <p className="text-gray-400 mt-2">Welcome! Track the high-level progress of your deliverables here.</p>
      </div>

      {projects.length === 0 ? (
        <div className="bg-[#1a1c26] p-10 rounded-xl border border-white/5 text-center shadow-lg">
          <Folder className="mx-auto text-gray-600 mb-4" size={56} />
          <h2 className="text-xl font-semibold mb-2">No Active Projects</h2>
          <p className="text-gray-400">You currently have no projects assigned to your account.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div key={project._id} className="bg-[#1a1c26] p-6 rounded-xl border border-white/5 shadow-lg hover:border-white/10 transition-all flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-semibold text-white">{project.name || project.title}</h2>
                <span className="bg-[#10b981]/10 text-[#10b981] text-xs px-2 py-1 rounded-md font-medium border border-[#10b981]/20">
                  {project.status || 'Active'}
                </span>
              </div>
              
              <p className="text-gray-400 text-sm mb-6 line-clamp-2 flex-grow">
                {project.description || 'No description provided for this project.'}
              </p>

              <div className="space-y-3 mb-6 bg-black/20 p-3 rounded-lg border border-white/5">
                <div className="flex items-center text-sm text-gray-300 gap-2">
                  <Clock size={16} className="text-[#f59e0b]" />
                  <span>Started: {new Date(project.createdAt).toLocaleDateString()}</span>
                </div>
                {project.dueDate && (
                  <div className="flex items-center text-sm text-gray-300 gap-2">
                    <CheckCircle size={16} className="text-[#10b981]" />
                    <span>Deadline: {new Date(project.dueDate).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              {/* Link to view specific tasks of the project */}
              <Link 
                to={`/projects/${project._id}`} 
                className="mt-auto w-full flex items-center justify-center gap-2 bg-[#7c7fff] hover:bg-[#6b6eed] text-white py-2.5 rounded-lg text-sm font-medium transition-all"
              >
                View Deliverables <ChevronRight size={16} />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClientPortal;