import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { setupStaticMiddleware } from "./static-middleware";
import { setupCors } from "./cors-config";
import path from "path";
import fs from "fs";
import { storage } from "./storage";

const app = express();

// Configuração de trust proxy para Heroku
app.set('trust proxy', 1);

// Configuração de CORS para permitir requisições cross-origin
setupCors(app);

// Configuração para utilizar UTF-8 na aplicação
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Sistema de ban de IP foi removido para maximizar conversões
// Todos os visitantes agora têm acesso ao site independente do dispositivo

// Se estiver em produção, adiciona middleware para corrigir caminhos de assets no Heroku
if (process.env.NODE_ENV === 'production') {
  console.log('[express] Running in production mode');
  
  setupStaticMiddleware(app);
  
  // Serve arquivos estáticos da pasta dist com configurações otimizadas
  const distPublicPath = path.join(process.cwd(), 'dist', 'public');
  console.log(`[express] Serving static files from: ${distPublicPath}`);
  
  // Serve arquivos estáticos da pasta assets diretamente, com prioridade
  const assetsPath = path.join(distPublicPath, 'assets');
  if (fs.existsSync(assetsPath)) {
    console.log(`[express] Assets directory exists: ${assetsPath}`);
    app.use('/assets', express.static(assetsPath, {
      maxAge: '1y',
      etag: true
    }));
  }
  
  // Serve outros arquivos estáticos
  app.use(express.static(distPublicPath, {
    maxAge: '1d',
    etag: true
  }));
  
  // Adiciona rota específica para index.html
  app.get('/', (req, res) => {
    console.log('[express] Serving index.html');
    res.sendFile(path.join(distPublicPath, 'index.html'));
  });
}

// Configurar cabeçalhos para UTF-8
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
  }
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Usa a porta fornecida pelo ambiente (Heroku) ou 5000 como fallback
  const port = process.env.PORT || 5000;
  server.listen({
    port: Number(port),
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
