import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Paperclip, FileText, Loader2 } from 'lucide-react';
import api from '../services/api';

const TaskDetailsModal = ({ task, onClose, organizationId, socket }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [localAttachments, setLocalAttachments] = useState(task.attachments || []);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Safely get file link
  const getFileLink = (fileUrl) => {
    if (!fileUrl) return '#';
    if (fileUrl.startsWith('http')) return fileUrl;
    const baseUrl = import.meta.env?.VITE_API_BASE_URL 
      ? import.meta.env.VITE_API_BASE_URL.split('/api')[0] 
      : 'http://localhost:5000';
    return `${baseUrl}${fileUrl}`;
  };

  // Check if file is an image
  const isImage = (fileName) => {
    return fileName?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
  };

  useEffect(() => {
    fetchComments();
    
    if (!socket) return; 

    const handleNewComment = (data) => {
      if (String(data.taskId) === String(task._id)) {
        setComments((prev) => {
          const exists = prev.some(c => String(c._id) === String(data.comment._id));
          if (exists) return prev;
          return [...prev, data.comment];
        });
      }
    };

    socket.on('newComment', handleNewComment);
    return () => socket.off('newComment', handleNewComment);
  }, [task._id, socket]);

  const fetchComments = async () => {
    try {
      const res = await api.get(`/collaboration/${task._id}/comments`);
      setComments(res.data);
    } catch (err) { console.error('Error fetching comments', err); }
  };

  // Nayi chat aane par automatically neechay scroll karne ke liye
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [comments, localAttachments]);

  const handleCombinedSubmit = async (e) => {
    e.preventDefault();

    // BINARY TEXT PASTE FIX: Agar ghalti se image paste ho gayi hai
    if (newComment.includes('ÿØÿà') || newComment.length > 3000) {
      alert("Please use the Paperclip icon to attach files! You pasted raw image data.");
      setNewComment('');
      return;
    }

    if (!newComment.trim() && !selectedFile) return;

    setIsSubmitting(true);

    try {
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        const fileRes = await api.post(`/tasks/${task._id}/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setLocalAttachments(prev => [...prev, fileRes.data.attachment]);
        setSelectedFile(null);
      }

      if (newComment.trim()) {
        await api.post(`/collaboration/${task._id}/comments`, { text: newComment });
        setNewComment('');
      }

    } catch (error) {
      console.error('Submission Error:', error);
      alert('Failed to send message or attach file.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- COMBINED FEED LOGIC (Comments + Attachments) ---
  const chatFeed = [
    ...comments.map(c => ({
      type: 'comment',
      id: c._id,
      text: c.text,
      senderName: c.createdBy?.name || 'User',
      date: new Date(c.createdAt || Date.now())
    })),
    ...localAttachments.map((a, index) => ({
      type: 'attachment',
      id: a._id || `attach-${index}`,
      fileName: a.fileName,
      fileUrl: a.fileUrl,
      senderName: 'System', // Attachments abhi user ke naam se link nahi hain
      date: new Date(a.uploadedAt || Date.now())
    }))
  ].sort((a, b) => a.date - b.date); // Sort by time

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#1a1c26] border border-white/10 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex justify-between items-center shrink-0">
          <h2 className="text-xl font-bold text-white">{task.title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={20} /></button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col min-h-0" ref={chatContainerRef}>
          <p className="text-[#84889c] mb-6">{task.description || 'No description provided.'}</p>
          
          <div className="border-t border-white/5 pt-6 flex-1 flex flex-col">
            <h4 className="text-sm font-bold text-white mb-4">Discussion</h4>
            
            {/* --- INLINE CHAT FEED --- */}
            <div className="space-y-4 mb-6 flex-1">
              {chatFeed.map((item) => (
                <div key={item.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#2a2d3e] flex items-center justify-center text-xs text-white shrink-0">
                    {item.type === 'comment' ? item.senderName.charAt(0).toUpperCase() : <Paperclip size={14} />}
                  </div>
                  <div className="bg-[#242634] p-3 rounded-xl rounded-tl-none max-w-[85%]">
                    {item.type === 'comment' && (
                       <p className="text-xs font-bold text-[#7c7fff] mb-1">{item.senderName}</p>
                    )}
                    
                    {item.type === 'comment' ? (
                      <p className="text-sm text-gray-300 break-words whitespace-pre-wrap">{item.text}</p>
                    ) : (
                      <div className="mt-1">
                        {/* Agar Image hai toh tasveer dikhayein, warna file ka icon */}
                        {isImage(item.fileName) ? (
                          <a href={getFileLink(item.fileUrl)} target="_blank" rel="noopener noreferrer">
                             <img 
                               src={getFileLink(item.fileUrl)} 
                               alt={item.fileName} 
                               className="max-w-full h-auto max-h-48 rounded-lg border border-white/10 hover:opacity-90 transition-opacity" 
                             />
                          </a>
                        ) : (
                          <a 
                            href={getFileLink(item.fileUrl)} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-2 rounded-lg bg-[#121218] border border-white/5 hover:border-[#7c7fff] transition-all group"
                          >
                            <div className="p-2 bg-[#7c7fff]/20 text-[#7c7fff] rounded-md shrink-0">
                              <FileText size={18} />
                            </div>
                            <div className="overflow-hidden">
                              <p className="text-sm font-medium text-gray-300 truncate group-hover:text-white transition-colors">
                                {item.fileName}
                              </p>
                            </div>
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
          </div>
        </div>

        {/* --- FIXED INPUT AREA (Bottom) --- */}
        <div className="p-4 border-t border-white/5 bg-[#1a1c26] shrink-0 rounded-b-2xl">
          {/* Selected File Preview Bubble */}
          {selectedFile && (
            <div className="flex items-center gap-2 mb-3 px-3 py-1.5 bg-[#7c7fff]/10 border border-[#7c7fff]/20 rounded-lg w-fit animate-in fade-in slide-in-from-bottom-2">
              <FileText size={14} className="text-[#7c7fff]" />
              <span className="text-xs font-medium text-[#7c7fff]">{selectedFile.name}</span>
              <button onClick={() => setSelectedFile(null)} className="text-[#7c7fff] hover:text-red-400 ml-1">
                <X size={14} />
              </button>
            </div>
          )}

          <form onSubmit={handleCombinedSubmit} className="flex gap-2 items-center">
            <div className="flex-1 flex items-center bg-[#121218] border border-white/5 rounded-lg px-2 focus-within:border-[#7c7fff] transition-colors">
              <input 
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 bg-transparent py-2.5 px-2 text-white focus:outline-none text-sm"
              />
              
              {/* Hidden File Input */}
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={(e) => setSelectedFile(e.target.files[0])}
                className="hidden"
              />
              
              {/* Attachment Icon Button */}
              <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()}
                className={`p-2 transition-colors ${selectedFile ? 'text-[#7c7fff]' : 'text-gray-400 hover:text-white'}`}
                title="Attach File"
              >
                <Paperclip size={18} />
              </button>
            </div>
            
            {/* Send Button */}
            <button 
              type="submit" 
              disabled={isSubmitting || (!newComment.trim() && !selectedFile)}
              className="bg-[#7c7fff] p-2.5 rounded-lg text-white hover:bg-[#6b6de0] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[44px]"
            >
              {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default TaskDetailsModal;