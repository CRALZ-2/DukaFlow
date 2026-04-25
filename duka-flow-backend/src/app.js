'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const router = require('./routes/index');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// ─── Middleware Order (as per MASTER_BLUEPRINT) ────────────────────────────────
// 1. CORS
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}));

// 2. Helmet (security headers)
app.use(helmet());

// 3. JSON body parser
app.use(express.json({ limit: '10mb' }));

// 4. URL-encoded body parser
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 5. HTTP request logger
if (process.env.NODE_ENV !== 'test') {
    app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// 6. API Routes
app.use('/api/v1', router);

// 7. Health check
app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 8. 404 handler (must be before errorHandler)
app.use((_req, res) => {
    res.status(404).json({ status: 'error', message: 'Route not found', data: null });
});

// 9. Global error handler (must be last)
app.use(errorHandler);

module.exports = app;
