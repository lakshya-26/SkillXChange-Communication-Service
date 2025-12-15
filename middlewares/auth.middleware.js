const { verifyToken } = require('../utilites/jwtHelper');
const { commonErrorHandler } = require('../utilites/errorHandler');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return commonErrorHandler(req, res, 'Authorization token is required', 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyToken(token);
    req.user = decoded; // Attach decoded user payload to the request
    next();
  } catch (error) {
    console.error('Error while verifying token:', error.message);
    return commonErrorHandler(req, res, 'Invalid or expired token', 401);
  }
};

const socketAuthMiddleware = (socket, next) => {
  const token = socket.handshake.auth?.token;

  if (!token) {
    return next(new Error('Authorization token is required'));
  }

  try {
    const decoded = verifyToken(token);
    socket.user = decoded;
    next();
  } catch (error) {
    console.error('Error while verifying token:', error.message);
    return next(new Error('Invalid or expired token'));
  }
};

module.exports = {
  authMiddleware,
  socketAuthMiddleware,
};
