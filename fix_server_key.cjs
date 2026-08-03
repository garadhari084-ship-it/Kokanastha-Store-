const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const oldInit = `  // Initialize Gemini AI
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });`;

const newInit = `  // Lazy initialize Gemini AI
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
  };`;

content = content.replace(oldInit, newInit);

const oldCall = `      const response = await ai.models.generateContent({`;
const newCall = `      const currentAi = getAi();
      const response = await currentAi.models.generateContent({`;

content = content.replace(oldCall, newCall);

fs.writeFileSync('server.ts', content);
