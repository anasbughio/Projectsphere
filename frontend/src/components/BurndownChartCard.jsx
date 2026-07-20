import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingDown, Loader2 } from 'lucide-react';
import api from '../services/api';

const BurndownChartCard = ({ projectId }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBurndownData = async () => {
      try {
        setLoading(true);
        // Agar projectId pass kiya hai toh specific project, warna pure workspace ka
        const endpoint = projectId 
          ? `/tasks/analytics/burndown?projectId=${projectId}` 
          : `/tasks/analytics/burndown`;
          
        const res = await api.get(endpoint);
        setData(res.data);
      } catch (error) {
        console.error("Burndown data load nahi hua", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBurndownData();
  }, [projectId]);

  if (loading) {
    return (
      <div className="bg-[#121218] border border-white/5 p-6 rounded-xl flex justify-center items-center h-[350px]">
        <Loader2 className="animate-spin text-[#7c7fff]" size={30} />
      </div>
    );
  }

  return (
    <div className="bg-[#121218] border border-white/5 p-6 rounded-xl shadow-lg">
      <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
        <div className="flex items-center gap-2">
          <TrendingDown className="text-[#7c7fff]" size={24} />
          <h2 className="text-lg font-bold text-white">Sprint Burndown (14 Days)</h2>
        </div>
        <span className="text-xs bg-[#1a1c26] text-gray-400 px-3 py-1 rounded-full border border-white/10">
          Ideal vs Actual
        </span>
      </div>

      <div className="h-[280px] w-full">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-500 italic">
            Not enough data to generate chart.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3e" vertical={false} />
              
              <XAxis 
                dataKey="date" 
                stroke="#6b7280" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
                dy={10}
              />
              
              <YAxis 
                stroke="#6b7280" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
                allowDecimals={false}
              />
              
              <Tooltip 
                contentStyle={{ backgroundColor: '#1a1c26', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                itemStyle={{ color: '#fff' }}
              />
              
              <Legend verticalAlign="top" height={36} iconType="circle" />
              
              {/* Ideal Line - Dashed Grey */}
              <Line 
                type="monotone" 
                dataKey="Ideal" 
                stroke="#6b7280" 
                strokeWidth={2}
                strokeDasharray="5 5" 
                dot={false}
                name="Ideal Remaining"
              />
              
              {/* Actual Line - Solid Primary Color */}
              <Line 
                type="monotone" 
                dataKey="Actual" 
                stroke="#7c7fff" 
                strokeWidth={3} 
                dot={{ r: 4, fill: '#121218', strokeWidth: 2 }}
                activeDot={{ r: 6, fill: '#7c7fff' }}
                name="Actual Remaining"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default BurndownChartCard;