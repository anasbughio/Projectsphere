import React, { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import api from '../services/api';
import { Loader2, Plus, X, Video } from 'lucide-react'; 

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

const CalendarView = () => {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Meeting Modal States (ClientId hata diya hai)
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      fetchTasks(selectedProjectId);
    }
  }, [selectedProjectId]);

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects');
      const projectList = Array.isArray(res.data) ? res.data : (res.data.data || res.data.projects || []);
      setProjects(projectList);
      
      if (projectList.length > 0) {
        setSelectedProjectId(projectList[0]._id);
      } else {
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error fetching projects", error);
      setIsLoading(false);
    }
  };

  const fetchTasks = async (projectId) => {
    try {
      setIsLoading(true);
      const res = await api.get(`/tasks/project/${projectId}`);
      const rawTasks = Array.isArray(res.data) ? res.data : (res.data.tasks || res.data.data || []);

      const formattedEvents = rawTasks.map(task => {
        const startDate = task.createdAt ? new Date(task.createdAt) : new Date();
        const endDate = task.dueDate ? new Date(task.dueDate) : startDate;

        return {
          id: task._id,
          title: task.title || 'Untitled Task',
          start: startDate,
          end: endDate,
          status: task.status || 'To Do',
          allDay: true,
        };
      });
      
      setTasks(formattedEvents);
    } catch (error) {
      console.error("Error fetching tasks for calendar:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 🔥 Ab sirf Title, Date, Time, aur Project ID jayegi
  const handleCreateMeeting = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/meetings', { 
        title, date, time, meetingLink, 
        projectId: selectedProjectId
      });
      setShowModal(false);
      setTitle(''); setDate(''); setTime(''); setMeetingLink('');
      
      alert("Meeting Scheduled Successfully! Assigned client can now see it.");
    } catch (error) {
      console.error("Error creating meeting:", error);
      alert(error.response?.data?.message || "Failed to create meeting.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const eventStyleGetter = (event) => {
    let backgroundColor = '#3174ad';
    if (event.status === 'Completed' || event.status === 'Done') backgroundColor = '#10b981';
    if (event.status === 'In Progress') backgroundColor = '#f59e0b';
    if (event.status === 'To Do') backgroundColor = '#6b7280';

    return { style: { backgroundColor, borderRadius: '5px', opacity: 0.9, color: 'white', border: '0px', display: 'block' } };
  };

  return (
    <div className="p-6 bg-[#121218] min-h-screen text-white relative">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Project Calendar</h1>
          <p className="text-gray-400 text-sm">Track your task deadlines and schedules</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-400 font-medium whitespace-nowrap">Select Project:</label>
            <select 
              className="bg-[#1a1c26] border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-[#7c7fff] transition-all"
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              disabled={isLoading || projects.length === 0}
            >
              {projects.length === 0 ? (
                <option value="">No Projects Found</option>
              ) : (
                projects.map(project => (
                  <option key={project._id} value={project._id}>
                    {project.name || project.title}
                  </option>
                ))
              )}
            </select>
          </div>

          <button 
            onClick={() => setShowModal(true)}
            disabled={!selectedProjectId}
            className="bg-[#7c7fff] hover:bg-[#6b6de0] disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2 shadow-lg"
          >
            <Plus size={18} /> Schedule Meeting
          </button>
        </div>
      </div>
      
      <div className="bg-[#1a1c26] p-4 rounded-xl border border-white/5 shadow-lg relative z-0">
        {isLoading && (
          <div className="absolute inset-0 z-10 bg-[#1a1c26]/80 flex items-center justify-center rounded-xl">
            <Loader2 className="animate-spin text-[#7c7fff]" size={40} />
          </div>
        )}
        
        <Calendar
          localizer={localizer}
          events={tasks}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 600, color: 'white' }}
          eventPropGetter={eventStyleGetter}
          views={['month', 'week', 'day']}
          className="custom-calendar"
        />
      </div>

      {/* Schedule Meeting Modal (Client Dropdown hata diya gaya hai) */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1c26] rounded-2xl border border-white/10 w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-white/10 flex justify-between items-center bg-[#121218]">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Video size={20} className="text-[#7c7fff]" /> Schedule a Call
              </h3>
              <button onClick={() => setShowModal(false)} className="text-[#84889c] hover:text-white transition p-1"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleCreateMeeting} className="p-5 overflow-y-auto custom-scrollbar flex-1">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#84889c] mb-1.5 uppercase">Meeting Title</label>
                  <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Design Review Call" className="w-full px-4 py-2.5 bg-[#121218] border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-[#7c7fff] transition" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#84889c] mb-1.5 uppercase">Date</label>
                    <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-4 py-2.5 bg-[#121218] border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-[#7c7fff] transition [color-scheme:dark]" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#84889c] mb-1.5 uppercase">Time</label>
                    <input type="time" required value={time} onChange={(e) => setTime(e.target.value)} className="w-full px-4 py-2.5 bg-[#121218] border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-[#7c7fff] transition [color-scheme:dark]" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#84889c] mb-1.5 uppercase">Meeting Link (Zoom/Meet)</label>
                  <input type="url" required value={meetingLink} onChange={(e) => setMeetingLink(e.target.value)} placeholder="https://zoom.us/j/..." className="w-full px-4 py-2.5 bg-[#121218] border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-[#7c7fff] transition" />
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-white/10 flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-[#84889c] hover:text-white transition">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-[#7c7fff] hover:bg-[#6b6de0] transition disabled:opacity-50 flex items-center gap-2">
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Schedule Call'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .rbc-calendar { font-family: inherit; }
        .rbc-header { padding: 10px; font-weight: bold; border-bottom: 1px solid rgba(255,255,255,0.1) !important; }
        .rbc-month-view, .rbc-time-view, .rbc-agenda-view { border-color: rgba(255,255,255,0.1); background: #1a1c26; }
        .rbc-day-bg { border-left: 1px solid rgba(255,255,255,0.05); border-bottom: 1px solid rgba(255,255,255,0.05); }
        .rbc-off-range-bg { background: rgba(0,0,0,0.2); }
        .rbc-today { background: rgba(124, 127, 255, 0.1); }
        .rbc-event { padding: 4px; font-size: 12px; }
        .rbc-toolbar button { color: white; border-color: rgba(255,255,255,0.2); }
        .rbc-toolbar button:hover { background: rgba(255,255,255,0.1); }
        .rbc-toolbar button.rbc-active { background: #7c7fff; color: white; border-color: #7c7fff; }
      `}} />
    </div>
  );
};

export default CalendarView;