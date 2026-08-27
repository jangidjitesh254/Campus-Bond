import bcrypt from 'bcryptjs';
import { validationResult } from 'express-validator';
import User from '../models/User.js';
import Otp from '../models/Otp.js';
import { sendEmail } from '../utils/sendEmail.js';
import { generateToken } from '../utils/generateToken.js';

/** Return the first validation error, if any. */
function firstValidationError(req) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return errors.array()[0].msg;
  return null;
}

/** Enforce the allowed college email domain, if one is configured. */
function isEmailDomainAllowed(email) {
  const domain = (process.env.ALLOWED_EMAIL_DOMAIN || '').trim().toLowerCase();
  if (!domain) return true; // no restriction during development
  return email.toLowerCase().endsWith(`@${domain}`) || email.toLowerCase().endsWith(domain);
}

/** Generate a 6-digit numeric OTP. */
function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/**
 * STEP 1 — Register: validate details, create/refresh an OTP, email it.
 * The user account is NOT created yet; the details are held on the OTP doc
 * until the code is verified.
 * POST /api/auth/register
 */
export async function register(req, res) {
  const validationError = firstValidationError(req);
  if (validationError) return res.status(400).json({ message: validationError });

  const { name, email, password, branch, semester } = req.body;
  const normalizedEmail = email.toLowerCase().trim();

  if (!isEmailDomainAllowed(normalizedEmail)) {
    return res.status(403).json({
      message: `Only ${process.env.ALLOWED_EMAIL_DOMAIN} campus emails can register.`,
    });
  }

  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    return res.status(409).json({ message: 'An account with this email already exists. Please log in.' });
  }

  const code = generateOtp();
  const codeHash = await Otp.hashCode(code);
  const passwordHash = await bcrypt.hash(password, await bcrypt.genSalt(10));
  const minutes = Number(process.env.OTP_EXPIRES_MINUTES) || 10;
  const expiresAt = new Date(Date.now() + minutes * 60 * 1000);

  // Replace any earlier pending OTP for this email.
  await Otp.findOneAndDelete({ email: normalizedEmail, purpose: 'signup' });
  await Otp.create({
    email: normalizedEmail,
    codeHash,
    purpose: 'signup',
    payload: { name, passwordHash, branch, semester },
    expiresAt,
  });

  await sendEmail({
    to: normalizedEmail,
    subject: 'Your Campus Bond verification code',
    text: `Welcome to Campus Bond! Your verification code is ${code}. It expires in ${minutes} minutes.`,
  });

  res.status(200).json({
    message: `Verification code sent to ${normalizedEmail}. It expires in ${minutes} minutes.`,
    email: normalizedEmail,
  });
}

/**
 * STEP 2 — Verify OTP: create the real account and return a JWT.
 * POST /api/auth/verify-otp
 */
export async function verifyOtp(req, res) {
  const validationError = firstValidationError(req);
  if (validationError) return res.status(400).json({ message: validationError });

  const { email, code } = req.body;
  const normalizedEmail = email.toLowerCase().trim();

  const otp = await Otp.findOne({ email: normalizedEmail, purpose: 'signup' });
  if (!otp) {
    return res.status(400).json({ message: 'No pending verification found. Please register again.' });
  }

  if (otp.attempts >= 5) {
    await otp.deleteOne();
    return res.status(429).json({ message: 'Too many incorrect attempts. Please register again.' });
  }

  const match = await otp.compareCode(String(code));
  if (!match) {
    otp.attempts += 1;
    await otp.save();
    return res.status(400).json({ message: 'Incorrect verification code.' });
  }

  // Code is valid — create the verified user from the stored payload.
  const user = await User.create({
    name: otp.payload.name,
    email: normalizedEmail,
    passwordHash: otp.payload.passwordHash,
    branch: otp.payload.branch,
    semester: otp.payload.semester,
    isVerified: true,
  });

  await otp.deleteOne();

  res.status(201).json({
    token: generateToken(user._id),
    user,
  });
}

/**
 * Resend a fresh OTP for a still-pending signup.
 * POST /api/auth/resend-otp
 */
export async function resendOtp(req, res) {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required.' });
  const normalizedEmail = email.toLowerCase().trim();

  const otp = await Otp.findOne({ email: normalizedEmail, purpose: 'signup' });
  if (!otp) {
    return res.status(400).json({ message: 'No pending verification found. Please register again.' });
  }

  const code = generateOtp();
  otp.codeHash = await Otp.hashCode(code);
  otp.attempts = 0;
  const minutes = Number(process.env.OTP_EXPIRES_MINUTES) || 10;
  otp.expiresAt = new Date(Date.now() + minutes * 60 * 1000);
  await otp.save();

  await sendEmail({
    to: normalizedEmail,
    subject: 'Your new Campus Bond verification code',
    text: `Your new verification code is ${code}. It expires in ${minutes} minutes.`,
  });

  res.status(200).json({ message: `A new code was sent to ${normalizedEmail}.` });
}

/**
 * Log in with email + password.
 * POST /api/auth/login
 */
export async function login(req, res) {
  const validationError = firstValidationError(req);
  if (validationError) return res.status(400).json({ message: validationError });

  const { email, password } = req.body;
  const normalizedEmail = email.toLowerCase().trim();

  const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');
  if (!user) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  const match = await user.comparePassword(password);
  if (!match) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  res.status(200).json({
    token: generateToken(user._id),
    user,
  });
}

/**
 * Get the currently logged-in user's profile.
 * GET /api/auth/me
 */
export async function getMe(req, res) {
  res.status(200).json({ user: req.user });
}

/**
 * Update the current user's profile (name, branch, semester, avatar).
 * PATCH /api/auth/profile  (multipart/form-data; optional `avatar` file)
 */
export async function updateProfile(req, res) {
  const { name, branch, semester } = req.body;
  const user = req.user;

  if (name !== undefined && name.trim()) user.name = name.trim();
  if (branch !== undefined) user.branch = branch.trim();
  if (semester !== undefined && semester !== '') {
    const s = Number(semester);
    if (!Number.isNaN(s)) user.semester = s;
  }
  if (req.file) user.avatar = `/uploads/${req.file.filename}`;

  await user.save();
  res.status(200).json({ user });
}
