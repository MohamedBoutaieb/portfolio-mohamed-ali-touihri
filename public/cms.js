// Loads editable content (titles, descriptions, photos) from /api/content when the site
// runs on Cloudflare. Without the API (e.g. GitHub Pages) the static page stays as is.
(() => {
  const COUNT = {
    fr: (n) => `${n} photographies · Cliquez pour agrandir`,
    en: (n) => `${n} photos · Click to enlarge`,
    de: (n) => `${n} Fotos · Zum Vergrößern anklicken`,
  };
  const ENLARGE = { fr: 'Agrandir : ', en: 'Enlarge: ', de: 'Vergrößern: ' };
  const pick = (o, lang) => (o && (o[lang] || o.fr)) || '';
  let content = null;

  function photoButton(gallery, photo, index, key, lang) {
    const caption = pick(photo.caption, lang);
    const img = document.createElement('img');
    img.loading = 'lazy';
    img.decoding = 'async';
    img.src = photo.src;
    img.alt = caption;
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
    button.setAttribute('aria-label', ENLARGE[lang] + caption);
    button.addEventListener('click', () => openPhoto(index, key));
    return button;
  }

  function render(lang) {
    if (!content) return;
    for (const p of content.projects) {
      document.querySelectorAll(`[data-cms-title="${p.id}"]`).forEach((el) => { el.textContent = pick(p.title, lang); });
      document.querySelectorAll(`[data-cms-desc="${p.id}"]`).forEach((el) => { el.textContent = pick(p.desc, lang); });
      document.querySelectorAll(`[data-cms-count="${p.id}"]`).forEach((el) => { el.textContent = COUNT[lang](p.photos.length); });
      const gallery = document.querySelector(`[data-cms-gallery="${p.id}"]`);
      if (!gallery) continue;
      portfolioGalleries[p.key] = p.photos.map((ph) => ({ src: ph.src, label: pick(ph.caption, lang) }));
      gallery.replaceChildren(...p.photos.map((ph, i) => photoButton(gallery, ph, i, p.key, lang)));
    }
    // keep any active photo filter applied to the rebuilt galleries
    document.querySelectorAll('[data-filter][aria-pressed="true"],[data-construction-filter][aria-pressed="true"]').forEach((b) => b.click());
    if (window.updateCarousels) window.updateCarousels();
  }

  const applyBase = window.applyLanguage;
  window.applyLanguage = function (lang) {
    applyBase(lang);
    render(lang);
  };

  fetch('/api/content', { cache: 'no-cache' })
    .then((r) => (r.ok && (r.headers.get('content-type') || '').includes('json') ? r.json() : null))
    .then((data) => {
      if (!data || !Array.isArray(data.projects)) return;
      content = data;
      render(currentLanguage);
    })
    .catch(() => {});
})();
