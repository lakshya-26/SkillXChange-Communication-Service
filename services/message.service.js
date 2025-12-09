const prisma = require('../utilites/prisma');
const { CustomException } = require('../utilites/errorHandler');

const createMessage = async (payload) => {
  const { conversationId, senderId, content } = payload;
  if (!conversationId || !senderId || !content.trim()) {
    throw new CustomException('Invalid message data', 400);
  }

  // Check if conversation exists and user is a participant
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { participants: true },
  });

  if (!conversation) {
    throw new CustomException('Conversation not found', 404);
  }

  const isParticipant = conversation.participants.some(
    (p) => p.userId === senderId
  );

  if (!isParticipant) {
    throw new CustomException('User is not a participant', 403);
  }

  // Determine receiver (the other participant)
  const receiverData = conversation.participants.find(
    (p) => p.userId !== senderId
  );

  const message = await prisma.message.create({
    data: {
      conversationId,
      senderId,
      content,
    },
  });

  // Update conversation timestamp
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });

  return {
    ...message,
    receiverId: receiverData?.userId,
  };
};

const markMessagesAsRead = async (conversationId, userId) => {
  // Update messages sent by OTHERS in this conversation
  const updateResult = await prisma.message.updateMany({
    where: {
      conversationId,
      senderId: { not: userId },
      readAt: null,
    },
    data: {
      readAt: new Date(),
    },
  });

  return updateResult.count;
};

const getMessages = async (conversationId) => {
  if (!conversationId) {
    throw new CustomException('Conversation ID required', 400);
  }

  return prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'asc' },
  });
};

module.exports = {
  createMessage,
  getMessages,
  markMessagesAsRead,
};
