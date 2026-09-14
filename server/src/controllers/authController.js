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

/** Enforce the allowed college email pattern (local part before @), if configured. */
function isEmailPatternAllowed(email) {
  const pattern = (process.env.ALLOWED_EMAIL_PATTERN || '').trim();
  if (!pattern) return true; // no restriction
  const localPart = email.split('@')[0];
  try {
    const regex = new RegExp(pattern, 'i');
    return regex.test(localPart);
  } catch (err) {
    console.error('Invalid ALLOWED_EMAIL_PATTERN regex:', err);
    return true;
  }
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
      message: `Only @${process.env.ALLOWED_EMAIL_DOMAIN} campus emails can register.`,
    });
  }

  if (!isEmailPatternAllowed(normalizedEmail)) {
    return res.status(400).json({
      message: `Invalid college email format. The email ID before @ must match the college enrollment pattern (e.g. 21bcon101@${process.env.ALLOWED_EMAIL_DOMAIN || 'vgu.ac.in'}).`,
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

  const isDev = !process.env.SMTP_HOST;
  res.status(200).json({
    message: `Verification code sent to ${normalizedEmail}. It expires in ${minutes} minutes.`,
    email: normalizedEmail,
    ...(isDev ? { devOtp: code } : {}),
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

  const isDev = !process.env.SMTP_HOST;
  res.status(200).json({
    message: `A new code was sent to ${normalizedEmail}.`,
    ...(isDev ? { devOtp: code } : {}),
  });
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
 * Update current user's profile details & skills.
 * PUT /api/auth/profile
 */
export async function updateProfile(req, res) {
  try {
    const {
      name,
      branch,
      semester,
      skills,
      bio,
      interests,
      githubUrl,
      linkedinUrl,
      portfolioUrl,
      avatar,
    } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (name !== undefined) user.name = name.trim();
    if (branch !== undefined) user.branch = branch.trim();
    if (semester !== undefined) user.semester = Number(semester);
    if (bio !== undefined) user.bio = bio.trim();
    if (avatar !== undefined) user.avatar = avatar.trim();
    if (githubUrl !== undefined) user.githubUrl = githubUrl.trim();
    if (linkedinUrl !== undefined) user.linkedinUrl = linkedinUrl.trim();
    if (portfolioUrl !== undefined) user.portfolioUrl = portfolioUrl.trim();

    if (skills !== undefined) {
      if (Array.isArray(skills)) {
        user.skills = skills.map((s) => String(s).trim()).filter(Boolean);
      } else if (typeof skills === 'string') {
        user.skills = skills
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
      }
    }

    if (interests !== undefined) {
      if (Array.isArray(interests)) {
        user.interests = interests.map((i) => String(i).trim()).filter(Boolean);
      } else if (typeof interests === 'string') {
        user.interests = interests
          .split(',')
          .map((i) => i.trim())
          .filter(Boolean);
      }
    }

    await user.save();
    res.status(200).json({
      message: 'Profile updated successfully',
      user,
    });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to update profile' });
  }
}
