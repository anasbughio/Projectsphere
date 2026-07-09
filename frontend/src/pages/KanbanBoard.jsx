import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, ArrowLeft, Loader2, MoreHorizontal, Calendar, AlignLeft, User, Edit3, Trash2, Search } from 'lucide-react';
import api from '../services/api';
import { io } from 'socket.io-client'; 
import ChatPanel from './ChatPanel';
import TaskDetailsModal from './TaskDetailsModal';
const KanbanBoard = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  
  const [tasks, setTasks] = useState([]);
  const [team, setTeam] = useState([]); 
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('To Do');
  const [priority, setPriority] = useState('Medium');
  const [dueDate, setDueDate] = useState('');
  const [department, setDepartment] = useState('General');
  const [assignedTo, setAssignedTo] = useState(''); 
  const [socketInstance, setSocketInstance] = useState(null);

  const storedUser = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || 'null') : null;
  const normalizeRole = (role) => {
    if (!role) return '';
    const normalized = role.toString().trim().toLowerCase();
    if (['admin', 'org admin', 'organization admin'].includes(normalized)) return 'admin';
    if (['member', 'team member'].includes(normalized)) return 'member';
    return normalized;
  };
  const userRole = normalizeRole(storedUser?.role);
  const currentUserId = storedUser?._id;
  const isAdmin = userRole === 'admin';
  const canManageBoard = isAdmin;
  
  const canModifyTask = (task) => {
    if (isAdmin) return true;
    if (!currentUserId) return false;
    const taskCreator = task?.createdBy?.toString?.() || task?.createdBy;
    const taskAssignee = task?.assignedTo?._id?.toString?.() || task?.assignedTo;
    return taskCreator === currentUserId || taskAssignee === currentUserId;
  };

  const fetchBoardData = async () => {
    try {
      const [taskRes, teamRes] = await Promise.all([
        api.get(`/tasks/project/${projectId}`),
        api.get('/team')
      ]);
      const normalizedTasks = taskRes.data.map((task) => {
        const selectedMember = teamRes.data.find((member) => member._id === task.assignedTo);
        return { ...task, assignedTo: selectedMember ? { _id: selectedMember._id, name: selectedMember.name } : null };
      });
      setTasks(normalizedTasks);
      setTeam(teamRes.data);
    } catch (error) { console.error('Failed to load board data', error); } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchBoardData();
  }, [projectId]);

  // 2. --- REAL-TIME SOCKET.IO LOGIC ---
  useEffect(() => {
   const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'https://projectsphere-dlvv.onrender.com';
  const socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling']
  });
  
  setSocketInstance(socket); // 🔥 Socket ko state mein save kiya

  if (storedUser?.organizationId) {
    socket.emit('joinOrganization', storedUser.organizationId);
  }
    const handleCreated = (newTask) => {
      if (newTask.projectId === projectId) {
        setTasks((prev) => prev.find(t => t._id === newTask._id) ? prev : [newTask, ...prev]);
      }
    };

    const handleUpdated = (updatedTask) => {
      if (updatedTask.projectId === projectId) {
        setTasks((prev) => prev.map(t => t._id === updatedTask._id ? updatedTask : t));
      }
    };

    const handleDeleted = (deletedTaskId) => {
      setTasks((prev) => prev.filter(t => t._id !== deletedTaskId));
    };

    socket.on('taskCreated', handleCreated);
    socket.on('taskUpdated', handleUpdated);
    socket.on('taskDeleted', handleDeleted);

    return () => {
      socket.off('taskCreated', handleCreated);
      socket.off('taskUpdated', handleUpdated);
      socket.off('taskDeleted', handleDeleted);
      socket.disconnect();
    };
  }, [projectId]);// Dependancy mein projectId add kiya taake project change hone par update ho

  // --- FILTERING LOGIC ---
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesPriority = priorityFilter === 'All' || task.priority === priorityFilter;
    const matchesDepartment = departmentFilter === 'All' || task.department === departmentFilter;
    
    return matchesSearch && matchesPriority && matchesDepartment;
  });

  const resetTaskForm = () => {
    setTitle('');
    setDescription('');
    setStatus('To Do');
    setPriority('Medium');
    setDueDate('');
    setDepartment('General');
    setAssignedTo('');
  };

  const openCreateModal = () => {
    setEditingTask(null);
    resetTaskForm();
    setIsModalOpen(true);
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setTitle(task.title || '');
    setDescription(task.description || '');
    setStatus(task.status || 'To Do');
    setPriority(task.priority || 'Medium');
    setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
    setDepartment(task.department || 'General');
    setAssignedTo(task.assignedTo?._id || '');
    setIsModalOpen(true);
  };

  const handleSubmitTask = async (e) => {
    e.preventDefault();
    if (!canManageBoard && editingTask && !canModifyTask(editingTask)) {
      alert('You do not have permission to edit this task.');
      return;
    }
   
    setIsSaving(true);

    try {
      const payload = {
        title, description, status, priority, dueDate: dueDate || null, department, projectId, assignedTo: assignedTo || null
      };

      if (editingTask) {
        await api.put(`/tasks/${editingTask._id}`, payload);
      } else {
        await api.post('/tasks', payload);
      }

      await fetchBoardData();
      setIsModalOpen(false);
      setEditingTask(null);


      resetTaskForm();
    } catch (err) {
      console.error('Task save error:', err.response?.data || err);
      alert(err.response?.data?.message || 'Failed to save task');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    const taskToDelete = tasks.find((task) => task._id === taskId);
    if (!taskToDelete) return;
    if (!canModifyTask(taskToDelete)) {
      alert('You do not have permission to delete this task.');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    try {
      // Optimistic delete
      setTasks((prevTasks) => prevTasks.filter((task) => task._id !== taskId));
      await api.delete(`/tasks/${taskId}`);
    } catch (error) {
      console.error('Delete task error:', error);
      alert('Failed to delete task');
    }
  };

  const handleDragStart = (e, taskId, task) => {
    if (!canModifyTask(task)) return;
    e.dataTransfer.setData('taskId', taskId);
  };
  const handleDragOver = (e) => e.preventDefault(); 
  
  const handleDrop = async (e, newStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (!taskId) return;
    const taskToUpdate = tasks.find((task) => task._id === taskId);
    if (!taskToUpdate || !canModifyTask(taskToUpdate)) {
      alert('You do not have permission to move this task.');
      return;
    }

    const previousTasks = [...tasks];
    setTasks(tasks.map(task => task._id === taskId ? { ...task, status: newStatus } : task));

    try {
      await api.patch(`/tasks/${taskId}/status`, { status: newStatus });
    } catch (error) {
      setTasks(previousTasks); 
      alert('Failed to move task.');
    }
  };

  const getTasksByStatus = (colStatus) => filteredTasks.filter(t => t.status === colStatus);

  if (loading) {
    return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-[#7c7fff]" size={40} /></div>;
  }

  return (
    <div className="h-full flex flex-col font-sans">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/projects')} className="p-2 hover:bg-white/5 rounded-lg text-[#606479] hover:text-white transition">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Project Board</h2>
            <p className="text-[#84889c] text-sm">Manage tasks and tickets</p>
          </div>
        </div>
        
          <button onClick={openCreateModal} className="flex items-center gap-2 bg-[#7c7fff] hover:bg-[#6b6de0] text-white px-4 py-2.5 rounded-lg font-semibold transition shadow-lg shadow-[#7c7fff]/20">
            <Plus size={18} /> New Task
          </button>
        
        <button 
  onClick={() => setIsChatOpen(!isChatOpen)} 
  className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2.5 rounded-lg font-semibold transition"
>
  {isChatOpen ? 'Close Chat' : 'Open Chat'}
</button>
      </div>

      {/* --- ADVANCED FILTER BAR --- */}
      <div className="bg-[#1a1c26] p-4 rounded-xl border border-white/5 mb-6 flex flex-col md:flex-row gap-4 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-[#606479]" size={18} />
          <input 
            type="text" 
            placeholder="Search project tasks..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#121218] border border-white/5 rounded-lg py-2 pl-10 pr-4 text-white focus:outline-none focus:border-[#7c7fff] transition"
          />
        </div>
        <select 
          value={priorityFilter} 
          onChange={(e) => setPriorityFilter(e.target.value)} 
          className="bg-[#121218] border border-white/5 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-[#7c7fff] transition cursor-pointer"
        >
          <option value="All">All Priorities</option>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
          <option value="Urgent">Urgent</option>
        </select>
        <select 
          value={departmentFilter} 
          onChange={(e) => setDepartmentFilter(e.target.value)} 
          className="bg-[#121218] border border-white/5 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-[#7c7fff] transition cursor-pointer"
        >
          <option value="All">All Departments</option>
          <option value="General">General</option>
          <option value="Design">Design</option>
          <option value="Frontend">Frontend</option>
          <option value="Backend">Backend</option>
          <option value="DevOps">DevOps</option>
        </select>
      </div>

      <div className="flex-1 flex gap-6 overflow-x-auto pb-4">
        {/* Column: To Do */}
        <div className="w-[320px] min-w-[320px] flex flex-col bg-[#1a1c26] rounded-xl border border-white/5 p-4 transition-colors hover:bg-[#1f222e]" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, 'To Do')}>
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#606479]"></span> TO DO <span className="ml-1 text-xs text-[#606479] bg-[#121218] px-2 py-0.5 rounded-full">{getTasksByStatus('To Do').length}</span></h3>
            <button className="text-[#606479] hover:text-white"><MoreHorizontal size={16} /></button>
          </div>
          <div className="flex-1 flex flex-col gap-3 overflow-y-auto min-h-[150px]">
           {getTasksByStatus('To Do').map(task => (
  <TaskCard 
    key={task._id} 
    task={task} 
    onDragStart={handleDragStart} 
    onEdit={openEditModal} 
    onDelete={handleDeleteTask} 
    canModifyTask={canModifyTask} 
    canManageBoard={canManageBoard}
    onClick={() => setSelectedTask(task)} // <--- Naya prop
  />
))}
          </div>
        </div>

        {/* Column: In Progress */}
        <div className="w-[320px] min-w-[320px] flex flex-col bg-[#1a1c26] rounded-xl border border-white/5 p-4 transition-colors hover:bg-[#1f222e]" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, 'In Progress')}>
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> IN PROGRESS <span className="ml-1 text-xs text-[#606479] bg-[#121218] px-2 py-0.5 rounded-full">{getTasksByStatus('In Progress').length}</span></h3>
            <button className="text-[#606479] hover:text-white"><MoreHorizontal size={16} /></button>
          </div>
          <div className="flex-1 flex flex-col gap-3 overflow-y-auto min-h-[150px]">
            {getTasksByStatus('In Progress').map(task => <TaskCard key={task._id} task={task} onDragStart={handleDragStart} onEdit={openEditModal} onDelete={handleDeleteTask} canModifyTask={canModifyTask} canManageBoard={canManageBoard} onClick={() => setSelectedTask(task)}/>)}
          </div>
        </div>

        {/* Column: Done */}
        <div className="w-[320px] min-w-[320px] flex flex-col bg-[#1a1c26] rounded-xl border border-white/5 p-4 transition-colors hover:bg-[#1f222e]" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, 'Done')}>
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> DONE <span className="ml-1 text-xs text-[#606479] bg-[#121218] px-2 py-0.5 rounded-full">{getTasksByStatus('Done').length}</span></h3>
            <button className="text-[#606479] hover:text-white"><MoreHorizontal size={16} /></button>
          </div>
          <div className="flex-1 flex flex-col gap-3 overflow-y-auto min-h-[150px]">
            {getTasksByStatus('Done').map(task => <TaskCard key={task._id} task={task} onDragStart={handleDragStart} onEdit={openEditModal} onDelete={handleDeleteTask} canModifyTask={canModifyTask} canManageBoard={canManageBoard} onClick={() => setSelectedTask(task)}/>)}
          </div>
        </div>
      </div>

      {/* Create/Edit Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#2a2d3e] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-white/5">
              <h3 className="text-xl font-bold text-white">{editingTask ? 'Edit Task' : 'Create New Task'}</h3>
            </div>
         
            <form onSubmit={handleSubmitTask} className="p-6">
              <div className="flex flex-col gap-5 mb-8">
                <div>
                  <label className="block text-xs font-semibold text-[#84889c] mb-2 uppercase">Task Title</label>
                  <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-4 py-2.5 bg-[#1a1c26] border border-white/5 rounded-lg text-white focus:outline-none focus:border-[#7c7fff] transition" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#84889c] mb-2 uppercase">Description</label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-4 py-2.5 bg-[#1a1c26] border border-white/5 rounded-lg text-white focus:outline-none focus:border-[#7c7fff] transition resize-none h-20" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#84889c] mb-2 uppercase">Status</label>
                    <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full px-4 py-2.5 bg-[#1a1c26] border border-white/5 rounded-lg text-white focus:outline-none focus:border-[#7c7fff] transition cursor-pointer">
                      <option value="To Do">To Do</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Done">Done</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#84889c] mb-2 uppercase">Priority</label>
                    <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full px-4 py-2.5 bg-[#1a1c26] border border-white/5 rounded-lg text-white focus:outline-none focus:border-[#7c7fff] transition cursor-pointer">
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#84889c] mb-2 uppercase">Due Date</label>
                    <input type="date" required value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full px-4 py-2.5 bg-[#1a1c26] border border-white/5 rounded-lg text-white focus:outline-none focus:border-[#7c7fff] transition" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#84889c] mb-2 uppercase">Department</label>
                    <select value={department} onChange={(e) => setDepartment(e.target.value)} className="w-full px-4 py-2.5 bg-[#1a1c26] border border-white/5 rounded-lg text-white focus:outline-none focus:border-[#7c7fff] transition cursor-pointer">
                      <option value="General">General</option>
                      <option value="Design">Design</option>
                      <option value="Frontend">Frontend</option>
                      <option value="Backend">Backend</option>
                      <option value="DevOps">DevOps</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#84889c] mb-2 uppercase">Assign To</label>
                  <select 
                    value={assignedTo} 
                    onChange={(e) => setAssignedTo(e.target.value)} 
                    className="w-full px-4 py-2.5 bg-[#1a1c26] border border-white/5 rounded-lg text-white focus:outline-none focus:border-[#7c7fff] transition cursor-pointer"
                  >
                    <option value="">Unassigned</option>
                    {team.map(member => (
                      <option key={member._id} value={member._id}>
                        {member.name} ({member.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-white/5">
                <button type="button" onClick={() => { setIsModalOpen(false); setEditingTask(null); resetTaskForm(); }} className="px-4 py-2 rounded-lg text-sm font-semibold text-[#a0a4b8] hover:text-white transition">Cancel</button>
                <button type="submit" disabled={isSaving} className="px-6 py-2 rounded-lg text-sm font-semibold text-white bg-[#7c7fff] hover:bg-[#6b6de0] transition min-w-[120px] flex justify-center shadow-lg shadow-[#7c7fff]/20">
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : editingTask ? 'Save Changes' : 'Add Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
         {selectedTask && (
  <TaskDetailsModal 
    task={selectedTask} 
    onClose={() => setSelectedTask(null)} 
    organizationId={storedUser?.organizationId}
    socket={socketInstance}
  />
)}
      <ChatPanel 
  isOpen={isChatOpen} 
  onClose={() => setIsChatOpen(false)} 
  organizationId={storedUser?.organizationId} 
  user={storedUser} 
  projectId={projectId}
/>
    </div>
  );
};

const TaskCard = ({ task, onDragStart, onEdit, onDelete, canModifyTask, canManageBoard, onClick }) => { // <--- onClick add kiya
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'Done';
  const canInteract = canManageBoard || canModifyTask(task);

  return (
    <div 
      onClick={onClick} // <--- Click event yahan bind hoga
      draggable={canInteract}
      onDragStart={(e) => onDragStart(e, task._id, task)}
      className={`bg-[#242634] p-4 rounded-xl border border-white/5 hover:border-white/20 transition ${canInteract ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'} group shadow-sm`}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex gap-2">
          {(canManageBoard || canModifyTask(task)) && (
            <>
              <button onClick={(e) => { e.stopPropagation(); onEdit(task); }} className="p-1 rounded text-[#606479] hover:text-[#7c7fff] transition" title="Edit task">
                <Edit3 size={14} />
              </button>
              <button onClick={(e) => { e.stopPropagation(); onDelete(task._id); }} className="p-1 rounded text-[#606479] hover:text-red-400 transition" title="Delete task">
                <Trash2 size={14} />
              </button>
            </>
          )}
        </div>
        <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded border ${
          task.priority === 'Urgent' ? 'border-red-500/30 text-red-400 bg-red-500/10' :
          task.priority === 'High' ? 'border-amber-500/30 text-amber-400 bg-amber-500/10' :
          task.priority === 'Medium' ? 'border-[#7c7fff]/30 text-[#7c7fff] bg-[#7c7fff]/10' :
          'border-[#84889c]/30 text-[#84889c] bg-[#84889c]/10'
        }`}>
          {task.priority}
        </span>
        <span className="text-[9px] text-[#606479] font-bold uppercase">{task.department}</span>
      </div>
      <h4 className="text-sm font-bold text-white mb-2 leading-snug">{task.title}</h4>
      {task.description && (
        <div className="flex items-center gap-1.5 text-xs text-[#606479] mb-4">
          <AlignLeft size={12} />
          <span className="truncate">{task.description}</span>
        </div>
      )}
      <div className="flex justify-between items-center pt-3 border-t border-white/5">
        <div className={`flex items-center gap-1 text-[10px] font-medium ${isOverdue ? 'text-red-400' : 'text-[#606479]'}`}>
          <Calendar size={12} />
          {task.dueDate ? new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'No date'}
        </div>
        
        {task.assignedTo ? (
          <div 
            className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#7c7fff] to-[#5b5eb8] border border-[#242634] flex items-center justify-center text-[10px] text-white font-bold"
            title={task.assignedTo.name}
          >
            {task.assignedTo.name.charAt(0).toUpperCase()}
          </div>
        ) : (
          <div className="w-6 h-6 rounded-full bg-[#121218] border border-white/10 flex items-center justify-center text-[#606479] text-xs">
            <User size={12} />
          </div>
        )}
      </div>
    </div>
  );
};

export default KanbanBoard;