import React, { useState, useEffect } from 'react';
// ERROR FIX: Yahan tamam required API services import kar li hain
import { getGlobalTasks, createGlobalTask, updateTaskStatus, deleteTask, updateTaskDetails } from '../services/taskService';

const TaskForm = () => {
  const [tasks, setTasks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  // Edit State
  const [editingTask, setEditingTask] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'Medium',
    department: 'General'
  });

  // Fetch Tasks on Load
  useEffect(() => {
    fetchGlobalTasks();
  }, []);

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

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      setTasks(tasks.map(t => t._id === taskId ? { ...t, status: newStatus } : t));
      await updateTaskStatus(taskId, newStatus);
    } catch (error) {
      console.error("Status update failed:", error);
      fetchGlobalTasks();
    }
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    
    try {
      await deleteTask(taskId);
      setTasks(tasks.filter(t => t._id !== taskId));
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // NAYA HANDLER: Edit button click par form open karega aur purana data fill karega
  const handleEditClick = (task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description,
      priority: task.priority,
      department: task.department
    });
    setShowForm(true);
  };

  // UPDATE: Create aur Edit dono ko handle karega
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTask) {
        // Agar edit mode hai toh update API call karein
        await updateTaskDetails(editingTask._id, formData);
        setEditingTask(null);
      } else {
        // Warna naya create karein
        await createGlobalTask(formData);
      }
      
      setShowForm(false);
      setFormData({ title: '', description: '', priority: 'Medium', department: 'General' }); // Reset
      fetchGlobalTasks(); // Refresh list
    } catch (error) {
      console.error("Task creation/update failed", error);
    }
  };

  // --- DRAG AND DROP HANDLERS ---
  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData("taskId", taskId);
  };

  const handleDragOver = (e) => {
    e.preventDefault(); // Zaroori hai drop allow karne ke liye
  };

  const handleDrop = async (e, newStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    
    const taskToUpdate = tasks.find(t => t._id === taskId);
    if (taskToUpdate && taskToUpdate.status !== newStatus) {
      handleStatusChange(taskId, newStatus); // Pehle banaya hua status change function use kar liya
    }
  };

  // Columns for Kanban Board
  const columns = ['To Do', 'In Progress', 'Done'];

  return (
    <div className="p-6 bg-[#0d0e12] min-h-screen text-white">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-8 border-b border-gray-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Organization Global Tasks</h1>
          <p className="text-sm text-gray-400">Drag and drop tasks or use the dropdown to update status</p>
        </div>
        <button 
          onClick={() => {
            setEditingTask(null);
            setFormData({ title: '', description: '', priority: 'Medium', department: 'General' });
            setShowForm(!showForm);
          }}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium transition"
        >
          {showForm ? 'Close Form' : '+ New Global Task'}
        </button>
      </div>

      {/* --- FORM SECTION --- */}
      {showForm && (
        <div className="mb-10 bg-[#121218] border border-gray-800 p-6 rounded-xl max-w-3xl">
          <h2 className="text-lg font-semibold mb-4 text-gray-200">
            {editingTask ? 'Edit Task' : 'Create New Global Task'}
          </h2>
          
          <form onSubmit={handleSubmit}>
            
            {/* 1. INPUTS KA MUKAMMAL ALAG BLOCK */}
            <div className="bg-[#1a1c26] p-5 rounded-lg mb-6 border border-gray-700/50">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Task Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Task Title</label>
                  <input
                    type="text" name="title" required value={formData.title} onChange={handleInputChange}
                    className="w-full bg-[#121218] border border-gray-700 rounded p-2.5 text-white focus:outline-none focus:border-blue-500"
                    placeholder="e.g. Weekly Progress Report Submission"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Description</label>
                  <textarea
                    name="description" rows="3" value={formData.description} onChange={handleInputChange}
                    className="w-full bg-[#121218] border border-gray-700 rounded p-2.5 text-white focus:outline-none focus:border-blue-500"
                    placeholder="Details for the VA team..."
                  />
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm text-gray-400 mb-1">Priority</label>
                    <select
                      name="priority" value={formData.priority} onChange={handleInputChange}
                      className="w-full bg-[#121218] border border-gray-700 rounded p-2.5 text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="Low">Low</option><option value="Medium">Medium</option>
                      <option value="High">High</option><option value="Urgent">Urgent</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm text-gray-400 mb-1">Department</label>
                    <select
                      name="department" value={formData.department} onChange={handleInputChange}
                      className="w-full bg-[#121218] border border-gray-700 rounded p-2.5 text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="General">General</option><option value="Frontend">Frontend</option>
                      <option value="Backend">Backend</option><option value="Design">Design</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. BUTTONS KA MUKAMMAL ALAG BLOCK */}
            <div className="bg-[#1a1c26] p-4 rounded-lg border border-gray-700/50 flex justify-end gap-3 items-center">
              <span className="text-xs text-gray-500 mr-auto">This task will be visible to the entire organization.</span>
              <button
                type="button" onClick={() => setShowForm(false)}
                className="px-5 py-2.5 hover:bg-[#222533] text-gray-300 rounded-lg text-sm font-medium transition border border-gray-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition shadow-lg"
              >
                {editingTask ? 'Save Changes' : 'Publish Global Task'}
              </button>
            </div>

          </form>
        </div>
      )}

      {/* --- KANBAN BOARD SECTION (DRAG & DROP) --- */}
      {loading ? (
        <p className="text-gray-500">Loading global tasks...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {columns.map(colStatus => (
            <div 
              key={colStatus} 
              className="bg-[#121218] rounded-xl p-4 border border-gray-800 min-h-[500px]"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, colStatus)}
            >
              <h2 className="text-gray-400 font-semibold mb-4 border-b border-gray-800 pb-2 flex justify-between items-center">
                {colStatus}
                <span className="bg-[#1a1c26] text-xs py-1 px-2 rounded-full border border-gray-700">
                  {tasks.filter(t => t.status === colStatus).length}
                </span>
              </h2>

              <div className="space-y-4">
                {tasks.filter(task => task.status === colStatus).map(task => (
                  <div 
                    key={task._id} 
                    draggable 
                    onDragStart={(e) => handleDragStart(e, task._id)}
                    className="bg-[#1a1c26] flex flex-col p-4 rounded-xl border border-gray-700 hover:border-blue-500 transition relative group cursor-grab active:cursor-grabbing"
                  >
                    
                    {/* Action Buttons (Edit & Delete) */}
                    <div className="absolute top-3 right-3 flex gap-2">
                      <button 
                        onClick={() => handleEditClick(task)}
                        className="text-gray-500 hover:text-blue-400 transition"
                        title="Edit Task"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => handleDelete(task._id)}
                        className="text-gray-500 hover:text-red-500 transition"
                        title="Delete Task"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>

                    <div className="flex justify-between items-start mb-2 pr-12">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        task.priority === 'Urgent' ? 'bg-red-900/50 text-red-400' :
                        task.priority === 'High' ? 'bg-orange-900/50 text-orange-400' :
                        'bg-blue-900/50 text-blue-400'
                      }`}>
                        {task.priority}
                      </span>
                      <span className="text-[10px] text-gray-500">{task.department}</span>
                    </div>
                    
                    <h3 className="font-semibold text-sm text-gray-200 mb-1">{task.title}</h3>
                    <p className="text-xs text-gray-400 line-clamp-2 mb-4 flex-grow">{task.description}</p>
                    
                    {/* Optional Fallback Dropdown for Status Change (Agar koi drag & drop use na karna chahay) */}
                    <div className="flex justify-between items-center text-[10px] pt-3 border-t border-gray-800 mt-auto">
                      <select 
                        value={task.status}
                        onChange={(e) => handleStatusChange(task._id, e.target.value)}
                        className="bg-transparent text-gray-500 hover:text-gray-300 focus:outline-none cursor-pointer"
                      >
                        <option value="To Do" className="bg-[#1a1c26]">To Do</option>
                        <option value="In Progress" className="bg-[#1a1c26]">In Progress</option>
                        <option value="Done" className="bg-[#1a1c26]">Done</option>
                      </select>
                      <span className="text-gray-600">{new Date(task.createdAt).toLocaleDateString()}</span>
                    </div>

                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskForm;