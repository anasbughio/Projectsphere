const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();
const connectDB = require('./config/db');
const http = require('http');
const { Server } = require('socket.io');
const passport = require('passport');
const path = require('path');

// Route Imports
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');
const teamRoutes = require('./routes/teamRoutes');
const collaborationRoutes = require('./routes/collaborationRoutes');
const reportRoutes = require('./routes/reportRoutes');
const auditRoutes = require('./routes/auditRoutes');
const uploadRoutes = require('./routes/uploadRoutes'); // 🔥 Naya Upload Route

const Message = require('./models/Message');
require('./config/passport');

const app = express();
const server = http.createServer(app);

const frontendUrls = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

// Middleware
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.json());
app.use(helmet());
app.use(morgan('dev'));
app.use(passport.initialize());

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if (frontendUrls.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'), false);
  },
  credentials: true
}));

connectDB();

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/team', teamRoutes);
app.use('/api/v1/collaboration', collaborationRoutes);
app.use('/api/v1/auditlogs', auditRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/upload', uploadRoutes); // 🔥 Ab upload yahan se handle hoga

// Socket.io Setup
const io = new Server(server, {
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
app.set('socketio', io);

// Messaging REST API
app.get('/api/v1/messages/:projectId', async (req, res) => {
  try {
    const messages = await Message.find({ projectId: req.params.projectId })
      .populate('sender', 'name').sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: "Error loading chat" });
  }
});

app.post('/api/v1/messages/:projectId', async (req, res) => {
  try {
    const { text, sender, fileUrl } = req.body;
    const { projectId } = req.params;
    const newMessage = await Message.create({ text, sender, projectId, fileUrl });
    const populatedMsg = await Message.findById(newMessage._id).populate('sender', 'name');
    if (io) io.to(projectId).emit('receiveMessage', populatedMsg);
    res.status(201).json(populatedMsg);
  } catch (error) {
    res.status(500).json({ message: "Error sending message" });
  }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;