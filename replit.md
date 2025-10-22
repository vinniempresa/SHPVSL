# Replit.md - Shopee Delivery Partners

## Overview

This project is a comprehensive web platform for recruiting delivery partners for Shopee in the Brazilian market. It features a modern React frontend with TypeScript, an Express.js backend, and integrates with external payment services (For4Payments) for processing kit purchases. The application includes a multi-step registration process, payment integration, IP tracking, vehicle verification, and email notifications.

## System Architecture

The application follows a full-stack architecture with clear separation between frontend and backend concerns:

**Frontend**: React with TypeScript, built using Vite for fast development and optimized production builds
**Backend**: Express.js server with TypeScript, providing RESTful API endpoints
**Database**: PostgreSQL with Drizzle ORM for type-safe database operations
**Styling**: Tailwind CSS with custom Shopee branding
**UI Components**: Radix UI components with shadcn/ui design system

## Key Components

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: React hooks and context for local state
- **Forms**: React Hook Form with Zod schema validation
- **HTTP Client**: Axios for API communication
- **Build Tool**: Vite for fast development and optimized builds

### Backend Architecture
- **Server**: Express.js with TypeScript
- **Database ORM**: Drizzle with PostgreSQL dialect
- **Authentication**: Custom IP tracking and ban system
- **External Integrations**: For4Payments API for PIX payments
- **Email Service**: SendGrid for transactional emails
- **CORS**: Configured for cross-origin requests

### Database Schema
The application uses several key entities:
- **States**: Brazilian states with vacancy counts
- **Candidates**: Registration data for delivery partners
- **Banned IPs**: IP blocking system for security
- **Payment Records**: Transaction tracking and status

### Payment Integration
- **Primary Provider**: For4Payments for PIX payment processing
- **Payment Flow**: Multi-step process with real-time status updates
- **Security**: Transaction tracking with IP-based fraud prevention
- **Validation**: CPF, email, and phone number validation

## Data Flow

1. **Registration Process**:
   - User selects state/region
   - Fills personal information form
   - Vehicle verification (optional integration with external API)
   - Payment processing for safety kit
   - Email confirmation and badge generation

2. **Payment Process**:
   - Generate PIX payment via For4Payments API
   - Real-time payment status monitoring
   - Automatic approval and email notifications
   - Badge generation upon successful payment

3. **Security Flow**:
   - IP tracking for all transactions
   - Automatic banning of suspicious IPs
   - Rate limiting and fraud detection

## External Dependencies

### Core Dependencies
- **React Ecosystem**: React, React Router (Wouter), React Hook Form
- **UI Framework**: Radix UI primitives, Tailwind CSS
- **Backend**: Express.js, Cors, Compression
- **Database**: PostgreSQL, Drizzle ORM
- **Validation**: Zod for schema validation
- **HTTP Client**: Axios for API requests

### External Services
- **For4Payments**: PIX payment processing
- **SendGrid**: Email delivery service
- **Vehicle API**: External vehicle verification service
- **Facebook Pixel**: Conversion tracking for marketing
- **TikTok Pixel**: Global conversion tracking with anti-duplicate protection (Purchase event) for TikTok ads
- **Microsoft Clarity**: User behavior analytics and session recordings

### Development Tools
- **TypeScript**: Type safety across the stack
- **Vite**: Build tool and development server
- **ESBuild**: Fast JavaScript bundling
- **Drizzle Kit**: Database migrations and schema management

## Deployment Strategy

The application supports multiple deployment strategies:

### 1. Unified Deployment (Recommended)
- **Platform**: Heroku with custom Vite server
- **Process**: Single dyno running Vite in development mode
- **Configuration**: `heroku-vite-server-standalone.js` for production-ready development server
- **Benefits**: Matches Replit preview exactly, simplified deployment

### 2. Separate Frontend/Backend
- **Frontend**: Netlify or Vercel for static hosting
- **Backend**: Heroku for API services
- **Configuration**: Separate build processes and CORS configuration
- **Benefits**: Optimized for static content delivery

### 3. Serverless Functions
- **Platform**: Vercel with serverless functions
- **Configuration**: Individual API endpoints as serverless functions
- **Benefits**: Automatic scaling and pay-per-use pricing

### Build Process
- Frontend builds to `dist/public` directory
- Backend builds with ESBuild to `dist` directory
- Environment variables managed through platform-specific configuration
- Database migrations handled via Drizzle Kit

## Changelog
- **October 22, 2025 (Microsoft Clarity ttxphy7a8o Instalado)**:
  - Configurado Microsoft Clarity ID: ttxphy7a8o
  - Clarity já estava integrado globalmente via ClarityInitializer em App.tsx
  - Rastreia comportamento dos usuários, gravações de sessões e mapas de calor
  - Sistema carrega automaticamente em todas as páginas
- **October 19, 2025 (Facebook Pixel 1141319457465997 Instalado)**:
  - Configurado novo Facebook Pixel ID: 1141319457465997
  - Sistema atualizado para usar variáveis de ambiente (VITE_FB_PIXEL_ID)
  - Facebook Pixel já estava integrado globalmente via FacebookPixelInitializer em App.tsx
  - Sistema anti-duplicata garante que cada venda é rastreada apenas uma vez
  - Suporta múltiplos pixels simultaneamente (VITE_FB_PIXEL_ID, VITE_FB_PIXEL_ID_2, etc.)
