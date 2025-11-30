const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const db = require('./config/database');

const app = express();

// Security Middleware
app.use(helmet());

// CORS Configuration
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:5500', // Live Server
    'http://127.0.0.1:5500', // Live Server alternative
    'http://localhost:8080', // XAMPP
    'https://your-netlify-app.netlify.app' // Your Netlify URL
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

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

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Authentication API is running',
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
