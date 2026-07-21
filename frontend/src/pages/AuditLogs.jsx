import { useState, useEffect } from 'react';
import { ShieldAlert, LogIn, FolderPlus, CheckSquare, UserPlus, Clock } from 'lucide-react';
import api from '../services/api';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        // new get route call
        const response = await api.get('/auditlogs');
        setLogs(response.data);
      } catch (err) {
        setError('Failed to load activity history.');
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  // icon color on action
  const getActionConfig = (action) => {
    switch (action) {
      case 'USER_LOGIN':
        return { icon: <LogIn size={16} />, color: 'text-emerald-400', bg: 'bg-emerald-400/10' };
      case 'PROJECT_CREATED':
        return { icon: <FolderPlus size={16} />, color: 'text-blue-400', bg: 'bg-blue-400/10' };
      case 'TASK_CREATED':
        return { icon: <CheckSquare size={16} />, color: 'text-purple-400', bg: 'bg-purple-400/10' };
      case 'USER_INVITED':
        return { icon: <UserPlus size={16} />, color: 'text-orange-400', bg: 'bg-orange-400/10' };
      default:
        return { icon: <ShieldAlert size={16} />, color: 'text-[#84889c]', bg: 'bg-white/5' };
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="bg-[#16171d] border border-white/[0.04] rounded-[1.25rem] p-6 sm:p-8 shadow-2xl w-full max-w-5xl mx-auto font-sans">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white tracking-tight">Activity History</h2>
        <p className="text-[#84889c] text-sm mt-1">Immutable record of system actions for compliance.</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5a5fe0]"></div>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg text-center font-medium">
          {error}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-[11px] font-semibold text-[#606479] uppercase tracking-wider">
                <th className="pb-3 pl-2">Action</th>
                <th className="pb-3">User</th>
                <th className="pb-3">Details</th>
                <th className="pb-3 text-right pr-2">Date & Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.02]">
              {logs.map((log) => {
                const config = getActionConfig(log.action);
                return (
                  <tr key={log._id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="py-4 pl-2">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${config.bg} ${config.color}`}>
                          {config.icon}
                        </div>
                        <span className="text-sm font-medium text-white">{log.action.replace('_', ' ')}</span>
                      </div>
                    </td>
                    <td className="py-4 text-sm text-[#a0a4b8]">
                      {log.user?.name || 'System User'}
                    </td>
                    <td className="py-4 text-sm text-[#84889c] max-w-xs truncate pr-4">
                      {log.details}
                    </td>
                    <td className="py-4 text-right pr-2 text-xs text-[#606479] whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <Clock size={12} />
                        {formatDate(log.createdAt)}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {logs.length === 0 && (
                <tr>
                  <td colSpan="4" className="text-center py-8 text-[#606479] text-sm">
                    No activity logs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AuditLogs;