const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

// All routes require admin authentication
router.use(protect);
router.use(authorize('admin'));

// User Management
router.get('/users', adminController.getAllUsers);
router.get('/users/stats', adminController.getUserStats);
router.get('/users/:id', adminController.getUserById);
router.put('/users/:id/status', adminController.updateUserStatus);
router.put('/users/:id/role', adminController.updateUserRole);
router.delete('/users/:id', adminController.deleteUser);

// Session Management
router.get('/sessions', adminController.getActiveSessions);
router.delete('/sessions/:userId', adminController.forceLogoutUser);

// Activity Overview
router.get('/activity', adminController.getActivityOverview);

module.exports = router;
