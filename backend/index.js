const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();
const connectDB = require('./config/db');
const http = require('http');
const passport = require('passport');
const path = require('path');
const meetingRoutes = require('./routes/meetingRoutes');

// Socket & Route Imports
const { initSocket } = require('./config/socket'); //  Socket logic separate
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');
const teamRoutes = require('./routes/teamRoutes');
const collaborationRoutes = require('./routes/collaborationRoutes');
const reportRoutes = require('./routes/reportRoutes');
const auditRoutes = require('./routes/auditRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const organizationRoutes = require('./routes/organizationRoutes');
const { uploadLimiter } = require('./middlewares/rateLimiter');
const milestoneRoutes = require('./routes/milestoneRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const Message = require('./models/Message');
const activityRoutes = require('./routes/activityRoutes');
const superAdminRoutes = require('./routes/superAdminRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const stripeRoutes = require('./routes/stripeRoutes');
const { stripeWebhook ,cancelSubscription} = require('./controllers/stripeController'); 
require('./config/passport');

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server); // socket logic initialized
app.use(morgan('dev'));
const frontendUrls = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

app.post('/api/v1/stripe/webhook', express.raw({ type: 'application/json' }), stripeWebhook);
// Middleware
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(helmet({
  crossOriginResourcePolicy: false, // here give permission to load images to vercel
}));


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
app.use('/api/v1/upload',uploadRoutes);
app.use('/api/v1/dashboard',dashboardRoutes);
app.use('/api/v1/organizations', organizationRoutes);
app.use('/api/v1/milestones', milestoneRoutes);
app.use('/api/v1/meetings', meetingRoutes);
app.use('/api/v1/tickets', ticketRoutes);
app.use('/api/v1/activities', activityRoutes);
app.use('/api/v1/superadmin', superAdminRoutes);
app.use('/api/v1/announcements', announcementRoutes);
app.use('/api/v1/stripe', stripeRoutes);
app.use('/api/v1/workflows', require('./routes/workflowRoutes'));
app.use('/api/v1/timelogs', require('./routes/timeLogRoutes'));
app.use('/api/v1/workload', require('./routes/workloadRoutes'));
app.get('/api/v1/messages/:projectId', async (req, res) => {
  try {
    const messages = await Message.find({ projectId: req.params.projectId })
      .populate('sender', 'name').sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: "Error loading chat" });
  }
});

// Here getIO broadcast
const { getIO } = require('./config/socket'); 

app.post('/api/v1/messages/:projectId', async (req, res) => {
  try {
    const { text, sender, fileUrl } = req.body;
    const { projectId } = req.params;
    const newMessage = await Message.create({ text, sender, projectId, fileUrl });
    const populatedMsg = await Message.findById(newMessage._id).populate('sender', 'name');
    
    // Broadcast live
    getIO().to(projectId).emit('receiveMessage', populatedMsg);
    
    res.status(201).json(populatedMsg);
  } catch (error) {
    res.status(500).json({ message: "Error sending message" });
  }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;