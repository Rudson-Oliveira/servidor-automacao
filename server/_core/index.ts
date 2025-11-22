import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { registerStatusRoutes } from "../routes/status";
import { registerConversarRoutes } from "../routes/conversar";
import { registerHistoricoRoutes } from "../routes/historico";
import { registerExecutarRoutes } from "../routes/executar";
import { registerCorrigirErroRoutes } from "../routes/corrigir-erro";
import { registerSkillsRoutes } from "../routes/skills";
import { registerCometApiRoutes } from "../routes/comet-api";
import authRouter from "../routes/auth";
import manusVisionRouter from "../routes/manus-vision";
import dashboardVisionRouter from "../routes/dashboard-vision";
import multiIaIntegrationRouter from "../routes/multi-ia-integration";
import { antiHallucinationMiddleware } from "../anti-hallucination";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  
  // Anti-hallucination middleware (detect and prevent fake data)
  app.use(antiHallucinationMiddleware);
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  
  // Registrar rotas REST do sistema de automação
  registerStatusRoutes(app);
  registerConversarRoutes(app);
  registerHistoricoRoutes(app);
  registerExecutarRoutes(app);
  registerCorrigirErroRoutes(app);
  registerSkillsRoutes(app);
  registerCometApiRoutes(app);
  app.use("/api/auth", authRouter);
  app.use("/api/manus", manusVisionRouter);
  app.use("/api/comet", manusVisionRouter);
  app.use("/api/dashboard", dashboardVisionRouter);
  app.use("/api/integration", multiIaIntegrationRouter);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
