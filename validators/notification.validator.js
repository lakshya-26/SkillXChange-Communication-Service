const Joi = require('joi');
const { validateRequest } = require('../helpers/commonFunctions.helper');

const requestParameterTypes = {
  body: 'body',
  query: 'query',
  params: 'param',
};

const getNotificationsQuery = (req, res, next) => {
  const schema = Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
  });
  return validateRequest(req, res, next, schema, requestParameterTypes.query);
};

const markAsReadParams = (req, res, next) => {
  const schema = Joi.object({
    id: Joi.number().integer().required(),
  });
  return validateRequest(req, res, next, schema, requestParameterTypes.params);
};

module.exports = {
  getNotificationsQuery,
  markAsReadParams,
};
