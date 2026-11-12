// Every /api/admin/* route requires a valid session; writes must come from this site
import { json, configured, hasSession, sameOrigin } from '../../../cloudflare/lib.js';

export async function onRequest(context) {
  const { request, env } = context;
  if (!configured(env)) return json({ error: 'L’administration n’est pas encore configurée.' }, 503);
  if (!(await hasSession(request, env))) return json({ error: 'Session expirée, reconnectez-vous.' }, 401);
  if (request.method !== 'GET' && !sameOrigin(request)) return json({ error: 'Origine refusée.' }, 403);
  return context.next();
}
