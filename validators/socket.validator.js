const Joi = require('joi');

const joinConversationSchema = Joi.number().integer().required();

const sendMessageSchema = Joi.object({
  conversationId: Joi.number().integer().required(),
  content: Joi.string().required(),
});

const typingSchema = Joi.object({
  conversationId: Joi.number().integer().required(),
});

module.exports = {
  joinConversationSchema,
  sendMessageSchema,
  typingSchema,
};
