import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from './ToastProvider';
import { Zap, Plus, Trash2, Power, Loader2, ArrowRight } from 'lucide-react';

const WorkflowAutomations = () => {
  const [workflows, setWorkflows] = useState([]);
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();

  // Form State
  const [name, setName] = useState('');
  const [triggerField, setTriggerField] = useState('status');
  const [triggerValue, setTriggerValue] = useState('Done');
  const [actionType, setActionType] = useState('ASSIGN_USER');
  const [actionValue, setActionValue] = useState('');

  // Dropdown Options
  const fieldOptions = {
    status: ['To Do', 'In Progress', 'Done', 'Completed'],
    priority: ['Low', 'Medium', 'High', 'Urgent'],
    department: ['General', 'Design', 'Frontend', 'Backend', 'DevOps']
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [wfRes, teamRes] = await Promise.all([
        api.get('/workflows'),
        api.get('/team')
      ]);
      setWorkflows(wfRes.data);
      setTeam(teamRes.data);
      if (teamRes.data.length > 0) {
        setActionValue(teamRes.data[0]._id);
      }
    } catch (error) {
      toast.push('Failed to load workflow data.', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Handle cascading dropdown resets
  const handleTriggerFieldChange = (field) => {
    setTriggerField(field);
    setTriggerValue(fieldOptions[field][0]);
  };

  const handleActionTypeChange = (type) => {
    setActionType(type);
    if (type === 'ASSIGN_USER' && team.length > 0) setActionValue(team[0]._id);
    if (type === 'UPDATE_STATUS') setActionValue('In Progress');
    if (type === 'UPDATE_PRIORITY') setActionValue('High');
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const { data } = await api.post('/workflows', {
        name, triggerField, triggerValue, actionType, actionValue
      });
      setWorkflows([data, ...workflows]);
      setName('');
      toast.push('Automation created successfully!', { type: 'success' });
    } catch (error) {
      toast.push(error.response?.data?.message || 'Failed to create automation', { type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = async (id) => {
    try {
      setWorkflows(workflows.map(wf => wf._id === id ? { ...wf, isActive: !wf.isActive } : wf));
      await api.patch(`/workflows/${id}/toggle`);
    } catch (error) {
      toast.push('Failed to toggle workflow.', { type: 'error' });
      fetchData(); // revert on fail
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this automation rule?")) return;
    try {
      await api.delete(`/workflows/${id}`);
      setWorkflows(workflows.filter(wf => wf._id !== id));
      toast.push('Automation deleted.', { type: 'success' });
    } catch (error) {
      toast.push('Failed to delete workflow.', { type: 'error' });
    }
  };

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-[#7c7fff]" size={32} /></div>;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2 mb-2">
          <Zap className="text-[#7c7fff]" /> Automation Workflows
        </h2>
        <p className="text-[#84889c] text-sm">Create "If This, Then That" rules to automate your project board.</p>
      </div>

      {/* CREATE WORKFLOW FORM */}
      <div className="bg-[#1a1c26] border border-white/10 rounded-2xl p-6 shadow-xl">
        <h3 className="text-white font-bold mb-4">Create New Rule</h3>
        <form onSubmit={handleCreate} className="space-y-6">
          <div>
            <label className="block text-xs font-semibold text-[#84889c] mb-2 uppercase">Rule Name</label>
            <input 
              type="text" required placeholder="e.g., Send to QA when Done"
              value={name} onChange={(e) => setName(e.target.value)} 
              className="w-full px-4 py-2 bg-[#121218] border border-white/5 rounded-lg text-white focus:border-[#7c7fff] outline-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-end">
            {/* IF TRIGGER */}
            <div className="md:col-span-5 p-4 border border-white/5 bg-[#121218]/50 rounded-xl space-y-3">
              <span className="text-[#7c7fff] font-bold text-sm">WHEN...</span>
              <div className="flex gap-2">
                <select value={triggerField} onChange={(e) => handleTriggerFieldChange(e.target.value)} className="w-1/2 px-3 py-2 bg-[#1a1c26] border border-white/5 rounded-lg text-sm text-white outline-none">
                  <option value="status">Task Status</option>
                  <option value="priority">Task Priority</option>
                  <option value="department">Department</option>
                </select>
                <span className="text-[#84889c] self-center text-sm">is</span>
                <select value={triggerValue} onChange={(e) => setTriggerValue(e.target.value)} className="w-1/2 px-3 py-2 bg-[#1a1c26] border border-white/5 rounded-lg text-sm text-white outline-none">
                  {fieldOptions[triggerField].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
            </div>

            <div className="md:col-span-1 flex justify-center pb-6">
              <ArrowRight className="text-[#606479] hidden md:block" />
            </div>

            {/* THEN ACTION */}
            <div className="md:col-span-5 p-4 border border-emerald-500/10 bg-emerald-500/5 rounded-xl space-y-3">
              <span className="text-emerald-400 font-bold text-sm">THEN...</span>
              <div className="flex gap-2">
                <select value={actionType} onChange={(e) => handleActionTypeChange(e.target.value)} className="w-1/2 px-3 py-2 bg-[#1a1c26] border border-white/5 rounded-lg text-sm text-white outline-none">
                  <option value="ASSIGN_USER">Assign To</option>
                  <option value="UPDATE_STATUS">Change Status</option>
                  <option value="UPDATE_PRIORITY">Change Priority</option>
                </select>
                
                <select value={actionValue} onChange={(e) => setActionValue(e.target.value)} className="w-1/2 px-3 py-2 bg-[#1a1c26] border border-white/5 rounded-lg text-sm text-white outline-none">
                  {actionType === 'ASSIGN_USER' && team.map(member => (
                    <option key={member._id} value={member._id}>{member.name}</option>
                  ))}
                  {actionType === 'UPDATE_STATUS' && fieldOptions.status.map(s => <option key={s} value={s}>{s}</option>)}
                  {actionType === 'UPDATE_PRIORITY' && fieldOptions.priority.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
          </div>

          <button disabled={isSaving} type="submit" className="w-full py-3 bg-[#7c7fff] hover:bg-[#6b6ee6] text-white font-bold rounded-xl flex items-center justify-center gap-2 transition">
            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <><Plus size={18} /> Create Automation Rule</>}
          </button>
        </form>
      </div>

      {/* ACTIVE WORKFLOWS LIST */}
      <div className="space-y-3">
        <h3 className="text-white font-bold text-lg mb-4">Active Rules ({workflows.length})</h3>
        {workflows.length === 0 ? (
          <div className="text-center p-10 border border-white/5 rounded-xl bg-[#121218] text-[#84889c] text-sm">
            No workflows created yet. Build your first rule above!
          </div>
        ) : (
          workflows.map(wf => (
            <div key={wf._id} className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border transition ${wf.isActive ? 'bg-[#1a1c26] border-white/10' : 'bg-[#121218] border-white/5 opacity-60'}`}>
              <div>
                <h4 className="text-white font-bold text-sm mb-1">{wf.name}</h4>
                <div className="text-xs text-[#84889c] flex items-center gap-1.5 flex-wrap">
                  <span className="bg-white/5 px-2 py-0.5 rounded">When {wf.triggerField} is <b>{wf.triggerValue}</b></span>
                  <ArrowRight size={10} />
                  <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded">
                    {wf.actionType === 'ASSIGN_USER' ? 'Assign to User' : wf.actionType === 'UPDATE_STATUS' ? 'Change status to' : 'Change priority to'} <b>{wf.actionType === 'ASSIGN_USER' ? team.find(t => t._id === wf.actionValue)?.name || 'Unknown' : wf.actionValue}</b>
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-3 mt-4 sm:mt-0">
                <button onClick={() => handleToggle(wf._id)} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition ${wf.isActive ? 'bg-[#7c7fff]/10 text-[#7c7fff] hover:bg-[#7c7fff]/20' : 'bg-white/5 text-[#84889c] hover:text-white'}`}>
                  <Power size={14} /> {wf.isActive ? 'Active' : 'Paused'}
                </button>
                <button onClick={() => handleDelete(wf._id)} className="p-1.5 text-[#606479] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default WorkflowAutomations;