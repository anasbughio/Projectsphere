import React, { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
// Naye ES Module Imports:
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US'; // require() ki jagah yeh import use karein

import 'react-big-calendar/lib/css/react-big-calendar.css';
import api from '../services/api';
import { Loader2 } from 'lucide-react';

const locales = {
  'en-US': enUS, // require() yahan se hata diya gaya hai
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

// ... baqi aapka CalendarView ka component same rahega
const CalendarView = ({ projectId }) => {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, [projectId]);

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      // Agar projectId pass hua hai toh specific project ke tasks, warna sabhi
      const endpoint = projectId ? `/tasks/project/${projectId}` : `/tasks/global/all`;
      const res = await api.get(endpoint);
      
      // Tasks ko calendar ke event format mein map karein
      const formattedEvents = res.data.map(task => ({
        id: task._id,
        title: task.title,
        start: new Date(task.createdAt), // Start date
        end: task.dueDate ? new Date(task.dueDate) : new Date(task.createdAt), // End date
        status: task.status,
        allDay: true,
      }));
      
      setTasks(formattedEvents);
    } catch (error) {
      console.error("Error fetching tasks for calendar", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Custom styling based on task status
  const eventStyleGetter = (event) => {
    let backgroundColor = '#3174ad'; // Default blue
    if (event.status === 'Completed' || event.status === 'Done') backgroundColor = '#10b981'; // Green
    if (event.status === 'In Progress') backgroundColor = '#f59e0b'; // Yellow
    if (event.status === 'To Do') backgroundColor = '#6b7280'; // Gray

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

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-10">
        <Loader2 className="animate-spin text-[#7c7fff]" size={40} />
      </div>
    );
  }

  return (
    <div className="p-6 bg-[#121218] min-h-screen text-white">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Project Calendar</h1>
        <p className="text-gray-400 text-sm">Track your task deadlines and schedules</p>
      </div>
      
      <div className="bg-[#1a1c26] p-4 rounded-xl border border-white/5 shadow-lg">
        {/* React Big Calendar Container */}
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

      {/* Custom CSS for Calendar Dark Mode adjustments */}
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