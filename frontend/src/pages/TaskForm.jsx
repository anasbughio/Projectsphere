import React, { useState, useEffect } from 'react';
import { Search, Edit2, Trash2, MessageSquare, Loader2, CheckCircle2, Calendar } from 'lucide-react';
import { getAllOrganizationTasks, createGlobalTask, updateTaskStatus, deleteTask, updateTaskDetails } from '../services/taskService';
import { io } from 'socket.io-client';
import { useToast } from '../components/ToastProvider';
import TaskDetailsModal from './TaskDetailsModal'; 

const TaskForm = () => {
  const [tasks, setTasks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [socketInstance, setSocketInstance] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [departmentFilter, setDepartmentFilter] = useState('All');

  // 🔥 NEW: Added dueDate to initial state
  const [formData, setFormData] = useState({
    title: '', description: '', priority: 'Medium', department: 'General', status: 'To Do', dueDate: ''
  });

  const toast = useToast();

  useEffect(() => {
    fetchGlobalTasks();
  }, []);

  useEffect(() => {
    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'https://projectsphere-dlvv.onrender.com';
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling']
    });
    
    setSocketInstance(socket); 

    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    if (storedUser && storedUser.organizationId) {
      socket.emit('joinOrganization', storedUser.organizationId);
    }

    socket.on('taskCreated', (newTask) => {
      if (!newTask.projectId) setTasks((prev) => [newTask, ...prev]);
    });

    socket.on('taskUpdated', (updatedTask) => {
      setTasks((prev) => prev.map((task) => (task._id === updatedTask._id ? updatedTask : task)));
      setSelectedTask((prev) => (prev && prev._id === updatedTask._id ? updatedTask : prev));
    });

    socket.on('taskDeleted', (deletedTaskId) => {
      setTasks((prev) => prev.filter((task) => task._id !== deletedTaskId));
      setSelectedTask((prev) => (prev && prev._id === deletedTaskId ? null : prev)); 
    });

    return () => socket.disconnect();
  }, []);

  const fetchGlobalTasks = async () => {
    try {
      setLoading(true);
      const data = await getAllOrganizationTasks();
      setTasks(data);
    } catch (error) {
      console.error("Global tasks fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          task.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = priorityFilter === 'All' || task.priority === priorityFilter;
    const matchesDepartment = departmentFilter === 'All' || task.department === departmentFilter;
    return matchesSearch && matchesPriority && matchesDepartment;
  });

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      setTasks((prev) => prev.map(t => t._id === taskId ? { ...t, status: newStatus } : t));
      await updateTaskStatus(taskId, newStatus);
    } catch (error) {
      fetchGlobalTasks();
    }
  };

  const handleDelete = async (e, taskId) => {
    e.stopPropagation(); 
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      setTasks((prev) => prev.filter(t => t._id !== taskId));
      await deleteTask(taskId);
      toast.push("Task deleted successfully", { type: 'success' });
    } catch (error) {
      fetchGlobalTasks(); 
    }
  };

  const handleEditClick = (e, task) => {
    e.stopPropagation(); 
    setEditingTask(task);
    setFormData({ 
      title: task.title, 
      description: task.description, 
      priority: task.priority, 
      department: task.department,
      status: task.status || 'To Do',
      // 🔥 Extract YYYY-MM-DD for the date input if date exists
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (editingTask) {
        await updateTaskDetails(editingTask._id, formData);
        toast.push("Task updated successfully", { type: 'success' });
      } else {
        await createGlobalTask(formData);
        toast.push("Task created successfully", { type: 'success' });
      }
      setEditingTask(null);
      await fetchGlobalTasks();
      setShowForm(false);
      // 🔥 Reset Form including dueDate
      setFormData({ title: '', description: '', priority: 'Medium', department: 'General', status: 'To Do', dueDate: '' });
    } catch (error) {
      toast.push(error.response?.data?.message || "Task action failed", { type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDragStart = (e, taskId) => e.dataTransfer.setData("taskId", taskId);
  const handleDragOver = (e) => e.preventDefault();
  const handleDrop = async (e, newStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    const taskToUpdate = tasks.find(t => t._id === taskId);
    if (taskToUpdate && taskToUpdate.status !== newStatus) {
      handleStatusChange(taskId, newStatus);
    }
  };

  const columns = ['To Do', 'In Progress', 'Done'];

  // 🔥 Helper function for formatting date on UI
  const formatDisplayDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // 🔥 Helper function to check if task is overdue
  const isOverdue = (dateString, status) => {
    if (!dateString || status === 'Done') return false;
    // Set both to midnight for accurate comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(dateString);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today;
  };

  return (
    <div className="p-6 bg-[#0d0e12] min-h-screen text-white">
      <div className="flex justify-between items-center mb-8 border-b border-gray-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Organization Global Tasks</h1>
          <p className="text-sm text-gray-400">Manage and track cross-department tasks</p>
        </div>
        <button 
          onClick={() => { setShowForm(!showForm); setEditingTask(null); }}
          className="bg-[#7c7fff] hover:bg-[#6b6de0] text-white px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 shadow-lg shadow-[#7c7fff]/20"
        >
          {showForm ? 'Close Form' : '+ New Global Task'}
        </button>
      </div>

      {showForm && (
        <div className="mb-10 bg-[#121218] border border-white/10 p-6 rounded-xl max-w-3xl shadow-2xl animate-in fade-in slide-in-from-top-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#7c7fff]/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>
          
          <h2 className="text-xl font-bold mb-6 text-white flex items-center gap-2">
            {editingTask ? <Edit2 size={20} className="text-[#7c7fff]" /> : <CheckCircle2 size={20} className="text-[#7c7fff]" />}
            {editingTask ? 'Edit Task Details' : 'Create a New Global Task'}
          </h2>
          
          <form onSubmit={handleSubmit} className="relative z-10">
            <div className="bg-[#1a1c26] p-5 rounded-lg mb-6 border border-white/5 shadow-inner">
              
              <input 
                autoFocus
                type="text" 
                required 
                value={formData.title} 
                onChange={(e) => setFormData({...formData, title: e.target.value})} 
                className="w-full bg-[#121218] border border-white/10 rounded-lg p-3 mb-4 focus:border-[#7c7fff] text-white focus:outline-none focus:ring-1 focus:ring-[#7c7fff] transition-all" 
                placeholder="Task Title (e.g., Update Server Infrastructure)" 
              />
              
              <textarea 
                rows="3" 
                value={formData.description} 
                onChange={(e) => setFormData({...formData, description: e.target.value})} 
                className="w-full bg-[#121218] border border-white/10 rounded-lg p-3 mb-4 focus:border-[#7c7fff] text-white focus:outline-none focus:ring-1 focus:ring-[#7c7fff] transition-all resize-none" 
                placeholder="Provide task details or context..." 
              />
              
              {/* 🔥 NEW: 4-column grid (added Deadline) */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block uppercase font-semibold tracking-wider">Status</label>
                  <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full bg-[#121218] border border-white/10 text-white rounded-lg p-2.5 focus:border-[#7c7fff] focus:outline-none cursor-pointer">
                    <option value="To Do">To Do</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Done">Done</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block uppercase font-semibold tracking-wider">Priority</label>
                  <select value={formData.priority} onChange={(e) => setFormData({...formData, priority: e.target.value})} className="w-full bg-[#121218] border border-white/10 text-white rounded-lg p-2.5 focus:border-[#7c7fff] focus:outline-none cursor-pointer">
                    <option>Low</option><option>Medium</option><option>High</option><option>Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block uppercase font-semibold tracking-wider">Department</label>
                  <select value={formData.department} onChange={(e) => setFormData({...formData, department: e.target.value})} className="w-full bg-[#121218] border border-white/10 text-white rounded-lg p-2.5 focus:border-[#7c7fff] focus:outline-none cursor-pointer">
                    <option>General</option><option>Frontend</option><option>Backend</option><option>Design</option>
                  </select>
                </div>
                {/* 🔥 NEW: Deadline Date Picker */}
                <div>
                  <label className="text-xs text-gray-500 mb-1 block uppercase font-semibold tracking-wider">Deadline</label>
                  <input 
                    type="date" 
                    value={formData.dueDate} 
                    onChange={(e) => setFormData({...formData, dueDate: e.target.value})} 
                    className="w-full bg-[#121218] border border-white/10 text-white rounded-lg p-2 focus:border-[#7c7fff] focus:outline-none transition-all cursor-pointer [color-scheme:dark]" 
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <button 
                type="button" 
                onClick={() => setShowForm(false)} 
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-transparent border border-white/10 hover:bg-white/5 rounded-lg text-sm text-gray-300 hover:text-white transition disabled:opacity-50"
              >
                Cancel
              </button>
              
              <button 
                type="submit" 
                disabled={isSubmitting || !formData.title.trim()}
                className="px-6 py-2.5 bg-[#7c7fff] hover:bg-[#6b6de0] rounded-lg text-sm font-medium transition text-white flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-[#7c7fff]/20"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    {editingTask ? 'Saving...' : 'Publishing...'}
                  </>
                ) : (
                  editingTask ? 'Save Changes' : 'Publish Task'
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* FILTER BAR */}
      <div className="bg-[#121218] p-4 rounded-xl border border-white/5 mb-6 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 text-gray-500" size={18} />
          <input type="text" placeholder="Search tasks..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-[#1a1c26] border border-white/5 rounded-lg py-2 pl-10 pr-4 text-white focus:border-[#7c7fff] focus:outline-none transition" />
        </div>
        <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="w-full md:w-auto bg-[#1a1c26] text-white border border-white/5 rounded-lg px-4 py-2 focus:border-[#7c7fff] focus:outline-none cursor-pointer"><option value="All">All Priorities</option><option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option><option value="Urgent">Urgent</option></select>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
           <Loader2 className="animate-spin text-[#7c7fff]" size={40} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {columns.map(colStatus => {
            const colTasks = filteredTasks.filter(t => t.status === colStatus);
            return (
              <div key={colStatus} className="bg-[#121218] rounded-xl p-4 border border-white/5 min-h-[500px] flex flex-col" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, colStatus)}>
                <h2 className="text-gray-400 font-semibold mb-4 border-b border-white/5 pb-3 flex justify-between items-center">
                  {colStatus}
                  <span className="bg-[#1a1c26] px-2.5 py-1 rounded-full text-xs font-bold text-gray-300 border border-white/10">{colTasks.length}</span>
                </h2>
                
                <div className="space-y-4 flex-1">
                  {colTasks.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-gray-600 text-sm italic border-2 border-dashed border-white/5 rounded-xl">
                      Drop tasks here
                    </div>
                  ) : (
                    colTasks.map(task => {
                      // 🔥 Check if overdue
                      const taskOverdue = isOverdue(task.dueDate, task.status);
                      
                      return (
                        <div 
                          key={task._id} 
                          draggable 
                          onDragStart={(e) => handleDragStart(e, task._id)} 
                          onClick={() => setSelectedTask(task)} 
                          className={`bg-[#1a1c26] p-4 rounded-xl border transition cursor-pointer hover:shadow-lg relative group ${taskOverdue ? 'border-red-500/30 hover:border-red-500/60 shadow-red-500/5' : 'border-white/5 hover:border-[#7c7fff]/50 shadow-[#7c7fff]/10'}`}
                        >
                          <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition z-10">
                            <button onClick={(e) => handleEditClick(e, task)} className="p-1.5 bg-[#222533] rounded hover:text-blue-400 transition hover:bg-[#2a2d3e]" title="Edit Task"><Edit2 size={14} /></button>
                            <button onClick={(e) => handleDelete(e, task._id)} className="p-1.5 bg-[#222533] rounded hover:text-red-500 transition hover:bg-[#2a2d3e]" title="Delete Task"><Trash2 size={14} /></button>
                          </div>
                          
                          <h3 className={`font-semibold text-sm mb-1 pr-16 transition-colors ${taskOverdue ? 'text-red-100 group-hover:text-red-400' : 'text-white group-hover:text-[#7c7fff]'}`}>{task.title}</h3>
                          <p className="text-xs text-gray-400 mb-4 line-clamp-2">{task.description}</p>
                          
                          <div className="flex justify-between items-center text-[10px] pt-3 border-t border-white/5">
                            <span className={`px-2 py-1 rounded font-bold uppercase ${
                              task.priority === 'Urgent' ? 'text-red-400 bg-red-500/10' :
                              task.priority === 'High' ? 'text-orange-400 bg-orange-500/10' :
                              'text-blue-400 bg-blue-500/10'
                            }`}>{task.priority}</span>
                            
                            <div className="flex gap-2 items-center">
                              {/* 🔥 NEW: Deadline Indicator */}
                              {task.dueDate && (
                                <div className={`flex items-center gap-1 px-2 py-1 rounded border font-medium ${
                                  taskOverdue 
                                    ? 'text-red-400 border-red-500/20 bg-red-500/10' 
                                    : 'text-gray-400 border-white/5 bg-white/5'
                                }`} title={taskOverdue ? 'Overdue' : 'Deadline'}>
                                  <Calendar size={12} />
                                  <span>{formatDisplayDate(task.dueDate)}</span>
                                </div>
                              )}
                              
                              <span className="text-gray-500 hover:text-gray-300 transition" title="Discussion">
                                <MessageSquare size={14} />
                              </span>
                              <span className="uppercase tracking-wider font-medium text-gray-400 bg-white/5 px-2 py-1 rounded">{task.department}</span>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedTask && (
        <TaskDetailsModal 
          task={selectedTask} 
          onClose={() => setSelectedTask(null)} 
          socket={socketInstance} 
        />
      )}
    </div>
  );
};

export default TaskForm;