import nodemailer from 'nodemailer';

/**
 * Sends an email via SMTP. If SMTP is not configured (no SMTP_HOST),
 * we fall back to DEV mode and just print the message to the console.
 * This lets you test OTP signup without setting up a real mail server.
 */
export async function sendEmail({ to, subject, text, html }) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;

  if (!SMTP_HOST) {
    console.log('\n────────────── 📧 DEV EMAIL (no SMTP configured) ──────────────');
    console.log(`To:      ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body:    ${text}`);
    console.log('───────────────────────────────────────────────────────────────\n');
    return { devMode: true };
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  await transporter.sendMail({
    from: SMTP_FROM || SMTP_USER,
    to,
    subject,
    text,
    html: html || `<p>${text}</p>`,
  });

  return { devMode: false };
}
