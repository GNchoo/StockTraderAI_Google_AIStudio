import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { TradingEngine } from "./src/lib/engine.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize Trading Engine
  const initialMode = process.env.KIS_MODE || "virtual";
  console.log(`Initializing Trading Engine with mode: ${initialMode}`);
  
  const engine = new TradingEngine(
    Number(process.env.INITIAL_CAPITAL) || 10000000,
    initialMode
  );

  // API Routes
  app.get("/api/status", (req, res) => {
    try {
      res.json(engine.getStatus());
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/mode", async (req, res) => {
    try {
      const { mode } = req.body;
      if (mode === "real" || mode === "virtual") {
        await engine.setMode(mode);
        res.json(engine.getStatus());
      } else {
        res.status(400).json({ error: "Invalid mode" });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/toggle", async (req, res) => {
    try {
      const status = engine.getStatus();
      if (status.isRunning) {
        engine.stop();
      } else {
        await engine.start();
      }
      res.json(engine.getStatus());
    } catch (error: any) {
      console.error("Toggle Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/performance", (req, res) => {
    try {
      // Generate some performance data based on balance
      const data = [
        { time: "09:00", value: 10000000 },
        { time: "10:00", value: 10050000 },
        { time: "11:00", value: 10030000 },
        { time: "12:00", value: 10120000 },
        { time: "13:00", value: 10080000 },
        { time: "14:00", value: 10150000 },
        { time: "15:00", value: 10240000 },
        { time: "15:30", value: engine.getStatus().balance },
      ];
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
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
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
