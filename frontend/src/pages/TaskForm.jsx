import React, { useState, useEffect } from 'react';
import { Search, Edit2, Trash2, MessageSquare, Loader2, CheckCircle2, Calendar } from 'lucide-react';
import { getAllOrganizationTasks, createGlobalTask, updateTaskStatus, deleteTask, updateTaskDetails } from '../services/taskService';
import { io } from 'socket.io-client';
import { useToast } from '../components/ToastProvider';
import TaskDetailsModal from './TaskDetailsModal'; 
import api from '../services/api';
import AddMilestoneModal from '../components/AddMilestoneModal'; 
import { motion, AnimatePresence } from 'framer-motion';

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
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: customEase } }
};

const cardVariant = {
  hidden: { opacity: 0, scale: 0.95, y: 15 },
  show: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.4, ease: customEase } }
};

const formVariant = {
  hidden: { opacity: 0, height: 0, marginBottom: 0 },
  show: { opacity: 1, height: 'auto', marginBottom: 40, transition: { duration: 0.5, ease: customEase } },
  exit: { opacity: 0, height: 0, marginBottom: 0, transition: { duration: 0.3, ease: customEase } }
};

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
  const [milestones, setMilestones] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [projects, setProjects] = useState([]);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [sortBy, setSortBy] = useState('Newest');
  const [isCompact, setIsCompact] = useState(false);
  const [formData, setFormData] = useState({
    title: '', description: '', priority: 'Medium', department: 'General', status: 'To Do', dueDate: '', milestoneId: ''
  });

  const toast = useToast();

  useEffect(() => {
    api.get('/projects').then(res => setProjects(res.data));
  }, []);

  const fetchProjectMilestones = () => {
    if (selectedProjectId) {
      api.get(`/milestones/project/${selectedProjectId}`)
        .then(res => setMilestones(res.data))
        .catch(err => console.error("Milestones load nahi hue"));
    } else {
      setMilestones([]);
    }
  };

  useEffect(() => {
    fetchProjectMilestones();
  }, [selectedProjectId]);

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

  const filteredAndSortedTasks = tasks
    .filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesPriority = priorityFilter === 'All' || task.priority === priorityFilter;
      const matchesDepartment = departmentFilter === 'All' || task.department === departmentFilter;
      return matchesSearch && matchesPriority && matchesDepartment;
    })
    .sort((a, b) => {
      if (sortBy === 'Newest') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === 'Oldest') return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === 'Due Date') {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      }
      if (sortBy === 'Priority') {
        const priorityWeight = { 'Urgent': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
        return (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
      }
      return 0;
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
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
      milestoneId: task.milestoneId || ''
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
      setFormData({ title: '', description: '', priority: 'Medium', department: 'General', status: 'To Do', dueDate: '', milestoneId: '' });
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

  const formatDisplayDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const isOverdue = (dateString, status) => {
    if (!dateString || status === 'Done') return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(dateString);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today;
  };

  return (
    <motion.div 
      initial="hidden"
      animate="show"
      variants={staggerContainer}
      className="p-6 bg-[#0d0e12] min-h-screen text-white relative overflow-hidden"
    >
      {/* Subtle Background Glow */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-[#7c7fff]/5 blur-[150px] rounded-full pointer-events-none -z-10"></div>

      <motion.div variants={fadeUpVariant} className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 border-b border-gray-800 pb-4 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-100 tracking-tight">Organization Global Tasks</h1>
          <p className="text-sm text-gray-400 font-light mt-1">Manage and track cross-department tasks</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsCompact(!isCompact)}
            className="bg-[#1a1c26] border border-white/5 hover:border-white/10 text-gray-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            {isCompact ? 'Detailed View' : 'Compact View'}
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowMilestoneModal(true)}
            className="bg-emerald-600/10 border border-emerald-500/20 hover:bg-emerald-600/20 text-emerald-400 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            + Add Milestone
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => { setShowForm(!showForm); setEditingTask(null); }}
            className="bg-gradient-to-r from-[#7c7fff] to-[#6b6de0] text-white px-5 py-2 rounded-lg font-medium transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(124,127,255,0.2)]"
          >
            {showForm ? 'Close Form' : '+ New Global Task'}
          </motion.button>
        </div>
      </motion.div>

      {/* Task Form with AnimatePresence for smooth expand/collapse */}
      <AnimatePresence>
        {showForm && (
          <motion.div 
            variants={formVariant}
            initial="hidden"
            animate="show"
            exit="exit"
            className="overflow-hidden"
          >
            <div className="bg-[#121218] border border-white/10 p-6 rounded-2xl max-w-3xl shadow-2xl relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#7c7fff]/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>
              
              <h2 className="text-xl font-bold mb-6 text-white flex items-center gap-2 relative z-10">
                {editingTask ? <Edit2 size={20} className="text-[#7c7fff]" /> : <CheckCircle2 size={20} className="text-[#7c7fff]" />}
                {editingTask ? 'Edit Task Details' : 'Create a New Global Task'}
              </h2>
              
              <form onSubmit={handleSubmit} className="relative z-10">
                <div className="bg-[#1a1c26] p-5 rounded-xl mb-6 border border-white/5 shadow-inner">
                  
                  <select 
                    className="w-full p-3 mb-4 bg-[#121218] border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#7c7fff] transition-colors"
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                  >
                    <option value="">Select Project to load Milestones</option>
                    {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                  </select>

                  <select 
                    value={formData.milestoneId} 
                    onChange={(e) => setFormData({...formData, milestoneId: e.target.value})}
                    className="w-full p-3 mb-4 bg-[#121218] border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#7c7fff] transition-colors"
                  >
                    <option value="">Select Milestone</option>
                    {milestones.map(m => (
                      <option key={m._id} value={m._id}>{m.title}</option>
                    ))}
                  </select>

                  <input 
                    autoFocus
                    type="text" 
                    required 
                    value={formData.title} 
                    onChange={(e) => setFormData({...formData, title: e.target.value})} 
                    className="w-full bg-[#121218] border border-white/10 rounded-lg p-3 mb-4 focus:border-[#7c7fff] text-white focus:outline-none transition-colors shadow-inner" 
                    placeholder="Task Title (e.g., Update Server Infrastructure)" 
                  />
                  
                  <textarea 
                    rows="3" 
                    value={formData.description} 
                    onChange={(e) => setFormData({...formData, description: e.target.value})} 
                    className="w-full bg-[#121218] border border-white/10 rounded-lg p-3 mb-4 focus:border-[#7c7fff] text-white focus:outline-none transition-colors resize-none shadow-inner" 
                    placeholder="Provide task details or context..." 
                  />
         
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="text-[10px] text-gray-500 mb-1.5 block uppercase font-bold tracking-wider">Status</label>
                      <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full bg-[#121218] border border-white/10 text-white rounded-lg p-2.5 focus:border-[#7c7fff] focus:outline-none cursor-pointer transition-colors">
                        <option value="To Do">To Do</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Done">Done</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 mb-1.5 block uppercase font-bold tracking-wider">Priority</label>
                      <select value={formData.priority} onChange={(e) => setFormData({...formData, priority: e.target.value})} className="w-full bg-[#121218] border border-white/10 text-white rounded-lg p-2.5 focus:border-[#7c7fff] focus:outline-none cursor-pointer transition-colors">
                        <option>Low</option><option>Medium</option><option>High</option><option>Urgent</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 mb-1.5 block uppercase font-bold tracking-wider">Department</label>
                      <select value={formData.department} onChange={(e) => setFormData({...formData, department: e.target.value})} className="w-full bg-[#121218] border border-white/10 text-white rounded-lg p-2.5 focus:border-[#7c7fff] focus:outline-none cursor-pointer transition-colors">
                        <option>General</option><option>Frontend</option><option>Backend</option><option>Design</option>
                        <option>DevOps</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 mb-1.5 block uppercase font-bold tracking-wider">Deadline</label>
                      <input 
                        type="date" 
                        value={formData.dueDate} 
                        onChange={(e) => setFormData({...formData, dueDate: e.target.value})} 
                        className="w-full bg-[#121218] border border-white/10 text-white rounded-lg p-2.5 focus:border-[#7c7fff] focus:outline-none transition-colors cursor-pointer [color-scheme:dark]" 
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end gap-3">
                  <button 
                    type="button" 
                    onClick={() => setShowForm(false)} 
                    disabled={isSubmitting}
                    className="px-5 py-2.5 bg-transparent border border-white/10 hover:bg-white/5 rounded-lg text-sm text-gray-300 hover:text-white transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <motion.button 
                    whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                    whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                    type="submit" 
                    disabled={isSubmitting || !formData.title.trim()}
                    className="px-6 py-2.5 bg-gradient-to-r from-[#7c7fff] to-[#6b6de0] rounded-lg text-sm font-medium transition-all text-white flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(124,127,255,0.2)]"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        {editingTask ? 'Saving...' : 'Publishing...'}
                      </>
                    ) : (
                      editingTask ? 'Save Changes' : 'Publish Task'
                    )}
                  </motion.button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ADVANCED FILTER BAR */}
      <motion.div variants={fadeUpVariant} className="bg-[#121218] p-4 rounded-xl border border-white/5 mb-8 flex flex-col md:flex-row gap-3 items-center shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-3 text-gray-500" size={18} />
          <input 
            type="text" 
            placeholder="Search global tasks..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            className="w-full bg-[#1a1c26] border border-white/5 rounded-lg py-2.5 pl-10 pr-4 text-white focus:border-[#7c7fff] focus:outline-none transition-colors shadow-inner" 
          />
        </div>
        
        <select 
          value={departmentFilter} 
          onChange={(e) => setDepartmentFilter(e.target.value)} 
          className="w-full md:w-auto bg-[#1a1c26] text-white border border-white/5 rounded-lg px-4 py-2.5 text-sm focus:border-[#7c7fff] focus:outline-none cursor-pointer transition-colors"
        >
          <option value="All">All Departments</option>
          <option value="General">General</option>
          <option value="Frontend">Frontend</option>
          <option value="Backend">Backend</option>
          <option value="Design">Design</option>
          <option value="DevOps">DevOps</option>
        </select>

        <select 
          value={priorityFilter} 
          onChange={(e) => setPriorityFilter(e.target.value)} 
          className="w-full md:w-auto bg-[#1a1c26] text-white border border-white/5 rounded-lg px-4 py-2.5 text-sm focus:border-[#7c7fff] focus:outline-none cursor-pointer transition-colors"
        >
          <option value="All">All Priorities</option>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
          <option value="Urgent">Urgent</option>
        </select>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs text-gray-500 uppercase font-bold hidden lg:block">Sort:</span>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)} 
            className="w-full bg-[#1a1c26] text-white border border-white/5 rounded-lg px-4 py-2.5 text-sm focus:border-[#7c7fff] focus:outline-none cursor-pointer transition-colors"
          >
            <option value="Newest">Newest First</option>
            <option value="Oldest">Oldest First</option>
            <option value="Priority">Highest Priority</option>
            <option value="Due Date">Earliest Deadline</option>
          </select>
        </div>

        {(searchQuery !== '' || priorityFilter !== 'All' || departmentFilter !== 'All' || sortBy !== 'Newest') && (
          <button 
            onClick={() => { 
              setSearchQuery(''); 
              setPriorityFilter('All'); 
              setDepartmentFilter('All'); 
              setSortBy('Newest');
            }}
            className="text-xs font-bold text-red-400 hover:text-red-300 transition-colors px-2 whitespace-nowrap"
          >
            Reset Filters
          </button>
        )}
      </motion.div>

      {/* KANBAN BOARD AREA */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
           <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
             <Loader2 className="text-[#7c7fff]" size={40} />
           </motion.div>
        </div>
      ) : (
        <motion.div variants={staggerContainer} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {columns.map((colStatus, index) => {
            const colTasks = filteredAndSortedTasks.filter(t => t.status === colStatus);
            return (
              <motion.div 
                variants={fadeUpVariant}
                key={colStatus} 
                className="bg-[#121218]/80 backdrop-blur-md rounded-2xl p-4 border border-white/5 min-h-[500px] flex flex-col shadow-lg" 
                onDragOver={handleDragOver} 
                onDrop={(e) => handleDrop(e, colStatus)}
              >
                <h2 className="text-gray-300 font-bold mb-5 border-b border-white/5 pb-3 flex justify-between items-center tracking-tight">
                  {colStatus}
                  <span className="bg-[#1a1c26] px-2.5 py-1 rounded-full text-xs font-bold text-gray-400 border border-white/5">{colTasks.length}</span>
                </h2>
                
                <div className="space-y-4 flex-1">
                  <AnimatePresence>
                    {colTasks.length === 0 ? (
                      <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="h-full flex items-center justify-center text-gray-600 text-sm font-light italic border-2 border-dashed border-white/5 rounded-xl"
                      >
                        Drop tasks here
                      </motion.div>
                    ) : (
                      colTasks.map(task => {
                        const taskOverdue = isOverdue(task.dueDate, task.status);
                        return (
                          <motion.div 
                            layout // <--- FLUID RESIZING MAGC HAPPENS HERE
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                            whileHover={{ y: -4, transition: { duration: 0.2 } }}
                            key={task._id} 
                            draggable 
                            onDragStart={(e) => handleDragStart(e, task._id)} 
                            onClick={() => setSelectedTask(task)} 
                            className={`bg-[#1a1c26] ${isCompact ? 'p-3' : 'p-5'} rounded-xl border transition-colors cursor-grab active:cursor-grabbing hover:border-white/10 relative group ${taskOverdue ? 'border-red-500/30 hover:border-red-500/50' : 'border-white/5'}`}
                          >
                            <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                              <button onClick={(e) => handleEditClick(e, task)} className="p-1.5 bg-[#222533] rounded-md hover:text-blue-400 transition-colors" title="Edit Task"><Edit2 size={14} /></button>
                              <button onClick={(e) => handleDelete(e, task._id)} className="p-1.5 bg-[#222533] rounded-md hover:text-red-500 transition-colors" title="Delete Task"><Trash2 size={14} /></button>
                            </div>
                            
                            <motion.h3 layout="position" className={`font-bold ${isCompact ? 'text-xs' : 'text-sm mb-2'} pr-16 transition-colors ${taskOverdue ? 'text-red-200 group-hover:text-red-100' : 'text-gray-200 group-hover:text-white'}`}>
                              {task.title}
                            </motion.h3>
                            
                            <AnimatePresence>
                              {!isCompact && (
                                <motion.p 
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="text-xs text-gray-400 mb-5 line-clamp-2 font-light"
                                >
                                  {task.description}
                                </motion.p>
                              )}
                            </AnimatePresence>
                            
                            <motion.div layout="position" className={`flex justify-between items-center text-[10px] ${isCompact ? 'mt-3' : 'pt-4 border-t border-white/5'}`}>
                              <span className={`px-2 py-1 rounded-md font-bold uppercase tracking-wider ${
                                task.priority === 'Urgent' ? 'text-red-400 bg-red-500/10' :
                                task.priority === 'High' ? 'text-orange-400 bg-orange-500/10' :
                                'text-blue-400 bg-blue-500/10'
                              }`}>{task.priority}</span>
                              
                              <div className="flex gap-2 items-center">
                                {task.dueDate && (
                                  <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md border font-semibold ${
                                    taskOverdue 
                                      ? 'text-red-400 border-red-500/20 bg-red-500/10' 
                                      : 'text-gray-400 border-white/5 bg-white/5'
                                  }`} title={taskOverdue ? 'Overdue' : 'Deadline'}>
                                    <Calendar size={12} />
                                    <span>{formatDisplayDate(task.dueDate)}</span>
                                  </div>
                                )}
                                <span className="uppercase tracking-widest font-bold text-gray-500 bg-white/5 px-2 py-1 rounded-md">{task.department}</span>
                              </div>
                            </motion.div>
                          </motion.div>
                        )
                      })
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
      
      {showMilestoneModal && (
        <AddMilestoneModal 
          projectId={selectedProjectId} 
          projects={projects}
          onClose={() => setShowMilestoneModal(false)} 
          onAdded={() => {
              setShowMilestoneModal(false);
              fetchProjectMilestones(); 
          }} 
        />
      )}

      {selectedTask && (
        <TaskDetailsModal 
          task={selectedTask} 
          onClose={() => setSelectedTask(null)} 
          socket={socketInstance} 
        />
      )}
    </motion.div>
  );
};

export default TaskForm;