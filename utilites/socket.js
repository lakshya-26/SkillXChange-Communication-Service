const { Server } = require('socket.io');
const redis = require('./redis');
const { socketAuthMiddleware } = require('../middlewares/auth.middleware');

const {
  createMessage,
  markMessagesAsRead,
} = require('../services/message.service');
const { validateSocket } = require('../helpers/commonFunctions.helper');
const {
  joinConversationSchema,
  sendMessageSchema,
  typingSchema,
} = require('../validators/socket.validator');

let io;

function setupSocket(httpServer) {
  io = new Server(httpServer, {
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

    // Set user online
    const onlineKey = `user:online:${userId}`;
    redis.set(onlineKey, 'true', null).catch((err) => {
      console.error('Redis error setting online status:', err);
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${userId}`);
      // Remove online status and set last seen
      redis.del(onlineKey).catch((err) => {
        console.error('Redis error removing online status:', err);
      });

      const lastSeenKey = `user:last_seen:${userId}`;
      redis.set(lastSeenKey, new Date().toISOString(), null).catch((err) => {
        console.error('Redis error setting last seen:', err);
      });
    });

    socket.on('join_conversation', async (conversationId) => {
      try {
        const validConversationId = validateSocket(
          conversationId,
          joinConversationSchema
        );
        socket.join(`conversation:${validConversationId}`);
        console.log(
          `User ${userId} joined conversation ${validConversationId}`
        );

        // Mark messages as read
        const updatedCount = await markMessagesAsRead(
          validConversationId,
          userId
        );

        if (updatedCount > 0) {
          // Notify the room that messages have been read
          io.to(`conversation:${validConversationId}`).emit('messages_read', {
            conversationId: validConversationId,
            readBy: userId,
          });
        }
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

        // Check if receiver is online - if not, send Push Notification
        const receiverRoom = io.sockets.adapter.rooms.get(
          `user:${savedMessage.receiverId}`
        );
        if (!receiverRoom || receiverRoom.size === 0) {
          console.log(
            `User ${savedMessage.receiverId} is offline. Sending Push Notification...`
          );
          // TODO: Integrate with FCM or other Push Service here
        }
      } catch (error) {
        console.error('❌ Error while sending message:', error.message);
        socket.emit('error_message', { message: 'Failed to send message' });
      }
    });

    socket.on('typing_start', (data) => {
      try {
        const val = validateSocket(data, typingSchema);
        socket
          .to(`conversation:${val.conversationId}`)
          .emit('participant_typing', {
            conversationId: val.conversationId,
            userId: userId,
          });
      } catch (error) {
        // Silent fail or log
        console.error('Typing start error:', error.message);
      }
    });

    socket.on('typing_stop', (data) => {
      try {
        const val = validateSocket(data, typingSchema);
        socket
          .to(`conversation:${val.conversationId}`)
          .emit('participant_stopped_typing', {
            conversationId: val.conversationId,
            userId: userId,
          });
      } catch (error) {
        console.error('Typing stop error:', error.message);
      }
    });
  });

  return io;
}

module.exports = {
  setupSocket,
  getIO: () => {
    if (!io) {
      throw new Error('Socket.io not initialized!');
    }
    return io;
  },
};
