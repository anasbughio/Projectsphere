const { Server } = require('socket.io');
const Message = require('../models/Message');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST", "PUT", "PATCH", "DELETE"] }
  });

  io.on('connection', (socket) => {
    socket.on('joinOrganization', (orgId) => socket.join(String(orgId)));
    socket.on('joinProjectChat', (projectId) => socket.join(projectId));
    socket.on('joinUserRoom', (userId) => socket.join(String(userId)));

    socket.on('sendMessage', async (data) => {
      const { text, sender, projectId, fileUrl } = data;
      const newMessage = await Message.create({ text, sender, projectId, fileUrl });
      const populatedMsg = await Message.findById(newMessage._id).populate('sender', 'name');
      io.to(projectId).emit('receiveMessage', populatedMsg);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized!");
  return io;
};

module.exports = { initSocket, getIO };