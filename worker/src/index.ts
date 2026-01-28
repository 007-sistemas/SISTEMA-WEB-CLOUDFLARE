import { neon } from '@neondatabase/serverless';

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/api/ping') {
      return new Response('pong', { status: 200 });
    }

    // Compatível com Node.js e Deno
    const getEnv = (key: string) =>
      typeof process !== 'undefined' && process.env
        ? process.env[key]
        : (globalThis as any).Deno?.env?.get(key);

    if (url.pathname === '/api/test-db') {
      const dbUrl = getEnv('DATABASE_URL');
      if (!dbUrl) return new Response('DATABASE_URL não definida', { status: 500 });
      const sql = neon(dbUrl);
      const result = await sql`SELECT NOW()`;
      return Response.json(result);
    }

    return new Response('Not found', { status: 404 });
  }
};
