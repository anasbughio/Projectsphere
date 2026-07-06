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
require('./config/passport');
const app = express();

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"]
  }
});
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Jab user login karega toh wo apni organization ke "Room" mein add ho jayega
  socket.on('joinOrganization', (organizationId) => {
    socket.join(organizationId);
    console.log(`User joined organization room: ${organizationId}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});
app.set('socketio', io);

// Middleware
app.use(cors());
app.use(express.json());

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


const PORT = process.env.PORT || 5000;

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
}

module.exports = app;