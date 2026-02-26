// Script para remover a coluna 'status' da tabela setores (Turso/SQLite)
import { sql } from './turso-db.js';

async function dropStatusColumn() {
  console.log('[MIGRATION] Removendo coluna status da tabela setores...');
  try {
    // SQLite não suporta DROP COLUMN diretamente, então precisamos:
    // 1. Criar nova tabela sem a coluna status
    // 2. Copiar dados
    // 3. Renomear tabelas
    await sql`CREATE TABLE setores_temp AS SELECT id, nome FROM setores;`;
    await sql`DROP TABLE setores;`;
    await sql`ALTER TABLE setores_temp RENAME TO setores;`;
    console.log('✅ Coluna status removida com sucesso!');
  } catch (e) {
    console.error('Erro ao remover coluna status:', e);
  }
}

dropStatusColumn();
