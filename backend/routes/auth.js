const express = require('express');
const router = express.Router();
const { login, me, getLoginHistory, exportLoginHistory, changePassword, register, forgotPassword, resetPassword, updateProfile, guestLogin } = require('../controllers/authController');
const { authenticate, requireRole } = require('../middleware/auth');

router.post('/login', login);
router.post('/guest', guestLogin);
router.post('/register', register);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', authenticate, me);
router.get('/history', authenticate, requireRole('admin', 'superadmin'), getLoginHistory);
router.get('/history/export', authenticate, requireRole('admin', 'superadmin'), exportLoginHistory);
router.put('/profile', authenticate, updateProfile);
router.put('/change-password', authenticate, changePassword);

module.exports = router;