- **October 16, 2025 (Chave API 4M Pagamentos Atualizada)**:
  - Atualizada chave secreta do gateway 4M Pagamentos
  - Nova chave: 3mpag_l04cmpzhx_mgtzhwuq (armazenada em MPAG_API_KEY_NEW)
  - Sistema de pagamentos PIX agora usa a nova credencial
- **October 16, 2025 (Segundo TikTok Pixel D3N3EFJC77U5QFM08SUG Adicionado)**:
  - Adicionado segundo pixel TikTok: D3N3EFJC77U5QFM08SUG
  - Sistema agora rastreia TODAS as vendas em 2 pixels simultaneamente
  - Cada pixel opera de forma independente com anti-duplicata próprio
  - Cobertura total: 100% das conversões rastreadas em ambos os pixels
- **October 16, 2025 (TikTok Pixel D3OJACRC77U816ES04EG Instalado)**:
  - Configurado primeiro TikTok Pixel ID: D3OJACRC77U816ES04EG
  - Pixel já estava integrado globalmente via TikTokPixelInitializer em App.tsx
  - Sistema anti-duplicata garante que cada venda é rastreada apenas uma vez
  - Rastreamento acontece em todas as páginas de pagamento (Payment, CpfPayment, Pagamento, Pay, Treinamento)
- **October 16, 2025 (Valor do Kit Atualizado)**:
  - Alterado valor da primeira taxa de R$ 64,90 para R$ 64,97
  - Atualizado em todos os arquivos: frontend (páginas de pagamento, pixels) e backend (rotas de API)
  - Sistema de pagamento agora processa o valor correto de R$ 64,97
- **October 16, 2025 (API de Verificação de Placas - Fix Produção)**:
  - CORRIGIDO: Removido código conflitante que tentava usar proxy Netlify inexistente
  - Página /cadastro agora usa apenas VehicleInfoBox para consultas de placas
  - Sistema funciona corretamente via endpoint /api/vehicle-info/:placa do backend
  - Logs de debug adicionados para facilitar troubleshooting
- **October 16, 2025 (API de Verificação de Placas Integrada)**:
  - Integrada API de verificação de placas de veículos
  - Configurada chave API segura via variável de ambiente VEHICLE_API_KEY
  - Sistema de cache e retry já implementado no backend (/api/vehicle-info/:placa)
  - Frontend com integração automática através do VehicleInfoBox e useVehicleInfo hook
- **October 16, 2025 (Nova Conta 4M Pagamentos Integrada)**:
  - Migrada integração de pagamento para nova conta 4M Pagamentos
  - Atualizada URL da API para https://app.4mpagamentos.com/api/v1
  - Configurada chave API segura via variável de ambiente MPAG_API_KEY_NEW
  - Todos os logs e comentários atualizados para refletir 4M Pagamentos
- **October 16, 2025 (Proteções Completamente Removidas)**:
  - Removido import do useDesktopProtection do App.tsx
  - Confirmado que TODAS as proteções de desktop/IP foram removidas
  - Sistema de ban de IP já estava desativado no servidor (linha 22-23 do server/index.ts)
  - Projeto agora abre completamente sem nenhuma restrição de acesso
- **October 16, 2025 (TikTok Pixel - Global Implementation)**:
  - Implemented global TikTok Pixel system similar to Facebook Pixel
  - Created centralized library (`client/src/lib/tiktok-pixel.ts`) with anti-duplicate protection using localStorage
  - Added TikTokPixelInitializer component loaded in App.tsx for global tracking
  - Integrated TikTok conversion tracking in all payment pages (Payment.tsx, Treinamento.tsx, etc.)
  - Supports multiple TikTok Pixel IDs via environment variables (VITE_TIKTOK_PIXEL_ID, VITE_TIKTOK_PIXEL_ID_2, etc.)
  - Automatic duplicate prevention - each transaction tracked only once
- **October 16, 2025 (Payment Service Fix)**: Fixed payment service initialization error by implementing lazy-loading of API keys
- **October 15, 2025 (Security Fix - API Keys)**: Moved 4mpagamentos API key from hardcoded values to secure environment variable (MPAG_API_KEY) across all server files to prevent key exposure
- **October 15, 2025 (3 CRITICAL BUGS FIXED)**: 
  1. **REMOVED ALL BLOCKING SYSTEMS** - Eliminated frontend desktop blocking script, backend IP ban middleware, and desktop detection middleware that were killing 30-50% of conversions
  2. **Fixed Payment Page** - Now accepts links without email parameter (CRM/WhatsApp compatibility)
  3. **Added Database Fallback** - System now uses MemStorage when PostgreSQL is unavailable instead of crashing
- October 15, 2025 (Critical Fix): **REMOVED DESKTOP BLOCKING** - This was killing conversions! Desktop/tablet users from TikTok ads were being blocked and redirected to about:blank
- October 15, 2025: Removed Chrome redirect logic from TikTok detector to allow in-app browsing; Added Microsoft Clarity analytics; Updated TikTok Pixel to fire Purchase event; Fixed PostgreSQL connection handling in Heroku deployment
- July 08, 2025: Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.