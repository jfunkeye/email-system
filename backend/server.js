// backend/server.js - Updated CORS configuration
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const db = require('./config/database');

const app = express();

// Enhanced CORS Configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // List of allowed origins
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5500',
      'http://127.0.0.1:5500',
      'http://localhost:8080',
      'https://your-netlify-app.netlify.app',
      'https://your-vercel-app.vercel.app',
      // Add your production frontend URLs here
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      console.log('CORS blocked for origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// Security Middleware
app.use(helmet());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body Parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);

// Health Check - Add CORS headers manually for this endpoint
app.get('/api/health', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json({ 
    status: 'OK', 
    message: 'Authentication API is running',
    timestamp: new Date().toISOString()
  });
});

// Root route with CORS headers
app.get('/', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json({
    success: true,
    message: 'Authentication API Server is running!',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      user: '/api/user',
      health: '/api/health'
    },
    timestamp: new Date().toISOString()
  });
});

// API Base Route - Add this
app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Authentication API Base Endpoint',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: {
        base: '/api/auth',
        endpoints: {
          signup: { method: 'POST', path: '/api/auth/signup', description: 'User registration' },
          login: { method: 'POST', path: '/api/auth/login', description: 'User login' },
          verifyEmail: { method: 'GET', path: '/api/auth/verify-email', description: 'Email verification' },
          forgotPassword: { method: 'POST', path: '/api/auth/forgot-password', description: 'Request password reset' },
          resetPassword: { method: 'POST', path: '/api/auth/reset-password', description: 'Reset password' },
          me: { method: 'GET', path: '/api/auth/me', description: 'Get current user (protected)' }
        }
      },
      user: {
        base: '/api/user',
        endpoints: {
          changePassword: { method: 'POST', path: '/api/user/change-password', description: 'Change password (protected)' },
          updateProfile: { method: 'PUT', path: '/api/user/profile', description: 'Update profile (protected)' }
        }
      },
      health: {
        method: 'GET',
        path: '/api/health',
        description: 'Server health check'
      }
    },
    documentation: 'Visit the root endpoint (/) for more information'
  });
});

// Root route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: '🔐 Authentication API Server',
    version: '1.0.0',
    description: 'Secure authentication system with JWT, email verification, and password reset',
    baseUrl: 'https://email-system-kt6p.onrender.com',
    endpoints: {
      api: '/api - API information (you are here)',
      health: '/api/health - Server status',
      auth: '/api/auth - Authentication endpoints',
      user: '/api/user - User management endpoints'
    },
    features: [
      'User registration with email verification',
      'JWT-based authentication',
      'Password reset with email verification',
      'Secure password hashing',
      'Rate limiting and security headers'
    ],
    timestamp: new Date().toISOString()
  });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'production' ? {} : err.message
  });
});

// 404 Handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found',
    suggestion: 'Try visiting /api or /api/health for available endpoints'
  });
});

const PORT = process.env.PORT || 5000;

// Database Connection Test
db.testConnection()
  .then(() => {
    console.log('✅ Database connected successfully');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV}`);
      console.log(`🌐 Server URL: http://localhost:${PORT}`);
      console.log(`🔗 Available endpoints:`);
      console.log(`   - Root: http://localhost:${PORT}/`);
      console.log(`   - API Base: http://localhost:${PORT}/api`);
      console.log(`   - Health: http://localhost:${PORT}/api/health`);
      console.log(`   - Auth: http://localhost:${PORT}/api/auth`);
    });
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err);
    process.exit(1);
  });

module.exports = app;
