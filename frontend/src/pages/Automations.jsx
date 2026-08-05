import React, { useState, useEffect } from 'react';
import { Zap, Plus, Save, Trash2, ArrowRight } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../components/ToastProvider';

const Automations = () => {
  const [automations, setAutomations] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  // New Rule State
  const [ruleName, setRuleName] = useState('');
  const [triggerEntity, setTriggerEntity] = useState('Task');
  const [triggerEvent, setTriggerEvent] = useState('updated');
  const [conditionField, setConditionField] = useState('priority');
  const [conditionValue, setConditionValue] = useState('Urgent');
  
  const [actionType, setActionType] = useState('update_field');
  // Default payload matches the first dropdown option
  const [actionPayload, setActionPayload] = useState('isClientDeliverable:true');

  useEffect(() => {
    fetchAutomations();
  }, []);

  const fetchAutomations = async () => {
    try {
      const { data } = await api.get('/automations');
      setAutomations(data);
    } catch (error) {
      console.error('Failed to load automations');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAutomation = async (e) => {
    e.preventDefault();
    
    // Safely parse the dropdown string (e.g. "progress:100") into a real object
    const [payloadKey, payloadValue] = actionPayload.split(':');
    
    let parsedValue = payloadValue;
    if (payloadValue === 'true') parsedValue = true;
    else if (payloadValue === 'false') parsedValue = false;
    else if (!isNaN(payloadValue)) parsedValue = Number(payloadValue); // Converts "100" to 100

    const formattedPayload = { [payloadKey]: parsedValue };

    const payload = {
      name: ruleName,
      trigger: {
        entity: triggerEntity,
        event: triggerEvent,
        conditions: [{ field: conditionField, operator: 'equals', value: conditionValue }]
      },
      action: {
        type: actionType,
        payload: formattedPayload
      }
    };

    try {
      await api.post('/automations', payload);
      toast.push('Automation Rule Activated!', { type: 'success' });
      setIsCreating(false);
      resetForm();
      fetchAutomations();
    } catch (error) {
      toast.push('Failed to save automation', { type: 'error' });
    }
  };

  const resetForm = () => {
    setRuleName('');
    setTriggerEntity('Task');
    setTriggerEvent('updated');
    setConditionField('priority');
    setConditionValue('Urgent');
    setActionType('update_field');
    setActionPayload('isClientDeliverable:true');
  };

  if (loading) return <div className="p-10 text-[#7c7fff]">Loading workflow engine...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto w-full font-sans">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Zap className="text-amber-400" /> Workspace Automations
          </h2>
          <p className="text-[#84889c] text-sm mt-1">Build automated workflows to eliminate manual tasks.</p>
        </div>
        <button 
          onClick={() => setIsCreating(!isCreating)}
          className="flex items-center gap-2 bg-[#7c7fff] hover:bg-[#6b6de0] text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition"
        >
          {isCreating ? 'Cancel' : <><Plus size={16} /> New Rule</>}
        </button>
      </div>

      {isCreating && (
        <form onSubmit={handleSaveAutomation} className="bg-[#1a1c26] p-6 rounded-xl border border-white/5 mb-8 shadow-lg animate-in fade-in slide-in-from-top-4">
          <h3 className="text-white font-bold mb-4 border-b border-white/5 pb-2">Create New Rule</h3>
          
          <div className="mb-6">
            <label className="block text-xs font-semibold text-[#84889c] mb-2 uppercase">Rule Name</label>
            <input 
              type="text" required value={ruleName} onChange={(e) => setRuleName(e.target.value)}
              placeholder="e.g., Auto-Check Client Deliverable on Urgent"
              className="w-full px-4 py-2 bg-[#121218] border border-white/5 rounded-lg text-white focus:outline-none focus:border-[#7c7fff]" 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end mb-6 bg-[#121218] p-4 rounded-lg border border-white/5">
            {/* TRIGGER COLUMN */}
            <div className="col-span-2">
              <span className="block text-xs font-bold text-emerald-400 mb-2 uppercase">When (Trigger)</span>
              <div className="flex gap-2">
                <select value={triggerEntity} onChange={(e) => setTriggerEntity(e.target.value)} className="w-1/2 px-3 py-2 bg-[#1a1c26] border border-white/5 rounded-lg text-white text-sm cursor-pointer">
                  <option value="Task">A Task</option>
                  <option value="Project">A Project</option>
                </select>
                <select value={triggerEvent} onChange={(e) => setTriggerEvent(e.target.value)} className="w-1/2 px-3 py-2 bg-[#1a1c26] border border-white/5 rounded-lg text-white text-sm cursor-pointer">
                  <option value="updated">is Updated</option>
                  <option value="created">is Created</option>
                </select>
              </div>
              
              <div className="flex gap-2 mt-2">
                <select value={conditionField} onChange={(e) => setConditionField(e.target.value)} className="w-1/2 px-3 py-2 bg-[#1a1c26] border border-white/5 rounded-lg text-[#84889c] text-sm cursor-pointer">
                  <option value="priority">where Priority</option>
                  <option value="status">where Status</option>
                  <option value="department">where Department</option>
                </select>
                <input type="text" value={conditionValue} onChange={(e) => setConditionValue(e.target.value)} placeholder="Value (e.g. Urgent)" className="w-1/2 px-3 py-2 bg-[#1a1c26] border border-white/5 rounded-lg text-white text-sm" />
              </div>
            </div>

            <div className="hidden md:flex justify-center pb-6">
              <ArrowRight className="text-[#606479]" />
            </div>

            {/* ACTION COLUMN */}
            <div className="col-span-2">
              <span className="block text-xs font-bold text-amber-400 mb-2 uppercase">Then (Action)</span>
              <div className="flex flex-col gap-2">
                <select 
                  value={actionType} 
                  onChange={(e) => {
                    setActionType(e.target.value);
                    // Reset payload to default when action type changes
                    setActionPayload(e.target.value === 'update_field' ? 'isClientDeliverable:true' : 'message:Task requires immediate attention!');
                  }} 
                  className="w-full px-3 py-2 bg-[#1a1c26] border border-white/5 rounded-lg text-white text-sm cursor-pointer"
                >
                  <option value="update_field">Update a Field</option>
                  <option value="send_notification">Send Notification</option>
                </select>
                
                {/* DYNAMIC PAYLOAD DROPDOWN */}
                {actionType === 'update_field' ? (
                  <select 
                    value={actionPayload} 
                    onChange={(e) => setActionPayload(e.target.value)} 
                    className="w-full px-3 py-2 bg-[#1a1c26] border border-white/5 rounded-lg text-white text-sm cursor-pointer"
                  >
                    <option value="isClientDeliverable:true">Set Client Deliverable to True</option>
                    <option value="isClientDeliverable:false">Set Client Deliverable to False</option>
                    <option value="priority:Urgent">Set Priority to Urgent</option>
                    <option value="priority:High">Set Priority to High</option>
                    <option value="status:Done">Set Status to Done</option>
                    <option value="status:To Do">Set Status to To Do</option>
                    <option value="progress:100">Set Progress to 100%</option>
                    <option value="progress:0">Set Progress to 0%</option>
                  </select>
                ) : (
                  <select 
                    value={actionPayload} 
                    onChange={(e) => setActionPayload(e.target.value)} 
                    className="w-full px-3 py-2 bg-[#1a1c26] border border-white/5 rounded-lg text-white text-sm cursor-pointer"
                  >
                    <option value="message:Task requires immediate attention!">Send: "Requires Attention"</option>
                    <option value="message:Task has been completed.">Send: "Task Completed"</option>
                    <option value="message:Client deliverable is ready.">Send: "Deliverable Ready"</option>
                  </select>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button type="submit" className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-lg text-sm font-semibold transition">
              <Save size={16} /> Activate Automation
            </button>
          </div>
        </form>
      )}

      {/* RENDER EXISTING RULES */}
      <div className="space-y-4">
        {automations.length === 0 && !isCreating ? (
          <div className="text-center p-10 bg-[#1a1c26] rounded-xl border border-white/5 text-[#606479]">
            No automations configured yet. Click "New Rule" to get started.
          </div>
        ) : (
          automations.map((rule) => (
            <div key={rule._id} className="bg-[#1a1c26] p-4 rounded-xl border border-white/5 flex justify-between items-center group">
              <div>
                <h4 className="text-white font-bold">{rule.name}</h4>
                <p className="text-[#84889c] text-xs mt-1">
                  If {rule.trigger.entity} is {rule.trigger.event} (where {rule.trigger.conditions[0]?.field} = {rule.trigger.conditions[0]?.value}) 
                  → {rule.action.type.replace('_', ' ')}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${rule.isActive ? 'bg-emerald-500' : 'bg-[#606479]'}`}></div>
                  <span className="text-xs text-[#84889c] uppercase font-bold">{rule.isActive ? 'Active' : 'Paused'}</span>
                </div>
                <button className="text-[#606479] hover:text-red-400 opacity-0 group-hover:opacity-100 transition">
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

export default Automations;