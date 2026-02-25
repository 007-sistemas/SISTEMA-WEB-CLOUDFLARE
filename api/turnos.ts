import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../services/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // Listar turnos padrões
    const rows = await db.all('SELECT * FROM turnos_padroes ORDER BY nome ASC');
    return res.status(200).json(rows);
  }
  if (req.method === 'POST') {
    // Criar ou atualizar turno padrão
    const { id, nome, horario_inicio, horario_fim, tolerancia_antes, tolerancia_depois } = req.body;
    if (!nome || !horario_inicio || !horario_fim) return res.status(400).json({ error: 'Campos obrigatórios' });
    let turnoId = id || `turno-${Date.now()}`;
    await db.run(`INSERT OR REPLACE INTO turnos_padroes (id, nome, horario_inicio, horario_fim, tolerancia_antes, tolerancia_depois, updated_at) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
      [turnoId, nome, horario_inicio, horario_fim, tolerancia_antes || 0, tolerancia_depois || 0]);
    return res.status(200).json({ success: true, id: turnoId });
  }
  if (req.method === 'DELETE') {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'ID obrigatório' });
    await db.run('DELETE FROM turnos_padroes WHERE id = ?', [id]);
    return res.status(200).json({ success: true });
  }
  res.status(405).end();
}
