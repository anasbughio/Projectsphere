import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, Video, CheckCircle, Loader2, CalendarDays, AlertCircle } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../components/ToastProvider';

const ClientCalendar = () => {
  const [meetings, setMeetings] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const fetchCalendarData = async () => {
    try {
      const res = await api.get('/meetings/calendar-data');
      setMeetings(res.data.meetings || []);
      setTasks(res.data.tasks || []);
    } catch (error) {
      console.error("Error fetching calendar data:", error);
      toast.push("Failed to load calendar events.", { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendarData();
  }, []);

  // NEW: Helper function to calculate relative days
  const getRelativeTimeLabel = (dateString) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(dateString);
    targetDate.setHours(0, 0, 0, 0);
    
    const diffTime = targetDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-[#7c7fff]" size={40} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-w-[1600px] mx-auto w-full p-2">
      <div className="mb-8 border-b border-white/10 pb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Meetings & Deadlines</h2>
        <p className="text-[#84889c] text-sm">Stay on top of your upcoming deliverables and sync-up calls.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        
        {/* Left Column: Scheduled Meetings */}
        <div className="bg-[#1a1c26] rounded-2xl border border-white/5 p-6 shadow-lg flex flex-col h-[600px]">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5 shrink-0">
            <div className="flex items-center gap-3">
              <div className="bg-blue-500/20 p-2 rounded-xl text-blue-400">
                <Video size={20} />
              </div>
              <h3 className="text-lg font-bold text-white">Upcoming Meetings</h3>
            </div>
            <span className="bg-white/5 text-[#84889c] text-xs font-bold px-2.5 py-1 rounded-full border border-white/10">
              {meetings.length} Scheduled
            </span>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
            {meetings.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <CalendarDays size={48} className="text-[#606479] mb-4 opacity-50" />
                <h4 className="text-white font-bold mb-1">No upcoming meetings</h4>
                <p className="text-[#84889c] text-sm max-w-[250px]">You have no sync-up calls scheduled at the moment.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {meetings.map((meeting) => {
                  const daysDiff = getRelativeTimeLabel(meeting.date);
                  const isToday = daysDiff === 0;

                  return (
                    <div key={meeting._id} className={`bg-[#121218] p-4 rounded-xl border transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      isToday ? 'border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.1)]' : 'border-white/5 hover:border-blue-500/30'
                    }`}>
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <h4 className="text-white font-bold">{meeting.title}</h4>
                          {isToday && (
                            <span className="bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider animate-pulse">
                              Today
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-xs font-medium text-[#84889c]">
                          <span className={`flex items-center gap-1.5 ${isToday ? 'text-blue-400' : ''}`}>
                            <CalendarIcon size={14} className={isToday ? "text-blue-400" : "text-[#606479]"}/> 
                            {daysDiff === 1 ? 'Tomorrow' : new Date(meeting.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Clock size={14} className="text-[#606479]"/> {meeting.time}
                          </span>
                        </div>
                      </div>
                      
                      {/* NEW: Smart Button Logic */}
                      {meeting.meetingLink ? (
                        <a 
                          href={meeting.meetingLink} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className={`text-xs font-bold px-5 py-2.5 rounded-lg transition-all text-center whitespace-nowrap shadow-lg ${
                            isToday ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20' : 'bg-[#2a2d3e] hover:bg-blue-600 text-white hover:shadow-blue-500/20'
                          }`}
                        >
                          Join Call
                        </a>
                      ) : (
                        <span className="bg-[#1a1c26] text-[#606479] text-xs font-bold px-5 py-2.5 rounded-lg text-center whitespace-nowrap cursor-not-allowed border border-white/5">
                          Link TBD
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Task Deadlines */}
        <div className="bg-[#1a1c26] rounded-2xl border border-white/5 p-6 shadow-lg flex flex-col h-[600px]">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5 shrink-0">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-500/20 p-2 rounded-xl text-emerald-400">
                <CheckCircle size={20} />
              </div>
              <h3 className="text-lg font-bold text-white">Deliverable Deadlines</h3>
            </div>
            <span className="bg-white/5 text-[#84889c] text-xs font-bold px-2.5 py-1 rounded-full border border-white/10">
              {tasks.length} Pending
            </span>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
            {tasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <CheckCircle size={48} className="text-[#606479] mb-4 opacity-50" />
                <h4 className="text-white font-bold mb-1">All caught up</h4>
                <p className="text-[#84889c] text-sm max-w-[250px]">There are no pending deliverables with upcoming deadlines.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {tasks.map((task) => {
                  const isDone = task.status === 'Done';
                  const daysDiff = getRelativeTimeLabel(task.dueDate);
                  const isOverdue = daysDiff < 0 && !isDone;
                  const isDueToday = daysDiff === 0 && !isDone;

                  return (
                    <div key={task._id} className={`bg-[#121218] p-4 rounded-xl border flex justify-between items-center gap-4 transition-colors ${
                      isOverdue ? 'border-red-500/30 bg-red-500/5' : 
                      isDueToday ? 'border-orange-500/30 bg-orange-500/5' : 
                      'border-white/5 hover:border-white/10'
                    }`}>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-bold mb-1.5 truncate text-sm" title={task.title}>{task.title}</h4>
                        <div className="flex items-center gap-2 text-xs font-medium">
                          {/* NEW: Smart Deadline Labels */}
                          <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md ${
                            isOverdue ? 'bg-red-500/10 text-red-400' : 
                            isDueToday ? 'bg-orange-500/10 text-orange-400' : 
                            'bg-[#1a1c26] text-[#84889c]'
                          }`}>
                            {isOverdue ? <AlertCircle size={12} /> : <CalendarIcon size={12} />} 
                            {isOverdue ? `${Math.abs(daysDiff)} days overdue` : 
                             isDueToday ? 'Due Today' : 
                             daysDiff === 1 ? 'Due Tomorrow' : 
                             `Due in ${daysDiff} days`
                            }
                          </span>
                          <span className="text-[#606479]">•</span>
                          <span className="text-[#606479]">
                            {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      </div>
                      <div className="shrink-0">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border ${
                          task.status === 'Done' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]' : 
                          task.status === 'In Progress' ? 'bg-[#7c7fff]/10 text-[#7c7fff] border-[#7c7fff]/20' : 
                          'bg-[#2a2d3e] text-[#84889c] border-white/5'
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

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { height: 6px; width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
      `}} />
    </div>
  );
};

export default ClientCalendar;