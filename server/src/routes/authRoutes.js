import { Router } from 'express';
import { body } from 'express-validator';
import {
  register,
  verifyOtp,
  resendOtp,
  login,
  getMe,
  updateProfile,
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { uploadImage } from '../middleware/upload.js';

const router = Router();

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required.'),
    body('email').isEmail().withMessage('A valid email is required.'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),
  ],
  register
);

router.post(
  '/verify-otp',
  [
    body('email').isEmail().withMessage('A valid email is required.'),
    body('code').notEmpty().withMessage('Verification code is required.'),
  ],
  verifyOtp
);

router.post('/resend-otp', resendOtp);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('A valid email is required.'),
    body('password').notEmpty().withMessage('Password is required.'),
  ],
  login
);

router.get('/me', protect, getMe);
router.patch('/profile', protect, uploadImage.single('avatar'), updateProfile);
// JSON variant (the web app): same handler, no file upload.
router.put('/profile', protect, updateProfile);

export default router;
