import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from './ToastProvider';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid } from 'recharts';
import { Users, Loader2, AlertTriangle, Briefcase, Activity } from 'lucide-react';

const TeamWorkload = () => {
  const [workload, setWorkload] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    fetchWorkload();
  }, []);

  const fetchWorkload = async () => {
    try {
      const response = await api.get('/workload');
      setWorkload(response.data);
    } catch (error) {
      toast.push('Failed to load workload data.', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-[#7c7fff]" size={40} /></div>;
  }

  const overloadedCount = workload.filter(w => w.isOverloaded).length;
  const totalTasks = workload.reduce((acc, curr) => acc + curr.taskCount, 0);

  // Custom Tooltip for the Recharts BarChart
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#2a2d3e] border border-white/10 p-3 rounded-lg shadow-xl text-sm">
          <p className="font-bold text-white mb-1">{data.name}</p>
          <p className="text-[#84889c]">Active Tasks: <span className="text-white">{data.taskCount}</span></p>
          <p className="text-[#84889c]">Est. Hours: <span className={data.isOverloaded ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>{data.estimatedHours}h</span></p>
          <p className="text-[#84889c] text-xs mt-1 border-t border-white/10 pt-1">Capacity: 40h/week</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="text-[#7c7fff]" /> Team Workload & Capacity
          </h2>
          <p className="text-[#84889c] text-sm mt-1">Monitor bandwidth and prevent team burnout.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-[#1a1c26] border border-white/5 p-6 rounded-2xl flex items-center gap-4 shadow-lg">
          <div className="bg-[#7c7fff]/10 p-3 rounded-xl"><Users className="text-[#7c7fff]" size={24} /></div>
          <div>
            <p className="text-xs text-[#84889c] font-bold uppercase tracking-wider">Total Team</p>
            <p className="text-2xl font-extrabold text-white">{workload.length}</p>
          </div>
        </div>
        <div className="bg-[#1a1c26] border border-white/5 p-6 rounded-2xl flex items-center gap-4 shadow-lg">
          <div className="bg-emerald-500/10 p-3 rounded-xl"><Briefcase className="text-emerald-400" size={24} /></div>
          <div>
            <p className="text-xs text-[#84889c] font-bold uppercase tracking-wider">Active Tasks</p>
            <p className="text-2xl font-extrabold text-white">{totalTasks}</p>
          </div>
        </div>
        <div className="bg-[#1a1c26] border border-white/5 p-6 rounded-2xl flex items-center gap-4 shadow-lg">
          <div className="bg-red-500/10 p-3 rounded-xl"><AlertTriangle className="text-red-400" size={24} /></div>
          <div>
            <p className="text-xs text-[#84889c] font-bold uppercase tracking-wider">Overloaded Members</p>
            <p className="text-2xl font-extrabold text-white">{overloadedCount}</p>
          </div>
        </div>
      </div>

      {/* Capacity Chart */}
      <div className="bg-[#1a1c26] border border-white/5 p-6 rounded-2xl shadow-xl">
        <h3 className="text-white font-bold mb-6 flex items-center gap-2">
          <Activity size={18} className="text-[#7c7fff]" /> Capacity Overview (Est. Hours)
        </h3>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={workload} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3e" vertical={false} />
              <XAxis dataKey="name" stroke="#84889c" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#84889c" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#2a2d3e', opacity: 0.4 }} />
              <ReferenceLine y={40} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'top', value: '40h Max Capacity', fill: '#ef4444', fontSize: 12 }} />
              
              <Bar 
                dataKey="estimatedHours" 
                radius={[4, 4, 0, 0]} 
                barSize={40}
              >
                {workload.map((entry, index) => (
                  <cell key={`cell-${index}`} fill={entry.isOverloaded ? '#ef4444' : '#7c7fff'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-[#1a1c26] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#121218] border-b border-white/5 text-xs uppercase tracking-wider text-[#84889c]">
                <th className="p-4 font-semibold">Team Member</th>
                <th className="p-4 font-semibold">Role</th>
                <th className="p-4 font-semibold">Active Tasks</th>
                <th className="p-4 font-semibold text-right">Bandwidth Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {workload.map((member) => (
                <tr key={member.userId} className="hover:bg-white/5 transition-colors">
                  <td className="p-4 font-medium text-white flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#2a2d3e] border border-white/10 flex items-center justify-center text-xs font-bold text-[#7c7fff]">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    {member.name}
                  </td>
                  <td className="p-4 text-gray-400 capitalize">{member.role}</td>
                  <td className="p-4 text-white font-bold">{member.taskCount}</td>
                  <td className="p-4 text-right">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                      member.isOverloaded 
                        ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}>
                      {member.isOverloaded ? <AlertTriangle size={12} /> : <Check size={12} />}
                      {member.isOverloaded ? 'Over Capacity' : 'Healthy'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Simple check icon for the table
const Check = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
);

export default TeamWorkload;