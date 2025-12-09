const { CustomException } = require('../utilites/errorHandler');
const prisma = require('../utilites/prisma');
const redis = require('../utilites/redis');
const { getIO } = require('../utilites/socket');

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

  // Fetch receiver details for the event payload
  const receiverData = await prisma.conversationParticipant.findFirst({
    where: {
      conversationId: newConv.id,
      userId: userB,
    },
  });

  try {
    const io = getIO();
    const isReceiverOnline = await redis.get(`user:online:${userB}`);

    const conversationPayload = {
      ...newConv,
      unreadCount: 0,
      receiver: {
        ...receiverData,
        isOnline: !!isReceiverOnline,
      },
    };

    io.to(`user:${userB}`).emit('new_conversation', conversationPayload);
  } catch (err) {
    console.error('Socket emission error:', err.message);
  }

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
        _count: {
          select: {
            messages: {
              where: {
                senderId: { not: Number(userId) },
                readAt: null,
              },
            },
          },
        },
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

  // Transform result to include unreadCount cleanly
  const conversationList = await Promise.all(
    conversations.map(async (conv) => {
      // Find receiver
      const receiver = conv.participants.find((p) => p.userId !== userId);
      let isOnline = false;
      let lastSeen = null;

      if (receiver) {
        const online = await redis.get(`user:online:${receiver.userId}`);
        isOnline = !!online;
        if (!isOnline) {
          lastSeen = await redis.get(`user:last_seen:${receiver.userId}`);
        }
      }

      return {
        ...conv,
        unreadCount: conv._count.messages,
        _count: undefined,
        receiver: {
          ...receiver,
          isOnline,
          lastSeen,
        },
      };
    })
  );

  return {
    page,
    limit,
    total,
    hasMore: total > page * limit,
    conversations: conversationList,
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
