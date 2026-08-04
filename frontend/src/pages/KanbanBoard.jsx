import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, ArrowLeft, Loader2, MoreHorizontal, Calendar, AlignLeft, User, Edit3, Trash2, Search, TrendingDown, Clock, Lock, LayoutDashboard } from 'lucide-react';
import api from '../services/api';
import { io } from 'socket.io-client'; 
import ChatPanel from './ChatPanel';
import TaskDetailsModal from './TaskDetailsModal';
import { useToast } from '../components/ToastProvider';
import BurndownChartCard from '../components/BurndownChartCard';
import ProjectGantt from '../components/ProjectGantt';
import TaskTimerModal from '../components/TaskTimerModal';
import ProjectVault from '../components/ProjectVault'; // 🔥 Imported the Vault

const KanbanBoard = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  
  // 🔥 NEW: State to control which tab is active
  const [activeTab, setActiveTab] = useState('board');
  
  const [tasks, setTasks] = useState([]);
  const [team, setTeam] = useState([]); 
  const [milestones, setMilestones] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [timerTask, setTimerTask] = useState(null);
  
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
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [progress, setProgress] = useState(0);
  const [department, setDepartment] = useState('General');
  const [assignedTo, setAssignedTo] = useState(''); 
  const [isClientDeliverable, setIsClientDeliverable] = useState(false);
  const [dependsOn, setDependsOn] = useState([]); 
  const [milestoneId, setMilestoneId] = useState(''); 

  const [socketInstance, setSocketInstance] = useState(null);
  const [showChart, setShowChart] = useState(false);
  const [showGantt, setShowGantt] = useState(false); 

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
  const toast = useToast();

  const fetchBoardData = async () => {
    try {
      const [taskRes, teamRes, milestoneRes] = await Promise.all([
        api.get(`/tasks/project/${projectId}`),
        api.get('/team'),
        api.get(`/milestones/project/${projectId}`) 
      ]);
      
      const normalizedTasks = taskRes.data.map((task) => {
        const assigneeId = task.assignedTo?._id || task.assignedTo;
        const selectedMember = teamRes.data.find((member) => member._id === assigneeId);
        
        return { 
          ...task, 
          assignedTo: selectedMember 
            ? { _id: selectedMember._id, name: selectedMember.name } 
            : task.assignedTo 
        };
      });
      
      setTasks(normalizedTasks);
      setTeam(teamRes.data);
      setMilestones(milestoneRes.data); 
    } catch (error) { 
      console.error('Failed to load board data', error); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => {
    fetchBoardData();
  }, [projectId]);

  useEffect(() => {
    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'https://projectsphere-dlvv.onrender.com';
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling']
    });
    
    setSocketInstance(socket);

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
  }, [projectId]);

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
    setStartDate('');
    setDueDate('');
    setProgress(0);
    setDepartment('General');
    setAssignedTo('');
    setIsClientDeliverable(false);
    setDependsOn([]);
    setMilestoneId(''); 
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
    setStartDate(task.startDate ? new Date(task.startDate).toISOString().split('T')[0] : '');
    setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
    setProgress(task.progress || 0);
    setDepartment(task.department || 'General');
    setAssignedTo(task.assignedTo?._id || '');
    setIsModalOpen(true);
    setIsClientDeliverable(task.isClientDeliverable || false);
    setDependsOn(task.dependsOn ? task.dependsOn.map(d => d._id || d) : []);
    setMilestoneId(task.milestoneId?._id || task.milestoneId || ''); 
  };

  const handleDependsOnChange = (e) => {
    const options = Array.from(e.target.selectedOptions);
    setDependsOn(options.map(option => option.value));
  };

  const handleSubmitTask = async (e) => {
    e.preventDefault();
    if (!canManageBoard && editingTask && !canModifyTask(editingTask)) {
      toast.push('You do not have permission to edit this task.', { type: 'error' });
      return;
    }
     setIsSaving(true);

    try {
      const payload = {
        title, description, status, priority, 
        startDate: startDate || null,
        dueDate: dueDate || null, 
        progress: Number(progress),
        department, projectId, 
        assignedTo: assignedTo || null, 
        isClientDeliverable,
        dependsOn: dependsOn, 
        milestoneId: milestoneId || null 
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
      toast.push(err.response?.data?.message || 'Failed to save task', { type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDuplicateTask = (task) => {
    setEditingTask(null); 
    setTitle(`${task.title} (Copy)`);
    setDescription(task.description || '');
    setStatus(task.status || 'To Do');
    setPriority(task.priority || 'Medium');
    setStartDate(task.startDate ? new Date(task.startDate).toISOString().split('T')[0] : '');
    setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
    setProgress(task.progress || 0);
    setDepartment(task.department || 'General');
    setAssignedTo(task.assignedTo?._id || '');
    setIsClientDeliverable(task.isClientDeliverable || false);
    setDependsOn(task.dependsOn ? task.dependsOn.map(d => d._id || d) : []);
    setMilestoneId(task.milestoneId?._id || task.milestoneId || ''); 
    
    setIsModalOpen(true); 
  };

  const exportToCSV = () => {
    if (tasks.length === 0) {
      toast.error("No tasks to export!", { type: 'error' });
      return;
    }

    const headers = ['Task Title', 'Description', 'Status', 'Priority', 'Department', 'Assignee', 'Start Date', 'Due Date'];

    const csvRows = tasks.map(task => {
      return [
        `"${task.title?.replace(/"/g, '""') || ''}"`,
        `"${task.description?.replace(/"/g, '""') || ''}"`,
        `"${task.status || ''}"`,
        `"${task.priority || ''}"`,
        `"${task.department || ''}"`,
        `"${task.assignedTo?.name || 'Unassigned'}"`,
        `"${task.startDate ? new Date(task.startDate).toLocaleDateString() : 'No date'}"`,
        `"${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'}"`
      ].join(',');
    });

    const csvContent = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `ProjectSphere_Tasks_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Tasks exported to Excel successfully!", { type: 'success' });
  };

  const handleDeleteTask = async (taskId) => {
    const taskToDelete = tasks.find((task) => task._id === taskId);
    if (!taskToDelete) return;
      if (!canModifyTask(taskToDelete)) {
      toast.push('You do not have permission to delete this task.', { type: 'error' });
      return;
    }
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    try {
      setTasks((prevTasks) => prevTasks.filter((task) => task._id !== taskId));
      await api.delete(`/tasks/${taskId}`);
    } catch (error) {
      console.error('Delete task error:', error);
      toast.push('Failed to delete task', { type: 'error' });
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
      toast.push('You do not have permission to move this task.', { type: 'error' });
      return;
    }

    if (taskToUpdate.dependsOn && taskToUpdate.dependsOn.length > 0) {
      const incompleteDeps = taskToUpdate.dependsOn.filter(depId => {
        const id = typeof depId === 'object' ? depId._id : depId;
        const blockingTask = tasks.find(t => t._id === id);
        return blockingTask && blockingTask.status !== 'Done' && blockingTask.status !== 'Completed';
      });
      
      if (incompleteDeps.length > 0) {
        toast.push(`🔒 Task locked! You must finish blocking tasks first.`, { type: 'error' });
        return; 
      }
    }
    
    const previousTasks = [...tasks];
    setTasks(tasks.map(task => task._id === taskId ? { ...task, status: newStatus } : task));

    try {
      await api.patch(`/tasks/${taskId}/status`, { status: newStatus });
    } catch (error) {
      setTasks(previousTasks); 
      toast.push('Failed to move task.', { type: 'error' });
    }
  };

  const getTasksByStatus = (colStatus) => filteredTasks.filter(t => t.status === colStatus);

  if (loading) {
    return <div className="h-full flex items-center justify-center w-full"><Loader2 className="animate-spin text-[#7c7fff]" size={40} /></div>;
  }

  return (
    <div className="min-h-full flex flex-col font-sans w-full box-border ">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <button 
            onClick={() => navigate('/projects')} 
            className="p-2 bg-[#1a1c26] sm:bg-transparent hover:bg-white/5 rounded-lg text-[#606479] hover:text-white transition shadow-sm sm:shadow-none shrink-0"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-0.5 sm:mb-1">Project Board</h2>
            <p className="text-[#84889c] text-xs sm:text-sm">Manage tasks and tickets</p>
          </div>
        </div>
        
        <div className="flex items-center flex-wrap gap-2 sm:gap-4"> 
          {activeTab === 'board' && (
            <>
              <button 
                onClick={() => setShowGantt(!showGantt)}
                className="flex items-center gap-1.5 sm:gap-2 bg-[#1a1c26] border border-white/5 hover:bg-white/10 text-[#7c7fff] px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg text-sm sm:text-base font-semibold transition"
              >
                <Clock size={16} /> {showGantt ? 'Hide Timeline' : 'View Timeline'}
              </button>
              <button 
                onClick={exportToCSV} 
                className="flex items-center gap-1.5 sm:gap-2 bg-[#1a1c26] border border-white/5 hover:bg-white/10 text-emerald-400 px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg text-sm sm:text-base font-semibold transition"
              >
                📥 Export CSV
              </button>
            </>
          )}
          <button 
            onClick={openCreateModal} 
            className="flex items-center gap-1.5 sm:gap-2 bg-[#7c7fff] hover:bg-[#6b6de0] text-white px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg text-sm sm:text-base font-semibold transition shadow-lg shadow-[#7c7fff]/20"
          >
            <Plus size={18} /> New Task
          </button>
          <button 
            onClick={() => setIsChatOpen(!isChatOpen)} 
            className="bg-[#1a1c26] border border-white/5 hover:bg-white/5 text-white px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg text-sm sm:text-base font-semibold transition"
          >
            {isChatOpen ? 'Close Chat' : 'Open Chat'}
          </button>
        </div>
      </div>

      {/* 🔥 NEW: TAB NAVIGATION */}
      <div className="flex items-center gap-4 border-b border-white/10 mb-6 pb-2">
        <button 
          onClick={() => setActiveTab('board')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-bold transition-colors ${
            activeTab === 'board' 
              ? 'text-[#7c7fff] border-b-2 border-[#7c7fff]' 
              : 'text-[#84889c] hover:text-white'
          }`}
        >
          <LayoutDashboard size={16} />
          Task Board
        </button>
        
        <button 
          onClick={() => setActiveTab('vault')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-bold transition-colors ${
            activeTab === 'vault' 
              ? 'text-emerald-400 border-b-2 border-emerald-400' 
              : 'text-[#84889c] hover:text-white'
          }`}
        >
          <Lock size={16} />
          Credentials Vault
        </button>
      </div>

      {/* 🔥 CONDITIONAL RENDERING BASED ON ACTIVE TAB */}
      {activeTab === 'board' ? (
        <>
          {/* --- ADVANCED FILTER BAR --- */}
          <div className="bg-[#1a1c26] p-3 sm:p-4 rounded-xl border border-white/5 mb-6 flex flex-col lg:flex-row gap-3 sm:gap-4 shadow-sm w-full">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-2.5 text-[#606479]" size={18} />
              <input 
                type="text" 
                placeholder="Search project tasks..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#121218] border border-white/5 rounded-lg py-2 pl-10 pr-4 text-sm sm:text-base text-white focus:outline-none focus:border-[#7c7fff] transition"
              />
            </div>
            <div className="flex gap-3 w-full lg:w-auto">
              <select 
                value={priorityFilter} 
                onChange={(e) => setPriorityFilter(e.target.value)} 
                className="w-1/2 lg:w-auto bg-[#121218] border border-white/5 rounded-lg px-3 sm:px-4 py-2 text-white text-xs sm:text-sm focus:outline-none focus:border-[#7c7fff] transition cursor-pointer"
              >
                <option value="All">All Priorities</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="flex justify-between items-center mb-6">
            <button 
              onClick={() => setShowChart(!showChart)}
              className="flex items-center gap-2 bg-[#1a1c26] hover:bg-[#2a2d3e] text-gray-300 px-4 py-2 rounded-lg border border-white/10 transition-colors"
            >
              <TrendingDown size={18} className={showChart ? "text-emerald-400" : "text-[#7c7fff]"} />
              {showChart ? 'Hide Analytics' : 'View Burndown Chart'}
            </button>
          </div>

          {showChart && (
            <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
              <BurndownChartCard projectId={projectId} />
            </div>
          )}

          {showGantt && (
            <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
              <ProjectGantt projectId={projectId} />
            </div>
          )}
          
          <div className="flex-1 flex flex-col lg:flex-row gap-4 sm:gap-6 pb-4 w-full min-h-0">
            {/* Column: To Do */}
            <div className="flex-1 w-full flex flex-col bg-[#1a1c26] rounded-xl border border-white/5 p-3 sm:p-4 transition-colors hover:bg-[#1f222e] min-h-[400px] lg:min-h-0" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, 'To Do')}>
              <div className="flex items-center justify-between mb-4 px-1 sm:px-2 shrink-0">
                <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                  <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-[#606479]"></span> TO DO 
                  <span className="ml-1 text-[10px] sm:text-xs text-[#606479] bg-[#121218] px-2 py-0.5 rounded-full">{getTasksByStatus('To Do').length}</span>
                </h3>
                <button className="text-[#606479] hover:text-white"><MoreHorizontal size={16} /></button>
              </div>
              <div className="flex-1 flex flex-col gap-3 overflow-y-auto custom-scrollbar pr-1 min-h-0">
                {getTasksByStatus('To Do').map(task => (
                  <TaskCard 
                    key={task._id} task={task} onDragStart={handleDragStart} onEdit={openEditModal} onOpenTimer={setTimerTask} onDelete={handleDeleteTask} onDuplicate={handleDuplicateTask} canModifyTask={canModifyTask} canManageBoard={canManageBoard} onClick={() => setSelectedTask(task)} 
                    isBlocked={task.dependsOn && task.dependsOn.some(depId => {
                      const id = typeof depId === 'object' ? depId._id : depId;
                      const depTask = tasks.find(t => t._id === id);
                      return depTask && depTask.status !== 'Done' && depTask.status !== 'Completed';
                    })}
                  />
                ))}
              </div>
            </div>

            {/* Column: In Progress */}
            <div className="flex-1 w-full flex flex-col bg-[#1a1c26] rounded-xl border border-white/5 p-3 sm:p-4 transition-colors hover:bg-[#1f222e] min-h-[400px] lg:min-h-0" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, 'In Progress')}>
              <div className="flex items-center justify-between mb-4 px-1 sm:px-2 shrink-0">
                <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                  <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-amber-500"></span> IN PROGRESS 
                  <span className="ml-1 text-[10px] sm:text-xs text-[#606479] bg-[#121218] px-2 py-0.5 rounded-full">{getTasksByStatus('In Progress').length}</span>
                </h3>
                <button className="text-[#606479] hover:text-white"><MoreHorizontal size={16} /></button>
              </div>
              <div className="flex-1 flex flex-col gap-3 overflow-y-auto custom-scrollbar pr-1 min-h-0">
                {getTasksByStatus('In Progress').map(task => (
                  <TaskCard key={task._id} task={task} onDragStart={handleDragStart} onEdit={openEditModal} onOpenTimer={setTimerTask} onDelete={handleDeleteTask} onDuplicate={handleDuplicateTask} canModifyTask={canModifyTask} canManageBoard={canManageBoard} onClick={() => setSelectedTask(task)}/>
                ))}
              </div>
            </div>

            {/* Column: Done */}
            <div className="flex-1 w-full flex flex-col bg-[#1a1c26] rounded-xl border border-white/5 p-3 sm:p-4 transition-colors hover:bg-[#1f222e] min-h-[400px] lg:min-h-0" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, 'Done')}>
              <div className="flex items-center justify-between mb-4 px-1 sm:px-2 shrink-0">
                <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                  <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-emerald-500"></span> DONE 
                  <span className="ml-1 text-[10px] sm:text-xs text-[#606479] bg-[#121218] px-2 py-0.5 rounded-full">{getTasksByStatus('Done').length}</span>
                </h3>
                <button className="text-[#606479] hover:text-white"><MoreHorizontal size={16} /></button>
              </div>
              <div className="flex-1 flex flex-col gap-3 overflow-y-auto custom-scrollbar pr-1 min-h-0">
                {getTasksByStatus('Done').map(task => (
                  <TaskCard key={task._id} task={task} onDragStart={handleDragStart} onEdit={openEditModal} onOpenTimer={setTimerTask} onDelete={handleDeleteTask} onDuplicate={handleDuplicateTask} canModifyTask={canModifyTask} canManageBoard={canManageBoard} onClick={() => setSelectedTask(task)}/>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : (
        /* 🔥 THE VAULT COMPONENT RENDERS HERE WHEN TAB IS SWITCHED */
        <div className="max-w-4xl mx-auto mt-4 w-full animate-in fade-in duration-300">
          <ProjectVault projectId={projectId} />
        </div>
      )}

      {/* --- MODALS & CHAT (Kept outside so they work globally) --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div 
            className="bg-[#2a2d3e] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[95vh] animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 sm:p-6 border-b border-white/5 shrink-0">
              <h3 className="text-lg sm:text-xl font-bold text-white">{editingTask ? 'Edit Task' : 'Create New Task'}</h3>
            </div>
         
            <form onSubmit={handleSubmitTask} className="p-5 sm:p-6 overflow-y-auto custom-scrollbar">
              <div className="flex flex-col gap-4 sm:gap-5 mb-6 sm:mb-8">
                <div>
                  <label className="block text-[10px] sm:text-xs font-semibold text-[#84889c] mb-1.5 sm:mb-2 uppercase">Task Title</label>
                  <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-[#1a1c26] border border-white/5 rounded-lg text-sm sm:text-base text-white focus:outline-none focus:border-[#7c7fff] transition" />
                </div>
                <div>
                  <label className="block text-[10px] sm:text-xs font-semibold text-[#84889c] mb-1.5 sm:mb-2 uppercase">Description</label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-[#1a1c26] border border-white/5 rounded-lg text-sm sm:text-base text-white focus:outline-none focus:border-[#7c7fff] transition resize-none h-20" />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] sm:text-xs font-semibold text-[#84889c] mb-1.5 sm:mb-2 uppercase">Status</label>
                    <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-[#1a1c26] border border-white/5 rounded-lg text-sm sm:text-base text-white focus:outline-none focus:border-[#7c7fff] transition cursor-pointer">
                      <option value="To Do">To Do</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Done">Done</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] sm:text-xs font-semibold text-[#84889c] mb-1.5 sm:mb-2 uppercase">Priority</label>
                    <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-[#1a1c26] border border-white/5 rounded-lg text-sm sm:text-base text-white focus:outline-none focus:border-[#7c7fff] transition cursor-pointer">
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] sm:text-xs font-semibold text-[#84889c] mb-1.5 sm:mb-2 uppercase">Start Date</label>
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-[#1a1c26] border border-white/5 rounded-lg text-sm sm:text-base text-white focus:outline-none focus:border-[#7c7fff] transition" />
                  </div>
                  <div>
                    <label className="block text-[10px] sm:text-xs font-semibold text-[#84889c] mb-1.5 sm:mb-2 uppercase">Due Date</label>
                    <input type="date" required value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-[#1a1c26] border border-white/5 rounded-lg text-sm sm:text-base text-white focus:outline-none focus:border-[#7c7fff] transition" />
                  </div>
                </div>
                
                <div>
                  <label className="block text-[10px] sm:text-xs font-semibold text-[#84889c] mb-1.5 sm:mb-2 uppercase">
                    Task Progress ({progress}%)
                  </label>
                  <input 
                    type="range" min="0" max="100" 
                    value={progress} 
                    onChange={(e) => setProgress(e.target.value)} 
                    className="w-full h-2 bg-[#121218] rounded-lg appearance-none cursor-pointer accent-[#7c7fff]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] sm:text-xs font-semibold text-[#84889c] mb-1.5 sm:mb-2 uppercase">Depends On (Hold Ctrl/Cmd to select multiple)</label>
                  <select 
                    multiple
                    value={dependsOn} 
                    onChange={handleDependsOnChange} 
                    className="w-full h-24 px-3 sm:px-4 py-2 sm:py-2.5 bg-[#1a1c26] border border-white/5 rounded-lg text-sm sm:text-base text-white focus:outline-none focus:border-[#7c7fff] transition cursor-pointer"
                  >
                    {tasks.filter(t => t._id !== editingTask?._id && t.status !== 'Done').map(t => (
                      <option key={t._id} value={t._id} className="p-1 hover:bg-[#7c7fff]/20 rounded">
                        {t.title} ({t.status})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] sm:text-xs font-semibold text-[#84889c] mb-1.5 sm:mb-2 uppercase">Department</label>
                    <select value={department} onChange={(e) => setDepartment(e.target.value)} className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-[#1a1c26] border border-white/5 rounded-lg text-sm sm:text-base text-white focus:outline-none focus:border-[#7c7fff] transition cursor-pointer">
                      <option value="General">General</option>
                      <option value="Design">Design</option>
                      <option value="Frontend">Frontend</option>
                      <option value="Backend">Backend</option>
                      <option value="DevOps">DevOps</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-[10px] sm:text-xs font-semibold text-[#84889c] mb-1.5 sm:mb-2 uppercase">Milestone (Optional)</label>
                    <select 
                      value={milestoneId} 
                      onChange={(e) => setMilestoneId(e.target.value)} 
                      className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-[#1a1c26] border border-white/5 rounded-lg text-sm sm:text-base text-white focus:outline-none focus:border-[#7c7fff] transition cursor-pointer"
                    >
                      <option value="">None</option>
                      {milestones.map(m => (
                        <option key={m._id} value={m._id}>
                          {m.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] sm:text-xs font-semibold text-[#84889c] mb-1.5 sm:mb-2 uppercase">Assign To</label>
                  <select 
                    value={assignedTo} 
                    onChange={(e) => setAssignedTo(e.target.value)} 
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-[#1a1c26] border border-white/5 rounded-lg text-sm sm:text-base text-white focus:outline-none focus:border-[#7c7fff] transition cursor-pointer"
                  >
                    <option value="">Unassigned</option>
                    {team.map(member => (
                      <option key={member._id} value={member._id}>
                        {member.name} ({member.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-1 sm:col-span-2 mt-2">
                  <label className="flex items-center gap-3 cursor-pointer p-3 bg-[#121218] border border-white/5 rounded-lg hover:border-[#7c7fff]/50 transition">
                    <input 
                      type="checkbox" 
                      checked={isClientDeliverable}
                      onChange={(e) => setIsClientDeliverable(e.target.checked)}
                      className="w-4 h-4 rounded bg-[#1a1c26] border-white/10 text-[#7c7fff] focus:ring-[#7c7fff] focus:ring-offset-0"
                    />
                    <div>
                      <span className="block text-sm font-semibold text-white">Client Deliverable</span>
                      <span className="block text-[10px] sm:text-xs text-[#84889c]">Check this if you want the client to see and approve this specific task.</span>
                    </div>
                  </label>
                </div>

              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-white/5 shrink-0">
                <button 
                  type="button" 
                  onClick={() => { setIsModalOpen(false); setEditingTask(null); resetTaskForm(); }} 
                  className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-lg text-sm font-semibold text-[#a0a4b8] hover:text-white hover:bg-white/5 transition text-center"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSaving} 
                  className="w-full sm:w-auto px-6 py-2.5 sm:py-2 rounded-lg text-sm font-semibold text-white bg-[#7c7fff] hover:bg-[#6b6de0] transition min-w-[120px] flex items-center justify-center shadow-md shadow-[#7c7fff]/20"
                >
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
      
      {timerTask && (
        <TaskTimerModal 
          task={timerTask} 
          onClose={() => setTimerTask(null)} 
        />
      )}
      
      <ChatPanel 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
        organizationId={storedUser?.organizationId} 
        user={storedUser} 
        projectId={projectId}
      />

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { height: 6px; width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
      `}} />
    </div>
  );
};

const TaskCard = ({ task, onDragStart, onEdit, onDelete, onDuplicate, onOpenTimer,canModifyTask, canManageBoard, onClick, isBlocked }) => { 
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'Done';
  const canInteract = canManageBoard || canModifyTask(task);

  return (
    <div 
      onClick={onClick} 
      draggable={canInteract}
      onDragStart={(e) => onDragStart(e, task._id, task)}
      className={`bg-[#242634] p-3 sm:p-4 rounded-xl border border-white/5 hover:border-white/20 transition ${canInteract ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'} group shadow-sm`}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex gap-1.5 sm:gap-2">
          {(canManageBoard || canModifyTask(task)) && (
            <>
            <button onClick={(e) => { e.stopPropagation(); onDuplicate(task); }} className="p-1 rounded text-[#606479] hover:text-emerald-400 transition" title="Duplicate task">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sm:w-[16px] sm:h-[16px]"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
              </button>
              <button onClick={(e) => { e.stopPropagation(); onOpenTimer(task); }} className="p-1 rounded text-[#606479] hover:text-[#7c7fff] transition" title="Track Time">
        <Clock size={14} className="sm:w-[16px] sm:h-[16px]" />
      </button>
              <button onClick={(e) => { e.stopPropagation(); onEdit(task); }} className="p-1 rounded text-[#606479] hover:text-[#7c7fff] transition" title="Edit task">
                <Edit3 size={14} className="sm:w-[16px] sm:h-[16px]" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); onDelete(task._id); }} className="p-1 rounded text-[#606479] hover:text-red-400 transition" title="Delete task">
                <Trash2 size={14} className="sm:w-[16px] sm:h-[16px]" />
              </button>
            </>
          )}
        </div>
        <div className="flex items-center gap-2 text-right">
          {task.isClientDeliverable && (
            <span className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 text-[8px] sm:text-[9px] font-bold uppercase tracking-wider rounded border border-blue-500/30 text-blue-400 bg-blue-500/10" title="Client can see and approve this task">
              👁️ Client
            </span>
          )}
          <span className={`px-1.5 sm:px-2 py-0.5 text-[8px] sm:text-[9px] font-bold uppercase tracking-wider rounded border ${
            task.priority === 'Urgent' ? 'border-red-500/30 text-red-400 bg-red-500/10' :
            task.priority === 'High' ? 'border-amber-500/30 text-amber-400 bg-amber-500/10' :
            task.priority === 'Medium' ? 'border-[#7c7fff]/30 text-[#7c7fff] bg-[#7c7fff]/10' :
            'border-[#84889c]/30 text-[#84889c] bg-[#84889c]/10'
          }`}>
            {task.priority}
          </span>
          <span className="text-[8px] sm:text-[9px] text-[#606479] font-bold uppercase hidden sm:inline-block">{task.department}</span>
        </div>
      </div>
      <h4 className="text-xs sm:text-sm font-bold text-white mb-2 leading-snug">{task.title}
        {isBlocked && (
          <span className="bg-red-500/20 text-red-400 text-[10px] px-1.5 py-0.5 rounded-md border border-red-500/30 flex items-center gap-1 ml-2 inline-flex" title="Blocked by another task">
            🔒 Blocked
          </span>
        )}
      </h4>
      
      {task.description && (
        <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-[#606479] mb-3 sm:mb-4">
          <AlignLeft size={12} className="shrink-0" />
          <span className="truncate">{task.description}</span>
        </div>
      )}
      <div className="flex justify-between items-center pt-2 sm:pt-3 border-t border-white/5">
        <div className={`flex items-center gap-1 text-[9px] sm:text-[10px] font-medium ${isOverdue ? 'text-red-400' : 'text-[#606479]'}`}>
          <Calendar size={12} />
          {task.dueDate ? new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'No date'}
        </div>
        
        {task.assignedTo ? (
          <div 
            className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-tr from-[#7c7fff] to-[#5b5eb8] border border-[#242634] flex items-center justify-center text-[9px] sm:text-[10px] text-white font-bold"
            title={task.assignedTo.name}
          >
            {task.assignedTo.name.charAt(0).toUpperCase()}
          </div>
        ) : (
          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#121218] border border-white/10 flex items-center justify-center text-[#606479] text-xs">
            <User size={12} />
          </div>
        )}
        
      </div>
      
    </div>
  );
};

export default KanbanBoard;