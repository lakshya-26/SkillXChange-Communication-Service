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
    const conversations = await conversationService.getConversations(req.user);
    req.data = conversations;
    req.statusCode = 200;
    next();
  } catch (error) {
    console.error('Conversation fetch error:', error);
    commonErrorHandler(req, res, error.message, error.StatusCode);
  }
};

module.exports = {
  createConversation,
  getConversations,
};
