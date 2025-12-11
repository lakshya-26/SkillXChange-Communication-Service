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

  return prisma.notification.update({
    where: { id: Number(id) },
    data: { isRead: true },
  });
};

/**
 * Create a notification (Internal usage mostly)
 */
const createNotification = async (data) => {
  return prisma.notification.create({
    data,
  });
};

module.exports = {
  getNotifications,
  markAsRead,
  createNotification,
};
