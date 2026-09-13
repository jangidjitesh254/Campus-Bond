import nodemailer from 'nodemailer';

/**
 * Sends an email via SMTP.
 *
 * Prints the message in the server console only when SMTP is not configured
 * at all (no host / user / password). Once a mailbox is configured, a send
 * failure throws EmailDeliveryError and the caller answers 502 — codes are
 * never written to the console.
 *
 * Note: .env is read once at startup. After changing SMTP_PASS, restart the
 * server (`--watch` only restarts on code changes).
 */
let transporter = null;
function getTransporter() {
  if (transporter) return transporter;
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
  });
  return transporter;
}

function printToConsole(reason, { to, subject, text }) {
  console.log(`\n────────────── 📧 DEV EMAIL (${reason}) ──────────────`);
  console.log(`To:      ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Body:    ${text}`);
  console.log('───────────────────────────────────────────────────────────────\n');
}

export class EmailDeliveryError extends Error {
  constructor(message, cause) {
    super(message);
    this.name = 'EmailDeliveryError';
    this.cause = cause;
  }
}

export async function sendEmail({ to, subject, text, html }) {
  const { SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    printToConsole('SMTP not configured', { to, subject, text });
    return { devMode: true };
  }

  try {
    await getTransporter().sendMail({
      from: SMTP_FROM || SMTP_USER,
      to,
      subject,
      text,
      html: html || `<p>${text}</p>`,
    });
    return { devMode: false };
  } catch (err) {
    const why = err.code === 'EAUTH'
      ? 'SMTP login rejected — check SMTP_USER / SMTP_PASS in .env, then restart the server'
      : `SMTP error ${err.code || ''}: ${err.message}`;
    console.error(`✉️  Could not send email to ${to}: ${why}`);
    throw new EmailDeliveryError('We could not send the verification email right now. Please try again in a minute.', err);
  }
}
