import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Permitir que a aplicação rode sem banco de dados (fallback para memória)
export const isDatabaseAvailable = !!process.env.DATABASE_URL;

if (!isDatabaseAvailable) {
  console.warn('[DB] DATABASE_URL não configurado. A aplicação usará armazenamento em memória.');
  console.warn('[DB] Para usar o banco de dados, configure a variável DATABASE_URL no Heroku.');
}

export const pool = isDatabaseAvailable 
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : null as any;

export const db = isDatabaseAvailable 
  ? drizzle({ client: pool, schema })
  : null as any;
