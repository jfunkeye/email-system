// backend/server.js - Corrected and Optimized
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const db = require('./config/database');

const app = express();

// Security Middleware - Apply helmet first
app.use(helmet());

// Enhanced CORS Configuration - SIMPLIFIED FOR TESTING
const corsOptions = {
  origin: function (origin, callback) {
    // Allow all origins for now - you can restrict this later
    callback(null, true);
    
    // For production, you can use this instead:
    /*
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5500',
      'http://127.0.0.1:5500',
      'http://localhost:8080',
      'https://your-netlify-app.netlify.app',
      'https://your-vercel-app.vercel.app',
    ];
    
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked for origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
    */
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Handle preflight requests globally
app.options('*', cors(corsOptions));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  }
});
app.use(limiter);

// Body Parser Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    success: true,
    status: 'OK', 
    message: 'Authentication API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
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
    }
  });
});

// Root route - SINGLE DEFINITION
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: '🔐 Authentication API Server',
    version: '1.0.0',
    description: 'Secure authentication system with JWT, email verification, and password reset',
    baseUrl: req.protocol + '://' + req.get('host'),
    timestamp: new Date().toISOString(),
    documentation: 'Visit /api for detailed endpoint information',
    quickStart: {
      health: 'GET /api/health',
      register: 'POST /api/auth/signup',
      login: 'POST /api/auth/login'
    }
  });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Error Stack:', err.stack);
  
  // CORS error handling
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      message: 'CORS Error: Request blocked by CORS policy',
      origin: req.headers.origin,
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
    ...(process.env.NODE_ENV === 'development' && { error: err.message, stack: err.stack })
  });
});

// 404 Handler - MUST BE LAST
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found',
    requestedUrl: req.originalUrl,
    method: req.method,
    availableEndpoints: {
      root: 'GET /',
      api: 'GET /api',
      health: 'GET /api/health',
      auth: 'POST /api/auth/signup, POST /api/auth/login, etc.',
      user: 'POST /api/user/change-password (protected)'
    },
    suggestion: 'Visit /api for complete endpoint documentation'
  });
});

const PORT = process.env.PORT || 5000;

// Database Connection and Server Start
const startServer = async () => {
  try {
    console.log('🔌 Attempting database connection...');
    await db.testConnection();
    console.log('✅ Database connected successfully');

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 Server URL: http://localhost:${PORT}`);
      console.log(`🔗 Public URL: https://email-system-kt6p.onrender.com`);
      console.log(`\n📋 Available endpoints:`);
      console.log(`   - Root: /`);
      console.log(`   - API Info: /api`);
      console.log(`   - Health: /api/health`);
      console.log(`   - Auth: /api/auth`);
      console.log(`   - User: /api/user`);
      console.log(`\n⚡ Server is ready to accept requests!`);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    console.error('💡 Troubleshooting tips:');
    console.error('   - Check database credentials in .env file');
    console.error('   - Verify database is running and accessible');
    console.error('   - Check if port', PORT, 'is available');
    process.exit(1);
  }
};

// Start the server
startServer();

module.exports = app;
