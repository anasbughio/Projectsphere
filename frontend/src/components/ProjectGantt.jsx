import React, { useState, useEffect } from 'react';
import { Gantt, ViewMode } from 'gantt-task-react';
import "gantt-task-react/dist/index.css";
import api from '../services/api';
import { Loader2 } from 'lucide-react';
import { useToast } from '../components/ToastProvider';

const ProjectGantt = ({ projectId }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState(ViewMode.Week);
  const toast = useToast();

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await api.get(`/tasks/project/${projectId}`);
        
        // Map database tasks to the format required by the Gantt library
        const formattedTasks = response.data.map(task => {
          // Safely handle dates to prevent crashes
          const start = new Date(task.startDate || task.createdAt || new Date());
          const end = task.dueDate ? new Date(task.dueDate) : new Date(start.getTime() + 24 * 60 * 60 * 1000); 
          
          return {
            start: start,
            end: end,
            name: task.title || 'Untitled Task',
            id: task._id,
            type: 'task',
            progress: task.progress || 0,
            isDisabled: false,
            styles: { progressColor: '#7c7fff', progressSelectedColor: '#6b6ee6' },
            dependencies: task.dependsOn ? task.dependsOn.map(dep => typeof dep === 'object' ? dep._id : dep) : []
          };
        });

        setTasks(formattedTasks);
      } catch (error) {
        toast.push("Failed to load Gantt timeline.", { type: 'error' });
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchTasks();
    }
  }, [projectId]);

  const handleTaskChange = async (task) => {
    try {
      // Allow users to drag-and-drop dates to update them directly
      await api.put(`/tasks/${task.id}`, {
        startDate: task.start,
        dueDate: task.end,
        progress: task.progress
      });
      toast.push("Timeline updated", { type: 'success' });
    } catch (error) {
      toast.push("Failed to update dates", { type: 'error' });
    }
  };

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-[#7c7fff]" /></div>;
  
  // 🔥 THE FIX: Stop the Gantt chart from rendering if the tasks array is empty
  if (!tasks || tasks.length === 0) {
    return (
      <div className="bg-[#1a1c26] p-10 rounded-2xl border border-white/10 shadow-xl mt-6 flex flex-col items-center justify-center">
        <p className="text-gray-400 text-sm">No tasks available for timeline view.</p>
        <p className="text-[#84889c] text-xs mt-2">Add some tasks to this project to see the Gantt chart!</p>
      </div>
    );
  }

  return (
    <div className="bg-[#1a1c26] p-6 rounded-2xl border border-white/10 shadow-xl overflow-x-auto mt-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white">Project Timeline</h2>
        <div className="flex gap-2">
          <button onClick={() => setViewMode(ViewMode.Day)} className="px-3 py-1 text-sm bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors">Day</button>
          <button onClick={() => setViewMode(ViewMode.Week)} className="px-3 py-1 text-sm bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors">Week</button>
          <button onClick={() => setViewMode(ViewMode.Month)} className="px-3 py-1 text-sm bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors">Month</button>
        </div>
      </div>
      
      <div className="gantt-container rounded-lg overflow-hidden border border-white/5">
        <Gantt
          tasks={tasks}
          viewMode={viewMode}
          onDateChange={handleTaskChange}
          onProgressChange={handleTaskChange}
          listCellWidth="155px"
          columnWidth={viewMode === ViewMode.Month ? 150 : 60}
          barCornerRadius={8}
          barFill={60}
        />
      </div>
    </div>
  );
};

export default ProjectGantt;