// routes/authRoutes.js
// -----------------------------------------------------------------------
// Auth endpoints get a STRICTER rate limit than the global one in
// app.js, since login/register endpoints are the most common target
// for credential-stuffing / brute-force bots, even though Firebase
// itself absorbs most of that risk.
// -----------------------------------------------------------------------

import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, googleLogin, logout, getMe } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // 20 auth attempts per IP per 15 minutes
  message: 'Too many authentication attempts, please try again later.',
});

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/google', authLimiter, googleLogin);
router.post('/logout', logout);
router.get('/me', protect, getMe);

export default router;
