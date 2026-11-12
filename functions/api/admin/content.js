import { json, loadContent } from '../../../cloudflare/lib.js';

export async function onRequestGet({ env }) {
  return json(await loadContent(env.DB));
}
