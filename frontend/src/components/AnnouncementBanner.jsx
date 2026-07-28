import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Megaphone, X, AlertTriangle, Info, CheckCircle } from 'lucide-react';

const AnnouncementBanner = () => {
  const [announcements, setAnnouncements] = useState([]);
  
  // ✅ FIX 1: Initialize the 'hidden' state from localStorage so it survives page refreshes
  const [hidden, setHidden] = useState(() => {
    const savedHidden = localStorage.getItem('dismissedAnnouncements');
    return savedHidden ? JSON.parse(savedHidden) : [];
  });

  useEffect(() => {
   const fetchAnnouncements = async () => {
      try {
        const res = await api.get(`/announcements?t=${new Date().getTime()}`);
        setAnnouncements(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Failed to load announcements");
      }
    };

    // when dasboard open automatically load
    fetchAnnouncements();

    // Auto refresh after 10 sec
    const intervalId = setInterval(fetchAnnouncements, 10000);

    // when user close it clear
    return () => clearInterval(intervalId);
  }, []);

  const dismissBanner = (id) => {
    // ✅ FIX 2: Update both the React State AND the browser's localStorage
    const newHiddenList = [...hidden, id];
    setHidden(newHiddenList);
    localStorage.setItem('dismissedAnnouncements', JSON.stringify(newHiddenList));
  };

  const visibleAnnouncements = announcements.filter(a => !hidden.includes(a._id));

  if (visibleAnnouncements.length === 0) return null;

  return (
    <div className="w-full flex flex-col gap-2 mb-6">
      {visibleAnnouncements.map((item) => {
        // Theme colors based on type
        let bgColor = "bg-[#7c7fff]/10";
        let borderColor = "border-[#7c7fff]/20";
        let iconColor = "text-[#7c7fff]";
        let Icon = Megaphone;

        if (item.type === 'urgent') {
          bgColor = "bg-red-500/10";
          borderColor = "border-red-500/20";
          iconColor = "text-red-400";
          Icon = AlertTriangle;
        } else if (item.type === 'warning') {
          bgColor = "bg-yellow-500/10";
          borderColor = "border-yellow-500/20";
          iconColor = "text-yellow-400";
          Icon = AlertTriangle;
        } else if (item.type === 'success') {
          bgColor = "bg-emerald-500/10";
          borderColor = "border-emerald-500/20";
          iconColor = "text-emerald-400";
          Icon = CheckCircle;
        } else {
          Icon = Info;
        }

        return (
          <div 
            key={item._id} 
            className={`relative flex items-start sm:items-center justify-between gap-4 p-3 sm:px-4 rounded-xl border ${bgColor} ${borderColor} shadow-sm backdrop-blur-sm`}
          >
            <div className="flex items-start sm:items-center gap-3">
              <div className={`p-1.5 rounded-lg bg-white/5 ${iconColor}`}>
                <Icon size={18} />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <span className={`text-sm font-bold ${iconColor}`}>{item.title}:</span>
                <span className="text-sm text-gray-200">{item.message}</span>
              </div>
            </div>
            
            <button 
              onClick={() => dismissBanner(item._id)}
              className="text-gray-400 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors shrink-0"
              title="Dismiss"
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default AnnouncementBanner;