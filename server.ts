import express from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import nodemailer from "nodemailer";

export async function startServer(): Promise<number> {
  // Load .env from possible locations
  const possibleEnvPaths = [
    process.env.APP_ROOT ? path.join(process.env.APP_ROOT, '.env') : '',
    process.resourcesPath ? path.join(process.resourcesPath, '.env') : '',
    process.execPath ? path.join(path.dirname(process.execPath), '.env') : '',
    path.join(process.cwd(), '.env')
  ].filter(Boolean);

  for (const envPath of possibleEnvPaths) {
    try {
      dotenv.config({ path: envPath });
    } catch (_) {}
  }

  const app = express();
  
  const isElectron = Boolean(process.versions.electron || process.env.APP_ROOT);
  
  // Support CLI arguments: --port <port> and --host <host>, or process.env.PORT
  let cliPort: number | null = null;
  let cliHost: string | null = null;
  for (let i = 0; i < process.argv.length; i++) {
    if (process.argv[i] === '--port' && process.argv[i + 1]) {
      const p = parseInt(process.argv[i + 1], 10);
      if (!isNaN(p)) cliPort = p;
    }
    if (process.argv[i] === '--host' && process.argv[i + 1]) {
      cliHost = process.argv[i + 1];
    }
  }

  const envPort = process.env.PORT ? parseInt(process.env.PORT, 10) : null;
  const PORT: number = cliPort ?? envPort ?? (isElectron ? 0 : 3000);
  const HOST: string = cliHost ?? (isElectron ? "127.0.0.1" : "0.0.0.0");

  // Middleware
  app.use(express.json({ limit: '50mb' }));

  // Lazy initialize Gemini AI
  let ai: GoogleGenAI | null = null;
  const getAi = () => {
    if (!ai) {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error("AI Invoice scanning is optional and requires a GEMINI_API_KEY to be set.");
      }
      ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
    return ai;
  };

  // API Route for Invoice Scanning
  app.post("/api/scan-invoice", async (req, res) => {
    try {
      const { imageBase64 } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ error: "Image data is required" });
      }

      // Remove data:image/jpeg;base64, prefix if present
      const base64Data = imageBase64.replace(/^data:image\/[a-z]+;base64,/, "");

      const prompt = `Analyze this purchase invoice and extract the following information in strict JSON format:
{
  "supplierName": "Supplier Name or Company Name",
  "supplierGstin": "GSTIN if available, else empty string",
  "supplierPhone": "Phone number if available, else empty string",
  "invoiceNumber": "Invoice number if found, else empty string",
  "date": "YYYY-MM-DD format if found, else empty string",
  "items": [
    {
      "name": "Product name",
      "qty": 0.0,
      "price": 0.0,
      "gst_rate": 0.0
    }
  ],
  "totalAmount": 0.0
}
Ensure that you only output valid JSON.`;

      const currentAi = getAi();
      const response = await currentAi.models.generateContent({
        model: "gemini-2.5-flash",
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: base64Data,
              },
            },
            {
              text: prompt,
            },
          ],
        },
        config: {
            responseMimeType: "application/json"
        }
      });

      const text = response.text;
      const parsed = JSON.parse(text);
      res.json(parsed);
    } catch (error: any) {
      console.error("Error scanning invoice:", error);
      res.status(500).json({ error: error.message || "Failed to scan invoice" });
    }
  });

  // Global shared Supabase configuration so all users and devices connect to the same live database
  const configFilePath = path.join(process.cwd(), 'supabase-config.json');

  app.get("/api/config/supabase", (req, res) => {
    try {
      const envUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
      const envKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
      if (envUrl && envKey) {
        return res.json({ url: envUrl, key: envKey });
      }
      if (fs.existsSync(configFilePath)) {
        const raw = fs.readFileSync(configFilePath, 'utf8');
        const parsed = JSON.parse(raw);
        return res.json({ url: parsed.url || '', key: parsed.key || '' });
      }
      return res.json({ url: '', key: '' });
    } catch (e: any) {
      return res.json({ url: '', key: '' });
    }
  });

  app.post("/api/config/supabase", (req, res) => {
    try {
      const { url, key } = req.body;
      const data = { 
        url: (url || '').trim(), 
        key: (key || '').trim(), 
        updated_at: new Date().toISOString() 
      };
      fs.writeFileSync(configFilePath, JSON.stringify(data, null, 2), 'utf8');
      process.env.VITE_SUPABASE_URL = data.url;
      process.env.VITE_SUPABASE_ANON_KEY = data.key;
      return res.json({ success: true });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message });
    }
  });

  const otpStore = new Map<string, { otp: string; expiresAt: number }>();

  app.post("/api/send-otp", async (req, res) => {
    try {
      const { email } = req.body || {};
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }
      const cleanEmail = String(email).trim().toLowerCase();
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      otpStore.set(cleanEmail, { otp, expiresAt: Date.now() + 10 * 60 * 1000 });

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
            auth: { user: smtpUser, pass: smtpPass },
            tls: { rejectUnauthorized: false }
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
          console.error("SMTP Error:", err);
          emailError = err.message || "Failed to send email";
        }
      }

      return res.json({
        success: true,
        message: emailSent ? "OTP sent to your email." : (emailError ? `OTP generated (${emailError})` : "OTP sent to your email."),
        otp,
        emailSent
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || "Failed to send OTP" });
    }
  });

  app.post("/api/verify-otp", (req, res) => {
    try {
      const { email, otp } = req.body || {};
      if (!email || !otp) {
        return res.status(400).json({ error: "Email and OTP are required" });
      }
      const cleanEmail = String(email).trim().toLowerCase();
      const stored = otpStore.get(cleanEmail);
      if (!stored) {
        return res.status(400).json({ error: "No active OTP requested for this email. Please request a new one." });
      }
      if (Date.now() > stored.expiresAt) {
        otpStore.delete(cleanEmail);
        return res.status(400).json({ error: "OTP code has expired. Please request a new OTP." });
      }
      if (stored.otp !== String(otp).trim()) {
        return res.status(400).json({ error: "Invalid OTP code. Please check and try again." });
      }
      return res.json({ success: true, message: "OTP verified successfully." });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || "Failed to verify OTP" });
    }
  });

  // Vite middleware for development; static files for production & Electron
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false, ws: false as const },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const baseDir = process.env.APP_ROOT || process.cwd();
    const distPath = path.join(baseDir, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  return new Promise<number>((resolve, reject) => {
    const server = app.listen(PORT, HOST, () => {
      const address = server.address() as any;
      const actualPort = address?.port || PORT;
      console.log(`Server running on http://${HOST}:${actualPort}`);
      process.env.ACTUAL_SERVER_PORT = actualPort.toString();
      resolve(actualPort);
    });

    server.on('error', (err) => {
      console.error("Server listen error:", err);
      reject(err);
    });
  });
}

// Automatically start if executed directly as standalone server (e.g., tsx server.ts or node dist/server.cjs)
if (!process.versions.electron && !process.env.APP_ROOT) {
  startServer().catch((err) => {
    console.error("Failed to start server:", err);
  });
}
