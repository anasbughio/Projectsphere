import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'https://projectsphere-dlvv.onrender.com';

const socket = io(SOCKET_URL, {
  transports: ['websocket', 'polling'] // disconnect on render
});

const ChatBox = () => {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  
  // Safe parsing in case user is not logged in
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (user?.organizationId) {
      socket.emit('joinOrganization', user.organizationId);
    }
    
    socket.on('receiveMessage', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => socket.off('receiveMessage');
  }, [user?.organizationId]);

  const sendMessage = () => {
    if (!text.trim()) return; // to prevent on sending empty message

    socket.emit('sendMessage', { 
      text, 
      sender: user._id, 
      organizationId: user.organizationId 
    });
    setText('');
  };

  return (
    <div className="bg-[#121218] p-4 rounded-xl border border-gray-800">
      <div className="h-60 overflow-y-auto mb-4 flex flex-col gap-2">
        {messages.map((m, i) => (
          <p key={i} className="text-white bg-[#1a1c26] p-2 rounded-lg text-sm w-fit">
            {m.text}
          </p>
        ))}
      </div>
      
      <div className="flex gap-2">
        <input 
          value={text} 
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()} 
          className="flex-1 bg-[#1a1c26] border border-gray-700 text-white p-2.5 rounded-lg focus:outline-none focus:border-blue-500"
          placeholder="Type a message..."
        />
        <button 
          onClick={sendMessage} 
          className="bg-blue-600 hover:bg-blue-500 transition px-5 py-2.5 rounded-lg text-white font-medium"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatBox;