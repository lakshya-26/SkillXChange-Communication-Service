const router = require('express').Router();
const { authMiddleware } = require('../middlewares/auth.middleware');
const { sendResponse } = require('../middlewares/reqRes.middleware');
const notificationController = require('../controllers/notification.controller');
const notificationValidator = require('../validators/notification.validator');

router.get(
  '/',
  authMiddleware,
  notificationValidator.getNotificationsQuery,
  notificationController.getNotifications,
  sendResponse
);

router.patch(
  '/:id/read',
  authMiddleware,
  notificationValidator.markAsReadParams,
  notificationController.markAsRead,
  sendResponse
);

module.exports = router;
