import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { ArrowLeft, Loader2, CheckCircle, Circle, Clock } from 'lucide-react';

const ClientDeliverables = () => {
  const { projectId } = useParams();
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        // Backend se is project ke tasks mangwayen
        const res = await api.get(`/tasks?projectId=${projectId}`);
        const taskList = Array.isArray(res.data) ? res.data : (res.data.data || []);
        setTasks(taskList);
      } catch (error) {
        console.error("Error fetching tasks:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTasks();
  }, [projectId]);

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
        <div className="bg-[#1a1c26] rounded-xl border border-white/5 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/20 border-b border-white/5 text-gray-400 text-sm">
                <th className="p-4 font-medium">Deliverable (Task)</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Priority</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map(task => (
                <tr key={task._id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="p-4 text-white font-medium">{task.title}</td>
                  <td className="p-4">
                    {task.status === 'Done' || task.status === 'Completed' ? (
                      <span className="flex items-center gap-1.5 text-[#10b981] bg-[#10b981]/10 px-2.5 py-1 rounded-full w-fit text-xs font-semibold">
                        <CheckCircle size={14} /> Completed
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
                  <td className="p-4 text-sm text-gray-400 capitalize">{task.priority || 'Normal'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ClientDeliverables;