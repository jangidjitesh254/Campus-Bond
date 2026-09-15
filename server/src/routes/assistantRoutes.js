import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { handleAssistantQuery } from '../controllers/assistantController.js';

const router = express.Router();

/**
 * Optional authentication: decodes JWT if present to attach req.user
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('name email');
      if (user) req.user = user;
    }
  } catch {
    // Ignore invalid token, proceed unauthenticated
  }
  next();
};

// POST /api/assistant/query
router.post('/query', optionalAuth, handleAssistantQuery);

export default router;
