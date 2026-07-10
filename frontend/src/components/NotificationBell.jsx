import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import api from '../services/api';

const NotificationBell = ({ user, socket }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // 1. Initial Load par purani notifications fetch karein
    const fetchNotifications = async () => {
      try {
        const res = await api.get('/collaboration/notifications'); // Iska API route backend par bana lijiye ga
        setNotifications(res.data);
        setUnreadCount(res.data.filter(n => !n.isRead).length);
      } catch (err) { console.error("Error fetching notifications", err); }
    };

    fetchNotifications();

    if (!socket || !user?._id) return;

    // 2. Personal room join karein
    socket.emit('joinUserRoom', user._id);

    // 3. Nayi notification listen karein
    socket.on('newNotification', (newNotif) => {
      console.log("🔔 New Live Notification Received:", newNotif);
      setNotifications((prev) => [newNotif, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    return () => {
      socket.off('newNotification');
    };
  }, [user?._id, socket]);

  const markAllAsRead = async () => {
    try {
      await api.put('/collaboration/notifications/mark-read');
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) { console.error(err); }
  };

  return (
    <div className="relative">
      {/* Bell Icon Button */}
      <button 
        onClick={() => { setIsOpen(!isOpen); if(unreadCount > 0) markAllAsRead(); }} 
        className="relative p-2 bg-[#1a1c26] border border-white/5 rounded-lg text-gray-400 hover:text-white transition"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-[#1a1c26] border border-white/10 rounded-xl shadow-2xl z-50 max-h-96 overflow-y-auto">
          <div className="p-4 border-b border-white/5 flex justify-between items-center">
            <h5 className="text-sm font-bold text-white">Notifications</h5>
          </div>
          <div className="divide-y divide-white/5">
            {notifications.length === 0 ? (
              <p className="p-4 text-xs text-gray-500 text-center">No new notifications</p>
            ) : (
              notifications.map((n) => (
                <div key={n._id} className={`p-4 text-xs ${!n.isRead ? 'bg-[#242634]/50' : ''}`}>
                  <p className="font-bold text-[#7c7fff] mb-1">{n.title}</p>
                  <p className="text-gray-300">{n.message}</p>
                  <span className="text-[10px] text-gray-500 block mt-2">
                    {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;