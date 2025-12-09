const Joi = require('joi');
const { validateRequest } = require('../helpers/commonFunctions.helper');

const requestParameterTypes = {
  body: 'body',
  query: 'query',
  params: 'param',
};

const createConversation = (req, res, next) => {
  const schema = Joi.object({
    userB: Joi.number().integer().required(),
  });
  return validateRequest(req, res, next, schema, requestParameterTypes.body);
};

const getMessagesQuery = (req, res, next) => {
  const schema = Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
  });
  return validateRequest(req, res, next, schema, requestParameterTypes.query);
};

const getChatMessagesParams = (req, res, next) => {
  const schema = Joi.object({
    conversationId: Joi.number().integer().required(),
  });
  return validateRequest(req, res, next, schema, requestParameterTypes.params);
};

const getChatMessagesQuery = (req, res, next) => {
  const schema = Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
  });
  return validateRequest(req, res, next, schema, requestParameterTypes.query);
};

module.exports = {
  createConversation,
  getChatMessagesParams,
  getChatMessagesQuery,
  getMessagesQuery,
};
