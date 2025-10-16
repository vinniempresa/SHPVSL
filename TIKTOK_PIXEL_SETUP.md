# Configuração do TikTok Pixel

## 📋 Visão Geral

O TikTok Pixel foi implementado globalmente em todas as páginas da aplicação com proteção automática contra duplicatas. O sistema rastreia conversões (Purchase events) em todas as páginas de pagamento.

## 🔧 Configuração

### 1. Adicionar IDs do TikTok Pixel

Configure as seguintes variáveis de ambiente no Replit:

- `VITE_TIKTOK_PIXEL_ID` - ID principal do TikTok Pixel
- `VITE_TIKTOK_PIXEL_ID_2` - (Opcional) Segundo TikTok Pixel
- `VITE_TIKTOK_PIXEL_ID_3` - (Opcional) Terceiro TikTok Pixel

**Exemplo:**
```
VITE_TIKTOK_PIXEL_ID=D3LDR93C77UD1HDJ6P80
VITE_TIKTOK_PIXEL_ID_2=D3NUMD3C77U1N95E0TJ0
```

### 2. Como Adicionar no Replit

1. Vá em "Tools" > "Secrets" no Replit
2. Clique em "Add new secret"
3. Adicione cada variável conforme o exemplo acima
4. Reinicie a aplicação

## ✅ Recursos Implementados

### 1. Inicialização Global
- TikTok Pixel carregado automaticamente em TODAS as páginas
- Componente `TikTokPixelInitializer` no App.tsx

### 2. Rastreamento de Conversões
O sistema rastreia conversões automaticamente nas seguintes páginas:
- **Payment.tsx** - Quando pagamento é aprovado
- **Treinamento.tsx** - Conversão na página de treinamento
- Outras páginas de conversão

### 3. Proteção Contra Duplicatas

**Páginas de Pagamento (Payment.tsx):**
- Usa `localStorage` para rastrear conversões únicas por transação
- Cada transação é rastreada apenas UMA vez
- Chave única: `tiktok_conversion_${transactionId}`

**Páginas Estáticas (Treinamento.tsx):**
- Usa `sessionStorage` para prevenir duplicatas na mesma sessão
- ID único gerado a cada carregamento: `treinamento_${timestamp}_${random}`
- Permite novas conversões em novas sessões do navegador

### 4. Múltiplos Pixels
- Suporta até 3 TikTok Pixels simultâneos
- Todos os pixels recebem os mesmos eventos via:
  - Pixel principal: `ttq.track(eventName, data)`
  - Pixels adicionais: `ttq.instance(pixelId).track(eventName, data)`
- Configuração via variáveis de ambiente

## 📊 Eventos Rastreados

### CompletePayment (Purchase)
Disparado quando um pagamento é aprovado:

```javascript
{
  value: 64.90,           // Valor da transação
  currency: 'BRL',        // Moeda
  content_name: 'Kit de Segurança Shopee',
  content_type: 'product',
  content_id: 'transaction_id',
  contents: [{
    content_id: 'transaction_id',
    content_name: 'Kit de Segurança Shopee',
    quantity: 1,
    price: 64.90
  }]
}
```

## 🔍 Como Verificar se Está Funcionando

### 1. Console do Navegador
Abra o Console (F12) e procure por:
```
[TIKTOK-PIXEL] Inicializando TikTok Pixels
[TIKTOK-PIXEL] X TikTok Pixels inicializados com sucesso
[TIKTOK-PIXEL] Rastreando compra aprovada: { transactionId: ..., amount: ... }
[TIKTOK-PIXEL] Conversão XXX rastreada e marcada como processada
```

### 2. TikTok Events Manager
1. Acesse o TikTok Ads Manager
2. Vá em "Assets" > "Events"
3. Selecione seu Pixel
4. Verifique os eventos "CompletePayment" sendo recebidos em tempo real

### 3. TikTok Pixel Helper (Extensão do Chrome)
1. Instale a extensão "TikTok Pixel Helper"
2. Navegue pelo site
3. A extensão mostrará os pixels carregados e eventos disparados

## 🚫 Sistema Anti-Duplicatas

O sistema previne duplicatas de 3 formas:

1. **localStorage**: Armazena conversões já rastreadas permanentemente
2. **Verificação por transactionId**: Cada transação tem ID único
3. **Return early**: Se já rastreado, retorna `false` imediatamente

**Exemplo de chave no localStorage:**
```
tiktok_conversion_tx_123456789 = "2025-10-16T18:16:00.000Z"
```

## 📝 Arquivos Criados/Modificados

### Novos Arquivos
- `client/src/lib/tiktok-pixel.ts` - Biblioteca principal
- `client/src/components/TikTokPixelInitializer.tsx` - Componente inicializador

### Arquivos Modificados
- `client/src/App.tsx` - Adicionado TikTokPixelInitializer
- `client/src/pages/Payment.tsx` - Adicionado tracking TikTok
- `client/src/pages/Treinamento.tsx` - Atualizado para usar nova biblioteca
- `client/src/components/ConversionTracker.tsx` - Adicionado suporte TikTok

## 🎯 Próximos Passos

1. Configure as variáveis de ambiente com seus IDs do TikTok Pixel
2. Reinicie a aplicação
3. Teste fazendo uma conversão
4. Verifique no TikTok Events Manager
5. Monitore os logs do console para confirmar funcionamento

## ⚠️ Importante

- **NÃO hardcode** os IDs do TikTok Pixel no código
- Sempre use variáveis de ambiente
- As variáveis DEVEM começar com `VITE_` para serem acessíveis no frontend
- Cada conversão é rastreada apenas UMA vez, mesmo com múltiplos pixels
