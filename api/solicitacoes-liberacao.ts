import type { VercelRequest, VercelResponse } from '@vercel/node';
import { hasDbConfig, sql } from '../services/db.js';

const toJsonSafe = <T>(value: T): T => {
  return JSON.parse(
    JSON.stringify(value, (_, v) => (typeof v === 'bigint' ? Number(v) : v))
  );
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (!hasDbConfig()) {
    return res.status(500).json({ error: 'Missing DATABASE_URL or DATABASE_AUTH_TOKEN env var' });
  }

  console.log('[solicitacoes-liberacao] Método:', req.method);

  try {
    // Criar tabela se não existir
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS solicitacoes_liberacao (
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
      `;
    } catch (tableError) {
      console.log('[solicitacoes-liberacao] Tabela já existe');
    }

    if (req.method === 'GET') {
      const { status, cooperado_id, hospital_id } = req.query;
      const statusFilter = typeof status === 'string' ? status : undefined;
      const cooperadoFilter = typeof cooperado_id === 'string' ? cooperado_id : undefined;
      const hospitalFilter = typeof hospital_id === 'string' ? hospital_id : undefined;

      let rows: any[] = [];

      // Tentar com JOIN
      try {
        if (statusFilter && cooperadoFilter && hospitalFilter) {
          rows = await sql`
            SELECT s.*, c.nome as cooperado_nome, c.cpf as cooperado_cpf, h.nome as hospital_nome 
            FROM solicitacoes_liberacao s 
            LEFT JOIN cooperados c ON s.cooperado_id = c.id 
            LEFT JOIN hospitals h ON s.hospital_id = h.id 
            WHERE s.status = ${statusFilter} AND s.cooperado_id = ${cooperadoFilter} AND s.hospital_id = ${hospitalFilter}
            ORDER BY s.created_at DESC
          `;
        } else if (statusFilter && cooperadoFilter) {
          rows = await sql`
            SELECT s.*, c.nome as cooperado_nome, c.cpf as cooperado_cpf, h.nome as hospital_nome 
            FROM solicitacoes_liberacao s 
            LEFT JOIN cooperados c ON s.cooperado_id = c.id 
            LEFT JOIN hospitals h ON s.hospital_id = h.id 
            WHERE s.status = ${statusFilter} AND s.cooperado_id = ${cooperadoFilter}
            ORDER BY s.created_at DESC
          `;
        } else if (statusFilter && hospitalFilter) {
          rows = await sql`
            SELECT s.*, c.nome as cooperado_nome, c.cpf as cooperado_cpf, h.nome as hospital_nome 
            FROM solicitacoes_liberacao s 
            LEFT JOIN cooperados c ON s.cooperado_id = c.id 
            LEFT JOIN hospitals h ON s.hospital_id = h.id 
            WHERE s.status = ${statusFilter} AND s.hospital_id = ${hospitalFilter}
            ORDER BY s.created_at DESC
          `;
        } else if (cooperadoFilter && hospitalFilter) {
          rows = await sql`
            SELECT s.*, c.nome as cooperado_nome, c.cpf as cooperado_cpf, h.nome as hospital_nome 
            FROM solicitacoes_liberacao s 
            LEFT JOIN cooperados c ON s.cooperado_id = c.id 
            LEFT JOIN hospitals h ON s.hospital_id = h.id 
            WHERE s.cooperado_id = ${cooperadoFilter} AND s.hospital_id = ${hospitalFilter}
            ORDER BY s.created_at DESC
          `;
        } else if (statusFilter) {
          rows = await sql`
            SELECT s.*, c.nome as cooperado_nome, c.cpf as cooperado_cpf, h.nome as hospital_nome 
            FROM solicitacoes_liberacao s 
            LEFT JOIN cooperados c ON s.cooperado_id = c.id 
            LEFT JOIN hospitals h ON s.hospital_id = h.id 
            WHERE s.status = ${statusFilter}
            ORDER BY s.created_at DESC
          `;
        } else if (cooperadoFilter) {
          rows = await sql`
            SELECT s.*, c.nome as cooperado_nome, c.cpf as cooperado_cpf, h.nome as hospital_nome 
            FROM solicitacoes_liberacao s 
            LEFT JOIN cooperados c ON s.cooperado_id = c.id 
            LEFT JOIN hospitals h ON s.hospital_id = h.id 
            WHERE s.cooperado_id = ${cooperadoFilter}
            ORDER BY s.created_at DESC
          `;
        } else if (hospitalFilter) {
          rows = await sql`
            SELECT s.*, c.nome as cooperado_nome, c.cpf as cooperado_cpf, h.nome as hospital_nome 
            FROM solicitacoes_liberacao s 
            LEFT JOIN cooperados c ON s.cooperado_id = c.id 
            LEFT JOIN hospitals h ON s.hospital_id = h.id 
            WHERE s.hospital_id = ${hospitalFilter}
            ORDER BY s.created_at DESC
          `;
        } else {
          rows = await sql`
            SELECT s.*, c.nome as cooperado_nome, c.cpf as cooperado_cpf, h.nome as hospital_nome 
            FROM solicitacoes_liberacao s 
            LEFT JOIN cooperados c ON s.cooperado_id = c.id 
            LEFT JOIN hospitals h ON s.hospital_id = h.id 
            ORDER BY s.created_at DESC
          `;
        }
      } catch (joinError: any) {
        console.warn('[solicitacoes-liberacao] JOIN falhou, usando fallback:', joinError?.message);
        // Fallback: sem JOIN
        try {
          if (statusFilter && cooperadoFilter && hospitalFilter) {
            rows = await sql`
              SELECT * FROM solicitacoes_liberacao 
              WHERE status = ${statusFilter} AND cooperado_id = ${cooperadoFilter} AND hospital_id = ${hospitalFilter}
              ORDER BY created_at DESC
            `;
          } else if (statusFilter && cooperadoFilter) {
            rows = await sql`
              SELECT * FROM solicitacoes_liberacao 
              WHERE status = ${statusFilter} AND cooperado_id = ${cooperadoFilter}
              ORDER BY created_at DESC
            `;
          } else if (statusFilter && hospitalFilter) {
            rows = await sql`
              SELECT * FROM solicitacoes_liberacao 
              WHERE status = ${statusFilter} AND hospital_id = ${hospitalFilter}
              ORDER BY created_at DESC
            `;
          } else if (cooperadoFilter && hospitalFilter) {
            rows = await sql`
              SELECT * FROM solicitacoes_liberacao 
              WHERE cooperado_id = ${cooperadoFilter} AND hospital_id = ${hospitalFilter}
              ORDER BY created_at DESC
            `;
          } else if (statusFilter) {
            rows = await sql`
              SELECT * FROM solicitacoes_liberacao 
              WHERE status = ${statusFilter}
              ORDER BY created_at DESC
            `;
          } else if (cooperadoFilter) {
            rows = await sql`
              SELECT * FROM solicitacoes_liberacao 
              WHERE cooperado_id = ${cooperadoFilter}
              ORDER BY created_at DESC
            `;
          } else if (hospitalFilter) {
            rows = await sql`
              SELECT * FROM solicitacoes_liberacao 
              WHERE hospital_id = ${hospitalFilter}
              ORDER BY created_at DESC
            `;
          } else {
            rows = await sql`SELECT * FROM solicitacoes_liberacao ORDER BY created_at DESC`;
          }
        } catch (fallbackError) {
          console.error('[solicitacoes-liberacao] Fallback falhou:', fallbackError);
          rows = [];
        }
      }

      return res.status(200).json(toJsonSafe(rows));
    }

    if (req.method === 'POST') {
      const { cooperado_id, hospital_id, observacao } = req.body;

      if (!cooperado_id || !hospital_id) {
        return res.status(400).json({
          error: 'cooperado_id e hospital_id são obrigatórios'
        });
      }

      try {
        // Verificar duplicata
        const existente = await sql`
          SELECT id FROM solicitacoes_liberacao 
          WHERE cooperado_id = ${cooperado_id} 
          AND hospital_id = ${hospital_id} 
          AND status = 'pendente'
        `;

        if (existente && existente.length > 0) {
          return res.status(400).json({
            error: 'Já existe uma solicitação pendente para esta unidade'
          });
        }

        const dataAtual = new Date().toISOString();

        await sql`
          INSERT INTO solicitacoes_liberacao 
          (cooperado_id, hospital_id, data_solicitacao, status, observacao)
          VALUES (${cooperado_id}, ${hospital_id}, ${dataAtual}, 'pendente', ${observacao || null})
        `;

        return res.status(201).json({
          success: true,
          message: 'Solicitação criada com sucesso'
        });
      } catch (error: any) {
        console.error('[solicitacoes-liberacao] Erro POST:', error);
        return res.status(500).json({
          error: 'Erro ao criar solicitação',
          details: error.message
        });
      }
    }

    if (req.method === 'PUT') {
      const { id, status, respondido_por, observacao } = req.body;

      if (!id || !status || !respondido_por) {
        return res.status(400).json({
          error: 'id, status e respondido_por são obrigatórios'
        });
      }

      if (!['aprovado', 'rejeitado'].includes(status)) {
        return res.status(400).json({
          error: 'status deve ser "aprovado" ou "rejeitado"'
        });
      }

      try {
        // Buscar dados da solicitação
        const solicitacoes = await sql`
          SELECT cooperado_id, hospital_id FROM solicitacoes_liberacao WHERE id = ${id}
        `;

        if (!solicitacoes || solicitacoes.length === 0) {
          return res.status(404).json({ error: 'Solicitação não encontrada' });
        }

        const { cooperado_id, hospital_id } = solicitacoes[0];
        const dataResposta = new Date().toISOString();

        // Atualizar status
        await sql`
          UPDATE solicitacoes_liberacao 
          SET status = ${status}, 
              data_resposta = ${dataResposta}, 
              respondido_por = ${respondido_por},
              observacao = ${observacao || null}
          WHERE id = ${id}
        `;

        // Se aprovado, adicionar unidade às autorizadas do cooperado
        if (status === 'aprovado') {
          const cooperados = await sql`
            SELECT unidades_justificativa FROM cooperados WHERE id = ${cooperado_id}
          `;

          if (cooperados && cooperados.length > 0) {
            let unidadesAtuais: string[] = [];
            const unidadesStr = cooperados[0].unidades_justificativa;

            if (unidadesStr) {
              try {
                unidadesAtuais = JSON.parse(unidadesStr as string);
                if (!Array.isArray(unidadesAtuais)) {
                  unidadesAtuais = [];
                }
              } catch {
                unidadesAtuais = [];
              }
            }

            // Adicionar unidade se não existir
            const hospitalIdStr = String(hospital_id);
            if (!unidadesAtuais.includes(hospitalIdStr)) {
              unidadesAtuais.push(hospitalIdStr);
            }

            // Atualizar cooperado
            await sql`
              UPDATE cooperados 
              SET unidades_justificativa = ${JSON.stringify(unidadesAtuais)}
              WHERE id = ${cooperado_id}
            `;
          }
        }

        return res.status(200).json({
          success: true,
          message: `Solicitação ${status} com sucesso`
        });
      } catch (error: any) {
        console.error('[solicitacoes-liberacao] Erro PUT:', error);
        return res.status(500).json({
          error: 'Erro ao responder solicitação',
          details: error.message
        });
      }
    }

    return res.status(405).json({ error: 'Método não permitido' });
  } catch (error: any) {
    console.error('[solicitacoes-liberacao] Erro geral:', error);
    return res.status(500).json({
      error: 'Erro no servidor',
      details: error.message
    });
  }
}
