import type { VercelRequest, VercelResponse } from '@vercel/node';
import { hasDbConfig, sql } from '../services/db.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }
  if (!hasDbConfig()) {
    res.status(500).json({ error: 'Missing DATABASE_URL or DATABASE_AUTH_TOKEN env var' });
    return;
  }


  if (req.method === 'GET') {
    try {
      // Garante colunas esperadas em bases antigas
      try { await sql`ALTER TABLE managers ADD COLUMN IF NOT EXISTS cpf text`; } catch {}
      try { await sql`ALTER TABLE managers ADD COLUMN IF NOT EXISTS email text`; } catch {}
      try { await sql`ALTER TABLE managers ADD COLUMN IF NOT EXISTS permissoes text DEFAULT '{}'`; } catch {}
      try { await sql`ALTER TABLE managers ADD COLUMN IF NOT EXISTS preferences text`; } catch {}
      try { await sql`ALTER TABLE managers ADD COLUMN IF NOT EXISTS categoria text`; } catch {}
      try { await sql`ALTER TABLE managers ADD COLUMN IF NOT EXISTS unidadesTomador text`; } catch {}

      let rows: any[] = [];
      try {
        rows = await sql`SELECT id, username, password, cpf, email, permissoes, preferences, categoria, unidadesTomador FROM managers ORDER BY created_at DESC`;
      } catch {
        rows = await sql`SELECT id, username, password, cpf, email, permissoes, preferences, categoria, unidadesTomador FROM managers`;
      }
      res.status(200).json(rows);
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Unknown error' });
    }
    return;
  }

  if (req.method === 'POST' || req.method === 'PUT') {
    const { id, username, password, cpf, email, permissoes, preferences, categoria, unidadesTomador } = req.body;
    if (!id || !username || !password || !cpf || !email) {
      res.status(400).json({ error: 'Campos obrigatórios ausentes.' });
      return;
    }
    try {
      await sql`
        INSERT OR REPLACE INTO managers (id, username, password, cpf, email, permissoes, preferences, categoria, unidadesTomador, created_at)
        VALUES (${id}, ${username}, ${password}, ${cpf}, ${email}, ${permissoes}, ${preferences}, ${categoria}, ${unidadesTomador}, COALESCE((SELECT created_at FROM managers WHERE id = ${id}), datetime('now')))
      `;
      res.status(200).json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Erro ao salvar gestor.' });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
  return;

  try {
    // Garante colunas esperadas em bases antigas
    try { await sql`ALTER TABLE managers ADD COLUMN IF NOT EXISTS cpf text`; } catch {}
    try { await sql`ALTER TABLE managers ADD COLUMN IF NOT EXISTS email text`; } catch {}
    try { await sql`ALTER TABLE managers ADD COLUMN IF NOT EXISTS permissoes text DEFAULT '{}'`; } catch {}
    try { await sql`ALTER TABLE managers ADD COLUMN IF NOT EXISTS preferences text`; } catch {}

    let rows: any[] = [];
    try {
      rows = await sql`SELECT id, username, password, cpf, email, permissoes, preferences FROM managers ORDER BY created_at DESC`;
    } catch {
      rows = await sql`SELECT id, username, password, cpf, email, permissoes, preferences FROM managers`;
    }
    res.status(200).json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Unknown error' });
  }
}
