import { neon } from '@neondatabase/serverless';

export default {
  async fetch(request: Request): Promise<Response> {
    // Exemplo simples: GET /api/ping
    const url = new URL(request.url);
    if (url.pathname === '/api/ping') {
      return new Response('pong', { status: 200 });
    }

    // Exemplo: conexão com NeonDB
    if (url.pathname === '/api/test-db') {
      const sql = neon(Deno.env.get('DATABASE_URL')!);
      const result = await sql`SELECT NOW()`;
      return Response.json(result);
    }

    return new Response('Not found', { status: 404 });
  }
};
