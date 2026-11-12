// Translate French text to English and German with Cloudflare Workers AI (free daily allowance)
import { json, text } from '../../../cloudflare/lib.js';

const MODEL = '@cf/meta/m2m100-1.2b';

export async function onRequestPost({ request, env }) {
  if (!env.AI) return json({ error: 'La traduction automatique n’est pas disponible ici.' }, 503);
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Requête invalide.' }, 400); }
  const source = text(body.text, 4000);
  if (!source) return json({ en: '', de: '' });
  try {
    const [en, de] = await Promise.all(['en', 'de'].map((target_lang) =>
      env.AI.run(MODEL, { text: source, source_lang: 'fr', target_lang }).then((r) => (r && r.translated_text) || '')));
    return json({ en, de });
  } catch (e) {
    return json({ error: 'La traduction a échoué, réessayez dans un instant.' }, 502);
  }
}
