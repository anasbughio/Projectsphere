import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Loader2, Briefcase, CheckCircle, Clock, Activity, User, RefreshCw, MessageSquare, FileText } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useToast } from '../components/ToastProvider'; // Toast integration

const ClientDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false); // NEW: Refresh state
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    completedTasks: 0,
    totalTasks: 0
  });
  const [chartData, setChartData] = useState([]);
  const [activities, setActivities] = useState([]);
  
  const toast = useToast();
  
  // NEW: Get user for personalized greeting
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const firstName = storedUser?.name ? storedUser.name.split(' ')[0] : '';

  const fetchDashboardData = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setIsRefreshing(true);
      else setLoading(true);
      
      // Fetch Projects
      const projectsRes = await api.get('/projects');
      const projects = Array.isArray(projectsRes.data) ? projectsRes.data : (projectsRes.data.data || []);

      // Fetch Tasks
      let allTasks = [];
      for (const proj of projects) {
        try {
          const taskRes = await api.get(`/tasks/project/${proj._id}`);
          const projTasks = Array.isArray(taskRes.data) ? taskRes.data : (taskRes.data.data || []);
          allTasks = [...allTasks, ...projTasks];
        } catch (err) {
          console.error(`Failed to fetch tasks for project ${proj._id}`);
        }
      }

      // Stats Calculate
      const activeProj = projects.filter(p => p.status !== 'Completed' && p.status !== 'Done').length;
      const completedT = allTasks.filter(t => t.status === 'Done' || t.status === 'Completed').length;
      const inProgressT = allTasks.filter(t => t.status === 'In Progress').length;
      const pendingT = allTasks.length - (completedT + inProgressT);

      setStats({
        totalProjects: projects.length,
        activeProjects: activeProj,
        completedTasks: completedT,
        totalTasks: allTasks.length
      });

      // Chart Data
      setChartData([
        { name: 'Completed', value: completedT, color: '#10b981' }, 
        { name: 'In Progress', value: inProgressT, color: '#f59e0b' }, 
        { name: 'Pending', value: pendingT, color: '#606479' }
      ]);

      // Fetch Recent Activities from Backend
      const activityRes = await api.get('/activities/recent');
      const activityData = Array.isArray(activityRes.data) ? activityRes.data : (activityRes.data.data || []);
      setActivities(activityData);

      if (isManualRefresh) toast.push("Dashboard updated successfully", { type: 'success' });

    } catch (error) {
      console.error("Error fetching client dashboard data:", error);
      toast.push("Failed to load dashboard data.", { type: 'error' });
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Time format helper function
  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  // NEW: Smart Icon Picker for Activity Timeline
  const getActivityIcon = (action = '') => {
    const lowerAction = action.toLowerCase();
    if (lowerAction.includes('comment') || lowerAction.includes('feedback')) {
      return { icon: MessageSquare, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' };
    }
    if (lowerAction.includes('complete') || lowerAction.includes('approve') || lowerAction.includes('done')) {
      return { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' };
    }
    if (lowerAction.includes('upload') || lowerAction.includes('file')) {
      return { icon: FileText, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' };
    }
    return { icon: User, color: 'text-[#7c7fff]', bg: 'bg-[#7c7fff]/10 border-[#7c7fff]/20' };
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-80px)] items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-[#7c7fff]" size={40} />
      </div>
    );
  }

  const overallProgress = stats.totalTasks === 0 
    ? 0 
    : Math.round((stats.completedTasks / stats.totalTasks) * 100);

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back{firstName ? `, ${firstName}` : ''}!</h1>
          <p className="text-gray-400">Here is a quick overview of your workspace and overall progress.</p>
        </div>
        
        {/* NEW: Refresh Button */}
        <button 
          onClick={() => fetchDashboardData(true)}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1a1c26] border border-white/10 text-gray-300 hover:text-white hover:bg-white/5 transition-all shadow-sm disabled:opacity-50"
        >
          <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
          {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#1a1c26] p-6 rounded-2xl border border-white/5 shadow-lg group hover:border-white/10 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-[#7c7fff]/10 p-3 rounded-xl text-[#7c7fff] group-hover:scale-110 transition-transform"><Briefcase size={24}/></div>
          </div>
          <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider">Total Projects</h3>
          <p className="text-3xl font-bold text-white mt-1">{stats.totalProjects}</p>
        </div>

        <div className="bg-[#1a1c26] p-6 rounded-2xl border border-white/5 shadow-lg group hover:border-white/10 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-[#10b981]/10 p-3 rounded-xl text-[#10b981] group-hover:scale-110 transition-transform"><Activity size={24}/></div>
          </div>
          <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider">Active Projects</h3>
          <p className="text-3xl font-bold text-white mt-1">{stats.activeProjects}</p>
        </div>

        <div className="bg-[#1a1c26] p-6 rounded-2xl border border-white/5 shadow-lg group hover:border-white/10 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-[#f59e0b]/10 p-3 rounded-xl text-[#f59e0b] group-hover:scale-110 transition-transform"><Clock size={24}/></div>
          </div>
          <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider">Deliverables in Progress</h3>
          <p className="text-3xl font-bold text-white mt-1">{stats.totalTasks - stats.completedTasks}</p>
        </div>

        <div className="bg-[#1a1c26] p-6 rounded-2xl border border-white/5 shadow-lg group hover:border-white/10 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-[#7c7fff]/10 p-3 rounded-xl text-[#7c7fff] group-hover:scale-110 transition-transform"><CheckCircle size={24}/></div>
          </div>
          <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider">Overall Completion</h3>
          <p className="text-3xl font-bold text-white mt-1">{overallProgress}%</p>
        </div>
      </div>

      {/* Chart & Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Task Status Breakdown Chart */}
        <div className="bg-[#1a1c26] p-6 rounded-2xl border border-white/5 shadow-lg">
          <h2 className="text-lg font-bold text-white mb-6">Task Status Breakdown</h2>
          {stats.totalTasks === 0 ? (
            <div className="h-[300px] flex flex-col items-center justify-center text-gray-500 border border-white/5 rounded-xl border-dashed bg-white/[0.02]">
              <PieChart size={40} className="mb-3 opacity-20" />
              No tasks available to generate chart.
            </div>
          ) : (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1a1c26', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)' }}
                    itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
        
        {/* Updated Recent Activity Section */}
        <div className="bg-[#1a1c26] p-6 rounded-2xl border border-white/5 shadow-lg flex flex-col h-[400px]">
          <h2 className="text-lg font-bold text-white mb-6">Recent Activity</h2>
          
          {activities.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="bg-white/5 p-4 rounded-full mb-4">
                <Activity className="text-gray-400" size={32} />
              </div>
              <p className="text-gray-400 text-sm max-w-sm leading-relaxed">
                Activity stream will appear here. Track real-time updates and comments from the project team.
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto pr-4 space-y-6 custom-scrollbar">
              {activities.map((log) => {
                const IconDetails = getActivityIcon(log.action);
                const IconComponent = IconDetails.icon;

                return (
                  <div key={log._id} className="flex gap-4 items-start relative group">
                    {/* Timeline Line */}
                    <div className="absolute left-[15px] top-8 bottom-[-24px] w-[2px] bg-white/5 group-last:hidden"></div>
                    
                    {/* Dynamic Avatar/Icon */}
                    <div className={`relative z-10 border p-2 rounded-full shrink-0 shadow-sm ${IconDetails.bg} ${IconDetails.color}`}>
                      <IconComponent size={14} />
                    </div>
                    
                    {/* Activity Details */}
                    <div className="flex-1 mt-0.5">
                      <p className="text-sm text-gray-200">
                        <span className="font-bold text-white">{log.user?.name || 'Team Member'}</span> {log.action}
                      </p>
                      {log.details && (
                        <p className="text-xs text-gray-400 mt-1 line-clamp-1 bg-[#121218] p-2 rounded-lg border border-white/5 inline-block w-full">
                          {log.details}
                        </p>
                      )}
                      <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mt-1.5 block">
                        {formatTimeAgo(log.createdAt)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { height: 6px; width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
      `}} />
    </div>
  );
};

export default ClientDashboard;