import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Loader2, Briefcase, CheckCircle, Clock, Activity, User } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const ClientDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    completedTasks: 0,
    totalTasks: 0
  });
  const [chartData, setChartData] = useState([]);
  // 1. Nayi State Recent Activities ke liye
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
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

        // 2. Fetch Recent Activities from Backend
        try {
          const activityRes = await api.get('/activities/recent');
          const activityData = Array.isArray(activityRes.data) ? activityRes.data : (activityRes.data.data || []);
          setActivities(activityData);
        } catch (err) {
          console.error("Error fetching activities", err);
        }

      } catch (error) {
        console.error("Error fetching client dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Time format helper function (e.g., "2 hours ago")
  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-80px)] items-center justify-center">
        <Loader2 className="animate-spin text-[#7c7fff]" size={40} />
      </div>
    );
  }

  const overallProgress = stats.totalTasks === 0 
    ? 0 
    : Math.round((stats.completedTasks / stats.totalTasks) * 100);

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Welcome Back!</h1>
        <p className="text-gray-400">Here is a quick overview of your workspace and overall progress.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#1a1c26] p-6 rounded-2xl border border-white/5 shadow-lg">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-[#7c7fff]/10 p-3 rounded-xl text-[#7c7fff]"><Briefcase size={24}/></div>
          </div>
          <h3 className="text-gray-400 text-sm font-medium">Total Projects</h3>
          <p className="text-3xl font-bold text-white mt-1">{stats.totalProjects}</p>
        </div>

        <div className="bg-[#1a1c26] p-6 rounded-2xl border border-white/5 shadow-lg">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-[#10b981]/10 p-3 rounded-xl text-[#10b981]"><Activity size={24}/></div>
          </div>
          <h3 className="text-gray-400 text-sm font-medium">Active Projects</h3>
          <p className="text-3xl font-bold text-white mt-1">{stats.activeProjects}</p>
        </div>

        <div className="bg-[#1a1c26] p-6 rounded-2xl border border-white/5 shadow-lg">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-[#f59e0b]/10 p-3 rounded-xl text-[#f59e0b]"><Clock size={24}/></div>
          </div>
          <h3 className="text-gray-400 text-sm font-medium">Deliverables in Progress</h3>
          <p className="text-3xl font-bold text-white mt-1">{stats.totalTasks - stats.completedTasks}</p>
        </div>

        <div className="bg-[#1a1c26] p-6 rounded-2xl border border-white/5 shadow-lg">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-[#7c7fff]/10 p-3 rounded-xl text-[#7c7fff]"><CheckCircle size={24}/></div>
          </div>
          <h3 className="text-gray-400 text-sm font-medium">Overall Completion</h3>
          <p className="text-3xl font-bold text-white mt-1">{overallProgress}%</p>
        </div>
      </div>

      {/* Chart & Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Task Status Breakdown Chart */}
        <div className="bg-[#1a1c26] p-6 rounded-2xl border border-white/5 shadow-lg">
          <h2 className="text-lg font-bold text-white mb-6">Task Status Breakdown</h2>
          {stats.totalTasks === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
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
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1a1c26', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
        
        {/* 🔥 3. Updated Recent Activity Section */}
        <div className="bg-[#1a1c26] p-6 rounded-2xl border border-white/5 shadow-lg flex flex-col">
          <h2 className="text-lg font-bold text-white mb-6">Recent Activity</h2>
          
          {activities.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="bg-white/5 p-4 rounded-full mb-4">
                <Activity className="text-gray-400" size={32} />
              </div>
              <p className="text-gray-400 text-sm max-w-sm">
                Activity stream will appear here. Track real-time updates and comments from the project team.
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto pr-2 space-y-5 custom-scrollbar max-h-[300px]">
              {activities.map((log) => (
                <div key={log._id} className="flex gap-4 items-start relative">
                  {/* Timeline Line */}
                  <div className="absolute left-[15px] top-8 bottom-[-20px] w-[2px] bg-white/5"></div>
                  
                  {/* Avatar/Icon */}
                  <div className="relative z-10 bg-[#232530] border border-white/10 p-2 rounded-full text-[#7c7fff] shrink-0">
                    <User size={14} />
                  </div>
                  
                  {/* Activity Details */}
                  <div>
                    <p className="text-sm text-gray-200">
                      <span className="font-semibold text-white">{log.user?.name || 'Team Member'}</span> {log.action}
                    </p>
                    {log.details && (
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{log.details}</p>
                    )}
                    <span className="text-[10px] text-gray-500 font-medium mt-1 block">
                      {formatTimeAgo(log.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
};

export default ClientDashboard;