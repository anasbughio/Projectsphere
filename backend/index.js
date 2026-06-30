const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();

// Middlewares
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

// Basic Health Check Route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'Success', message: 'ProjectSphere API is running smoothly.' });
});

// Port and Server Start
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});