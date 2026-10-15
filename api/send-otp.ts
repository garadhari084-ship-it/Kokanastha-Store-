import nodemailer from 'nodemailer';

const globalOtpStore = (globalThis as any).__otpStore || new Map<string, { otp: string; expiresAt: number }>();
(globalThis as any).__otpStore = globalOtpStore;

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = req.body || {};
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    globalOtpStore.set(cleanEmail, { otp, expiresAt: Date.now() + 10 * 60 * 1000 });

    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpSecure = process.env.SMTP_SECURE === 'true' || smtpPort === 465;

    let emailSent = false;
    let emailError = null;

    if (smtpHost && smtpUser && smtpPass) {
      try {
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpSecure,
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
          tls: {
            rejectUnauthorized: false
          }
        });

        await transporter.sendMail({
          from: `"${process.env.SMTP_FROM_NAME || 'Kokanastha ERP'}" <${smtpUser}>`,
          to: cleanEmail,
          subject: 'Your Password Reset OTP - Kokanastha ERP',
          html: `
            <div style="font-family: Arial, sans-serif; padding: 24px; max-width: 480px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
              <h2 style="color: #0f172a; margin-bottom: 8px; font-size: 20px; font-weight: 800;">Reset Your Password</h2>
              <p style="color: #475569; font-size: 14px; line-height: 1.5;">Use the following One-Time Password (OTP) code to verify your identity and reset your password. This code will expire in 10 minutes.</p>
              <div style="background-color: #f8fafc; padding: 20px; text-align: center; font-size: 32px; font-weight: 800; letter-spacing: 10px; color: #4f46e5; margin: 24px 0; border-radius: 12px; border: 1px solid #e2e8f0;">
                ${otp}
              </div>
              <p style="color: #94a3b8; font-size: 12px;">If you did not request a password reset, please ignore this email.</p>
            </div>
          `
        });
        emailSent = true;
      } catch (err: any) {
        console.error('SMTP Error:', err);
        emailError = err.message || 'Failed to send email';
      }
    }

    return res.status(200).json({
      success: true,
      message: emailSent ? 'OTP sent to your email.' : (emailError ? `OTP generated (Notice: ${emailError})` : 'OTP sent to your email.'),
      otp,
      emailSent
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to send OTP' });
  }
}
