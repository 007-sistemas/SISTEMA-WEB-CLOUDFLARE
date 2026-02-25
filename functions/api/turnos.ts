// Função Cloudflare Pages para /api/turnos
// Salva e lista turnos padrões no Turso via HTTP API
export const onRequest = async (context) => {
  const TURSO_URL = context.env.DATABASE_URL;
  const TURSO_AUTH = context.env.DATABASE_AUTH_TOKEN;
  const req = context.request;

  if (!TURSO_URL || !TURSO_AUTH) {
    return new Response(JSON.stringify({ error: 'DATABASE_URL ou DATABASE_AUTH_TOKEN não configurados' }), { status: 500 });
  }

  // Função utilitária para query no Turso
  async function tursoQuery(sql, params = []) {
    const res = await fetch(`${TURSO_URL}/v1/execute`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TURSO_AUTH}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        statements: [{ sql, args: params }]
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao consultar Turso');
    return data.results[0]?.rows || [];
  }

  if (req.method === 'GET') {
    // Listar turnos padrões
    try {
      const rows = await tursoQuery('SELECT * FROM turnos_padroes ORDER BY nome ASC');
      return new Response(JSON.stringify(rows), { status: 200 });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
  }

  if (req.method === 'POST') {
    try {
      const body = await req.json();
      const { id, nome, horario_inicio, horario_fim, tolerancia_antes, tolerancia_depois } = body;
      if (!nome || !horario_inicio || !horario_fim) {
        return new Response(JSON.stringify({ error: 'Campos obrigatórios' }), { status: 400 });
      }
      const turnoId = id || `turno-${Date.now()}`;
      await tursoQuery(
        `INSERT OR REPLACE INTO turnos_padroes (id, nome, horario_inicio, horario_fim, tolerancia_antes, tolerancia_depois, updated_at) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
        [turnoId, nome, horario_inicio, horario_fim, tolerancia_antes || 0, tolerancia_depois || 0]
      );
      return new Response(JSON.stringify({ success: true, id: turnoId }), { status: 200 });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const body = await req.json();
      const { id } = body;
      if (!id) return new Response(JSON.stringify({ error: 'ID obrigatório' }), { status: 400 });
      await tursoQuery('DELETE FROM turnos_padroes WHERE id = ?', [id]);
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
  }

  return new Response('Method Not Allowed', { status: 405 });
};
