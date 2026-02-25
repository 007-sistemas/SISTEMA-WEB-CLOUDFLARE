import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sql } from "../services/db.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "GET") {
    try {
      const rows = await sql`SELECT name FROM professions ORDER BY name ASC`;
      const professions = rows.map((row: any) => row.name);
      res.status(200).json(professions);
    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar profissões." });
    }
  } else {
    res.status(405).json({ error: "Método não permitido." });
  }
}
