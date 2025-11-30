const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const EmailService = require('../utils/emailService');
const auth = require('../middleware/auth');

const router = express.Router();

// ADD THIS: Base route for /api/user (Protected)
router.get('/', auth, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'User Management API Endpoints',
    user: {
      id: req.user.id,
      email: req.user.email,
      firstName: req.user.first_name,
      lastName: req.user.last_name
    },
    endpoints: {
      changePassword: {
        method: 'POST',
        path: '/api/user/change-password',
        description: 'Change password while logged in'
      },
      updateProfile: {
        method: 'PUT',
        path: '/api/user/profile',
        description: 'Update user profile'
      }
    },
    timestamp: new Date().toISOString()
  });
});

// Input validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Change Password Route (Protected)
router.post('/change-password', [
  auth,
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], handleValidationErrors, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Get user with password
    const user = await User.findByEmail(req.user.email);
    
    // Verify current password
    const isCurrentPasswordValid = await User.comparePassword(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    await User.changePassword(userId, newPassword);

    // Send confirmation email
    await EmailService.sendPasswordChangeConfirmation(user.email, user.first_name);

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during password change'
    });
  }
});

// Update Profile Route (Protected)
router.put('/profile', [
  auth,
  body('firstName').optional().notEmpty().trim().escape(),
  body('lastName').optional().notEmpty().trim().escape()
], handleValidationErrors, async (req, res) => {
  try {
    const { firstName, lastName } = req.body;
    const userId = req.user.id;

    // Update user profile
    const query = 'UPDATE users SET first_name = ?, last_name = ? WHERE id = ?';
    const [result] = await User.pool.execute(query, [firstName, lastName, userId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get updated user
    const updatedUser = await User.findById(userId);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: updatedUser
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during profile update'
    });
  }
});

module.exports = router;
