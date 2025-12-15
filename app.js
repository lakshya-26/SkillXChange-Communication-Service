const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const routes = require('./routes');
const { commonErrorHandler } = require('./utilites/errorHandler');
const { ping } = require('./utilites/redis');
const prisma = require('./utilites/prisma');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.disable('x-powered-by');

// Health API
app.use('/health', async (_req, res) => {
  try {
    const [results] = await prisma.$queryRaw`SELECT NOW() as current_time`;
    const redisPing = await ping();
    return res.send({
      message: 'Application running successfully!',
      uptime: process.uptime(),
      database: results.current_time,
      redis: redisPing,
    });
  } catch (error) {
    return commonErrorHandler(_req, res, error.message, 400);
  }
});

// REST Routes
routes.registerRoutes(app);

app.use((req, res) => commonErrorHandler(req, res, 'Invalid endpoint', 404));

module.exports = app;
