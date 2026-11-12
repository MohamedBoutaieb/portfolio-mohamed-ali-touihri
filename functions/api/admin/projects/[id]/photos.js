// Upload a photo to a project (the browser resizes it first; stored in D1)
import { json, i18n } from '../../../../../cloudflare/lib.js';

const TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 1_900_000; // D1 values are limited to 2 MB

export async function onRequestPost({ request, env, params }) {
  let form;
  try { form = await request.formData(); } catch { return json({ error: 'Envoi invalide.' }, 400); }
  const file = form.get('file');
  if (!file || typeof file === 'string') return json({ error: 'Aucun fichier reçu.' }, 400);
  if (!TYPES.includes(file.type)) return json({ error: 'Format non pris en charge (JPEG, PNG ou WebP).' }, 415);
  if (file.size > MAX_BYTES) return json({ error: 'Photo trop lourde après compression (max. 1,9 Mo).' }, 413);

  const project = await env.DB.prepare('SELECT id FROM projects WHERE id=?').bind(params.id).first();
  if (!project) return json({ error: 'Projet introuvable.' }, 404);

  const caption = i18n({ fr: form.get('caption_fr'), en: form.get('caption_en'), de: form.get('caption_de') }, 300);
  const mediaId = crypto.randomUUID();
  const src = `/media/${mediaId}`;
  const next = await env.DB.prepare('SELECT COALESCE(MAX(position), -1) + 1 AS p FROM photos WHERE project_id=?').bind(params.id).first();
  const [, inserted] = await env.DB.batch([
    env.DB.prepare('INSERT INTO media (id, mime, data) VALUES (?, ?, ?)').bind(mediaId, file.type, await file.arrayBuffer()),
    env.DB.prepare('INSERT INTO photos (project_id, position, src, caption_fr, caption_en, caption_de, media_id) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id')
      .bind(params.id, next.p, src, caption.fr, caption.en, caption.de, mediaId),
  ]);
  return json({ photo: { id: inserted.results[0].id, src, group: null, caption } }, 201);
}
