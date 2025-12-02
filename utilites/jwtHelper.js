const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

const decodeToken = (token) => {
  return jwt.decode(token);
};

module.exports = {
  verifyToken,
  decodeToken,
};
