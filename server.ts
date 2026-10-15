import express from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

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
  const PORT: number = isElectron ? 0 : 3000;
  const HOST: string = isElectron ? "127.0.0.1" : "0.0.0.0";

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

  // Vite middleware for development; static files for production & Electron
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
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
