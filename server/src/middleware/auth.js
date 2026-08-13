import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Protects routes: requires a valid "Authorization: Bearer <token>" header.
 * On success, attaches the current user to req.user.
 */
export async function protect(req, res, next) {
  let token;
  const header = req.headers.authorization;

  if (header && header.startsWith('Bearer ')) {
    token = header.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'User no longer exists.' });
    }
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: 'Not authorized, token invalid or expired.' });
  }
}

/** Restrict a route to admins only. Use after `protect`. */
export function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required.' });
  }
  next();
}
