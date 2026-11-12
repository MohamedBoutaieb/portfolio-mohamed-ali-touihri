import { json, configured, hasSession } from '../../../cloudflare/lib.js';

export async function onRequestGet({ request, env }) {
  if (!configured(env)) return json({ authenticated: false, configured: false });
  return json({ authenticated: await hasSession(request, env), configured: true });
}
