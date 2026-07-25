import React, { useState, useEffect } from 'react';
import { 
  Briefcase, CheckSquare, Activity, 
  MoreVertical, Calendar, Clock, AlertCircle, 
  ArrowUpRight, AlertTriangle, Loader2, FolderKanban, Mail, CheckCircle, Users, Download
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import api from '../services/api';
import { Link } from 'react-router-dom';
import MilestoneProgressCard from '../components/MilestoneProgressCard';
import BurndownChartCard from '../components/BurndownChartCard';
import { downloadCSV } from '../utils/exportUtils';

const Dashboard = () => {
  // Get data from local storage
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  
  // 👉 1. Determine User Roles dynamically
  const userRole = user?.role?.toLowerCase() || '';
  const isSuperAdmin = userRole === 'super admin';
  // Check if user is higher management
  const isManagerOrAdmin = ['org admin', 'organization admin', 'admin', 'project manager'].includes(userRole);
  // If not super admin and not manager, they are a team member
  const isTeamMember = !isSuperAdmin && !isManagerOrAdmin; 

  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [teamCount, setTeamCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalOrgs: 0, totalUsers: 0, totalProjects: 0 }); 

  const [isGenerating, setIsGenerating] = useState(false);
  const [reportStatus, setReportStatus] = useState(null);
  const [projectMilestones, setProjectMilestones] = useState([]);

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    setReportStatus(null);
    try {
      const res = await api.post('/reports/weekly');
      const userEmail = user?.email || 'your email';
      setReportStatus({ type: 'success', text: `Report requested — it will be sent to ${userEmail} shortly.` });
      setTimeout(() => setReportStatus(null), 3000);
    } catch (error) {
      console.error('Report generation error:', error);
      setReportStatus({ type: 'error', text: 'Failed to send report.' });
      setTimeout(() => setReportStatus(null), 3000);
    } finally {
      setIsGenerating(false);
    }
  };

  const fetchMilestones = async (projectId) => {
    const res = await api.get(`/milestones/project/${projectId}`);
    setProjectMilestones(res.data);
  };
 
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        if (isSuperAdmin) {
          const res = await api.get('/dashboard/platform-stats'); 
          setProjects(res.data.projects || []); 
          setTasks(res.data.tasks || []);
          setTeamCount(res.data.usersCount || 0);
        } else {
          // Normal Admin/Member data fetching
          const [projectRes, taskRes, teamRes] = await Promise.all([
            api.get('/projects'),
            api.get('/tasks/all'),
            api.get('/team')
          ]);

          let fetchedTasks = taskRes.data;
          let fetchedProjects = projectRes.data;

          // 👉 2. Filter data for Team Members
          if (isTeamMember) {
            // Sirf wahi tasks dikhayen jo is user ko assign kiye gaye hain
            fetchedTasks = fetchedTasks.filter(task => 
              task.assignedTo === user?._id || 
              task.assignee === user?._id || 
              (task.assignees && task.assignees.includes(user?._id))
            );

            // (Optional) Sirf unhi projects ko dikhayen jinme user ke tasks hain
            const myProjectIds = fetchedTasks.map(t => t.projectId || t.project);
            fetchedProjects = fetchedProjects.filter(p => myProjectIds.includes(p._id));
          }

          setProjects(fetchedProjects);
          setTasks(fetchedTasks);
          setTeamCount(teamRes.data.length);
        }
      } catch (error) {
        console.error('Dashboard error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [isSuperAdmin, isTeamMember, user?._id]);

  if (loading) {
    return (
      <div className="h-full min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-[#7c7fff]" size={40} />
      </div>
    );
  }

  const handleExportReport = () => {
    // clean data and format
    const formattedData = tasks.map(task => ({
      Task_Title: task.title,
      Status: task.status,
      Priority: task.priority,
      Department: task.department,
      Created_Date: new Date(task.createdAt).toLocaleDateString(),
      Due_Date: task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No Due Date',
    }));

    // Trigger CSV download
    downloadCSV(formattedData, `${isTeamMember ? 'My' : 'Workspace'}_Tasks_Report`);
  };

  // Projects Calculations
  const activeProjectsCount = projects.filter(p => p.status === 'Active' || p.status === 'Planning').length;
  const completedProjectsCount = projects.filter(p => p.status === 'Completed').length;
  
  // Tasks Calculations (Automatically based on filtered user tasks!)
  const totalTasks = tasks.length;
  const pendingTasks = tasks.filter(t => t.status !== 'Done');
  const completedTasks = tasks.filter(t => t.status === 'Done');
  const overdueTasksCount = pendingTasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date()).length;

  // Velocity = (Completed Tasks / Total Tasks) * 100
  const teamVelocity = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;

  // Workspace Health
  const workspaceHealth = totalTasks === 0 ? 100 : Math.max(0, Math.round(100 - ((overdueTasksCount / totalTasks) * 100)));

  // Critical Deadlines (Sort by closest due date)
  const criticalDeadlines = pendingTasks
    .filter(t => t.dueDate)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 3);

  // Team Workload Calculations
  const totalPendingForWorkload = pendingTasks.length || 1; 
  const getWorkload = (dept) => {
    const deptTasks = pendingTasks.filter(t => t.department === dept).length;
    return Math.round((deptTasks / totalPendingForWorkload) * 100);
  };
  const workloadData = [
    { name: 'Design', percent: getWorkload('Design') },
    { name: 'Frontend', percent: getWorkload('Frontend') },
    { name: 'Backend', percent: getWorkload('Backend') },
    { name: 'DevOps', percent: getWorkload('DevOps') }
  ];

  // Pie Chart Data (Status)
  const statusCounts = { 'To Do': 0, 'In Progress': 0, 'Done': 0 };
  tasks.forEach(t => { if (statusCounts[t.status] !== undefined) statusCounts[t.status]++; });
  const statusData = [
    { name: 'To Do', value: statusCounts['To Do'] },
    { name: 'In Progress', value: statusCounts['In Progress'] },
    { name: 'Done', value: statusCounts['Done'] }
  ];
  const STATUS_COLORS = ['#606479', '#f59e0b', '#10b981'];

  // Bar Chart Data (Priority)
  const priorityCounts = { 'Low': 0, 'Medium': 0, 'High': 0, 'Urgent': 0 };
  tasks.forEach(t => { if (priorityCounts[t.priority] !== undefined) priorityCounts[t.priority]++; });
  const priorityData = [
    { name: 'Low', count: priorityCounts['Low'], fill: '#3b82f6' },
    { name: 'Medium', count: priorityCounts['Medium'], fill: '#8b5cf6' },
    { name: 'High', count: priorityCounts['High'], fill: '#f97316' },
    { name: 'Urgent', count: priorityCounts['Urgent'], fill: '#ef4444' }
  ];

  return (
    <div className="flex flex-col gap-6 font-sans pb-8 px-4 sm:px-6 lg:px-8 max-w-full overflow-hidden">
      
      {reportStatus && (
        <div className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-lg shadow-lg border flex items-center gap-3 transition-all animate-in fade-in slide-in-from-top-5 ${
          reportStatus.type === 'success' ? 'bg-[#10b981]/10 border-[#10b981]/20 text-[#10b981]' : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          {reportStatus.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span className="font-medium text-sm">{reportStatus.text}</span>
        </div>
      )}

      {/* TOP ACTIONS */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 w-full my-4">
        {/* Only Org Admin & PMs should see the weekly report generation button ideally, but kept here if members can trigger it too */}
        <button
          onClick={handleGenerateReport}
          disabled={isGenerating}
          className="flex items-center justify-center gap-2 px-4 py-2.5 w-full sm:w-auto bg-gradient-to-r from-[#7c7fff] to-[#5a5fe0] hover:opacity-90 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-sm shadow-[#7c7fff]/20"
        >
          {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Mail size={18} />}
          <span>{isGenerating ? 'Sending...' : 'Generate Weekly Report'}</span>
        </button>
        <Link
          to="/activity"
          className="flex items-center justify-center gap-2 px-4 py-2.5 w-full sm:w-auto bg-[#5a5fe0]/10 hover:bg-[#5a5fe0]/20 text-[#5a5fe0] hover:text-white text-sm font-medium rounded-lg border border-[#5a5fe0]/20 transition-all duration-200 shadow-sm"
        >
          <Activity size={18} />
          <span>View Activity History</span>
        </Link>

        <div className="flex justify-between items-center mb-6">
        {/* EXPORT BUTTON */}
        <button 
          onClick={handleExportReport}
          className="flex items-center gap-2 bg-[#7c7fff] hover:bg-[#6a6dec] text-white px-4 py-2 rounded-lg transition-colors font-medium shadow-lg"
        >
          <Download size={18} />
          Export Report (CSV)
        </button>
      </div>
      </div>

      {/* KPI CARDS BLOCK */}
      {isSuperAdmin && stats ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-[#1a1c26] p-6 rounded-xl border border-white/5">
            <h3 className="text-[#84889c] uppercase text-xs">Total Organizations</h3>
            <div className="text-3xl font-bold text-white mt-2">{stats.totalOrgs || 0}</div>
          </div>
        </div>
      ) : isSuperAdmin ? (
        <div className="text-white">Loading stats...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#1a1c26] p-5 rounded-xl border border-white/5 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xs font-semibold text-[#84889c] tracking-widest uppercase">Total Team Members</h3>
              <div className="p-1.5 bg-[#7c7fff]/10 text-[#7c7fff] rounded-lg">
                <Users size={16} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-white mb-1">{teamCount}</div>
            <div className="flex items-center gap-1 text-xs font-medium text-[#7c7fff]">
              <span>Active in workspace</span>
            </div>
          </div>

          <div className="bg-[#1a1c26] p-5 rounded-xl border border-white/5 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xs font-semibold text-[#84889c] tracking-widest uppercase">{isTeamMember ? "My Projects" : "Total Projects"}</h3>
              <div className="p-1.5 bg-[#7c7fff]/10 text-[#7c7fff] rounded-lg">
                <Briefcase size={16} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-white mb-1">{projects.length}</div>
            <div className="text-xs font-medium text-[#7c7fff]">
              {activeProjectsCount} Active, {completedProjectsCount} Completed
            </div>
          </div>

          <div className="bg-[#1a1c26] p-5 rounded-xl border border-white/5 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xs font-semibold text-[#84889c] tracking-widest uppercase">{isTeamMember ? "My Pending Tasks" : "Pending Tasks"}</h3>
              <div className="p-1.5 bg-[#7c7fff]/10 text-[#7c7fff] rounded-lg">
                <CheckSquare size={16} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-white mb-1">{pendingTasks.length}</div>
            <div className={`flex items-center gap-1 text-xs font-medium ${overdueTasksCount > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
              {overdueTasksCount > 0 ? <AlertTriangle size={14} /> : <CheckCircle size={14} />}
              <span>{overdueTasksCount > 0 ? `${overdueTasksCount} overdue` : 'On track'}</span>
            </div>
          </div>

          <div className="bg-[#1a1c26] p-5 rounded-xl border border-white/5 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xs font-semibold text-[#84889c] tracking-widest uppercase">{isTeamMember ? "My Task Velocity" : "Team Velocity"}</h3>
              <div className="p-1.5 bg-[#7c7fff]/10 text-[#7c7fff] rounded-lg">
                <Activity size={16} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-white mb-1">{teamVelocity}%</div>
            <div className="text-xs font-medium text-[#84889c]">
              {teamVelocity >= 80 ? 'Optimal efficiency' : 'Needs attention'}
            </div>
          </div>
        </div>
      )}

      {/* ANALYTICS CHARTS BLOCK */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Task Status Pie Chart */}
        <div className="bg-[#1a1c26] rounded-xl border border-white/5 shadow-sm p-4 sm:p-6 h-[320px] flex flex-col">
          <h2 className="text-base sm:text-lg font-bold text-white mb-4">Task Status Distribution</h2>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
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
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Task Priority Bar Chart */}
        <div className="bg-[#1a1c26] rounded-xl border border-white/5 shadow-sm p-4 sm:p-6 h-[320px] flex flex-col">
          <h2 className="text-base sm:text-lg font-bold text-white mb-4">Tasks by Priority</h2>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#84889c" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#84889c" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip 
                  cursor={{ fill: '#2a2d3e' }} 
                  contentStyle={{ backgroundColor: '#2a2d3e', borderColor: '#4b4e63', color: '#fff', borderRadius: '8px' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={50}>
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <BurndownChartCard />
      </div>
      <div className="mt-8">
         <MilestoneProgressCard />
      </div>

      {/* MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 flex flex-col gap-4 sm:gap-6">
          
          {/* PROJECT PORTFOLIO BLOCK */}
          <div className="bg-[#1a1c26] rounded-xl border border-white/5 shadow-sm flex flex-col overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-white/5 flex justify-between items-center">
              <h2 className="text-base sm:text-lg font-bold text-white">{isTeamMember ? "My Active Projects" : "Recent Projects"}</h2>
            </div>
            <div className="p-0 overflow-x-auto w-full">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="px-4 sm:px-6 py-4 text-xs font-semibold text-[#84889c] uppercase tracking-wider">Project Name</th>
                    <th className="px-4 sm:px-6 py-4 text-xs font-semibold text-[#84889c] uppercase tracking-wider">Date Created</th>
                    <th className="px-4 sm:px-6 py-4 text-xs font-semibold text-[#84889c] uppercase tracking-wider">Status</th>
                    <th className="px-4 sm:px-6 py-4 text-xs font-semibold text-[#84889c] uppercase tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {projects.length === 0 ? (
                    <tr><td colSpan="4" className="px-6 py-8 text-center text-[#84889c] text-sm">No projects found.</td></tr>
                  ) : (
                    projects.slice(0, 5).map((project) => (
                      <tr key={project._id} className="hover:bg-white/[0.02] transition">
                        <td className="px-4 sm:px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-[#7c7fff]/10 text-[#7c7fff] rounded-lg hidden sm:block"><FolderKanban size={16} /></div>
                            <span className="font-semibold text-xs sm:text-sm text-white truncate max-w-[120px] sm:max-w-[200px]">{project.name}</span>
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-xs sm:text-sm text-[#a0a4b8] whitespace-nowrap">{new Date(project.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 sm:px-2.5 py-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider rounded-full border ${
                            project.status === 'Active' ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' :
                            project.status === 'Completed' ? 'border-blue-500/30 text-blue-400 bg-blue-500/10' :
                            'border-amber-500/30 text-amber-500 bg-amber-500/10'
                          }`}>{project.status}</span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-right">
                          <button className="text-[#606479] hover:text-white transition"><MoreVertical size={16} /></button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* DYNAMIC: TEAM WORKLOAD BLOCK */}
          {!isTeamMember && ( // Team Members don't usually need to see entire department workload
            <div className="bg-[#1a1c26] rounded-xl border border-white/5 shadow-sm p-4 sm:p-6">
              <div className="flex justify-between items-start mb-6 sm:mb-8">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white">Team Workload</h2>
                  <p className="text-[10px] sm:text-xs text-[#84889c] mt-1">Real-time task allocation across core teams.</p>
                </div>
              </div>
              <div className="flex flex-col gap-4 sm:gap-5">
                {workloadData.map((dept) => (
                  <div key={dept.name} className="flex items-center gap-3 sm:gap-4">
                    <span className="w-16 sm:w-20 text-xs sm:text-sm font-medium text-white truncate">{dept.name}</span>
                    <div className="flex-1 h-5 sm:h-6 bg-[#121218] rounded-md overflow-hidden flex border border-white/5 relative">
                      <div 
                        className="bg-[#7c7fff] h-full flex items-center px-2 text-[9px] sm:text-[10px] font-bold text-[#121218] transition-all duration-500 ease-in-out" 
                        style={{ width: `${dept.percent}%` }}
                      >
                        {dept.percent > 0 ? `${dept.percent}%` : ''}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4 sm:gap-6">
          
          {/* CRITICAL DEADLINES BLOCK */}
          <div className="bg-[#1a1c26] rounded-xl border border-white/5 shadow-sm p-4 sm:p-6">
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <h2 className="text-base sm:text-lg font-bold text-white">{isTeamMember ? "My Critical Deadlines" : "Critical Deadlines"}</h2>
              <div className="w-6 h-6 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center"><AlertCircle size={14} /></div>
            </div>
            <div className="flex flex-col gap-3 sm:gap-4">
              {criticalDeadlines.length === 0 ? (
                <div className="text-sm text-[#84889c] text-center py-4">No upcoming deadlines!</div>
              ) : (
                criticalDeadlines.map(task => {
                  const isOverdue = new Date(task.dueDate) < new Date();
                  return (
                    <div key={task._id} className={`bg-[#121218] border ${isOverdue ? 'border-red-500/20' : 'border-white/5'} rounded-xl p-3 sm:p-4 relative overflow-hidden`}>
                      {isOverdue && <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>}
                      <div className="flex justify-between items-center mb-2 sm:mb-3">
                        <span className={`px-2 py-0.5 text-[8px] sm:text-[9px] font-bold uppercase tracking-wider rounded ${
                          task.priority === 'Urgent' ? 'bg-red-500 text-white' : 
                          task.priority === 'High' ? 'bg-amber-500/20 text-amber-500' : 'bg-white/5 text-[#a0a4b8]'
                        }`}>{task.priority}</span>
                        <span className={`text-[10px] sm:text-xs font-semibold ${isOverdue ? 'text-red-400' : 'text-[#a0a4b8]'}`}>
                          {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-white mb-2 line-clamp-1">{task.title}</h4>
                      <div className="flex items-center gap-2 text-[10px] sm:text-xs text-[#a0a4b8] font-medium">
                        <Clock size={12} className="sm:w-3.5 sm:h-3.5" />
                        <span className="capitalize">{task.status}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* WORKSPACE/PERSONAL HEALTH */}
          <div className="bg-[#1a1c26] rounded-xl border border-white/5 shadow-sm p-4 sm:p-6 relative overflow-hidden">
            <h2 className="text-base sm:text-lg font-bold text-white mb-1 relative z-10">{isTeamMember ? "Personal Health Score" : "Workspace Health"}</h2>
            <p className="text-[10px] sm:text-xs text-[#84889c] mb-4 sm:mb-6 relative z-10">Based on on-time task completion</p>
            <div className="flex items-end justify-between relative z-10">
              <div>
                <div className={`text-3xl sm:text-4xl font-bold tracking-tight ${workspaceHealth > 80 ? 'text-emerald-400' : workspaceHealth > 50 ? 'text-amber-400' : 'text-red-400'}`}>
                  {workspaceHealth}%
                </div>
                <div className="text-[9px] sm:text-[10px] font-semibold text-[#7c7fff] uppercase tracking-widest mt-1">
                  {workspaceHealth === 100 ? 'Perfect Standing' : overdueTasksCount > 0 ? `${overdueTasksCount} Tasks Impacting Health` : 'Maintaining'}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;