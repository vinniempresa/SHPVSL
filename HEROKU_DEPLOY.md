# Deploy no Heroku - Shopee Delivery Partners

## ✅ SOLUÇÃO ATUALIZADA: Pipeline de Build Unificado

### Por que essa abordagem é melhor?
✅ **Build unificado**: Usa o mesmo pipeline do desenvolvimento
✅ **Código real**: Todas as APIs e funcionalidades da aplicação real
✅ **Segurança**: Configurações de IP e proxy adequadas para produção
✅ **Confiável**: Sem duplicação de código ou configurações conflitantes

### Como funciona
1. **Build do frontend**: Vite (com config do Heroku) compila React para `dist/public`
2. **Build do backend**: ESBuild compila TypeScript para `dist/index.js`
3. **Servidor inicia**: Express serve frontend e APIs compiladas
4. **Todas as funcionalidades**: IP blocking, WebSocket, push notifications funcionam

### Comando de Build
```bash
vite build --config vite.heroku.config.js && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist
```

### Arquivos da solução
- `package-heroku.json` - Package.json específico para Heroku com todas as dependências
- `Procfile.fullstack` - Comando: `web: node dist/index.js`
- `vite.heroku.config.js` - Configuração do Vite para produção
- `app.json` - Configuração do Heroku

### Comandos para deploy
```bash
# Usar o package específico do Heroku (se necessário)
cp package-heroku.json package.json

# Usar o Procfile correto
cp Procfile.fullstack Procfile

# Commit
git commit -m "Deploy: Pipeline de build unificado"

# Push para Heroku
git push heroku main
```

### APIs incluídas (TODAS funcionais)
- `GET /api/regions` - Regiões reais do sistema
- `GET /api/vehicle-info/:placa` - Consulta real de veículo
- `GET /api/check-ip-status` - Verificação de IP com proteção real
- `POST /api/payments/create-pix` - Sistema de pagamentos completo
- `POST /api/push-subscriptions` - Sistema de notificações push
- `WebSocket` - Comunicação em tempo real
- **E todas as outras APIs da aplicação**

### Resultado
Após deploy, você terá:
- ✅ Aplicação React completa **idêntica** ao Replit
- ✅ **Todas** as páginas e funcionalidades
- ✅ Sistema de proteção de IP funcional
- ✅ Sistema de notificações push
- ✅ WebSocket para comunicação em tempo real
- ✅ Performance otimizada com build de produção
- ✅ Todas as APIs reais (não mocks)

### Configurações de Segurança
- ✅ Trust proxy configurado para Heroku
- ✅ IP blocking funcional em produção
- ✅ CORS configurado para produção
- ✅ Cabeçalhos de segurança aplicados