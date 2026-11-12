// Edit a photo's caption, or delete the photo (and its uploaded file, if any)
import { json, i18n } from '../../../../cloudflare/lib.js';

export async function onRequestPatch({ request, env, params }) {
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Requête invalide.' }, 400); }
  const caption = i18n(body.caption, 300);
  const r = await env.DB.prepare('UPDATE photos SET caption_fr=?, caption_en=?, caption_de=? WHERE id=?')
    .bind(caption.fr, caption.en, caption.de, Number(params.id)).run();
  if (!r.meta.changes) return json({ error: 'Photo introuvable.' }, 404);
  return json({ ok: true, caption });
}

export async function onRequestDelete({ env, params }) {
  const photo = await env.DB.prepare('SELECT id, media_id FROM photos WHERE id=?').bind(Number(params.id)).first();
  if (!photo) return json({ error: 'Photo introuvable.' }, 404);
  const statements = [env.DB.prepare('DELETE FROM photos WHERE id=?').bind(photo.id)];
  if (photo.media_id) statements.push(env.DB.prepare('DELETE FROM media WHERE id=?').bind(photo.media_id));
  await env.DB.batch(statements);
  return json({ ok: true });
}
