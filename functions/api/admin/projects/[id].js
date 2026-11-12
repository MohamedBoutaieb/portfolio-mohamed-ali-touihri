// Update a project's title and description (FR/EN/DE)
import { json, i18n } from '../../../../cloudflare/lib.js';

export async function onRequestPut({ request, env, params }) {
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Requête invalide.' }, 400); }
  const title = i18n(body.title, 200), desc = i18n(body.desc, 4000);
  if (!title.fr) return json({ error: 'Le titre en français est obligatoire.' }, 400);
  const r = await env.DB.prepare(
    'UPDATE projects SET title_fr=?, title_en=?, title_de=?, desc_fr=?, desc_en=?, desc_de=?, updated_at=CURRENT_TIMESTAMP WHERE id=?'
  ).bind(title.fr, title.en, title.de, desc.fr, desc.en, desc.de, params.id).run();
  if (!r.meta.changes) return json({ error: 'Projet introuvable.' }, 404);
  return json({ ok: true, title, desc });
}
