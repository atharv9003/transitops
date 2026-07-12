/**
 * Email Service tests — covers Resend primary path and SMTP fallback
 * All external calls are mocked; no real emails are sent.
 */

// ─── Mocks (must be top-level for hoisting) ───────────────────────────────────

const mockResendSend = jest.fn();
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: mockResendSend },
  })),
}));

const mockSmtpSend = jest.fn().mockResolvedValue({ messageId: 'smtp-id' });
jest.mock('nodemailer', () => ({
  default: {
    createTransport: jest.fn(() => ({ sendMail: mockSmtpSend })),
  },
  createTransport: jest.fn(() => ({ sendMail: mockSmtpSend })),
}));

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('Email Service — sendEmail()', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...ORIGINAL_ENV };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it('sends via Resend when RESEND_API_KEY is set', async () => {
    process.env.RESEND_API_KEY = 're_testkey_123';
    mockResendSend.mockResolvedValueOnce({ data: { id: 'resend-id-001' }, error: null });

    // Dynamic import after setting env
    jest.resetModules();
    const { sendEmail } = await import('../notifications/email.service');

    await sendEmail({
      from: 'TransitOps <transitops@felix-au.me>',
      to: 'admin@test.com',
      subject: 'Test Subject',
      html: '<p>Test</p>',
    });

    expect(mockResendSend).toHaveBeenCalledTimes(1);
    expect(mockResendSend).toHaveBeenCalledWith(expect.objectContaining({
      from: 'TransitOps <transitops@felix-au.me>',
      to: ['admin@test.com'],
      subject: 'Test Subject',
    }));
  });

  it('falls back to SMTP when Resend returns an error', async () => {
    process.env.RESEND_API_KEY = 're_testkey_456';
    process.env.SMTP_USER = 'fallback@gmail.com';
    process.env.SMTP_PASS = 'pass';

    mockResendSend.mockResolvedValueOnce({
      data: null,
      error: { message: 'API error: domain not verified' },
    });

    jest.resetModules();
    const { sendEmail } = await import('../notifications/email.service');

    await sendEmail({
      from: 'TransitOps <transitops@felix-au.me>',
      to: 'admin@test.com',
      subject: 'Fallback Test',
      html: '<p>Fallback</p>',
    });

    // Resend was attempted
    expect(mockResendSend).toHaveBeenCalledTimes(1);
    // SMTP fallback was used
    expect(mockSmtpSend).toHaveBeenCalledTimes(1);
  });

  it('uses SMTP-only when RESEND_API_KEY is absent', async () => {
    delete process.env.RESEND_API_KEY;
    process.env.SMTP_USER = 'smtp@gmail.com';
    process.env.SMTP_PASS = 'pass';

    jest.resetModules();
    const { sendEmail } = await import('../notifications/email.service');

    await sendEmail({
      from: 'TransitOps <noreply@t.com>',
      to: 'admin@test.com',
      subject: 'SMTP-only',
      html: '<p>SMTP</p>',
    });

    expect(mockResendSend).not.toHaveBeenCalled();
    expect(mockSmtpSend).toHaveBeenCalledTimes(1);
  });

  it('logs to console and does not throw when no transport is configured', async () => {
    delete process.env.RESEND_API_KEY;
    delete process.env.SMTP_USER;

    jest.resetModules();
    const { sendEmail } = await import('../notifications/email.service');
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await expect(sendEmail({
      from: 'TransitOps <transitops@felix-au.me>',
      to: 'admin@test.com',
      subject: 'No-op',
      html: '<p>No transport</p>',
    })).resolves.toBeUndefined();

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('No transport configured'));
    consoleSpy.mockRestore();
  });
});

// ─── License Expiry Reminder ──────────────────────────────────────────────────
describe('Email Service — sendLicenseExpiryReminder()', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.RESEND_API_KEY = 're_testkey_789';
    mockResendSend.mockResolvedValue({ data: { id: 'resend-exp-001' }, error: null });
  });

  it('sends reminder with driver info in subject', async () => {
    jest.resetModules();
    const { sendLicenseExpiryReminder } = await import('../notifications/email.service');

    const expiry = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000); // 5 days from now
    await sendLicenseExpiryReminder('Rajesh Kumar', expiry, '+91 9876543210');

    expect(mockResendSend).toHaveBeenCalledWith(expect.objectContaining({
      subject: expect.stringContaining('Rajesh Kumar'),
    }));
  });

  it('uses reminders.transitops@felix-au.me as from address', async () => {
    jest.resetModules();
    const { sendLicenseExpiryReminder } = await import('../notifications/email.service');

    const expiry = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000);
    await sendLicenseExpiryReminder('Test Driver', expiry, '+91 1234567890');

    expect(mockResendSend).toHaveBeenCalledWith(expect.objectContaining({
      from: expect.stringContaining('reminders.transitops@felix-au.me'),
    }));
  });
});
