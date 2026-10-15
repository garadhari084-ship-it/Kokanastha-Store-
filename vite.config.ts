import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// In-memory OTP storage: email -> { otp: string, expiresAt: number }
const otpStore = new Map<string, { otp: string; expiresAt: number }>();

function apiOtpPlugin(): Plugin {
  return {
    name: 'api-otp-server',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url === '/api/send-otp' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', async () => {
            try {
              const { email } = JSON.parse(body || '{}');
              if (!email) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ error: 'Email is required' }));
              }
              const cleanEmail = email.trim().toLowerCase();
              const otp = Math.floor(100000 + Math.random() * 900000).toString();
              otpStore.set(cleanEmail, { otp, expiresAt: Date.now() + 10 * 60 * 1000 });

              // Send email if SMTP credentials are provided
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

              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({
                success: true,
                message: emailSent ? 'OTP sent to your email.' : (emailError ? `OTP generated (Email Notice: ${emailError})` : 'OTP sent to your email.'),
                otp,
                emailSent
              }));
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ error: err.message || 'Failed to send OTP' }));
            }
          });
          return;
        }

        if (req.url === '/api/verify-otp' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              const { email, otp } = JSON.parse(body || '{}');
              if (!email || !otp) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ error: 'Email and OTP are required' }));
              }
              const cleanEmail = email.trim().toLowerCase();
              const stored = otpStore.get(cleanEmail);
              if (!stored) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ error: 'No active OTP requested for this email. Please request a new one.' }));
              }
              if (Date.now() > stored.expiresAt) {
                otpStore.delete(cleanEmail);
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ error: 'OTP code has expired. Please request a new OTP.' }));
              }
              if (stored.otp !== otp.trim()) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ error: 'Invalid OTP code. Please check and try again.' }));
              }

              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ success: true, message: 'OTP verified successfully.' }));
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ error: err.message || 'Failed to verify OTP' }));
            }
          });
          return;
        }

        next();
      });
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), apiOtpPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-charts': ['recharts'],
            'vendor-pdf': ['jspdf', 'jspdf-autotable'],
            'vendor-xlsx': ['xlsx'],
          }
        },
      },
    },
    server: {
      hmr: false,
      watch: null,
    },
  };
});
