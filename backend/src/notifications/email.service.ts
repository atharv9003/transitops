/**
 * TransitOps Email Service
 *
 * Primary:  Resend API (https://resend.com) — domain: felix-au.me
 * Fallback: Nodemailer SMTP — used when RESEND_API_KEY is not set
 *
 * From addresses:
 *   - License reminders: reminders.transitops@felix-au.me
 *   - Contact / notifications: contact.transitops@felix-au.me
 *   - Default sender: TransitOps <transitops@felix-au.me>
 */

import { Resend } from 'resend';
import nodemailer from 'nodemailer';

// ─── Resend Client ────────────────────────────────────────────────────────────

let resendClient: Resend | null = null;

function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

// ─── SMTP Fallback ────────────────────────────────────────────────────────────

function getSmtpTransporter(): nodemailer.Transporter | null {
  if (!process.env.SMTP_USER) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

// ─── Core Send Helper ─────────────────────────────────────────────────────────

interface EmailOptions {
  from: string;  // e.g. "TransitOps Reminders <reminders.transitops@felix-au.me>"
  to: string | string[];
  subject: string;
  html: string;
}

/**
 * Sends an email via Resend. Falls back to SMTP if RESEND_API_KEY is absent.
 * If neither is configured, logs a console notice and returns gracefully.
 */
export async function sendEmail(opts: EmailOptions): Promise<void> {
  const resend = getResendClient();

  if (resend) {
    const result = await resend.emails.send({
      from: opts.from,
      to: Array.isArray(opts.to) ? opts.to : [opts.to],
      subject: opts.subject,
      html: opts.html,
    });
    if (result.error) {
      console.error(`[EMAIL/Resend] Failed: ${result.error.message}. Attempting SMTP fallback…`);
      // Fall through to SMTP
    } else {
      console.log(`[EMAIL/Resend] Sent "${opts.subject}" → id:${result.data?.id}`);
      return;
    }
  }

  // ─── SMTP Fallback ──────────────────────────────────────────────────────────
  const smtp = getSmtpTransporter();
  if (smtp) {
    await smtp.sendMail({
      from: opts.from,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    });
    console.log(`[EMAIL/SMTP] Sent "${opts.subject}"`);
    return;
  }

  // No transport configured — log only
  console.log(`[EMAIL] No transport configured. Would send: "${opts.subject}" to ${opts.to}`);
}

// ─── Domain-specific senders ──────────────────────────────────────────────────

const FROM_REMINDERS = 'TransitOps Reminders <reminders.transitops@felix-au.me>';
const FROM_CONTACT   = 'TransitOps <contact.transitops@felix-au.me>';

// Recipient: read from env or default to admin
function adminRecipient(): string {
  return process.env.ADMIN_EMAIL || 'admin@transitops.com';
}

// ─── Email Templates ──────────────────────────────────────────────────────────

/**
 * Driver license expiry reminder — sent by the nightly cron job
 */
export async function sendLicenseExpiryReminder(
  driverName: string,
  expiryDate: Date,
  contactNumber: string
): Promise<void> {
  const expiryStr = expiryDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  const daysLeft  = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const urgency   = daysLeft <= 7 ? '#dc3545' : '#fd7e14';

  await sendEmail({
    from: FROM_REMINDERS,
    to: adminRecipient(),
    subject: `⚠️ License Expiry Alert — ${driverName} (${daysLeft} days)`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f1117; color: #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #1e40af, #7c3aed); padding: 24px 32px;">
          <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #fff; letter-spacing: -0.5px;">
            🚌 TransitOps
          </h1>
          <p style="margin: 4px 0 0; color: rgba(255,255,255,0.7); font-size: 13px;">Smart Transport Operations Platform</p>
        </div>
        <div style="padding: 32px;">
          <h2 style="color: ${urgency}; margin-top: 0;">⚠️ Driver License Expiry Alert</h2>
          <p style="color: #94a3b8;">This is an automated reminder from TransitOps regarding an upcoming license expiry.</p>
          <table style="border-collapse: collapse; width: 100%; background: #1a1f2e; border-radius: 8px; overflow: hidden;">
            <tr style="border-bottom: 1px solid #2d3748;">
              <td style="padding: 12px 16px; font-weight: 600; color: #94a3b8; font-size: 13px;">Driver Name</td>
              <td style="padding: 12px 16px; color: #f1f5f9; font-weight: 700;">${driverName}</td>
            </tr>
            <tr style="border-bottom: 1px solid #2d3748;">
              <td style="padding: 12px 16px; font-weight: 600; color: #94a3b8; font-size: 13px;">License Expiry</td>
              <td style="padding: 12px 16px; color: ${urgency}; font-weight: 700;">${expiryStr}</td>
            </tr>
            <tr style="border-bottom: 1px solid #2d3748;">
              <td style="padding: 12px 16px; font-weight: 600; color: #94a3b8; font-size: 13px;">Days Remaining</td>
              <td style="padding: 12px 16px; color: ${urgency}; font-size: 18px; font-weight: 800;">${daysLeft} day${daysLeft !== 1 ? 's' : ''}</td>
            </tr>
            <tr>
              <td style="padding: 12px 16px; font-weight: 600; color: #94a3b8; font-size: 13px;">Contact Number</td>
              <td style="padding: 12px 16px; color: #f1f5f9;">${contactNumber}</td>
            </tr>
          </table>
          <div style="margin-top: 20px; padding: 16px; background: rgba(220, 53, 69, 0.1); border: 1px solid rgba(220, 53, 69, 0.3); border-radius: 8px;">
            <p style="margin: 0; color: #dc3545; font-weight: 600; font-size: 13px;">
              ⚠️ This driver will be automatically blocked from trip assignment once the license expires.
              Please ensure renewal is arranged before the expiry date.
            </p>
          </div>
        </div>
        <div style="padding: 16px 32px; border-top: 1px solid #2d3748; font-size: 11px; color: #64748b;">
          This is an automated message from TransitOps. Sent by reminders.transitops@felix-au.me
        </div>
      </div>
    `,
  });
}

/**
 * Maintenance completion notification
 */
export async function sendMaintenanceNotification(
  vehicleRegNumber: string,
  serviceType: string,
  cost: number
): Promise<void> {
  await sendEmail({
    from: FROM_CONTACT,
    to: adminRecipient(),
    subject: `🔧 Maintenance Completed — ${vehicleRegNumber}`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">🔧 Maintenance Completed</h2>
        <p>Vehicle <strong>${vehicleRegNumber}</strong> has been marked as maintenance complete.</p>
        <ul>
          <li>Service Type: <strong>${serviceType}</strong></li>
          <li>Cost: <strong>₹${cost.toLocaleString()}</strong></li>
        </ul>
        <p style="color: #6b7280; font-size: 12px;">— TransitOps System</p>
      </div>
    `,
  });
}
