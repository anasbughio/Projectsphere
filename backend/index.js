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
const teamRoutes = require('./routes/teamRoutes'); // Upar imports mein
const passport = require('passport');
const Message = require('./models/Message');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
require('./config/passport');


const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"]
  }
});
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

socket.on('joinProjectChat', (projectId) => {
  socket.join(projectId); // User us specific project ke room mein chala gaya
  console.log(`User joined project chat: ${projectId}`);
});

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
  
 socket.on('sendMessage', async (data) => {
  const { text, sender, projectId, fileUrl } = data;

  try {
    const messageData = { text, sender, projectId };
    if (fileUrl) messageData.fileUrl = fileUrl;
    
    const newMessage = await Message.create(messageData);
    const populatedMsg = await Message.findById(newMessage._id).populate('sender', 'name');
    
    // Emit to all users in the project room
    io.to(projectId).emit('receiveMessage', populatedMsg);
  } catch (error) {
    console.error('Error saving message:', error);
  }
});
});
app.set('socketio', io);



app.set('trust proxy', 1);

// Initialize passport middleware
app.use(passport.initialize());


connectDB(); 

// Middlewares
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

app.use('/api/v1/auth', authRoutes); 
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/team', teamRoutes);
app.get('/api/v1/messages/:projectId', async (req, res) => {
  try {
   const messages = await Message.find({ projectId: req.params.projectId })
                                .populate('sender', 'name') 
                                .sort({ createdAt: 1 });
  res.json(messages);
  } catch (error) {
    res.status(500).json({ message: "Error loading chat" });
  }
});
app.post('/api/v1/upload', upload.single('file'), async (req, res) => {
  try {
    console.log('Upload endpoint hit. file present:', !!req.file);
    if (req.file) {
      console.log('Uploaded file info:', {
        originalname: req.file.originalname,
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype,
      });
    }
    if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });
    return res.json({ filePath: `/uploads/${req.file.filename}` });
  } catch (error) {
    console.error('Error handling upload:', error);
    return res.status(500).json({ message: 'Upload failed', error: error.message });
  }
});
const PORT = process.env.PORT || 5000;

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
}

module.exports = app;