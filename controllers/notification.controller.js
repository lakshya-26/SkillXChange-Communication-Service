const notificationService = require('../services/notification.service');
const { commonErrorHandler } = require('../utilites/errorHandler');

const getNotifications = async (req, res, next) => {
  try {
    const result = await notificationService.getNotifications({
      userId: req.user.id,
      page: req.query.page,
      limit: req.query.limit,
    });

    req.data = result;
    req.statusCode = 200;
    next();
  } catch (error) {
    console.error('Notification fetch error:', error);
    commonErrorHandler(req, res, error.message, error.statusCode);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await notificationService.markAsRead(id, req.user.id);

    req.data = result;
    req.statusCode = 200;
    next();
  } catch (error) {
    console.error('Notification update error:', error);
    commonErrorHandler(req, res, error.message, error.statusCode);
  }
};

module.exports = {
  getNotifications,
  markAsRead,
};
