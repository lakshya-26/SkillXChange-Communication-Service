const router = require('express').Router();
const { authMiddleware } = require('../middlewares/auth.middleware');
const { sendResponse } = require('../middlewares/reqRes.middleware');
const conversationController = require('../controllers/conversation.controller');
const conversationValidator = require('../validators/conversation.validator');

router.post(
  '/',
  authMiddleware,
  conversationValidator.createConversation,
  conversationController.createConversation,
  sendResponse
);
router.get(
  '/',
  authMiddleware,
  conversationValidator.getMessagesQuery,
  conversationController.getConversations,
  sendResponse
);

router.get(
  '/eligibility',
  authMiddleware,
  conversationController.checkEligibility,
  sendResponse
);

router.get(
  '/:conversationId',
  authMiddleware,
  conversationValidator.getChatMessagesParams, // reuse param validation
  conversationController.getConversationById,
  sendResponse
);

router.get(
  '/:conversationId/messages',
  authMiddleware,
  conversationValidator.getChatMessagesParams,
  conversationValidator.getChatMessagesQuery,
  conversationController.getChatMessages,
  sendResponse
);

router.get(
  '/:conversationId/stats',
  authMiddleware,
  conversationValidator.getChatMessagesParams,
  conversationController.getConversationStats,
  sendResponse
);

module.exports = router;
