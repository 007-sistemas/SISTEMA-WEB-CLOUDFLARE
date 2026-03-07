import { sql } from '../services/db';

export default async function handler(req: any, res: any) {
  if (req.method === 'GET') {
    // Listar turnos padrões
    const rows = await sql`SELECT * FROM turnos_padroes ORDER BY nome ASC`;
    // Mapear snake_case para camelCase
    const mapped = rows.map((r: any) => ({
      id: r.id,
      nome: r.nome,
      horarioInicio: r.horario_inicio,
      horarioFim: r.horario_fim,
      toleranciaAntes: r.tolerancia_antes,
      toleranciaDepois: r.tolerancia_depois,
      createdAt: r.created_at,
      updatedAt: r.updated_at
    }));
    return res.status(200).json(mapped);
  }
  if (req.method === 'POST') {
    // Criar ou atualizar turno padrão
    const { id, nome, horario_inicio, horario_fim, tolerancia_antes, tolerancia_depois } = req.body;
    if (!nome || !horario_inicio || !horario_fim) return res.status(400).json({ error: 'Campos obrigatórios' });
    const turnoId = id || `turno-${Date.now()}`;
    await sql`INSERT OR REPLACE INTO turnos_padroes (id, nome, horario_inicio, horario_fim, tolerancia_antes, tolerancia_depois, updated_at) VALUES (${turnoId}, ${nome}, ${horario_inicio}, ${horario_fim}, ${tolerancia_antes || 0}, ${tolerancia_depois || 0}, datetime('now'))`;
    return res.status(200).json({ success: true, id: turnoId });
  }
  if (req.method === 'DELETE') {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'ID obrigatório' });
    await sql`DELETE FROM turnos_padroes WHERE id = ${id}`;
    return res.status(200).json({ success: true });
  }
  res.status(405).end();
}
