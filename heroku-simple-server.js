// Um servidor simplificado para Heroku que não usa template literals complexos
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import compression from 'compression';
import cors from 'cors';

// Configuração
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 5000;
const STATIC_DIR = path.join(__dirname, 'dist', 'public');

// Inicializar Express
const app = express();
app.use(cors());
app.use(compression());
app.use(express.json());

// Verificar diretórios
if (!fs.existsSync(STATIC_DIR)) {
  fs.mkdirSync(STATIC_DIR, { recursive: true });
  console.log(`Created ${STATIC_DIR}`);
  
  const assetsDir = path.join(STATIC_DIR, 'assets');
  fs.mkdirSync(assetsDir, { recursive: true });
  console.log(`Created ${assetsDir}`);
  
  // Criar index.html de fallback
  const fallbackHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Shopee Delivery Partners - Fallback</title>
  <style>
    body { font-family: Arial; margin: 0; padding: 20px; text-align: center; }
    .error { color: #ff4d4f; margin: 20px 0; }
  </style>
</head>
<body>
  <h1>Shopee Delivery Partners</h1>
  <p class="error">Este é um arquivo de fallback. Por favor, execute "npm run build" antes do deploy.</p>
</body>
</html>`;
  fs.writeFileSync(path.join(STATIC_DIR, 'index.html'), fallbackHtml);
}

// Listar arquivos
if (fs.existsSync(STATIC_DIR)) {
  const files = fs.readdirSync(STATIC_DIR);
  console.log(`Files in static dir: ${files.join(', ')}`);
  
  const assetsDir = path.join(STATIC_DIR, 'assets');
  if (fs.existsSync(assetsDir)) {
    const assetFiles = fs.readdirSync(assetsDir);
    console.log(`Files in assets dir: ${assetFiles.join(', ')}`);
  }
}

// Servir arquivos estáticos - abordagem simplificada
app.use('/assets', express.static(path.join(STATIC_DIR, 'assets')));
app.use(express.static(STATIC_DIR));

// Processar index.html
app.get('/', (req, res) => {
  const indexPath = path.join(STATIC_DIR, 'index.html');
  
  if (!fs.existsSync(indexPath)) {
    return res.status(404).send('index.html not found');
  }
  
  try {
    // Ler o HTML
    let html = fs.readFileSync(indexPath, 'utf8');
    
    // Corrigir caminhos
    html = html.replace(/src="\/assets\//g, 'src="assets/');
    html = html.replace(/href="\/assets\//g, 'href="assets/');
    
    // Remover tag base
    html = html.replace(/<base [^>]*>/g, '');
    
    // Adicionar tag debug
    html = html.replace('</head>', 
      '<!-- Heroku version -->\n' +
      '<meta name="is-heroku" content="true">\n' +
      '<style>' +
      '  .loading-status { text-align: center; margin: 20px; font-size: 18px; }' +
      '  #root { opacity: 0; transition: opacity 0.5s; }' +
      '</style>\n' +
      '</head>');
    
    // Adicionar script de recuperação simples 
    html = html.replace('<div id="root"></div>', 
      '<div id="root"></div>\n' +
      '<div class="loading-status" id="loading-status">Carregando recursos...</div>\n' +
      '<script>\n' +
      '  document.addEventListener("DOMContentLoaded", function() {\n' +
      '    var root = document.getElementById("root");\n' +
      '    var status = document.getElementById("loading-status");\n' +
      '    \n' +
      '    // Verificar se os recursos carregaram\n' +
      '    setTimeout(function() {\n' +
      '      root.style.opacity = 1;\n' +
      '      status.style.display = "none";\n' +
      '    }, 2000);\n' +
      '    \n' +
      '    // Tentar corrigir scripts que falham\n' +
      '    window.addEventListener("error", function(e) {\n' +
      '      if (e.target && (e.target.tagName === "SCRIPT" || e.target.tagName === "LINK")) {\n' +
      '        var src = e.target.src || e.target.href;\n' +
      '        if (src) {\n' +
      '          if (src.startsWith("/assets/")) {\n' +
      '            var newSrc = src.replace("/assets/", "assets/");\n' +
      '            console.log("Trying path:", newSrc);\n' +
      '            if (e.target.tagName === "SCRIPT") {\n' +
      '              e.target.src = newSrc;\n' +
      '            } else {\n' +
      '              e.target.href = newSrc;\n' +
      '            }\n' +
      '          }\n' +
      '        }\n' +
      '      }\n' +
      '    }, true);\n' +
      '  });\n' +
      '</script>');
    
    // Enviar HTML modificado
    res.send(html);
  } catch (err) {
    console.error(err);
    res.sendFile(indexPath);
  }
});

// Rota para verificar status de transação (compatível com 4MPagamentos)
app.get('/api/transactions/:id/status', async (req, res) => {
  const transactionId = req.params.id;
  
  try {
    // Se a transação é da 4MPagamentos (começa com '4M')
    if (transactionId.startsWith('4M')) {
      const fetch = (await import('node-fetch')).default;
      const response = await fetch(`https://app.4mpagamentos.com/api/v1/transactions/${transactionId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.MPAG_API_KEY}`
        }
      });

      if (response.ok) {
        const responseData = await response.json();
        const data = responseData.data || responseData;
        
        // Retornar dados no formato esperado pelo frontend
        return res.json({
          success: true,
          status: data.status || 'pending',
          transaction: {
            gateway_id: data.gateway_id || transactionId,
            status: data.status || 'pending',
            amount: data.amount || 64.9,
            customer_name: data.customer_name || '',
            customer_email: data.customer_email || '',
            description: data.description || 'Kit de Segurança Shopee Delivery',
            pix_code: data.pix_code || '',
            pix_qr_code: data.pix_qr_code || '',
            expires_at: data.expires_at,
            paid_at: data.paid_at,
            created_at: data.created_at,
            updated_at: data.updated_at
          }
        });
      }
    }
    
    // Fallback para transações locais
    res.json({
      success: true,
      status: 'pending',
      transaction: {
        gateway_id: transactionId,
        status: 'pending',
        amount: 64.9
      }
    });
  } catch (error) {
    console.error(`Erro ao verificar status da transação ${transactionId}:`, error);
    res.status(500).json({
      success: false,
      error: 'Erro interno ao verificar status da transação'
    });
  }
});

