require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const yaml = require('js-yaml');
const routes = require('./routes/index');
const { strictLimiter } = require('./middleware/rateLimit.middleware');
const { errorHandler, notFoundHandler } = require('./middleware/error.middleware');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3001;

// ── Security ──────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ── Rate limiting ─────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: {
        code: 'RATE_LIMIT',
        message: 'Too many requests, please try again later',
      },
    },
  });
  app.use(limiter);
}

// ── Body parsing ──────────────────────────────
app.use(express.json());

// ── Swagger docs ──────────────────────────────
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'ClassRep Vote API Docs',
}));
app.get('/api-docs.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});
app.get('/api-docs.yaml', (_req, res) => {
  res.setHeader('Content-Type', 'application/yaml');
  res.send(yaml.dump(swaggerSpec));
});

// ── API routes ────────────────────────────────
app.use('/api/v1/auth', strictLimiter);
app.use('/api/v1/voters/vote', strictLimiter);
app.use('/api/v1/voters/register', strictLimiter);
app.use('/api/v1/voters/register-batch', strictLimiter);
app.use('/api/v1', routes);

// ── Error handling ────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ── Start server ──────────────────────────────
if (process.env.NODE_ENV !== 'test' && require.main === module) {
  app.listen(PORT, () => {
    logger.info(`ClassRep Vote API running on http://localhost:${PORT}`);
    logger.info(`Swagger docs available at http://localhost:${PORT}/api-docs`);
    logger.info(`Swagger JSON at http://localhost:${PORT}/api-docs.json`);
    logger.info(`Swagger YAML at http://localhost:${PORT}/api-docs.yaml`);
  });
}

module.exports = app;
