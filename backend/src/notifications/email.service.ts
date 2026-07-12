// Email service stub — full implementation in notifications/email.service.ts (C10b)
// This stub prevents import errors during incremental development

export async function sendLicenseExpiryReminder(
  driverName: string,
  expiryDate: Date,
  contactNumber: string
): Promise<void> {
  console.log(`[EMAIL STUB] License expiry reminder for ${driverName} (expires: ${expiryDate.toDateString()}, contact: ${contactNumber})`);
  // Full nodemailer implementation added in C10b
}