// Server-Sent Events para notificação de status de pagamento em tempo real
app.get('/api/payments/:id/stream', (req, res) => {
  const transactionId = req.params.id;
  
  // Configurar SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'X-Accel-Buffering': 'no' // Para Heroku/Nginx buffering
  });

  console.log(`[SSE] Cliente conectado para transação: ${transactionId}`);

  // Verificar status da transação
  const checkStatus = async () => {
    try {
      if (!transactionId.startsWith('4M')) {
        return;
      }

      const fetch = (await import('node-fetch')).default;
      const response = await fetch(`https://app.4mpagamentos.com/api/v1/transactions/${transactionId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.MPAG_API_KEY}`
        }
      });

      if (response.ok) {
        const responseData = await response.json();
        const data = responseData.data || responseData;
        
        // Enviar status via SSE
        res.write(`data: ${JSON.stringify({ 
          type: 'status', 
          status: data.status,
          transaction_id: data.gateway_id || transactionId,
          amount: data.amount,
          paid_at: data.paid_at 
        })}\n\n`);

        // Se aprovado, enviar evento especial e fechar conexão
        if (data.status === 'paid' || data.status === 'approved') {
          console.log(`[SSE] Pagamento aprovado para transação: ${transactionId}`);
          res.write(`data: ${JSON.stringify({ 
            type: 'approved', 
            transaction_id: transactionId,
            redirect_to: '/treinamento'
          })}\n\n`);
          
          // Fechar conexão após aprovação
          setTimeout(() => {
            res.end();
          }, 2000);
          return;
        }
      }
    } catch (error) {
      console.error(`[SSE] Erro ao verificar status da transação ${transactionId}:`, error);
    }
  };

  // Verificar status inicial
  checkStatus();

  // Verificar status a cada 1 segundo (no backend)
  const interval = setInterval(checkStatus, 1000);

  // Cleanup quando cliente desconectar
  req.on('close', () => {
    console.log(`[SSE] Cliente desconectado da transação: ${transactionId}`);
    clearInterval(interval);
  });

  // Timeout após 10 minutos
  setTimeout(() => {
    console.log(`[SSE] Timeout da conexão para transação: ${transactionId}`);
    clearInterval(interval);
    res.end();
  }, 600000); // 10 minutos
});

// SPA fallback
app.get('*', (req, res) => {
  if (!req.path.includes('.')) {
    res.sendFile(path.join(STATIC_DIR, 'index.html'));
  } else {
    res.status(404).send('Not found');
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Simple server running on port ${PORT}`);
});