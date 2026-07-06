import React, { useState, useEffect } from 'react';
import { Search, Edit2, Trash2 } from 'lucide-react';
import { getGlobalTasks, createGlobalTask, updateTaskStatus, deleteTask, updateTaskDetails } from '../services/taskService';
import { io } from 'socket.io-client';
import ExampleUpload from '../components/ExampleUpload';

const TaskForm = () => {
  const [tasks, setTasks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingTask, setEditingTask] = useState(null);

  // --- FILTER STATES ---
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [departmentFilter, setDepartmentFilter] = useState('All');

  const [formData, setFormData] = useState({
    title: '', description: '', priority: 'Medium', department: 'General'
  });

  // 1. Initial Data Fetch
  useEffect(() => {
    fetchGlobalTasks();
  }, []);

  // 2. --- REAL-TIME SOCKET.IO LOGIC ---
  useEffect(() => {
    
const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000');

    // User ki organization ka room join karein
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    if (storedUser && storedUser.organizationId) {
      socket.emit('joinOrganization', storedUser.organizationId);
    }

    // A. Jab Naya Task Bane
    socket.on('taskCreated', (newTask) => {
      // Sirf global tasks ko add karein (jinme projectId nahi hota)
      if (!newTask.projectId) {
        setTasks((prevTasks) => [newTask, ...prevTasks]);
      }
    });

    // B. Jab Task Update ya Drag & Drop Ho
    socket.on('taskUpdated', (updatedTask) => {
      setTasks((prevTasks) =>
        prevTasks.map((task) => (task._id === updatedTask._id ? updatedTask : task))
      );
    });

    // C. Jab Task Delete Ho
    socket.on('taskDeleted', (deletedTaskId) => {
      setTasks((prevTasks) => prevTasks.filter((task) => task._id !== deletedTaskId));
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
    };
  }, []);
  // ------------------------------------

  const fetchGlobalTasks = async () => {
    try {
      setLoading(true);
      const data = await getGlobalTasks();
      setTasks(data);
    } catch (error) {
      console.error("Global tasks fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- FILTERING LOGIC ---
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          task.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = priorityFilter === 'All' || task.priority === priorityFilter;
    const matchesDepartment = departmentFilter === 'All' || task.department === departmentFilter;
    return matchesSearch && matchesPriority && matchesDepartment;
  });

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      // Optimistic update
      setTasks((prevTasks) => prevTasks.map(t => t._id === taskId ? { ...t, status: newStatus } : t));
      await updateTaskStatus(taskId, newStatus);
    } catch (error) {
      fetchGlobalTasks();
    }
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      // Optimistic update
      setTasks((prevTasks) => prevTasks.filter(t => t._id !== taskId));
      await deleteTask(taskId);
    } catch (error) {
      console.error("Delete failed:", error);
      fetchGlobalTasks(); // Rollback if failed
    }
  };

  const handleEditClick = (task) => {
    setEditingTask(task);
    setFormData({ title: task.title, description: task.description, priority: task.priority, department: task.department });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTask) {
        await updateTaskDetails(editingTask._id, formData);
        setEditingTask(null);
      } else {
        await createGlobalTask(formData);
      }

      await fetchGlobalTasks();
      setShowForm(false);
      setFormData({ title: '', description: '', priority: 'Medium', department: 'General' });
    } catch (error) {
      console.error("Task creation/update failed", error);
      alert(error.response?.data?.message || "Task creation/update failed");
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

  return (
    <div className="p-6 bg-[#0d0e12] min-h-screen text-white">
      <div className="flex justify-between items-center mb-8 border-b border-gray-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Organization Global Tasks</h1>
          <p className="text-sm text-gray-400">Manage and track cross-department tasks</p>
        </div>
        <button 
          onClick={() => { setShowForm(!showForm); setEditingTask(null); }}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium transition"
        >
          {showForm ? 'Close Form' : '+ New Global Task'}
        </button>
      </div>

      {showForm && (
        <div className="mb-10 bg-[#121218] border border-gray-800 p-6 rounded-xl max-w-3xl">
          <h2 className="text-lg font-semibold mb-4">{editingTask ? 'Edit Task' : 'Create New Task'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="bg-[#1a1c26] p-5 rounded-lg mb-6 border border-gray-700/50">
              <input type="text" name="title" required value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full bg-[#121218] border border-gray-700 rounded p-2.5 mb-4 focus:border-blue-500 focus:outline-none" placeholder="Task Title" />
              <textarea name="description" rows="3" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full bg-[#121218] border border-gray-700 rounded p-2.5 mb-4 focus:border-blue-500 focus:outline-none" placeholder="Description..." />
              <div className="flex gap-4">
                <select name="priority" value={formData.priority} onChange={(e) => setFormData({...formData, priority: e.target.value})} className="flex-1 bg-[#121218] border border-gray-700 rounded p-2.5 focus:border-blue-500 focus:outline-none cursor-pointer"><option>Low</option><option>Medium</option><option>High</option><option>Urgent</option></select>
                <select name="department" value={formData.department} onChange={(e) => setFormData({...formData, department: e.target.value})} className="flex-1 bg-[#121218] border border-gray-700 rounded p-2.5 focus:border-blue-500 focus:outline-none cursor-pointer"><option>General</option><option>Frontend</option><option>Backend</option><option>Design</option></select>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 bg-[#222533] rounded-lg text-sm hover:text-white transition">Cancel</button>
              <button type="submit" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm transition">{editingTask ? 'Save Changes' : 'Publish Task'}</button>
            </div>
          </form>
        </div>
      )}

      {/* --- FILTER BAR --- */}
      <div className="bg-[#121218] p-4 rounded-xl border border-gray-800 mb-6 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 text-gray-500" size={18} />
          <input type="text" placeholder="Search tasks..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-[#1a1c26] border border-gray-700 rounded-lg py-2 pl-10 pr-4 focus:border-blue-500 focus:outline-none transition" />
        </div>
        <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="w-full md:w-auto bg-[#1a1c26] border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none cursor-pointer"><option value="All">All Priorities</option><option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option><option value="Urgent">Urgent</option></select>
        <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)} className="w-full md:w-auto bg-[#1a1c26] border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none cursor-pointer"><option value="All">All Departments</option><option value="General">General</option><option value="Frontend">Frontend</option><option value="Backend">Backend</option><option value="Design">Design</option></select>
      </div>

      {/* --- FILE UPLOAD --- */}
      <div className="bg-[#121218] p-4 rounded-xl border border-gray-800 mb-6">
        <h3 className="text-sm font-semibold mb-3 text-gray-300">Upload Task Attachment</h3>
        <ExampleUpload />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {columns.map(colStatus => (
          <div key={colStatus} className="bg-[#121218] rounded-xl p-4 border border-gray-800 min-h-[500px]" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, colStatus)}>
            <h2 className="text-gray-400 font-semibold mb-4 border-b border-gray-800 pb-2 flex justify-between items-center">
              {colStatus}
              <span className="bg-[#1a1c26] px-2 py-0.5 rounded-full text-xs border border-gray-700">{filteredTasks.filter(t => t.status === colStatus).length}</span>
            </h2>
            <div className="space-y-4">
              {filteredTasks.filter(t => t.status === colStatus).map(task => (
                <div key={task._id} draggable onDragStart={(e) => handleDragStart(e, task._id)} className="bg-[#1a1c26] p-4 rounded-xl border border-gray-700 hover:border-blue-500 transition cursor-grab active:cursor-grabbing relative group">
                  <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition">
                    <button onClick={() => handleEditClick(task)} className="p-1.5 bg-[#222533] rounded hover:text-blue-400 transition" title="Edit Task"><Edit2 size={14} /></button>
                    <button onClick={() => handleDelete(task._id)} className="p-1.5 bg-[#222533] rounded hover:text-red-500 transition" title="Delete Task"><Trash2 size={14} /></button>
                  </div>
                  <h3 className="font-semibold text-sm mb-1 pr-16">{task.title}</h3>
                  <p className="text-xs text-gray-400 mb-3">{task.description}</p>
                  <div className="flex justify-between items-center text-[10px] text-gray-500 pt-3 border-t border-gray-800">
                    <span className={`px-2 py-0.5 rounded font-bold uppercase ${
                      task.priority === 'Urgent' ? 'text-red-400 bg-red-500/10' :
                      task.priority === 'High' ? 'text-orange-400 bg-orange-500/10' :
                      'text-blue-400 bg-blue-500/10'
                    }`}>{task.priority}</span>
                    <span className="uppercase tracking-wider">{task.department}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TaskForm;