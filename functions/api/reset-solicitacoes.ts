// Cloudflare Pages Function
import { createClient } from '@libsql/client';

const turso = createClient({
  url: process.env.DATABASE_URL || '',
  authToken: process.env.DATABASE_AUTH_TOKEN || '',
});

export async function onRequest() {
  try {
    // Drop table
    await turso.execute(`DROP TABLE IF EXISTS solicitacoes_liberacao`);
    
    // Recreate table
    await turso.execute(`
      CREATE TABLE solicitacoes_liberacao (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cooperado_id TEXT NOT NULL,
        hospital_id TEXT NOT NULL,
        data_solicitacao TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pendente',
        data_resposta TEXT,
        respondido_por TEXT,
        observacao TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    return new Response(JSON.stringify({ 
      message: 'Tabela recriada com sucesso' 
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
