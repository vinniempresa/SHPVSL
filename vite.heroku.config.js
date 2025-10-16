// Configuração do Vite específica para o Heroku
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import runtimeErrorOverlay from '@replit/vite-plugin-runtime-error-modal';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay()
  ],
  server: {
    host: '0.0.0.0',
    port: process.env.PORT || 5000,
    strictPort: true
  },
  preview: {
    host: '0.0.0.0',
    port: process.env.PORT || 5000,
    strictPort: true
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src'),
      '@shared': path.resolve(__dirname, './shared'),
      '@assets': path.resolve(__dirname, './client/src/assets'),
      '@attached': path.resolve(__dirname, './attached_assets')
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'wouter']
  },
  build: {
    outDir: path.resolve(__dirname, 'dist/public'),
    emptyOutDir: true
  },
  root: path.resolve(__dirname, 'client')
});