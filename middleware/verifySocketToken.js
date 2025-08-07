const jwt = require('jsonwebtoken');

exports.verifySocketToken = (socket, next) => {
  // Try to get token from multiple sources
  let token = socket.handshake.auth?.token;
  
  // If not in auth, try URL query parameters
  if (!token) {
    const url = new URL(socket.handshake.url, 'http://localhost');
    token = url.searchParams.get('token');
  }

  if (!token) {
    return next(new Error('Authentication failed: No token provided'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    console.log('✅ Socket authenticated for user:', decoded.email || decoded.id);
    next();
  } catch (err) {
    console.error('❌ Socket authentication failed:', err.message);
    next(new Error('Invalid token'));
  }
};
