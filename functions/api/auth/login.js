import { json, configured, sameOrigin, safeEqual, createSession, sessionCookie, SESSION_MAX_AGE } from '../../../cloudflare/lib.js';

export async function onRequestPost({ request, env }) {
  if (!configured(env)) return json({ error: 'L’administration n’est pas encore configurée.' }, 503);
  if (!sameOrigin(request)) return json({ error: 'Origine refusée.' }, 403);
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Requête invalide.' }, 400); }
  const [userOk, passOk] = await Promise.all([
    safeEqual(env.SESSION_SECRET, String(body.user || '').trim().toLowerCase(), String(env.ADMIN_USER).trim().toLowerCase()),
    safeEqual(env.SESSION_SECRET, String(body.password || ''), env.ADMIN_PASSWORD),
  ]);
  if (!(userOk && passOk)) {
    await new Promise((r) => setTimeout(r, 800)); // slow down guessing
    return json({ error: 'Identifiant ou mot de passe incorrect.' }, 401);
  }
  return json({ ok: true }, 200, { 'set-cookie': sessionCookie(await createSession(env), SESSION_MAX_AGE) });
}
