const prisma = require('../utilites/prisma');
const { CustomException } = require('../utilites/errorHandler');

const createMessage = async (payload) => {
  const { conversationId, senderId, content } = payload;
  if (!conversationId || !senderId || !content.trim()) {
    throw new CustomException('Invalid message data', 400);
  }

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

  return message;
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
};
