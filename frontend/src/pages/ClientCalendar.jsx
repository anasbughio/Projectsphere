import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, Video, CheckCircle, Loader2, CalendarDays } from 'lucide-react';
import api from '../services/api';

const ClientCalendar = () => {
  const [meetings, setMeetings] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCalendarData = async () => {
    try {
      const res = await api.get('/meetings/calendar-data');
      setMeetings(res.data.meetings);
      setTasks(res.data.tasks);
    } catch (error) {
      console.error("Error fetching calendar data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendarData();
  }, []);

  if (loading) {
    return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-[#7c7fff]" size={40} /></div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Meetings & Deadlines</h2>
        <p className="text-[#84889c] text-sm">Stay on top of your upcoming deliverables and sync-up calls.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        
        {/* Left Column: Scheduled Meetings */}
        <div className="bg-[#1a1c26] rounded-2xl border border-white/5 p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
            <div className="bg-blue-500/20 p-2 rounded-lg text-blue-400">
              <Video size={20} />
            </div>
            <h3 className="text-lg font-bold text-white">Upcoming Meetings</h3>
          </div>

          {meetings.length === 0 ? (
            <div className="text-center py-8">
              <CalendarDays size={40} className="mx-auto text-white/10 mb-3" />
              <p className="text-[#84889c] text-sm">No upcoming meetings scheduled.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {meetings.map((meeting) => (
                <div key={meeting._id} className="bg-[#121218] p-4 rounded-xl border border-white/5 hover:border-blue-500/30 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-white font-bold mb-1">{meeting.title}</h4>
                    <div className="flex items-center gap-4 text-xs font-medium text-[#84889c]">
                      <span className="flex items-center gap-1.5"><CalendarIcon size={14} className="text-blue-400"/> {new Date(meeting.date).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1.5"><Clock size={14} className="text-blue-400"/> {meeting.time}</span>
                    </div>
                  </div>
                  <a href={meeting.meetingLink} target="_blank" rel="noopener noreferrer" className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition text-center whitespace-nowrap">
                    Join Call
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Task Deadlines */}
        <div className="bg-[#1a1c26] rounded-2xl border border-white/5 p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
            <div className="bg-emerald-500/20 p-2 rounded-lg text-emerald-400">
              <CheckCircle size={20} />
            </div>
            <h3 className="text-lg font-bold text-white">Deliverable Deadlines</h3>
          </div>

          {tasks.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle size={40} className="mx-auto text-white/10 mb-3" />
              <p className="text-[#84889c] text-sm">No pending deliverables with deadlines.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tasks.map((task) => {
                const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'Done';
                return (
                  <div key={task._id} className={`bg-[#121218] p-4 rounded-xl border ${isOverdue ? 'border-red-500/30' : 'border-white/5'} flex justify-between items-center gap-4`}>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-bold mb-1 truncate" title={task.title}>{task.title}</h4>
                      <div className="flex items-center gap-2 text-xs font-medium">
                        <span className={`flex items-center gap-1.5 ${isOverdue ? 'text-red-400' : 'text-[#84889c]'}`}>
                          <CalendarIcon size={14} /> 
                          {new Date(task.dueDate).toLocaleDateString()} 
                          {isOverdue && ' (Overdue)'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                        task.status === 'Done' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                        task.status === 'In Progress' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 
                        'bg-[#606479]/20 text-[#84889c] border-[#606479]/30'
                      }`}>
                        {task.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default ClientCalendar;