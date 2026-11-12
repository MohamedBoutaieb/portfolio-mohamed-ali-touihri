// Save the drag-and-drop order of a project's photos
import { json } from '../../../../../cloudflare/lib.js';

export async function onRequestPut({ request, env, params }) {
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Requête invalide.' }, 400); }
  const ids = Array.isArray(body.ids) ? body.ids.map(Number) : [];
  const { results } = await env.DB.prepare('SELECT id FROM photos WHERE project_id=?').bind(params.id).all();
  const current = new Set(results.map((r) => r.id));
  if (ids.length !== current.size || !ids.every((id) => current.has(id)) || new Set(ids).size !== ids.length) {
    return json({ error: 'La liste des photos a changé, rechargez la page.' }, 409);
  }
  await env.DB.batch(ids.map((id, i) => env.DB.prepare('UPDATE photos SET position=? WHERE id=? AND project_id=?').bind(i, id, params.id)));
  return json({ ok: true });
}
