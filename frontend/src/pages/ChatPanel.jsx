import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { Send, X, Paperclip, Loader, FileText } from 'lucide-react';
import api from '../services/api';

const IS_PROD = import.meta.env.PROD; 
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ChatPanel = ({ isOpen, onClose, organizationId, user, projectId }) => {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0); // FIXED: State added
  
  const socketRef = useRef();
  const pollRef = useRef();
  const chatEndRef = useRef(null);

  // FIXED: Dynamic URL helper to fix localhost connection error
  const getFileLink = (fileUrl) => {
    if (!fileUrl) return '#';
    if (fileUrl.startsWith('http')) return fileUrl;
    
    const baseUrl = import.meta.env?.VITE_API_BASE_URL 
      ? import.meta.env.VITE_API_BASE_URL.split('/api')[0] 
      : API_URL;
    return `${baseUrl}${fileUrl}`;
  };

  const isImage = (fileName) => fileName?.match(/\.(jpg|jpeg|png|gif|webp)$/i);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`${API_URL}/messages/${projectId}`);
      const data = await res.json();
      setMessages(data);
    } catch (err) {
      console.error("Error fetching history", err);
    }
  };

  // FIXED: Wrapped in curly braces to avoid Promise/Effect error
  useEffect(() => {
    if (projectId) {
      fetchMessages();
    }
  }, [projectId]);

  useEffect(() => {
    if (!projectId) return;

    if (!IS_PROD) {
      socketRef.current = io(API_URL);
      socketRef.current.emit('joinProjectChat', projectId);
      socketRef.current.on('receiveMessage', (msg) => {
        setMessages((prev) => [...prev, msg]);
      });
      return () => socketRef.current.disconnect();
    } else {
      pollRef.current = setInterval(fetchMessages, 3000); 
      return () => clearInterval(pollRef.current);
    }
  }, [projectId]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!text.trim()) return;
    const msgData = { text, sender: user._id, projectId };

    if (!IS_PROD && socketRef.current) {
      socketRef.current.emit('sendMessage', msgData);
    } else {
      try {
        await fetch(`${API_URL}/messages/${projectId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(msgData),
        });
        fetchMessages();
      } catch (err) {
        console.error("Send failed", err);
      }
    }
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
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (pe) => {
          if (pe.total) setUploadProgress(Math.round((pe.loaded / pe.total) * 100));
        },
      });

      // If the file uploaded to your server successfully
      if (resp.status === 200 && resp.data.filePath) {
        
        // 1. Prepare the exact same message payload as text messages, but include fileUrl
        const fileMsgData = { 
          text: `📎 ${file.name}`, 
          fileUrl: resp.data.filePath, 
          sender: user._id, 
          projectId
        };

        // 2. Use the SAME logic as your sendMessage() function!
        if (!IS_PROD && socketRef.current) {
          socketRef.current.emit('sendMessage', fileMsgData);
        } else {
          try {
            // Hit your backend POST endpoint so it saves to the DB and broadcasts
            await fetch(`${API_URL}/messages/${projectId}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(fileMsgData),
            });
            fetchMessages(); // Refresh the chat to show the new image
          } catch (err) {
            console.error("Failed to send image message", err);
          }
        }
        
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('Upload failed');
    } finally {
      setUploadProgress(0);
      setIsUploading(false);
      e.target.value = ''; // Reset input
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-[#121218] border-l border-white/10 shadow-2xl z-[60] flex flex-col">
      <div className="p-4 border-b border-white/5 flex justify-between items-center bg-[#1a1c26]">
        <h3 className="text-white font-bold text-sm">Team Chat</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={18} /></button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
    {messages.map((m, i) => {
          // 🔥 THE FIX: Pehle check karein ke sender object hai ya string, phir uski ID extract karein
          const senderId = typeof m.sender === 'object' ? m.sender._id : m.sender;
          
          // Dono ko String mein convert kar ke compare karein taake koi mismatch na ho
          const isMyMessage = String(senderId) === String(user._id);

          return (
            <div key={i} className={`flex flex-col ${isMyMessage ? 'items-end' : 'items-start'}`}>
              <span className="text-[10px] text-gray-500 mb-1">
                {isMyMessage ? 'You' : (m.sender?.name || 'Team Member')}
              </span>
              
              <div className={`p-2 rounded-xl text-sm max-w-[85%] ${isMyMessage ? 'bg-[#7c7fff] text-white rounded-tr-none' : 'bg-[#2a2d3e] text-gray-200 rounded-tl-none'}`}>
                {m.fileUrl ? (
                  <div className="mt-1">
                    {isImage(m.fileUrl) ? (
                      <a href={getFileLink(m.fileUrl)} target="_blank" rel="noopener noreferrer">
                        <img src={getFileLink(m.fileUrl)} alt="att" className="max-w-full h-auto rounded-lg" />
                      </a>
                    ) : (
                      <a href={getFileLink(m.fileUrl)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 bg-white/10 rounded-lg text-white">
                        <FileText size={16} /> <span className="truncate">{m.text ? m.text.replace('📎 ', '') : 'Document'}</span>
                      </a>
                    )}
                  </div>
                ) : (
                  <p className="break-words whitespace-pre-wrap">{m.text}</p>
                )}
              </div>
            </div>
          );
        })}
        <div ref={chatEndRef} />
      </div>

      <div className="p-4 border-t border-white/5 bg-[#1a1c26]">
        {isUploading && <div className="text-xs text-gray-400 mb-2">Uploading: {uploadProgress}%</div>}
        <div className="flex gap-2">
          <input value={text} onChange={(e) => setText(e.target.value)} className="flex-1 bg-[#121218] border border-white/5 rounded-lg p-2 text-white text-sm focus:outline-none" placeholder="Type..." />
          <input type="file" id="chatFileInput" className="hidden" onChange={handleFileUpload} />
          <button onClick={() => document.getElementById('chatFileInput').click()} className="p-2 text-gray-400 hover:text-white"><Paperclip size={18} /></button>
          <button onClick={sendMessage} className="p-2 bg-[#7c7fff] rounded-lg text-white"><Send size={16} /></button>
        </div>
      </div>
    </div>
  );
};
export default ChatPanel;