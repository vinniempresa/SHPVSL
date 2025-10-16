// Script para executar o Express.js no ambiente Heroku
const express = require('express');
const path = require('path');
const fs = require('fs');
const compression = require('compression');

const app = express();
const PORT = process.env.PORT || 3000;

// Compressão para melhorar a performance
app.use(compression());

// Middleware para CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
  next();
});

// Configurações para servir arquivos estáticos
const staticOptions = {
  maxAge: '30d',
  setHeaders: (res, path) => {
    // Configura cabeçalhos para diferentes tipos de arquivos
    if (path.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    } else if (path.includes('/assets/')) {
      res.setHeader('Cache-Control', 'public, max-age=31536000');
    }
  }
};

// Caminho para arquivos estáticos
const staticPath = path.join(__dirname, 'dist', 'public');

// Servir arquivos estáticos
app.use(express.static(staticPath, staticOptions));

// Middleware para JSON
app.use(express.json());

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

// Para outras rotas de API, retornar erro 404
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API endpoint não encontrado' });
});

// Para qualquer outra rota, serve o index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(staticPath, 'index.html'));
});

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});