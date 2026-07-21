import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Loader2, Briefcase, CheckCircle, Clock, Activity } from 'lucide-react';
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

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // 1. Projects aur Tasks fetch karein (Backend RBAC khud hi sirf is client ka data dega)
        const [projectsRes, tasksRes] = await Promise.all([
          api.get('/projects'),
          api.get('/tasks') // Assuming yeh route client ke tamam tasks return karta hai
        ]);

        const projects = Array.isArray(projectsRes.data) ? projectsRes.data : (projectsRes.data.data || []);
        const tasks = Array.isArray(tasksRes.data) ? tasksRes.data : (tasksRes.data.data || []);

        // 2. Stats Calculate Karein
        const activeProj = projects.filter(p => p.status !== 'Completed' && p.status !== 'Done').length;
        const completedT = tasks.filter(t => t.status === 'Done' || t.status === 'Completed').length;
        const inProgressT = tasks.filter(t => t.status === 'In Progress').length;
        const pendingT = tasks.length - (completedT + inProgressT);

        setStats({
          totalProjects: projects.length,
          activeProjects: activeProj,
          completedTasks: completedT,
          totalTasks: tasks.length
        });

        // 3. Chart Data Prepare Karein
        setChartData([
          { name: 'Completed', value: completedT, color: '#10b981' }, // Emerald
          { name: 'In Progress', value: inProgressT, color: '#f59e0b' }, // Amber
          { name: 'Pending', value: pendingT, color: '#606479' }  // Gray
        ]);

      } catch (error) {
        console.error("Error fetching client dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-80px)] items-center justify-center">
        <Loader2 className="animate-spin text-[#7c7fff]" size={40} />
      </div>
    );
  }

  // overall progress percentage
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

      {/* Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
        
        {/* Placeholder for future widgets (e.g. Recent Activity or Approvals) */}
        <div className="bg-[#1a1c26] p-6 rounded-2xl border border-white/5 shadow-lg flex flex-col items-center justify-center text-center">
          <div className="bg-white/5 p-4 rounded-full mb-4">
            <Activity className="text-gray-400" size={32} />
          </div>
          <h2 className="text-lg font-bold text-white mb-2">Recent Activity</h2>
          <p className="text-gray-400 text-sm max-w-sm">
            Activity stream will appear here. Track real-time updates and comments from the project team.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;