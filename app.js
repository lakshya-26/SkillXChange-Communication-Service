const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const { createServer } = require('http');
const { Server } = require('socket.io');

const app = express();
const httpServer = createServer(app);

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Socket.io setup
const io = new Server(httpServer, {
  cors: {
    origin: '*', // Allow all origins for now, configure as needed
    methods: ['GET', 'POST'],
  },
});

// Socket.io authentication middleware (optional, if you want to verify token on connection)
// io.use((socket, next) => {
//   // Implement socket auth here using verifyToken from jwtHelper
//   next();
// });

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });

  // Example: Join a conversation room
  socket.on('join_conversation', (conversationId) => {
    socket.join(conversationId);
    console.log(`User ${socket.id} joined conversation ${conversationId}`);
  });

  // Example: Send message
  socket.on('send_message', (data) => {
    // data should contain conversationId, content, etc.
    // Save to DB (using controller/service) and emit to room
    io.to(data.conversationId).emit('receive_message', data);
  });
});

// Routes
// app.use('/api/v1', routes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'Communication Service' });
});

// Error handling
// app.use(commonErrorHandler);

module.exports = { app, httpServer, io };
