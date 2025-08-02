require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const authRoutes = require('./routes/authRoutes'); 
const stockRoutes = require('./routes/stockRoutes');
const { initSocketServer } = require('./socket');

const mongoose = require('mongoose');

// 🔁 Add this before server.listen
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

// Routes
app.get('/', (req, res) => {
  res.send('✅ Stock backend is live!');
});
app.use('/api/auth', authRoutes);
app.use('/api/stocks', stockRoutes);

// WebSocket
initSocketServer(io);

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
