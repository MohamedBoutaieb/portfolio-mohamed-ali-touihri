// Serve photos uploaded through /admin (stored in D1)
export async function onRequestGet({ env, params }) {
  if (!/^[0-9a-f-]{36}$/.test(params.id)) return new Response('Not found', { status: 404 });
  const row = await env.DB.prepare('SELECT mime, data FROM media WHERE id=?').bind(params.id).first();
  if (!row) return new Response('Not found', { status: 404 });
  return new Response(new Uint8Array(row.data), {
    headers: { 'content-type': row.mime, 'cache-control': 'public, max-age=31536000, immutable' },
  });
}
