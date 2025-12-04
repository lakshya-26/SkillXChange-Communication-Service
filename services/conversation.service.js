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

const getConversations = async (user) => {
  const userId = user.id;

  return prisma.conversation.findMany({
    where: {
      participants: {
        some: { userId },
      },
    },
    orderBy: { updatedAt: 'desc' },
    include: {
      participants: true,
    },
  });
};

module.exports = {
  createConversation,
  getConversations,
};
