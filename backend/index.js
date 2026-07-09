const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();
const connectDB = require('./config/db');
const http = require('http');
const { Server } = require('socket.io');
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');
const teamRoutes = require('./routes/teamRoutes');
const passport = require('passport');
const Message = require('./models/Message');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const collaborationRoutes = require('./routes/collaborationRoutes');
// Import karein
const auditRoutes = require('./routes/auditRoutes');


require('./config/passport');

const app = express();
const server = http.createServer(app);
// Middlewares
// Configure CORS origins from env var(s). Accept comma-separated list.
const frontendUrls = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

app.use((req, res, next) => {
  console.log('Incoming request:', req.method, req.path, 'Origin:', req.headers.origin || 'n/a');
  // Log shallow body preview but redact sensitive fields
  if (req.body) {
    const preview = { ...req.body };
    if (preview.password) preview.password = '[REDACTED]';
    try {
      console.log('Body preview:', Object.keys(preview).length ? JSON.stringify(preview) : '<empty>');
    } catch (e) {
      console.log('Body preview: <unserializable>');
    }
  }
  next();
});

app.use(cors({
  origin: function(origin, callback) {
    // Allow non-browser requests (like curl or server-to-server) when origin is undefined
    if (!origin) return callback(null, true);
    if (frontendUrls.includes(origin)) return callback(null, true);
    console.warn('Blocked CORS origin:', origin);
    return callback(new Error('Not allowed by CORS'), false);
  },
  credentials: true
}));
app.use(express.json());
app.use(helmet());
app.use(morgan('dev'));
app.use('/uploads', express.static('uploads'));
app.use(passport.initialize());


connectDB();

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/team', teamRoutes);
app.use('/api/v1/collaboration', collaborationRoutes);
app.use('/api/v1/auditlogs', auditRoutes);

let io;
  io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST","PUT", "PATCH", "DELETE"] }
  });

  io.on('connection', (socket) => {
    socket.on('joinOrganization', (orgId) => {
      socket.join(String(orgId));
      console.log(`User joined organization room: ${orgId}`);
    });
    
    socket.on('joinProjectChat', (projectId) => socket.join(projectId));
    
  socket.on('joinUserRoom', (userId) => {
    socket.join(String(userId));
    console.log(`User joined personal notification room: ${userId}`);
  });

    
    socket.on('sendMessage', async (data) => {
      const { text, sender, projectId, fileUrl } = data;
      const newMessage = await Message.create({ text, sender, projectId, fileUrl });
      const populatedMsg = await Message.findById(newMessage._id).populate('sender', 'name');
      io.to(projectId).emit('receiveMessage', populatedMsg);
    });
  });
app.set('socketio', io);

// REST API Routes
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

    // If socket.io IS running (non-prod), also broadcast it live
    if (io) {
      io.to(projectId).emit('receiveMessage', populatedMsg);
    }

    res.status(201).json(populatedMsg);
  } catch (error) {
    res.status(500).json({ message: "Error sending message" });
  }
});

app.post('/api/v1/upload', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });
  res.json({ filePath: `/uploads/${req.file.filename}` });
});

const PORT = process.env.PORT || 5000;


  server.listen(PORT)
    .on('listening', () => console.log(`Server is running on port ${PORT}`))
    .on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`Port ${PORT} is already in use. Please close the other process.`);
      } else {
        console.error(err);
      }
    });

module.exports = app;