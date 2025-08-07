require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const authRoutes = require('./routes/authRoutes'); 
const stockRoutes = require('./routes/stockRoutes');
const favoriteRoutes = require('./routes/favoriteRoutes');
const cacheRoutes = require('./routes/cacheRoutes');
const positionRoutes = require('./routes/positionRoutes');
const alertRoutes = require('./routes/alertRoutes');
const searchRoutes = require('./routes/searchRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const { initSocketServer } = require('./socket');

// Services
const alertService = require('./services/alertService');
const notificationService = require('./services/notificationService');
const notificationQueueService = require('./services/notificationQueueService');

const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('✅ Connected to MongoDB');
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
});


const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

app.use(cors());
app.use(express.json());

// Serve static files from public directory (frontend build)
app.use(express.static('public'));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use('/api/auth', authRoutes);
app.use('/api/stocks', stockRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/cache', cacheRoutes);
app.use('/api/positions', positionRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/notifications', notificationRoutes);

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// WebSocket
initSocketServer(io);

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // Start background services
  alertService.start();
  notificationQueueService.start();
  
  console.log('🚀 All background services started on PORT', process.env.PORT);
});
