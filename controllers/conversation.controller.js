const conversationService = require('../services/conversation.service');
const { commonErrorHandler } = require('../utilites/errorHandler');

const createConversation = async (req, res, next) => {
  try {
    const payload = {
      user: req.user,
      ...req.body,
    };
    const conversation = await conversationService.createConversation(payload);
    req.data = conversation;
    req.statusCode = 201;
    next();
  } catch (error) {
    console.error('Conversation error:', error);
    commonErrorHandler(req, res, error.message, error.statusCode);
  }
};

const getConversations = async (req, res, next) => {
  try {
    const payload = {
      ...req.user,
      ...req.query,
    };
    const conversations = await conversationService.getConversations(payload);
    req.data = conversations;
    req.statusCode = 200;
    next();
  } catch (error) {
    console.error('Conversation fetch error:', error);
    commonErrorHandler(req, res, error.message, error.StatusCode);
  }
};

const getChatMessages = async (req, res, next) => {
  try {
    const payload = {
      ...req.params,
      ...req.query,
    };
    const messages = await conversationService.getChatMessages(payload);
    req.data = messages;
    req.statusCode = 200;
    next();
  } catch (error) {
    console.error('Message fetch error', error);
  }
};

const getConversationById = async (req, res, next) => {
  try {
    const conversationId = req.params.conversationId;
    const userId = req.user.id;
    const conversation = await conversationService.getConversationById(
      conversationId,
      userId
    );
    req.data = conversation;
    req.statusCode = 200;
    next();
  } catch (error) {
    console.error('Get conversation error:', error);
    commonErrorHandler(req, res, error.message, error.statusCode);
  }
};

module.exports = {
  createConversation,
  getConversations,
  getChatMessages,
  getConversationById,
};
