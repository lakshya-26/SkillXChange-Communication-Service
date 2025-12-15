const prisma = require('../utilites/prisma');

/**
 * Get notifications for a user
 * @param {Object} params
 * @param {number} params.userId
 * @param {number} [params.page]
 * @param {number} [params.limit]
 */
const getNotifications = async ({ userId, page = 1, limit = 10 }) => {
  page = parseInt(page, 10);
  limit = parseInt(limit, 10);
  const skip = (page - 1) * limit;

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: Number(userId) },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.notification.count({
      where: { userId: Number(userId) },
    }),
  ]);

  // also get unread count
  const unreadCount = await prisma.notification.count({
    where: {
      userId: Number(userId),
      isRead: false,
    },
  });

  return {
    page,
    limit,
    total,
    hasMore: total > page * limit,
    notifications,
    unreadCount,
  };
};

/**
 * Mark a notification as read
 * @param {number} id
 * @param {number} userId - to ensure ownership
 */
const { getIO } = require('../utilites/socket'); // Can safe import since socket exports getter
const { markMessagesAsRead: markMsgsService } = require('./message.service');

// ... existing code ...

const markAsRead = async (id, userId) => {
  // Check if exists and belongs to user
  const notification = await prisma.notification.findUnique({
    where: { id: Number(id) },
  });

  if (!notification) {
    throw new Error('Notification not found');
  }

  if (notification.userId !== Number(userId)) {
    throw new Error('Unauthorized access to notification');
  }

  const updatedNotification = await prisma.notification.update({
    where: { id: Number(id) },
    data: { isRead: true },
  });

  // If this was a message notification, verify if we should mark messages as read too
  if (notification.type === 'MESSAGE' && notification.relatedId) {
    // Mark messages in conversation as read
    const count = await markMsgsService(notification.relatedId, userId);

    // If messages were updated, emit event so chat list updates
    if (count > 0) {
      try {
        const io = getIO();
        io.to(`conversation:${notification.relatedId}`).emit('messages_read', {
          conversationId: notification.relatedId,
          readBy: userId,
        });
      } catch (e) {
        console.error('Socket emit failed in markAsRead', e);
      }
    }
  }

  return updatedNotification;
};

const markNotificationsAsReadByRelatedId = async (userId, relatedId, type) => {
  const { count } = await prisma.notification.updateMany({
    where: {
      userId: Number(userId),
      relatedId: Number(relatedId),
      type: type,
      isRead: false,
    },
    data: { isRead: true },
  });

  return count;
};

const createNotification = async (data) => {
  return prisma.notification.create({
    data,
  });
};

module.exports = {
  getNotifications,
  markAsRead,
  createNotification,
  markNotificationsAsReadByRelatedId,
};
