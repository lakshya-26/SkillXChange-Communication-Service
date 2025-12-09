const { CustomException } = require('../utilites/errorHandler');
const prisma = require('../utilites/prisma');

const createConversation = async (payload) => {
  const { user, userB } = payload;
  const userA = user.id;

  if (!userB || userB === userA) {
    throw new CustomException('Invalid user selection', 400);
  }

  // Check if conversation already exists
  const existing = await prisma.conversation.findFirst({
    where: {
      participants: {
        some: { userId: userA },
      },
      AND: {
        participants: {
          some: { userId: userB },
        },
      },
    },
    include: { participants: true },
  });

  if (existing) {
    return existing;
  }

  // Create new conversation
  const newConv = await prisma.conversation.create({
    data: {
      participants: {
        create: [{ userId: userA }, { userId: userB }],
      },
    },
    include: {
      participants: true,
    },
  });

  return newConv;
};

const getConversations = async ({ userId, page = 1, limit = 20 }) => {
  page = parseInt(page, 10);
  limit = parseInt(limit, 10);
  const skip = (page - 1) * limit;

  const [conversations, total] = await Promise.all([
    prisma.conversation.findMany({
      where: {
        participants: {
          some: { userId: Number(userId) },
        },
      },
      orderBy: { updatedAt: 'desc' },
      skip,
      take: limit,
      include: {
        participants: true,
      },
    }),
    prisma.conversation.count({
      where: {
        participants: {
          some: { userId: Number(userId) },
        },
      },
    }),
  ]);

  return {
    page,
    limit,
    total,
    hasMore: total > page * limit,
    conversations,
  };
};

const getChatMessages = async ({ conversationId, page = 1, limit = 20 }) => {
  page = parseInt(page, 10);
  limit = parseInt(limit, 10);
  const skip = (page - 1) * limit;

  const [messages, total] = await Promise.all([
    prisma.message.findMany({
      where: { conversationId: Number(conversationId) },
      orderBy: { createdAt: 'asc' },
      skip,
      take: limit,
    }),
    prisma.message.count({
      where: { conversationId: Number(conversationId) },
    }),
  ]);

  return {
    page,
    limit,
    total,
    hasMore: total > page * limit,
    messages,
  };
};

module.exports = {
  createConversation,
  getConversations,
  getChatMessages,
};
