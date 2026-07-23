import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { ArrowLeft, Loader2, CheckCircle, Circle, Clock, ThumbsUp, MessageSquare, X } from 'lucide-react';

const ClientDeliverables = () => {
  const { projectId } = useParams();
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Revision Modal State
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [revisionText, setRevisionText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTasks = async () => {
    try {
      const res = await api.get(`/tasks/project/${projectId}`);
      const taskList = Array.isArray(res.data) ? res.data : (res.data.data || []);
      setTasks(taskList);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [projectId]);

  // Handle Approve Task
 const handleApprove = async (taskId) => {
    try {
      await api.put(`/tasks/${taskId}/client-review`, { status: 'Done' });
      
      setTasks(tasks.map(t => 
        t._id === taskId ? { ...t, status: 'Done', isClientApproved: true } : t
      ));
      
    } catch (error) {
      console.error("Error approving task:", error);
      alert("Failed to approve task.");
    }
  };

  // Handle Revision Request
 const handleRequestRevision = async () => {
    if (!revisionText.trim()) return;
    
    try {
      setIsSubmitting(true);
      await api.put(`/tasks/${selectedTask._id}/client-review`, { 
        status: 'In Progress', 
        comment: revisionText 
      });
    
      setTasks(tasks.map(t => 
        t._id === selectedTask._id ? { ...t, status: 'In Progress', isClientApproved: false } : t
      ));
      
      // close modal and clear
      setIsRevisionModalOpen(false);
      setRevisionText('');
      setSelectedTask(null);
    } catch (error) {
      console.error("Error requesting revision:", error);
      alert("Failed to send revision.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openRevisionModal = (task) => {
    setSelectedTask(task);
    setIsRevisionModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-80px)] items-center justify-center">
        <Loader2 className="animate-spin text-[#7c7fff]" size={40} />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      <Link to="/client-portal" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors">
        <ArrowLeft size={16} /> Back to Portal
      </Link>

      <h1 className="text-2xl font-bold text-white mb-6">Project Deliverables</h1>

      {tasks.length === 0 ? (
        <div className="bg-[#1a1c26] p-8 rounded-xl border border-white/5 text-center">
          <p className="text-gray-400">No deliverables have been logged for this project yet.</p>
        </div>
      ) : (
        <div className="bg-[#1a1c26] rounded-xl border border-white/5 overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-black/20 border-b border-white/5 text-gray-400 text-sm">
                  <th className="p-4 font-medium w-1/3">Deliverable (Task)</th>
                  <th className="p-4 font-medium w-1/4">Status</th>
                  <th className="p-4 font-medium w-1/4 text-center">Client Action</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map(task => {
                  const isCompleted = task.isClientApproved === true;  
                  
                  return (
                    <tr key={task._id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="p-4 text-white font-medium">{task.title}
                        {task.description && (
    <div className="text-xs text-gray-400 mt-1 line-clamp-2" title={task.description}>
      {task.description}
    </div>
  )}
                      </td>
                      
                      <td className="p-4">
                        {isCompleted ? (
                          <span className="flex items-center gap-1.5 text-[#10b981] bg-[#10b981]/10 px-2.5 py-1 rounded-full w-fit text-xs font-semibold">
                            <CheckCircle size={14} /> Approved
                          </span>
                        ) : task.status === 'In Progress' ? (
                          <span className="flex items-center gap-1.5 text-[#f59e0b] bg-[#f59e0b]/10 px-2.5 py-1 rounded-full w-fit text-xs font-semibold">
                            <Clock size={14} /> In Progress
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-gray-400 bg-white/5 px-2.5 py-1 rounded-full w-fit text-xs font-semibold">
                            <Circle size={14} /> Pending
                          </span>
                        )}
                      </td>
                      
                      {/* ACTIONS COLUMN */}
                      <td className="p-4 flex justify-center gap-2">
                        {!isCompleted ? (
                          <>
                            <button 
                              onClick={() => handleApprove(task._id)}
                              className="flex items-center gap-1.5 bg-[#10b981]/10 hover:bg-[#10b981] text-[#10b981] hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border border-[#10b981]/20 hover:border-[#10b981]"
                            >
                              <ThumbsUp size={14} /> Approve
                            </button>
                            <button 
                              onClick={() => openRevisionModal(task)}
                              className="flex items-center gap-1.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border border-red-500/20 hover:border-red-500"
                            >
                              <MessageSquare size={14} /> Revise
                            </button>
                          </>
                        ) : (
                          <span className="text-gray-500 text-xs italic">No action needed</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REVISION MODAL */}
      {isRevisionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1a1c26] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl p-6 relative">
            <button 
              onClick={() => setIsRevisionModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X size={20} />
            </button>
            
            <h3 className="text-xl font-bold text-white mb-2">Request Revision</h3>
            <p className="text-sm text-gray-400 mb-4">
              Provide feedback for: <span className="font-semibold text-white">{selectedTask?.title}</span>
            </p>
            
            <textarea
              value={revisionText}
              onChange={(e) => setRevisionText(e.target.value)}
              placeholder="E.g., Please change the color scheme to match our brand guidelines..."
              className="w-full bg-[#121218] border border-white/10 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-[#7c7fff] min-h-[120px] mb-4"
            ></textarea>
            
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setIsRevisionModalOpen(false)} 
                className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button 
                onClick={handleRequestRevision}
                disabled={!revisionText.trim() || isSubmitting}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <MessageSquare size={16} />}
                Submit Feedback
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientDeliverables;