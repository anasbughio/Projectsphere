import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from './ToastProvider';
import { Clock, Play, Pause, RotateCcw, Plus, Trash2, Loader2, X } from 'lucide-react';

const TaskTimerModal = ({ task, onClose }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ totalHours: '0.00' });
  const toast = useToast();

  // Stopwatch State
  const [isActive, setIsActive] = useState(false);
  const [seconds, setSeconds] = useState(0);

  // Manual Log State
  const [manualMinutes, setManualMinutes] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchTimeData();
  }, [task._id]);

  useEffect(() => {
    let interval = null;
    if (isActive) {
      interval = setInterval(() => {
        setSeconds(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive]);

  const fetchTimeData = async () => {
    try {
      const [logsRes, summaryRes] = await Promise.all([
        api.get(`/timelogs/task/${task._id}`),
        api.get(`/timelogs/project/${task.projectId}`)
      ]);
      setLogs(logsRes.data);
      setSummary(summaryRes.data);
    } catch (error) {
      toast.push('Failed to load time tracking data.', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTimer = async () => {
    if (seconds < 60) {
      toast.push('Timer must run for at least 1 minute to log.', { type: 'error' });
      return;
    }
    const minutes = Math.round(seconds / 60);
    await submitTimeLog(minutes, 'Live Stopwatch Session');
    setSeconds(0);
    setIsActive(false);
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualMinutes || Number(manualMinutes) <= 0) {
      toast.push('Please enter valid minutes.', { type: 'error' });
      return;
    }
    await submitTimeLog(Number(manualMinutes), description);
    setManualMinutes('');
    setDescription('');
  };

  const submitTimeLog = async (minutes, desc) => {
    setIsSubmitting(true);
    try {
      await api.post('/timelogs', {
        taskId: task._id,
        projectId: task.projectId,
        durationMinutes: minutes,
        description: desc
      });
      toast.push('Time logged successfully!', { type: 'success' });
      fetchTimeData();
    } catch (error) {
      toast.push('Failed to record time.', { type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLog = async (id) => {
    try {
      await api.delete(`/timelogs/${id}`);
      toast.push('Time entry deleted.', { type: 'success' });
      fetchTimeData();
    } catch (error) {
      toast.push('Failed to delete entry.', { type: 'error' });
    }
  };

  const formatTime = (totalSecs) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#2a2d3e] border border-white/10 rounded-2xl w-full max-w-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-white/5 flex justify-between items-center shrink-0">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Clock className="text-[#7c7fff]" size={20} /> Time Tracking
            </h3>
            <p className="text-xs text-[#84889c] truncate max-w-md">{task.title}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[#84889c] hover:text-white bg-white/5 hover:bg-white/10 transition">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
          
          {/* LIVE STOPWATCH WIDGET */}
          <div className="bg-[#1a1c26] p-5 rounded-xl border border-white/5 flex flex-col items-center justify-center space-y-4 shadow-inner">
            <span className="text-xs uppercase font-semibold text-[#84889c] tracking-wider">Live Stopwatch</span>
            <div className="text-4xl font-mono font-extrabold text-white tracking-widest">
              {formatTime(seconds)}
            </div>
            <div className="flex gap-3">
              {!isActive ? (
                <button onClick={() => setIsActive(true)} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-bold flex items-center gap-1.5 transition shadow-lg shadow-emerald-500/20">
                  <Play size={16} /> Start
                </button>
              ) : (
                <button onClick={() => setIsActive(false)} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-bold flex items-center gap-1.5 transition">
                  <Pause size={16} /> Pause
                </button>
              )}
              <button onClick={() => { setIsActive(false); setSeconds(0); }} className="px-3 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-sm transition">
                <RotateCcw size={16} />
              </button>
              {seconds >= 60 && (
                <button onClick={handleSaveTimer} disabled={isSubmitting} className="px-4 py-2 bg-[#7c7fff] hover:bg-[#6b6ee6] text-white rounded-lg text-sm font-bold transition shadow-lg shadow-[#7c7fff]/20">
                  Save Time
                </button>
              )}
            </div>
          </div>

          {/* MANUAL LOG FORM */}
          <form onSubmit={handleManualSubmit} className="bg-[#1a1c26] p-5 rounded-xl border border-white/5 space-y-4">
            <h4 className="text-xs uppercase font-semibold text-[#84889c] tracking-wider">Log Time Manually</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-[#84889c] uppercase mb-1">Duration (Minutes)</label>
                <input 
                  type="number" min="1" required placeholder="e.g. 45"
                  value={manualMinutes} onChange={(e) => setManualMinutes(e.target.value)}
                  className="w-full px-3 py-2 bg-[#121218] border border-white/5 rounded-lg text-sm text-white focus:border-[#7c7fff] outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[#84889c] uppercase mb-1">Description (Optional)</label>
                <input 
                  type="text" placeholder="What did you work on?"
                  value={description} onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-[#121218] border border-white/5 rounded-lg text-sm text-white focus:border-[#7c7fff] outline-none"
                />
              </div>
            </div>
            <button disabled={isSubmitting} type="submit" className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold rounded-lg text-sm transition flex items-center justify-center gap-2">
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <><Plus size={16} /> Add Time Entry</>}
            </button>
          </form>

          {/* TIME LOG HISTORY LIST */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-sm font-bold text-white">Task History</h4>
              <span className="text-xs text-[#7c7fff] font-semibold bg-[#7c7fff]/10 px-2.5 py-1 rounded-full border border-[#7c7fff]/20">
                Project Total: {summary.totalHours} hrs
              </span>
            </div>

            {loading ? (
              <div className="flex justify-center p-6"><Loader2 className="animate-spin text-[#7c7fff]" size={24} /></div>
            ) : logs.length === 0 ? (
              <div className="text-center p-6 bg-[#1a1c26] rounded-xl border border-white/5 text-[#84889c] text-xs">
                No time logged on this task yet.
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                {logs.map(log => (
                  <div key={log._id} className="flex items-center justify-between p-3 bg-[#1a1c26] rounded-xl border border-white/5 text-xs">
                    <div>
                      <span className="font-bold text-white block mb-0.5">
                        {Math.floor(log.durationMinutes / 60)}h {log.durationMinutes % 60}m 
                        <span className="text-[#84889c] font-normal ml-2">by {log.userId?.name || 'User'}</span>
                      </span>
                      {log.description && <span className="text-[#84889c] italic">"{log.description}"</span>}
                    </div>
                    <button onClick={() => handleDeleteLog(log._id)} className="p-1.5 text-[#84889c] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default TaskTimerModal;