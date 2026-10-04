import express from "express";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { healthRouter } from "./routes/health.js";
import { createAnalyzeRouter } from "./routes/analyze.js";
import { createRewriteRouter } from "./routes/rewrite.js";
import { createVoiceRouter, type VoiceService } from "./routes/voice.js";
import { AnalysisService } from "./services/ai/analyze.js";
import { GemmaService } from "./services/ai/gemma.js";
import { RewriteService } from "./services/ai/rewrite.js";

const envPath = resolve(__dirname, "../.env");
if (existsSync(envPath)) process.loadEnvFile(envPath);

export function createApp(
  analysisService?: AnalysisService,
  rewriteService?: RewriteService,
  voiceService?: VoiceService,
) {
  const gemma = new GemmaService();
  const app = express();

  app.use(express.json({ limit: "12kb" }));
  app.use((request, response, next) => {
    const allowedOrigin = process.env.FRONTEND_URL ?? "http://localhost:3000";
    if (request.headers.origin === allowedOrigin) {
      response.setHeader("Access-Control-Allow-Origin", allowedOrigin);
      response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
      response.setHeader("Access-Control-Allow-Headers", "Content-Type");
      response.setHeader("Vary", "Origin");
    }
    if (request.method === "OPTIONS") return response.sendStatus(204);
    next();
  });
  app.use("/api", healthRouter);
  app.use("/api", createAnalyzeRouter(analysisService ?? new AnalysisService(gemma)));
  app.use("/api/rewrite", createRewriteRouter(rewriteService ?? new RewriteService(gemma)));
  app.use("/api/voice", createVoiceRouter(voiceService));

  return app;
}

const port = Number(process.env.PORT ?? 3001);

if (process.env.NODE_ENV !== "test") {
  createApp().listen(port, "0.0.0.0", () => {
    console.log(`Backend listening on 0.0.0.0:${port}`);
  });
}
