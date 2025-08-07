const io = require('socket.io-client');

// Test socket connection
const socket = io('http://localhost:3001', {
  transports: ['websocket']
});

socket.on('connect', () => {
  console.log('✅ Connected to server');
  
  // Test authentication
  socket.emit('auth', {
    token: 'test-token'
  });
});

socket.on('auth_error', (data) => {
  console.log('❌ Auth error:', data);
});

socket.on('auth_success', (data) => {
  console.log('✅ Auth success:', data);
});

socket.on('stockUpdate', (data) => {
  console.log('📊 Stock update received:', data.length, 'stocks');
});

socket.on('disconnect', () => {
  console.log('❌ Disconnected from server');
});

socket.on('connect_error', (error) => {
  console.log('❌ Connection error:', error);
});

// Test for 10 seconds then disconnect
setTimeout(() => {
  console.log('🔄 Test completed, disconnecting...');
  socket.disconnect();
  process.exit(0);
}, 10000);
