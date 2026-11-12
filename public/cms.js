// Loads editable content (titles, descriptions, photos) from /api/content when the site
// runs on Cloudflare. Without the API (e.g. GitHub Pages) the static page stays as is.
// The request starts in <head> (window.__cms) and CMS-managed spots stay hidden until it
// settles, so the old galleries never flash before the current ones.
(() => {
  const COUNT = {
    fr: (n) => `${n} photographies · Cliquez pour agrandir`,
    en: (n) => `${n} photos · Click to enlarge`,
    de: (n) => `${n} Fotos · Zum Vergrößern anklicken`,
  };
  const ENLARGE = { fr: 'Agrandir : ', en: 'Enlarge: ', de: 'Vergrößern: ' };
  const pick = (o, lang) => (o && (o[lang] || o.fr)) || '';
  const root = document.documentElement;
  let content = null;

  function photoButton(gallery, photo, index, key) {
    const img = document.createElement('img');
    img.loading = 'lazy';
    img.decoding = 'async';
    img.src = photo.src;
    const button = document.createElement('button');
    button.type = 'button';
    if (gallery.id === 'photos') {
      button.className = 'photo';
      if (photo.group) button.dataset.category = photo.group;
      button.append(img);
    } else {
      const reno = gallery.classList.contains('renovation-gallery');
      button.className = reno ? 'renovation-photo' : 'construction-photo';
      if (photo.group) button.dataset.constructionGroup = photo.group;
      const frame = document.createElement('span');
      frame.className = reno ? 'renovation-image' : 'construction-frame';
      frame.append(img);
      button.append(frame);
    }
    button.addEventListener('click', () => openPhoto(index, key));
    return button;
  }

  // Build the galleries once per content load
  function build() {
    for (const p of content.projects) {
      const gallery = document.querySelector(`[data-cms-gallery="${p.id}"]`);
      if (gallery) gallery.replaceChildren(...p.photos.map((ph, i) => photoButton(gallery, ph, i, p.key)));
    }
    document.querySelectorAll('[data-filter][aria-pressed="true"],[data-construction-filter][aria-pressed="true"]').forEach((b) => b.click());
    if (window.updateCarousels) window.updateCarousels();
  }

  // Language-dependent text only: titles, descriptions, counts, captions (no image reloads)
  function texts(lang) {
    for (const p of content.projects) {
      document.querySelectorAll(`[data-cms-title="${p.id}"]`).forEach((el) => { el.textContent = pick(p.title, lang); });
      document.querySelectorAll(`[data-cms-desc="${p.id}"]`).forEach((el) => { el.textContent = pick(p.desc, lang); });
      document.querySelectorAll(`[data-cms-count="${p.id}"]`).forEach((el) => { el.textContent = COUNT[lang](p.photos.length); });
      portfolioGalleries[p.key] = p.photos.map((ph) => ({ src: ph.src, label: pick(ph.caption, lang) }));
      const gallery = document.querySelector(`[data-cms-gallery="${p.id}"]`);
      if (!gallery) continue;
      [...gallery.children].forEach((button, i) => {
        const caption = pick(p.photos[i] && p.photos[i].caption, lang);
        button.setAttribute('aria-label', ENLARGE[lang] + caption);
        const img = button.querySelector('img');
        if (img) img.alt = caption;
      });
    }
  }

  const applyBase = window.applyLanguage;
  window.applyLanguage = function (lang) {
    applyBase(lang);
    if (content) texts(lang);
  };

  const request = window.__cms || fetch('/api/content', { cache: 'no-cache' })
    .then((r) => (r.ok && (r.headers.get('content-type') || '').includes('json') ? r.json() : null))
    .catch(() => null);
  request
    .then((data) => {
      if (!data || !Array.isArray(data.projects)) return;
      content = data;
      build();
      texts(currentLanguage);
    })
    .finally(() => root.classList.remove('cms-wait'));
})();
