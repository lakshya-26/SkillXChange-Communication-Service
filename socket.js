const { Server } = require('socket.io');
const { socketAuthMiddleware } = require('./middlewares/auth.middleware');

const onlineUsers = new Map();

function setupSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      transports: ['websocket', 'polling'],
    },
  });

  io.use(socketAuthMiddleware);

  io.on('connection', (socket) => {
    const userId = socket.user.id;
    onlineUsers.set(userId, socket.id);
    console.log(`User connected: ${userId}`);

    socket.on('disconnect', () => {
      onlineUsers.delete(userId);
      console.log(`User disconnected: ${userId}`);
    });

    socket.on('join_conversation', (conversationId) => {
      socket.join(`conversation:${conversationId}`);
    });

    socket.on('send_message', (data) => {
      io.to(`conversation:${data.conversationId}`).emit(
        'receive_message',
        data
      );
    });
  });

  return io;
}

module.exports = setupSocket;
