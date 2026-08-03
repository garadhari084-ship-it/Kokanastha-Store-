import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json({ limit: '50mb' }));

  // Lazy initialize Gemini AI
  let ai: GoogleGenAI | null = null;
  const getAi = () => {
    if (!ai) {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is missing. Please set it in the AI Studio Settings/Secrets panel.");
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

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
