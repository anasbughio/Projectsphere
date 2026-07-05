import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, ArrowLeft, Loader2, MoreHorizontal, Calendar, AlignLeft, User } from 'lucide-react';
import api from '../services/api';

const KanbanBoard = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  
  const [tasks, setTasks] = useState([]);
  const [team, setTeam] = useState([]); // Team members ki state
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('To Do');
  const [priority, setPriority] = useState('Medium');
  const [dueDate, setDueDate] = useState('');
  const [department, setDepartment] = useState('General');
  const [assignedTo, setAssignedTo] = useState(''); // Assignment State

  useEffect(() => {
    const fetchBoardData = async () => {
      try {
        // Tasks aur Team Members dono ek sath fetch kar rahe hain
        const [taskRes, teamRes] = await Promise.all([
          api.get(`/tasks/project/${projectId}`),
          api.get('/team')
        ]);
        setTasks(taskRes.data);
        setTeam(teamRes.data);
      } catch (error) {
        console.error('Failed to load board data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBoardData();
  }, [projectId]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      // payload mein assignedTo add kiya hai
      const response = await api.post('/tasks', {
        title, description, status, priority, dueDate, department, projectId,
        assignedTo: assignedTo || null // Agar koi select nahi kiya toh null bhejein
      });

      // Kyunke naya task abhi populate nahi hua backend se, usay properly state mein add kar rahe hain
      const selectedMember = team.find(m => m._id === assignedTo);
      const newTask = {
        ...response.data,
        assignedTo: selectedMember ? { _id: selectedMember._id, name: selectedMember.name } : null
      };

      setTasks([newTask, ...tasks]);
      setIsModalOpen(false);

      // Form reset
      setTitle(''); setDescription(''); setDueDate('');
      setDepartment('General'); setAssignedTo('');
    } catch (err) {
      console.error('Create task error:', err.response?.data || err);
      alert(err.response?.data?.message || 'Failed to create task');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDragStart = (e, taskId) => e.dataTransfer.setData('taskId', taskId);
  const handleDragOver = (e) => e.preventDefault(); 
  
  const handleDrop = async (e, newStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (!taskId) return;

    const previousTasks = [...tasks];
    setTasks(tasks.map(task => task._id === taskId ? { ...task, status: newStatus } : task));

    try {
      await api.patch(`/tasks/${taskId}/status`, { status: newStatus });
    } catch (error) {
      setTasks(previousTasks); 
      alert('Failed to move task.');
    }
  };

  const getTasksByStatus = (colStatus) => tasks.filter(t => t.status === colStatus);

  if (loading) {
    return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-[#7c7fff]" size={40} /></div>;
  }

  return (
    <div className="h-full flex flex-col font-sans">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/projects')} className="p-2 hover:bg-white/5 rounded-lg text-[#606479] hover:text-white transition">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Project Board</h2>
            <p className="text-[#84889c] text-sm">Manage tasks and tickets</p>
          </div>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-[#7c7fff] hover:bg-[#6b6de0] text-white px-4 py-2.5 rounded-lg font-semibold transition shadow-lg shadow-[#7c7fff]/20">
          <Plus size={18} /> New Task
        </button>
      </div>

      <div className="flex-1 flex gap-6 overflow-x-auto pb-4">
        
        {/* Column: To Do */}
        <div className="w-[320px] min-w-[320px] flex flex-col bg-[#1a1c26] rounded-xl border border-white/5 p-4 transition-colors hover:bg-[#1f222e]" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, 'To Do')}>
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#606479]"></span> TO DO <span className="ml-1 text-xs text-[#606479] bg-[#121218] px-2 py-0.5 rounded-full">{getTasksByStatus('To Do').length}</span></h3>
            <button className="text-[#606479] hover:text-white"><MoreHorizontal size={16} /></button>
          </div>
          <div className="flex-1 flex flex-col gap-3 overflow-y-auto min-h-[150px]">
            {getTasksByStatus('To Do').map(task => <TaskCard key={task._id} task={task} onDragStart={handleDragStart} />)}
          </div>
        </div>

        {/* Column: In Progress */}
        <div className="w-[320px] min-w-[320px] flex flex-col bg-[#1a1c26] rounded-xl border border-white/5 p-4 transition-colors hover:bg-[#1f222e]" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, 'In Progress')}>
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> IN PROGRESS <span className="ml-1 text-xs text-[#606479] bg-[#121218] px-2 py-0.5 rounded-full">{getTasksByStatus('In Progress').length}</span></h3>
            <button className="text-[#606479] hover:text-white"><MoreHorizontal size={16} /></button>
          </div>
          <div className="flex-1 flex flex-col gap-3 overflow-y-auto min-h-[150px]">
            {getTasksByStatus('In Progress').map(task => <TaskCard key={task._id} task={task} onDragStart={handleDragStart} />)}
          </div>
        </div>

        {/* Column: Done */}
        <div className="w-[320px] min-w-[320px] flex flex-col bg-[#1a1c26] rounded-xl border border-white/5 p-4 transition-colors hover:bg-[#1f222e]" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, 'Done')}>
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> DONE <span className="ml-1 text-xs text-[#606479] bg-[#121218] px-2 py-0.5 rounded-full">{getTasksByStatus('Done').length}</span></h3>
            <button className="text-[#606479] hover:text-white"><MoreHorizontal size={16} /></button>
          </div>
          <div className="flex-1 flex flex-col gap-3 overflow-y-auto min-h-[150px]">
            {getTasksByStatus('Done').map(task => <TaskCard key={task._id} task={task} onDragStart={handleDragStart} />)}
          </div>
        </div>

      </div>

      {/* Create Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#2a2d3e] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-white/5">
              <h3 className="text-xl font-bold text-white">Create New Task</h3>
            </div>
            
            <form onSubmit={handleCreateTask} className="p-6">
              {/* =========================================
                  INPUTS BLOCK 
              ========================================= */}
              <div className="flex flex-col gap-5 mb-8">
                <div>
                  <label className="block text-xs font-semibold text-[#84889c] mb-2 uppercase">Task Title</label>
                  <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-4 py-2.5 bg-[#1a1c26] border border-white/5 rounded-lg text-white focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#84889c] mb-2 uppercase">Description</label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-4 py-2.5 bg-[#1a1c26] border border-white/5 rounded-lg text-white focus:outline-none resize-none h-20" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#84889c] mb-2 uppercase">Status</label>
                    <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full px-4 py-2.5 bg-[#1a1c26] border border-white/5 rounded-lg text-white focus:outline-none cursor-pointer">
                      <option value="To Do">To Do</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Done">Done</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#84889c] mb-2 uppercase">Priority</label>
                    <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full px-4 py-2.5 bg-[#1a1c26] border border-white/5 rounded-lg text-white focus:outline-none cursor-pointer">
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
                    <input type="date" required value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full px-4 py-2.5 bg-[#1a1c26] border border-white/5 rounded-lg text-white focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#84889c] mb-2 uppercase">Department</label>
                    <select value={department} onChange={(e) => setDepartment(e.target.value)} className="w-full px-4 py-2.5 bg-[#1a1c26] border border-white/5 rounded-lg text-white focus:outline-none cursor-pointer">
                      <option value="General">General</option>
                      <option value="Design">Design</option>
                      <option value="Frontend">Frontend</option>
                      <option value="Backend">Backend</option>
                      <option value="DevOps">DevOps</option>
                    </select>
                  </div>
                </div>

                {/* Team Assignment Dropdown */}
                <div>
                  <label className="block text-xs font-semibold text-[#84889c] mb-2 uppercase">Assign To</label>
                  <select 
                    value={assignedTo} 
                    onChange={(e) => setAssignedTo(e.target.value)} 
                    className="w-full px-4 py-2.5 bg-[#1a1c26] border border-white/5 rounded-lg text-white focus:outline-none cursor-pointer"
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

              {/* =========================================
                  BUTTONS BLOCK 
              ========================================= */}
              <div className="flex justify-end gap-3 pt-2 border-t border-white/5">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg text-sm font-semibold text-[#a0a4b8] hover:text-white transition">Cancel</button>
                <button type="submit" disabled={isCreating} className="px-6 py-2 rounded-lg text-sm font-semibold text-white bg-[#7c7fff] hover:bg-[#6b6de0] transition min-w-[120px] flex justify-center">
                  {isCreating ? <Loader2 size={16} className="animate-spin" /> : 'Add Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const TaskCard = ({ task, onDragStart }) => {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'Done';

  return (
    <div 
      draggable
      onDragStart={(e) => onDragStart(e, task._id)}
      className="bg-[#242634] p-4 rounded-xl border border-white/5 hover:border-white/20 transition cursor-grab active:cursor-grabbing group shadow-sm"
    >
      <div className="flex justify-between items-start mb-2">
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
        
        {/* Assigned User Avatar */}
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