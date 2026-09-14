/**
 * HTML email templates. Kept table-based and inline-styled so they render in
 * Gmail / Outlook / Apple Mail, which strip <style> blocks and modern CSS.
 */

const GREEN = '#15532E';
const GREEN_DARK = '#0F3D22';
const BG = '#EFF5EC';
const TEXT = '#16241C';
const MUTED = '#6B7B72';

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/** One-time-code email for signup / resend. Returns { subject, text, html }. */
export function otpEmail({ name, code, minutes, resend = false }) {
  const firstName = escapeHtml((name || '').trim().split(' ')[0] || 'there');
  const digits = String(code).split('');
  const subject = resend ? `${code} is your new Campus Bond code` : `${code} is your Campus Bond verification code`;
  const text = `Hi ${firstName},\n\nYour Campus Bond verification code is ${code}. It expires in ${minutes} minutes.\n\nIf you didn't request this, you can ignore this email.`;

  // Each digit in its own cell so the code is easy to read and to copy.
  const digitCells = digits
    .map(
      (d) => `<td align="center" style="padding:0 4px;">
        <div style="width:44px;height:56px;line-height:56px;border-radius:12px;background:#FFFFFF;border:1.5px solid #DCEBDF;font-family:'SF Mono',Menlo,Consolas,monospace;font-size:26px;font-weight:700;color:${GREEN};text-align:center;">${d}</div>
      </td>`
    )
    .join('');

  const html = `<!doctype html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${BG};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BG};padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:440px;background:#FFFFFF;border-radius:20px;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
        <!-- header -->
        <tr>
          <td style="background:${GREEN};padding:28px 32px;text-align:center;">
            <div style="display:inline-block;width:44px;height:44px;line-height:44px;border-radius:12px;background:#FFFFFF;color:${GREEN};font-size:22px;font-weight:800;">✓</div>
            <div style="margin-top:12px;color:#FFFFFF;font-size:18px;font-weight:800;letter-spacing:0.2px;">Campus Bond</div>
          </td>
        </tr>
        <!-- body -->
        <tr>
          <td style="padding:32px 32px 8px;">
            <p style="margin:0 0 6px;font-size:22px;font-weight:800;color:${TEXT};">Hi ${firstName} 👋</p>
            <p style="margin:0;font-size:15px;line-height:22px;color:${MUTED};">
              ${resend ? 'Here is your new verification code.' : 'Welcome! Use this code to verify your college email and finish creating your account.'}
            </p>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:24px 32px 8px;">
            <table role="presentation" cellpadding="0" cellspacing="0"><tr>${digitCells}</tr></table>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:8px 32px 28px;">
            <p style="margin:0;font-size:13px;color:${MUTED};">This code expires in <strong style="color:${TEXT};">${minutes} minutes</strong>.</p>
          </td>
        </tr>
        <!-- footer -->
        <tr>
          <td style="background:${BG};padding:18px 32px;text-align:center;">
            <p style="margin:0;font-size:12px;line-height:18px;color:${MUTED};">
              Didn't request this? You can safely ignore this email.<br/>
              Never share this code with anyone — Campus Bond will never ask for it.
            </p>
          </td>
        </tr>
      </table>
      <p style="margin:16px 0 0;font-size:11px;color:${MUTED};">© Campus Bond · One campus, every student, connected.</p>
    </td></tr>
  </table>
</body>
</html>`;

  return { subject, text, html };
}

// Colours kept for future templates (welcome, approval notifications, …).
export const emailColors = { GREEN, GREEN_DARK, BG, TEXT, MUTED };
