import React, { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import api from '../services/api';
import { Loader2 } from 'lucide-react';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const CalendarView = () => {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // fetch user projects
  useEffect(() => {
    fetchProjects();
  }, []);

  // when project select the fetch that projects tasks
  useEffect(() => {
    if (selectedProjectId) {
      fetchTasks(selectedProjectId);
    }
  }, [selectedProjectId]);

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects');
      // handle data format that comes from backend
      const projectList = Array.isArray(res.data) ? res.data : (res.data.data || res.data.projects || []);
      setProjects(projectList);
      
      // if projects ,then set as default
      if (projectList.length > 0) {
        setSelectedProjectId(projectList[0]._id);
      } else {
        setIsLoading(false); // if projects are not then remove loader
      }
    } catch (error) {
      console.error("Error fetching projects", error);
      setIsLoading(false);
    }
  };

  const fetchTasks = async (projectId) => {
    try {
      setIsLoading(true);
      // hit specific project task
      const res = await api.get(`/tasks/project/${projectId}`);
      
      const rawTasks = Array.isArray(res.data) ? res.data : (res.data.tasks || res.data.data || []);

      const formattedEvents = rawTasks.map(task => {
        // Project tasks due date map
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

  const eventStyleGetter = (event) => {
    let backgroundColor = '#3174ad';
    if (event.status === 'Completed' || event.status === 'Done') backgroundColor = '#10b981';
    if (event.status === 'In Progress') backgroundColor = '#f59e0b';
    if (event.status === 'To Do') backgroundColor = '#6b7280';

    return {
      style: {
        backgroundColor,
        borderRadius: '5px',
        opacity: 0.9,
        color: 'white',
        border: '0px',
        display: 'block'
      }
    };
  };

  return (
    <div className="p-6 bg-[#121218] min-h-screen text-white">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Project Calendar</h1>
          <p className="text-gray-400 text-sm">Track your task deadlines and schedules</p>
        </div>
        
        {/* Project Selector Dropdown */}
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-400 font-medium">Select Project:</label>
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
      </div>
      
      <div className="bg-[#1a1c26] p-4 rounded-xl border border-white/5 shadow-lg relative">
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