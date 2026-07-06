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
require('./config/passport');

const app = express();

// Middlewares
app.use(cors({
  origin: [process.env.FRONTEND_URL || "http://localhost:5173"],
  credentials: true
}));
app.use(express.json());
app.use(helmet());
app.use(morgan('dev'));
app.use('/uploads', express.static('uploads'));
app.use(passport.initialize());

// DB Connection
connectDB();

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/team', teamRoutes);

// Socket Logic (Only initialize if not in production environment to avoid Vercel crash)
const server = http.createServer(app);
let io;

if (process.env.NODE_ENV !== 'production') {
  io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
  });

  io.on('connection', (socket) => {
    socket.on('joinProjectChat', (projectId) => socket.join(projectId));
    
    socket.on('sendMessage', async (data) => {
      const { text, sender, projectId, fileUrl } = data;
      const newMessage = await Message.create({ text, sender, projectId, fileUrl });
      const populatedMsg = await Message.findById(newMessage._id).populate('sender', 'name');
      io.to(projectId).emit('receiveMessage', populatedMsg);
    });
  });
}

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

// Sirf local development mein server ko listen karwayein
if (process.env.NODE_ENV !== 'production') {
  server.listen(PORT)
    .on('listening', () => console.log(`Server is running on port ${PORT}`))
    .on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`Port ${PORT} is already in use. Please close the other process.`);
      } else {
        console.error(err);
      }
    });
}
module.exports = app;