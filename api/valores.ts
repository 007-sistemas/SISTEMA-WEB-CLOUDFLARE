import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../services/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // Listar valores por turno/unidade
    const { hospitalId } = req.query;
    let query = 'SELECT * FROM turnos_unidade';
    let params: any[] = [];
    if (hospitalId) {
      query += ' WHERE hospital_id = ?';
      params.push(hospitalId);
    }
    const rows = await db.all(query, params);
    return res.status(200).json(rows);
  }
  if (req.method === 'POST') {
    // Criar ou atualizar valor de turno/unidade
    const { id, hospital_id, turno_padrao_id, categoria_profissional, valor_hora, tolerancia_antes, tolerancia_depois } = req.body;
    if (!hospital_id || !turno_padrao_id || !categoria_profissional || !valor_hora) return res.status(400).json({ error: 'Campos obrigatórios' });
    let valorId = id || `valor-${Date.now()}`;
    await db.run(`INSERT OR REPLACE INTO turnos_unidade (id, hospital_id, turno_padrao_id, categoria_profissional, valor_hora, tolerancia_antes, tolerancia_depois, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      [valorId, hospital_id, turno_padrao_id, categoria_profissional, valor_hora, tolerancia_antes || 0, tolerancia_depois || 0]);
    return res.status(200).json({ success: true, id: valorId });
  }
  if (req.method === 'DELETE') {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'ID obrigatório' });
    await db.run('DELETE FROM turnos_unidade WHERE id = ?', [id]);
    return res.status(200).json({ success: true });
  }
  res.status(405).end();
}
