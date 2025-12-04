const router = require('express').Router();
const { authMiddleware } = require('../middlewares/auth.middleware');
const { sendResponse } = require('../middlewares/reqRes.middleware');
const conversationController = require('../controllers/conversation.controller');

router.post(
  '/',
  authMiddleware,
  conversationController.createConversation,
  sendResponse
);
router.get(
  '/',
  authMiddleware,
  conversationController.getConversations,
  sendResponse
);

module.exports = router;
