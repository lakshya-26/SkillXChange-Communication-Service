const { Server } = require('socket.io');
const { socketAuthMiddleware } = require('../middlewares/auth.middleware');

const { createMessage } = require('../services/message.service');
const { validateSocket } = require('../helpers/commonFunctions.helper');
const {
  joinConversationSchema,
  sendMessageSchema,
} = require('../validators/socket.validator');

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
    console.log(`User connected: ${userId}`);

    socket.join(`user:${userId}`);

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${userId}`);
    });

    socket.on('join_conversation', (conversationId) => {
      try {
        const validConversationId = validateSocket(
          conversationId,
          joinConversationSchema
        );
        socket.join(`conversation:${validConversationId}`);
        console.log(
          `User ${userId} joined conversation ${validConversationId}`
        );
      } catch (error) {
        console.error(`Invalid join_conversation data: ${error.message}`);
        socket.emit('error_message', { message: 'Invalid data' });
      }
    });

    socket.on('send_message', async (data) => {
      try {
        const validData = validateSocket(data, sendMessageSchema);
        const { conversationId, content } = validData;

        console.log('📩 New message:', { userId, conversationId, content });

        const savedMessage = await createMessage({
          conversationId,
          senderId: userId,
          content,
        });

        // Broadcast to conversation room
        io.to(`conversation:${conversationId}`).emit(
          'receive_message',
          savedMessage
        );

        // Optionally send push to recipient's personal room
        io.to(`user:${savedMessage.receiverId}`).emit(
          'new_notification',
          savedMessage
        );
      } catch (error) {
        console.error('❌ Error while sending message:', error.message);
        socket.emit('error_message', { message: 'Failed to send message' });
      }
    });
  });

  return io;
}

module.exports = setupSocket;
