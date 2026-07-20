import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Target, Loader2 } from 'lucide-react';

const MilestoneProgressCard = () => {
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllMilestones = async () => {
      try {
        setLoading(true);
        // 1. Pehle saare projects get karein
        const projectsRes = await api.get('/projects');
        const projects = projectsRes.data;
        
        let allMilestones = [];
        
        // 2. Har project ke milestones loop chala kar fetch karein
        for (const project of projects) {
          try {
            const mRes = await api.get(`/milestones/project/${project._id}`);
            // Project ka naam bhi milestone ke sath add kar dete hain UI ke liye
            const projectMilestones = mRes.data.map(m => ({ ...m, projectName: project.name }));
            allMilestones = [...allMilestones, ...projectMilestones];
          } catch (err) {
            console.error(`Failed to fetch milestones for ${project.name}`);
          }
        }
        
        setMilestones(allMilestones);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllMilestones();
  }, []);

  if (loading) {
    return (
      <div className="bg-[#121218] border border-white/5 p-6 rounded-xl flex justify-center items-center h-48">
        <Loader2 className="animate-spin text-[#7c7fff]" size={30} />
      </div>
    );
  }

  return (
    <div className="bg-[#121218] border border-white/5 p-6 rounded-xl shadow-lg">
      <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-4">
        <Target className="text-[#7c7fff]" size={24} />
        <h2 className="text-lg font-bold text-white">Active Milestones Progress</h2>
      </div>

      <div className="space-y-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
        {milestones.length === 0 ? (
          <p className="text-gray-500 text-sm italic text-center py-4">No active milestones found.</p>
        ) : (
          milestones.map(m => (
            <div key={m._id} className="group">
              <div className="flex justify-between text-sm mb-2">
                <div>
                  <span className="text-white font-medium block">{m.title}</span>
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider">{m.projectName}</span>
                </div>
                <span className="text-[#7c7fff] font-bold">{m.progress || 0}%</span>
              </div>
              
              {/* Progress Bar Background */}
              <div className="h-2.5 bg-[#1a1c26] rounded-full overflow-hidden border border-white/5">
                {/* Progress Bar Fill */}
                <div 
                  className="h-full bg-gradient-to-r from-[#7c7fff] to-emerald-400 transition-all duration-1000 ease-out relative" 
                  style={{ width: `${m.progress || 0}%` }}
                >
                  <div className="absolute top-0 right-0 bottom-0 left-0 bg-white/20 animate-pulse"></div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MilestoneProgressCard;