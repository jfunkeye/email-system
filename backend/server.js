// backend/server.js - Fixed CORS and Security Configuration
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const db = require('./config/database');

const app = express();

// CORS Configuration - APPLY FIRST
const corsOptions = {
  origin: function (origin, callback) {
    // Allow all origins in development, restrict in production
    if (process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      // In production, allow specific origins + your frontend domains
      const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:5500',
        'http://127.0.0.1:5500',
        'http://localhost:8080',
        'https://your-netlify-app.netlify.app',
        'https://your-vercel-app.vercel.app',
        // Add your actual frontend domains here
        'https://yourfrontend.netlify.app', // Replace with your actual frontend URL
        location.origin // Current frontend origin
      ];
      
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log('CORS blocked origin:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  exposedHeaders: ['Content-Length', 'Authorization'],
  optionsSuccessStatus: 200,
  preflightContinue: false,
  maxAge: 86400 // 24 hours
};

// Apply CORS middleware FIRST
app.use(cors(corsOptions));

// Custom CORS headers for all responses
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Set CORS headers for all responses
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  res.header(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, OPTIONS, PATCH'
  );
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Security Middleware - Configure helmet to work with CORS
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  }
}));

// Disable specific helmet features that block CORS
app.use((req, res, next) => {
  res.removeHeader('Cross-Origin-Resource-Policy');
  res.removeHeader('Cross-Origin-Embedder-Policy');
  next();
});

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Body Parser Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url} - Origin: ${req.headers.origin}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);

// Health Check Endpoint - No authentication required
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    success: true,
    status: 'OK', 
    message: 'Authentication API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    cors: 'enabled',
    allowedOrigins: process.env.NODE_ENV === 'development' ? 'all' : 'restricted'
  });
});

// API Base Route
app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Authentication API Base Endpoint',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    baseUrl: req.protocol + '://' + req.get('host'),
    cors: {
      enabled: true,
      allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    },
    endpoints: {
      auth: '/api/auth',
      user: '/api/user',
      health: '/api/health'
    }
  });
});

// Root route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: '🔐 Authentication API Server',
    version: '1.0.0',
    description: 'Secure authentication system with JWT, email verification, and password reset',
    baseUrl: req.protocol + '://' + req.get('host'),
    timestamp: new Date().toISOString(),
    cors: 'Enabled for cross-origin requests',
    documentation: 'Visit /api for detailed endpoint information'
  });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Error Stack:', err.stack);
  
  // CORS error
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      message: 'CORS Error: Request blocked by CORS policy',
      origin: req.headers.origin,
      allowedOrigins: process.env.NODE_ENV === 'development' ? 'All origins' : 'Restricted origins',
      suggestion: 'Contact administrator to add your domain to allowed origins'
    });
  }

  // Rate limit error
  if (err.status === 429) {
    return res.status(429).json({
      success: false,
      message: 'Rate limit exceeded',
      suggestion: 'Please try again later'
    });
  }

  // General error
  res.status(err.status || 500).json({ 
    success: false, 
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { 
      error: err.message,
      stack: err.stack 
    })
  });
});

// 404 Handler - MUST BE LAST
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found',
    requestedUrl: req.originalUrl,
    method: req.method,
    availableEndpoints: [
      'GET /',
      'GET /api', 
      'GET /api/health',
      'POST /api/auth/signup',
      'POST /api/auth/login'
    ]
  });
});

const PORT = process.env.PORT || 5000;

// Database Connection and Server Start
const startServer = async () => {
  try {
    console.log('🔌 Attempting database connection...');
    await db.testConnection();
    console.log('✅ Database connected successfully');

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 Local URL: http://localhost:${PORT}`);
      console.log(`🔗 Public URL: https://email-system-kt6p.onrender.com`);
      console.log(`🔧 CORS: Enabled`);
      console.log(`\n📋 Available endpoints:`);
      console.log(`   ✅ GET  / - Root endpoint`);
      console.log(`   ✅ GET  /api - API information`);
      console.log(`   ✅ GET  /api/health - Health check`);
      console.log(`   ✅ POST /api/auth/signup - User registration`);
      console.log(`   ✅ POST /api/auth/login - User login`);
      console.log(`\n⚡ Server is ready to accept requests from any origin!`);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

// Start the server
startServer();

module.exports = app;
