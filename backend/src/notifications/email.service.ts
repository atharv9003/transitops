import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendLicenseExpiryReminder(
  driverName: string,
  expiryDate: Date,
  contactNumber: string
): Promise<void> {
  if (!process.env.SMTP_USER) {
    console.log(`[EMAIL] SMTP not configured. Reminder for ${driverName} (expires: ${expiryDate.toDateString()}, contact: ${contactNumber})`);
    return;
  }

  const expiryStr = expiryDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  const daysLeft = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'TransitOps <noreply@transitops.in>',
    to: process.env.SMTP_USER, // Send to admin — driver contact number is for reference
    subject: `⚠️ License Expiry Alert — ${driverName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #F5A623;">TransitOps — License Expiry Alert</h2>
        <p>This is an automated reminder from TransitOps.</p>
        <table style="border-collapse: collapse; width: 100%;">
          <tr><td style="padding: 8px; font-weight: bold;">Driver Name:</td><td style="padding: 8px;">${driverName}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">License Expiry:</td><td style="padding: 8px; color: ${daysLeft <= 7 ? '#dc3545' : '#fd7e14'};">${expiryStr}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Days Remaining:</td><td style="padding: 8px;">${daysLeft} day(s)</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Contact Number:</td><td style="padding: 8px;">${contactNumber}</td></tr>
        </table>
        <p style="color: #dc3545; font-weight: bold;">⚠️ This driver will be automatically blocked from trip assignment once the license expires.</p>
        <p style="color: #6c757d; font-size: 12px;">— TransitOps System</p>
      </div>
    `,
  });

  console.log(`[EMAIL] Expiry reminder sent for driver: ${driverName}`);
}
