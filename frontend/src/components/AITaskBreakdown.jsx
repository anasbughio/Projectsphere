import React, { useState } from 'react';
import { Sparkles, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import api from '../services/api';
import { useToast } from './ToastProvider';

const AITaskBreakdown = ({ task, projectId, onSubtasksCreated }) => {
  const [loading, setLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();

  const handleGenerate = async () => {
    setLoading(true);
    setAiSuggestions([]);
    try {
      const response = await api.post('/ai/breakdown', {
        title: task.title,
        description: task.description
      });
      setAiSuggestions(response.data);
    } catch (error) {
      toast.push('Failed to generate AI breakdown.', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptAll = async () => {
    setIsSaving(true);
    try {
      // Create a new task in the database for each AI suggestion
      const promises = aiSuggestions.map(suggestion => 
        api.post('/tasks', {
          title: suggestion.title,
          description: suggestion.description,
          priority: suggestion.priority,
          department: suggestion.department,
          status: 'To Do',
          projectId: projectId,
          dependsOn: [task._id] // Automatically blocks them until the parent is done, or links them
        })
      );
      
      await Promise.all(promises);
      toast.push('AI Sub-tasks created successfully!', { type: 'success' });
      setAiSuggestions([]);
      
      // Trigger the parent component to refresh the Kanban board
      if (onSubtasksCreated) onSubtasksCreated();
    } catch (error) {
      toast.push('Failed to save AI tasks to the board.', { type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-[#7c7fff]/10 to-transparent border border-[#7c7fff]/20 rounded-xl p-4 mt-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Sparkles size={16} className="text-[#7c7fff]" /> 
            AI Task Breakdown
          </h4>
          <p className="text-xs text-[#84889c] mt-1">Stuck on how to start? Let AI generate the technical steps.</p>
        </div>
        
        {!loading && aiSuggestions.length === 0 && (
          <button 
            onClick={handleGenerate}
            className="flex items-center gap-2 bg-[#7c7fff]/10 hover:bg-[#7c7fff]/20 text-[#7c7fff] px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border border-[#7c7fff]/30"
          >
            Generate Steps
          </button>
        )}
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-6 gap-3">
          <Loader2 className="animate-spin text-[#7c7fff]" size={24} />
          <p className="text-xs text-[#84889c] animate-pulse">Gemini is analyzing the requirements...</p>
        </div>
      )}

      {aiSuggestions.length > 0 && (
        <div className="space-y-3 animate-in fade-in duration-500">
          {aiSuggestions.map((suggestion, index) => (
            <div key={index} className="bg-[#1a1c26] border border-white/5 p-3 rounded-lg">
              <div className="flex justify-between items-start mb-1">
                <span className="text-sm font-bold text-white">{suggestion.title}</span>
                <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded border ${
                  suggestion.priority === 'High' || suggestion.priority === 'Urgent' 
                    ? 'bg-red-500/10 text-red-400 border-red-500/30' 
                    : 'bg-[#7c7fff]/10 text-[#7c7fff] border-[#7c7fff]/30'
                }`}>
                  {suggestion.priority} • {suggestion.department}
                </span>
              </div>
              <p className="text-xs text-[#84889c]">{suggestion.description}</p>
            </div>
          ))}

          <div className="flex justify-end gap-3 pt-3">
            <button 
              onClick={() => setAiSuggestions([])}
              className="px-3 py-1.5 text-xs font-bold text-[#84889c] hover:text-white transition-colors"
            >
              Discard
            </button>
            <button 
              onClick={handleAcceptAll}
              disabled={isSaving}
              className="flex items-center gap-2 bg-[#7c7fff] text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-[#6b6de0] transition-colors shadow-[0_0_15px_rgba(124,127,255,0.2)]"
            >
              {isSaving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              Add to Kanban Board
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AITaskBreakdown;