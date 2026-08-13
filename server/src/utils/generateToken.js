import jwt from 'jsonwebtoken';

/** Create a signed JWT for a user id. */
export function generateToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  });
}
