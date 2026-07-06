import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { Send, X, Paperclip, Loader } from 'lucide-react';
import api from '../services/api';
const ChatPanel = ({ isOpen, onClose, organizationId, user,projectId }) => {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const socketRef = useRef();
  const chatEndRef = useRef(null);

 useEffect(() => {
  const fetchMessages = async () => {
    try {
      // organizationId ki jagah projectId use karein
      const res = await fetch(`http://localhost:5000/api/v1/messages/${projectId}`);
      const data = await res.json();
      setMessages(data);
    } catch (err) { console.error("Error fetching history"); }
  };
  
  if (projectId) fetchMessages();
}, [projectId]);

  useEffect(() => {
    // Backend connection
    socketRef.current = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');
    
 if (projectId) {
    socketRef.current.emit('joinProjectChat', projectId);
  }

    // Message receive karna
    socketRef.current.on('receiveMessage', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => socketRef.current.disconnect();
  }, [projectId]);

  // Auto-scroll to bottom
  useEffect(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), [messages]);

 const sendMessage = () => {
  if (!text.trim()) return;
  const msgData = { 
    text, 
    sender: user._id, // Yahan name ki jagah ID bhejen
    projectId
  };
  socketRef.current.emit('sendMessage', msgData);
  setText('');
};

const handleFileUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  setIsUploading(true);
  setUploadProgress(0);

  const formData = new FormData();
  formData.append('file', file);
  
  try {
    const resp = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percent = Math.round((progressEvent.loaded / progressEvent.total) * 100);
          setUploadProgress(percent);
        }
      },
    });

    if (resp.status === 200 && resp.data.filePath) {
      // Emit file message through Socket.io
      socketRef.current.emit('sendMessage', { 
        text: `📎 ${file.name}`, 
        fileUrl: resp.data.filePath, 
        sender: user._id, 
        projectId 
      });
      
      alert('File uploaded successfully!');
    }
  } catch (err) {
    console.error('Upload error:', err);
    alert('Upload failed: ' + (err.response?.data?.message || err.message));
  } finally {
    setUploadProgress(0);
    setIsUploading(false);
    e.target.value = ''; // Reset input so same file can be uploaded again
  }
};
  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-[#121218] border-l border-white/10 shadow-2xl z-[60] flex flex-col">
      <div className="p-4 border-b border-white/5 flex justify-between items-center bg-[#1a1c26]">
        <h3 className="text-white font-bold text-sm">Team Chat</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={18} /></button>
      </div>
      
      {/* Messages */}
     <div className="flex-1 overflow-y-auto p-4 space-y-4">
  {messages.map((m, i) => {
    // Check karein ke msg bhejne wala khud login user hai ya koi aur
    const isMyMessage = m.sender === user.name || m.sender === user._id;

    return (
      <div key={i} className={`flex flex-col ${isMyMessage ? 'items-end' : 'items-start'}`}>
        <span className="text-[10px] text-gray-500 mb-1">
          {isMyMessage ? 'You' : m.sender}
        </span>
       <div className={`p-2 rounded-lg text-sm max-w-[80%] ${
  isMyMessage 
    ? 'bg-[#7c7fff] text-white rounded-tr-none' 
    : 'bg-[#2a2d3e] text-gray-200 rounded-tl-none'
}`}>
  {m.fileUrl ? (
    <a 
      href={`http://localhost:5000${m.fileUrl}`} 
      target="_blank" 
      rel="noopener noreferrer" 
      className="underline flex items-center gap-2"
    >
      <Paperclip size={14} /> {m.text}
    </a>
  ) : (
    m.text
  )}
</div>
      </div>
    );
  })}
  <div ref={chatEndRef} />
</div>

      {/* Input Area */}
      <div className="p-4 border-t border-white/5 bg-[#1a1c26]">
        {isUploading && (
          <div className="mb-2 text-xs text-gray-400">
            Uploading: {uploadProgress}%
          </div>
        )}
        <div className="flex gap-2">
          <input 
            value={text} 
            onChange={(e) => setText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            disabled={isUploading}
            className="flex-1 bg-[#121218] border border-white/5 rounded-lg p-2 text-white text-sm focus:outline-none focus:border-[#7c7fff] disabled:opacity-50"
            placeholder="Type a message..."
          />
          <button 
            onClick={sendMessage} 
            disabled={isUploading}
            className="p-2 bg-[#7c7fff] rounded-lg text-white hover:bg-[#6b6de0] transition disabled:opacity-50"
          >
            <Send size={16} />
          </button>
          <input 
            type="file" 
            id="fileInput" 
            className="hidden" 
            onChange={handleFileUpload}
            disabled={isUploading}
          />
          <button 
            onClick={() => document.getElementById('fileInput').click()}
            disabled={isUploading}
            className="p-2 text-gray-300 hover:text-white transition disabled:opacity-50"
          >
            {isUploading ? <Loader size={18} className="animate-spin" /> : <Paperclip size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;