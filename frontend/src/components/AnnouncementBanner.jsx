import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Megaphone, X, AlertTriangle, Info, CheckCircle } from 'lucide-react';

const AnnouncementBanner = () => {
  // 1. Safely extract user role to determine if they are Client, Super Admin, or Tenant
  const storedUser = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || 'null') : null;
  const userRole = storedUser?.role?.toLowerCase() || '';
  
  const isSuperAdmin = userRole === 'super admin';
  const isClient = userRole === 'client';

  const [announcements, setAnnouncements] = useState([]);
  
  const [hidden, setHidden] = useState(() => {
    const savedHidden = localStorage.getItem('dismissedAnnouncements');
    return savedHidden ? JSON.parse(savedHidden) : [];
  });

  useEffect(() => {
    if (isSuperAdmin) return;

    const fetchAnnouncements = async () => {
      try {
        const res = await api.get(`/announcements?t=${new Date().getTime()}`);
        setAnnouncements(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Failed to load announcements");
      }
    };

    fetchAnnouncements();
    const intervalId = setInterval(fetchAnnouncements, 10000);
    return () => clearInterval(intervalId);
  }, [isSuperAdmin]);

  const dismissBanner = (id) => {
    const newHiddenList = [...hidden, id];
    setHidden(newHiddenList);
    localStorage.setItem('dismissedAnnouncements', JSON.stringify(newHiddenList));
  };

  if (isSuperAdmin) return null;

  // ✅ FIX: The filtering logic now strictly enforces the Target Audience!
  const visibleAnnouncements = announcements.filter(a => {
    // Hide if the user already dismissed it
    if (hidden.includes(a._id)) return false;

    // Audience Targeting Logic:
    if (a.targetAudience === 'clients' && !isClient) return false; // Only clients see this
    if (a.targetAudience === 'tenants' && isClient) return false;  // Clients cannot see tenant broadcasts

    return true; // 'all' audience, or passed the checks above
  });

  if (visibleAnnouncements.length === 0) return null;

  return (
    <div className="w-full flex flex-col gap-2 mb-6">
      {visibleAnnouncements.map((item) => {
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