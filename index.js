require('dotenv').config();
const redis = require('./utilites/redis');
const app = require('./app');
const { createServer } = require('http');
const setupSocket = require('./socket');

const PORT = process.env.PORT || 8080;
const httpServer = createServer(app);

// attach socket
setupSocket(httpServer);

(async () => {
  try {
    await redis.connect();
    console.log('Connected to Redis');

    httpServer.listen(PORT, () => {
      console.log(`Communication Service running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start:', err.message);
    process.exit(1);
  }
})();
