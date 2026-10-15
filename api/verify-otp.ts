const globalOtpStore = (globalThis as any).__otpStore || new Map<string, { otp: string; expiresAt: number }>();
(globalThis as any).__otpStore = globalOtpStore;

export default function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, otp } = req.body || {};
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const stored = globalOtpStore.get(cleanEmail);
    if (!stored) {
      return res.status(400).json({ error: 'No active OTP requested for this email. Please request a new one.' });
    }

    if (Date.now() > stored.expiresAt) {
      globalOtpStore.delete(cleanEmail);
      return res.status(400).json({ error: 'OTP code has expired. Please request a new OTP.' });
    }

    if (stored.otp !== String(otp).trim()) {
      return res.status(400).json({ error: 'Invalid OTP code. Please check and try again.' });
    }

    return res.status(200).json({ success: true, message: 'OTP verified successfully.' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to verify OTP' });
  }
}
