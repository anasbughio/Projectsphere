import React, { useState, useEffect } from 'react';
import { X, Send } from 'lucide-react';
import api from '../services/api';
// socket.io-client import karne ki zaroorat nahi kyunke hum prop use kar rahe hain

const TaskDetailsModal = ({ task, onClose, organizationId, socket }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  useEffect(() => {
      console.log("Socket Prop Check:", socket);
    fetchComments();
    
    // Agar parent (KanbanBoard) se socket nahi aya, toh ruk jao
    if (!socket) return; 

    // Listener function
    const handleNewComment = (data) => {
      console.log("🔥 LIVE COMMENT TRIGGERED:", data);

      if (String(data.taskId) === String(task._id)) {
        setComments((prev) => {
          const exists = prev.some(c => String(c._id) === String(data.comment._id));
          if (exists) return prev;
          return [...prev, data.comment];
        });
      } else {
        console.log("Task ID mismatch:", data.taskId, "!==", task._id);
      }
    };

    // Parent wale socket par hi listen karein (Naya nahi banana)
    socket.on('newComment', handleNewComment);

    // Cleanup mein sirf listener off karein, disconnect nahi
    return () => {
      socket.off('newComment', handleNewComment);
    };
  }, [task._id, socket]);

  const fetchComments = async () => {
    try {
      const res = await api.get(`/collaboration/${task._id}/comments`);
      setComments(res.data);
    } catch (err) { console.error('Error fetching comments', err); }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const res = await api.post(`/collaboration/${task._id}/comments`, { text: newComment });
      setNewComment('');
    } catch (err) { alert('Failed to add comment'); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#1a1c26] border border-white/10 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">{task.title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={20} /></button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto flex-1">
          <p className="text-[#84889c] mb-6">{task.description || 'No description provided.'}</p>
          
          <div className="border-t border-white/5 pt-6">
            <h4 className="text-sm font-bold text-white mb-4">Discussion</h4>
            <div className="space-y-4 mb-6">
              {comments.map((c) => (
                <div key={c._id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#2a2d3e] flex items-center justify-center text-xs text-white">
                    {c.createdBy?.name?.charAt(0)}
                  </div>
                  <div className="bg-[#242634] p-3 rounded-xl rounded-tl-none">
                    <p className="text-xs font-bold text-[#7c7fff] mb-1">{c.createdBy?.name}</p>
                    <p className="text-sm text-gray-300">{c.text}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <form onSubmit={handleAddComment} className="flex gap-2">
              <input 
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 bg-[#121218] border border-white/5 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#7c7fff]"
              />
              <button className="bg-[#7c7fff] p-2 rounded-lg text-white hover:bg-[#6b6de0] transition"><Send size={18} /></button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailsModal;