import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import hpp from 'hpp';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middlewares/error.middleware.js';
import { router } from './routes/index.js';
import { ENV } from './config/env.js';

const app = express();

// Secure headers
app.use(helmet());

// Enable CORS
app.use(
  cors({
    origin: ENV.CLIENT_URL,
    credentials: true,
  })
);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parsing
app.use(cookieParser());

// Prevent HTTP parameter pollution
app.use(hpp());

// Gzip compression
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: { message: 'Too many requests from this IP, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Serve static uploaded files (temporary or persistent local storage fallback)
app.use('/uploads', express.static(ENV.UPLOAD_DIR));

// API routes
app.use('/api', router);

// import routes
import healthzRouter from './routes/healthz.route.js';

// managed routes
app.use('/api/v1/', healthzRouter);

// Catch-all 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Resource not found' });
});

// Centralized error handler
app.use(errorHandler);

export { app };
