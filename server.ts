import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON parser with sufficient limit for base64 image frames
  app.use(express.json({ limit: "15mb" }));

  // Shared Gemini client lazy getter
  let aiClient: GoogleGenAI | null = null;
  function getAI() {
    if (!aiClient) {
      const apiKey = process.env.GEMINI_API_KEY;
      aiClient = new GoogleGenAI({
        apiKey: apiKey || "",
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
    return aiClient;
  }

  // Accessibility System Instructions
  const DEFAULT_SYSTEM_INSTRUCTION = `Você é um assistente visual inteligente de alta precisão especializado em acessibilidade para pessoas com deficiência visual ou baixa visão.
Sua missão é descrever o que está diante da câmera de forma extremamente clara, concisa, natural e prioritária para a locomoção, identificação e segurança do usuário.

Diretrizes estritas:
1. ESTRUTURA EM 3 PONTOS CHAVE (máximo 2 a 3 frases no total):
   - Cena Principal: O que está acontecendo e onde o usuário parece estar (ex: 'Você está em um escritório em frente a uma mesa de trabalho').
   - Objetos e Obstáculos: Liste os 2 ou 3 objetos mais relevantes com localização espacial relativa ao usuário (ex: 'Há uma caneca à direita e um laptop aberto no centro').
   - Textos e Telas: Se houver texto legível, sinalização ou interface de tela, transcreva o texto essencial com clareza.
2. Seja direto e objetivo. Evite floreios, introduções como 'Na imagem vejo...' ou 'Posso observar...'. Vá direto aos fatos.
3. Se houver algum perigo evidente, obstáculo de tropeço ou borda, mencione com prioridade máxima.
4. Responda em Português do Brasil com linguagem acessível.`;

  // API Route: Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // API Route: Analyze camera frame
  app.post("/api/analyze-frame", async (req, res) => {
    try {
      const { imageBase64, customPrompt, systemInstruction } = req.body;

      if (!imageBase64) {
        return res.status(400).json({ error: "Imagem não fornecida (imageBase64 ausente)" });
      }

      // Clean base64 data if it contains data URL prefix
      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");

      const ai = getAI();
      // Use configured model or fallback to gemini-3.6-flash
      let modelName = process.env.GEMINI_MODEL || "gemini-3.6-flash";
      if (modelName === "gemini-2.5-flash" || modelName === "gemini-1.5-flash" || modelName === "gemini-2.0-flash") {
        modelName = "gemini-3.6-flash";
      }

      const promptText =
        customPrompt ||
        "Descreva esta cena para acessibilidade visual: o que está acontecendo, objetos principais com posição espacial, e qualquer texto detectado.";

      const response = await ai.models.generateContent({
        model: modelName,
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: cleanBase64,
              },
            },
            {
              text: promptText,
            },
          ],
        },
        config: {
          systemInstruction: systemInstruction || DEFAULT_SYSTEM_INSTRUCTION,
          temperature: 0.2,
          topP: 0.9,
        },
      });

      const description = response.text || "Nenhuma descrição pôde ser gerada.";

      return res.json({
        success: true,
        model: modelName,
        description,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error("Erro ao analisar frame com Gemini:", error);
      return res.status(500).json({
        error: error.message || "Falha ao processar frame com a API do Gemini",
      });
    }
  });

  // Vite middleware for development vs static build in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor rodando na porta http://0.0.0.0:${PORT}`);
  });
}

startServer();
