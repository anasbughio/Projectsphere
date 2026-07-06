import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const ChatBox = () => {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const socket = io('http://localhost:5000');
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    socket.emit('joinOrganization', user.organizationId);
    
    socket.on('receiveMessage', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => socket.off('receiveMessage');
  }, []);

  const sendMessage = () => {
    socket.emit('sendMessage', { 
      text, 
      sender: user._id, 
      organizationId: user.organizationId 
    });
    setText('');
  };

  return (
    <div className="bg-[#121218] p-4 rounded-xl border border-gray-800">
      <div className="h-60 overflow-y-auto mb-4">
        {messages.map((m, i) => <p key={i} className="text-white">{m.text}</p>)}
      </div>
      <input 
        value={text} 
        onChange={(e) => setText(e.target.value)}
        className="w-full bg-[#1a1c26] text-white p-2"
        placeholder="Type a message..."
      />
      <button onClick={sendMessage} className="bg-blue-600 mt-2 px-4 py-2 text-white">Send</button>
    </div>
  );
};