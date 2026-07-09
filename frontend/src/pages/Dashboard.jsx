import React, { useState, useEffect } from 'react';
import { 
  DollarSign, Briefcase, CheckSquare, Activity, 
  MoreVertical, Calendar, Clock, AlertCircle, 
  ArrowUpRight, AlertTriangle, Loader2, FolderKanban
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import api from '../services/api';
import { Link } from 'react-router-dom';


const Dashboard = () => {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [projectRes, taskRes] = await Promise.all([
          api.get('/projects'),
          api.get('/tasks/global/all') // Ya agar aapne dedicated endpoint use karna ho toh wo laga lein
        ]);
        setProjects(projectRes.data);
        setTasks(taskRes.data);
      } catch (error) {
        console.error('Dashboard data load error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="animate-spin text-[#7c7fff]" size={40} />
      </div>
    );
  }

  // --- Dynamic Calculations ---
  const activeProjectsCount = projects.filter(p => p.status === 'Active' || p.status === 'Planning').length;
  const completedProjectsCount = projects.filter(p => p.status === 'Completed').length;
  const pendingTasks = tasks.filter(t => t.status !== 'Done');
  const overdueTasksCount = pendingTasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date()).length;

  const criticalDeadlines = pendingTasks
    .filter(t => t.dueDate)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 3);

  // --- TEAM WORKLOAD CALCULATIONS ---
  const totalPending = pendingTasks.length || 1; 

  const getWorkload = (dept) => {
    const deptTasks = pendingTasks.filter(t => t.department === dept).length;
    return Math.round((deptTasks / totalPending) * 100);
  };

  const workloadData = [
    { name: 'Design', percent: getWorkload('Design') },
    { name: 'Frontend', percent: getWorkload('Frontend') },
    { name: 'Backend', percent: getWorkload('Backend') },
    { name: 'DevOps', percent: getWorkload('DevOps') }
  ];


  
  // 1. Status Data for Pie Chart
  const statusCounts = { 'To Do': 0, 'In Progress': 0, 'Done': 0 };
  tasks.forEach(t => {
    if (statusCounts[t.status] !== undefined) statusCounts[t.status]++;
  });
  
  const statusData = [
    { name: 'To Do', value: statusCounts['To Do'] },
    { name: 'In Progress', value: statusCounts['In Progress'] },
    { name: 'Done', value: statusCounts['Done'] }
  ];

  const STATUS_COLORS = ['#606479', '#f59e0b', '#10b981'];

  // 2. Priority Data for Bar Chart
  const priorityCounts = { 'Low': 0, 'Medium': 0, 'High': 0, 'Urgent': 0 };
  tasks.forEach(t => {
    if (priorityCounts[t.priority] !== undefined) priorityCounts[t.priority]++;
  });

  const priorityData = [
    { name: 'Low', count: priorityCounts['Low'], fill: '#3b82f6' },
    { name: 'Medium', count: priorityCounts['Medium'], fill: '#8b5cf6' },
    { name: 'High', count: priorityCounts['High'], fill: '#f97316' },
    { name: 'Urgent', count: priorityCounts['Urgent'], fill: '#ef4444' }
  ];

  return (
    <div className="flex flex-col gap-6 font-sans pb-8">
      
    {/* 1. TOP KPI CARDS BLOCK */}
      <div className="flex items-center justify-end w-full my-4">
  <Link
    to="/activity"
    className="flex items-center gap-2 px-4 py-2.5 bg-[#5a5fe0]/10 hover:bg-[#5a5fe0]/20 text-[#5a5fe0] hover:text-white text-sm font-medium rounded-lg border border-[#5a5fe0]/20 transition-all duration-200 shadow-sm"
  >
    <Activity size={18} />
    <span>View Activity History</span>
  </Link>
</div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#1a1c26] p-5 rounded-xl border border-white/5 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xs font-semibold text-[#84889c] tracking-widest uppercase">Total Revenue</h3>
            <div className="p-1.5 bg-[#7c7fff]/10 text-[#7c7fff] rounded-lg">
              <DollarSign size={16} />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-1">$1.2M</div>
          <div className="flex items-center gap-1 text-xs font-medium text-emerald-400">
            <ArrowUpRight size={14} />
            <span>+12.5% vs last month</span>
          </div>
        </div>

        <div className="bg-[#1a1c26] p-5 rounded-xl border border-white/5 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xs font-semibold text-[#84889c] tracking-widest uppercase">Total Projects</h3>
            <div className="p-1.5 bg-[#7c7fff]/10 text-[#7c7fff] rounded-lg">
              <Briefcase size={16} />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-1">{projects.length}</div>
          <div className="text-xs font-medium text-[#7c7fff]">
            {activeProjectsCount} Active, {completedProjectsCount} Completed
          </div>
        </div>

        <div className="bg-[#1a1c26] p-5 rounded-xl border border-white/5 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xs font-semibold text-[#84889c] tracking-widest uppercase">Pending Tasks</h3>
            <div className="p-1.5 bg-[#7c7fff]/10 text-[#7c7fff] rounded-lg">
              <CheckSquare size={16} />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-1">{pendingTasks.length}</div>
          <div className={`flex items-center gap-1 text-xs font-medium ${overdueTasksCount > 0 ? 'text-red-400' : 'text-amber-400'}`}>
            <AlertTriangle size={14} />
            <span>{overdueTasksCount} overdue</span>
          </div>
        </div>

        <div className="bg-[#1a1c26] p-5 rounded-xl border border-white/5 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xs font-semibold text-[#84889c] tracking-widest uppercase">Team Velocity</h3>
            <div className="p-1.5 bg-[#7c7fff]/10 text-[#7c7fff] rounded-lg">
              <Activity size={16} />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-1">94%</div>
          <div className="text-xs font-medium text-[#84889c]">
            Optimal efficiency
          </div>
        </div>
      </div>

      {/* 2. ANALYTICS CHARTS BLOCK (NEW) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Task Status Pie Chart */}
        <div className="bg-[#1a1c26] rounded-xl border border-white/5 shadow-sm p-6 h-[320px] flex flex-col">
          <h2 className="text-lg font-bold text-white mb-4">Task Status Distribution</h2>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#2a2d3e', borderColor: '#4b4e63', color: '#fff', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle"/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Task Priority Bar Chart */}
        <div className="bg-[#1a1c26] rounded-xl border border-white/5 shadow-sm p-6 h-[320px] flex flex-col">
          <h2 className="text-lg font-bold text-white mb-4">Tasks by Priority</h2>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#84889c" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#84889c" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip 
                  cursor={{ fill: '#2a2d3e' }} 
                  contentStyle={{ backgroundColor: '#2a2d3e', borderColor: '#4b4e63', color: '#fff', borderRadius: '8px' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* 3. MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* PROJECT PORTFOLIO BLOCK */}
          <div className="bg-[#1a1c26] rounded-xl border border-white/5 shadow-sm flex flex-col">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <h2 className="text-lg font-bold text-white">Recent Projects</h2>
            </div>
            <div className="p-0 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="px-6 py-4 text-xs font-semibold text-[#84889c] uppercase tracking-wider">Project Name</th>
                    <th className="px-6 py-4 text-xs font-semibold text-[#84889c] uppercase tracking-wider">Date Created</th>
                    <th className="px-6 py-4 text-xs font-semibold text-[#84889c] uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-semibold text-[#84889c] uppercase tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {projects.length === 0 ? (
                    <tr><td colSpan="4" className="px-6 py-8 text-center text-[#84889c] text-sm">No projects found.</td></tr>
                  ) : (
                    projects.slice(0, 5).map((project) => (
                      <tr key={project._id} className="hover:bg-white/[0.02] transition">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-[#7c7fff]/10 text-[#7c7fff] rounded-lg"><FolderKanban size={16} /></div>
                            <span className="font-semibold text-sm text-white truncate max-w-[200px]">{project.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-[#a0a4b8]">{new Date(project.createdAt).toLocaleDateString()}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border ${
                            project.status === 'Active' ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' :
                            project.status === 'Completed' ? 'border-blue-500/30 text-blue-400 bg-blue-500/10' :
                            'border-amber-500/30 text-amber-500 bg-amber-500/10'
                          }`}>{project.status}</span>
                        </td>
                        <td className="px-6 py-4 text-right"><button className="text-[#606479] hover:text-white transition"><MoreVertical size={16} /></button></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* DYNAMIC: TEAM WORKLOAD BLOCK */}
          <div className="bg-[#1a1c26] rounded-xl border border-white/5 shadow-sm p-6">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-lg font-bold text-white">Team Workload</h2>
                <p className="text-xs text-[#84889c] mt-1">Real-time task allocation across core teams.</p>
              </div>
            </div>
            <div className="flex flex-col gap-5">
              {workloadData.map((dept) => (
                <div key={dept.name} className="flex items-center gap-4">
                  <span className="w-20 text-sm font-medium text-white">{dept.name}</span>
                  <div className="flex-1 h-6 bg-[#121218] rounded-md overflow-hidden flex border border-white/5 relative">
                    <div 
                      className="bg-[#7c7fff] h-full flex items-center px-2 text-[10px] font-bold text-[#121218] transition-all duration-500 ease-in-out" 
                      style={{ width: `${dept.percent}%` }}
                    >
                      {dept.percent > 0 ? `${dept.percent}%` : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          
          {/* CRITICAL DEADLINES BLOCK */}
          <div className="bg-[#1a1c26] rounded-xl border border-white/5 shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-white">Critical Deadlines</h2>
              <div className="w-6 h-6 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center"><AlertCircle size={14} /></div>
            </div>
            <div className="flex flex-col gap-4">
              {criticalDeadlines.length === 0 ? (
                <div className="text-sm text-[#84889c] text-center py-4">No upcoming deadlines!</div>
              ) : (
                criticalDeadlines.map(task => {
                  const isOverdue = new Date(task.dueDate) < new Date();
                  return (
                    <div key={task._id} className={`bg-[#121218] border ${isOverdue ? 'border-red-500/20' : 'border-white/5'} rounded-xl p-4 relative overflow-hidden`}>
                      {isOverdue && <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>}
                      <div className="flex justify-between items-center mb-3">
                        <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded ${
                          task.priority === 'Urgent' ? 'bg-red-500 text-white' : 
                          task.priority === 'High' ? 'bg-amber-500/20 text-amber-500' : 'bg-white/5 text-[#a0a4b8]'
                        }`}>{task.priority}</span>
                        <span className={`text-xs font-semibold ${isOverdue ? 'text-red-400' : 'text-[#a0a4b8]'}`}>
                          {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white mb-2">{task.title}</h4>
                      <div className="flex items-center gap-2 text-xs text-[#a0a4b8] font-medium">
                        <Clock size={14} />
                        <span className="capitalize">{task.status}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* SYSTEM HEALTH BLOCK */}
          <div className="bg-[#1a1c26] rounded-xl border border-white/5 shadow-sm p-6 relative overflow-hidden">
            <h2 className="text-lg font-bold text-white mb-1 relative z-10">System Health</h2>
            <p className="text-xs text-[#84889c] mb-6 relative z-10">Real-time node performance monitor</p>
            <div className="flex items-end justify-between relative z-10">
              <div>
                <div className="text-4xl font-bold text-white tracking-tight">99.9%</div>
                <div className="text-[10px] font-semibold text-[#7c7fff] uppercase tracking-widest mt-1">Uptime maintained</div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;