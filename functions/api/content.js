// Public: projects, descriptions and photo order for the portfolio page
import { json, loadContent } from '../../cloudflare/lib.js';

export async function onRequestGet({ env }) {
  if (!env.DB) return json({ error: 'Database not bound' }, 503);
  return json(await loadContent(env.DB), 200, { 'cache-control': 'public, max-age=15' });
}
