// Shared helpers for the Cloudflare Pages Functions (auth, JSON, content loading)
const enc = new TextEncoder();
export const COOKIE = 'portfolio_admin';
export const LANGS = ['fr', 'en', 'de'];
const SESSION_DAYS = 7;

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers },
  });
}

export function configured(env) {
  return Boolean(env.ADMIN_USER && env.ADMIN_PASSWORD && env.SESSION_SECRET && env.SESSION_SECRET.length >= 32 && env.DB);
}

// Mutating requests must come from this site (the cookie is SameSite=Strict as well)
export function sameOrigin(request) {
  const origin = request.headers.get('origin');
  return !origin || origin === new URL(request.url).origin;
}

const b64url = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

async function hmac(secret, message) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return crypto.subtle.sign('HMAC', key, enc.encode(message));
}

// Constant-time comparison of two strings (compares their HMACs)
export async function safeEqual(secret, a, b) {
  const [x, y] = await Promise.all([hmac(secret, String(a)), hmac(secret, String(b))]);
  const X = new Uint8Array(x), Y = new Uint8Array(y);
  let diff = 0;
  for (let i = 0; i < X.length; i++) diff |= X[i] ^ Y[i];
  return diff === 0;
}

export async function createSession(env) {
  const exp = Date.now() + SESSION_DAYS * 864e5;
  return `v1.${exp}.${b64url(await hmac(env.SESSION_SECRET, `v1.${exp}`))}`;
}

export async function hasSession(request, env) {
  const cookie = request.headers.get('cookie') || '';
  const m = cookie.match(new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]+)`));
  if (!m) return false;
  const [v, exp, sig] = m[1].split('.');
  if (v !== 'v1' || !exp || !sig || Number(exp) < Date.now()) return false;
  return safeEqual(env.SESSION_SECRET, sig, b64url(await hmac(env.SESSION_SECRET, `v1.${exp}`)));
}

export const sessionCookie = (value, maxAgeSeconds) =>
  `${COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAgeSeconds}`;
export const SESSION_MAX_AGE = SESSION_DAYS * 86400;

export const text = (value, max) => (typeof value === 'string' ? value.trim().slice(0, max) : '');
export const i18n = (obj, max) => Object.fromEntries(LANGS.map((l) => [l, text(obj && obj[l], max)]));

export async function loadContent(db) {
  const [projects, photos] = await db.batch([
    db.prepare('SELECT * FROM projects ORDER BY sort, id'),
    db.prepare('SELECT id, project_id, src, grp, caption_fr, caption_en, caption_de FROM photos ORDER BY project_id, position, id'),
  ]);
  const byProject = {};
  for (const r of photos.results) {
    (byProject[r.project_id] ||= []).push({
      id: r.id, src: r.src, group: r.grp,
      caption: { fr: r.caption_fr, en: r.caption_en, de: r.caption_de },
    });
  }
  return {
    projects: projects.results.map((r) => ({
      id: r.id, key: r.gallery_key, category: r.category, updatedAt: r.updated_at,
      title: { fr: r.title_fr, en: r.title_en, de: r.title_de },
      desc: { fr: r.desc_fr, en: r.desc_en, de: r.desc_de },
      photos: byProject[r.id] || [],
    })),
  };
}
