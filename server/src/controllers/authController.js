import bcrypt from 'bcryptjs';
import { validationResult } from 'express-validator';
import User from '../models/User.js';
import Otp from '../models/Otp.js';
import { sendEmail } from '../utils/sendEmail.js';
import { otpEmail } from '../utils/emailTemplates.js';
import { generateToken } from '../utils/generateToken.js';
import { storeImage, deleteImage } from '../middleware/upload.js';

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

  // Compare the domain exactly. Matching on the bare suffix would also admit
  // look-alikes such as someone@notvgu.ac.in.
  const at = email.lastIndexOf('@');
  if (at < 1) return false;
  if (email.slice(at + 1).toLowerCase() !== domain) return false;

  // Optional extra rule for the enrolment number itself.
  const pattern = (process.env.ALLOWED_EMAIL_PATTERN || '').trim();
  if (!pattern) return true;
  try {
    return new RegExp(pattern, 'i').test(email.slice(0, at));
  } catch {
    // A malformed pattern must never lock the whole campus out.
    console.error('⚠️  ALLOWED_EMAIL_PATTERN is not a valid regex — ignoring it.');
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
      message: `Please sign up with your VGU email — <enrollment>@${process.env.ALLOWED_EMAIL_DOMAIN}.`,
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

  // The OTP record stays either way, so a failed send can be retried with
  // "resend code" instead of registering again.
  let delivery;
  try {
    delivery = await sendEmail({ to: normalizedEmail, ...otpEmail({ name, code, minutes }) });
  } catch (err) {
    return res.status(502).json({ message: err.message, email: normalizedEmail });
  }

  res.status(200).json({
    message: delivery.devMode
      ? `Email is not set up on this server — the code for ${normalizedEmail} was printed in the server console.`
      : `Verification code sent to ${normalizedEmail}. It expires in ${minutes} minutes.`,
    email: normalizedEmail,
    ...(delivery.devMode ? { devOtp: code } : {}),
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

  let delivery;
  try {
    delivery = await sendEmail({
      to: normalizedEmail,
      ...otpEmail({ name: otp.payload?.name, code, minutes, resend: true }),
    });
  } catch (err) {
    return res.status(502).json({ message: err.message });
  }

  res.status(200).json({
    message: delivery.devMode
      ? `Email is not set up on this server — the new code was printed in the server console.`
      : `A new code was sent to ${normalizedEmail}.`,
    ...(delivery.devMode ? { devOtp: code } : {}),
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
 * Update the current user's profile (name, branch, semester, avatar, skills,
 * bio, interests, links).
 * PATCH /api/auth/profile  (multipart/form-data; optional `avatar` file)
 * PUT   /api/auth/profile  (JSON; `avatar` may be a URL string)
 *
 * `skills` / `learning` arrive as a JSON array or a comma-separated string
 * (multipart cannot carry arrays natively).
 */
function parseTags(value) {
  if (value === undefined) return undefined;
  let list = value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      list = Array.isArray(parsed) ? parsed : value.split(',');
    } catch {
      list = value.split(',');
    }
  }
  if (!Array.isArray(list)) return undefined;
  const seen = new Set();
  const out = [];
  for (const raw of list) {
    const tag = String(raw).trim().slice(0, 40);
    const k = tag.toLowerCase();
    if (tag && !seen.has(k)) {
      seen.add(k);
      out.push(tag);
    }
  }
  return out.slice(0, 20);
}

export async function updateProfile(req, res) {
  const { name, branch, semester, bio, githubUrl, linkedinUrl, portfolioUrl } = req.body;
  const user = req.user;

  const skills = parseTags(req.body.skills);
  const learning = parseTags(req.body.learning);
  const interests = parseTags(req.body.interests);
  if (skills !== undefined) user.skills = skills;
  if (learning !== undefined) user.learning = learning;
  if (interests !== undefined) user.interests = interests;
  if (bio !== undefined) user.bio = String(bio).trim();
  if (githubUrl !== undefined) user.githubUrl = String(githubUrl).trim();
  if (linkedinUrl !== undefined) user.linkedinUrl = String(linkedinUrl).trim();
  if (portfolioUrl !== undefined) user.portfolioUrl = String(portfolioUrl).trim();

  if (name !== undefined && name.trim()) user.name = name.trim();
  if (branch !== undefined) user.branch = branch.trim();
  if (semester !== undefined && semester !== '') {
    const s = Number(semester);
    if (!Number.isNaN(s)) user.semester = s;
  }
  if (req.file) {
    deleteImage(user.avatar); // drop the photo it replaces
    user.avatar = await storeImage(req.file);
  } else if (typeof req.body.avatar === 'string' && req.body.avatar.trim()) {
    user.avatar = req.body.avatar.trim(); // JSON clients pass a URL
  }

  await user.save();
  res.status(200).json({ user });
}
