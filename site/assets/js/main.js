/* Juscelio Diaz – Portfolio. Ohne Abhängigkeiten. */
(() => {
  const doc = document.documentElement;
  doc.classList.remove('no-js');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Menü (mobil) ---------- */
  const menuBtn = document.querySelector('.menu-btn');
  menuBtn?.addEventListener('click', () => {
    const open = document.body.classList.toggle('menu-open');
    menuBtn.setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.body.classList.contains('menu-open')) {
      document.body.classList.remove('menu-open');
      menuBtn?.setAttribute('aria-expanded', 'false');
      menuBtn?.focus();
    }
  });

  /* ---------- Fehlende Medien: Platzhalter statt kaputtem Bild ---------- */
  const markMissing = (el) => el.closest('.frame-media')?.classList.add('is-missing');
  const watchMedia = (root) => root.querySelectorAll('.frame-media img, .frame-media video, .lb-media img, .lb-media video').forEach((el) => {
    const fail = () => (el.closest('.frame-media') ? markMissing(el) : el.replaceWith(Object.assign(document.createElement('p'), { className: 'label', textContent: '— ' + (el.getAttribute('src') || '') })));
    if (!el.getAttribute('src')) return fail();
    el.addEventListener('error', fail);
    if (el.tagName === 'IMG' ? el.complete && el.naturalWidth === 0 : el.networkState === 3) fail();
  });
  watchMedia(document);

  /* ---------- Einblenden beim Scrollen ---------- */
  const reveals = document.querySelectorAll('.reveal');
  if (reduce || !('IntersectionObserver' in window)) {
    reveals.forEach((el) => el.classList.add('in'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    reveals.forEach((el) => io.observe(el));
  }

  /* ---------- Videos: stumm, Loop, nur sichtbar, nicht bei reduzierter Bewegung ---------- */
  const videos = document.querySelectorAll('video[data-autoplay]');
  if (reduce) videos.forEach((v) => (v.controls = true));
  else if ('IntersectionObserver' in window) {
    const vo = new IntersectionObserver((entries) => entries.forEach((e) => {
      const v = e.target;
      if (e.isIntersecting) v.play().catch(() => {}); else v.pause();
    }), { threshold: 0.25 });
    videos.forEach((v) => vo.observe(v));
  }

  /* ---------- Vorher/Nachher-Regler ---------- */
  const initBA = (root) => root.querySelectorAll('.ba').forEach((ba) => {
    const input = ba.querySelector('input');
    const set = (v) => ba.style.setProperty('--pos', v + '%');
    input?.addEventListener('input', () => set(input.value));
    set(input?.value ?? 50);
  });
  initBA(document);

  /* ---------- Sucher: Fadenkreuz + Koordinaten ---------- */
  document.querySelectorAll('.viewfinder').forEach((vf) => {
    const media = vf.querySelector('.frame-media');
    const cross = vf.querySelector('.crosshair');
    const out = vf.querySelector('[data-xy]');
    if (!media || !cross) return;
    media.addEventListener('pointermove', (e) => {
      const r = media.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
      const y = Math.max(0, Math.min(1, (e.clientY - r.top) / r.height));
      cross.style.setProperty('--cx', x * 100 + '%');
      cross.style.setProperty('--cy', y * 100 + '%');
      const w = Number(vf.dataset.w || 1024), h = Number(vf.dataset.h || 1280);
      if (out) out.textContent = `X ${String(Math.round(x * w)).padStart(4, '0')} · Y ${String(Math.round(y * h)).padStart(4, '0')}`;
    });
  });

  /* ---------- Filter (Projekte, Galerie) ---------- */
  document.querySelectorAll('[data-filter-group]').forEach((group) => {
    const target = document.querySelector(group.dataset.filterGroup);
    const buttons = group.querySelectorAll('button');
    buttons.forEach((b) => b.addEventListener('click', () => {
      const f = b.dataset.filter;
      buttons.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      target?.querySelectorAll('[data-cat]').forEach((item) => {
        item.hidden = !!f && !item.dataset.cat.split(' ').includes(f);
      });
    }));
  });

  /* ---------- Galerie-Lightbox ---------- */
  const dialog = document.querySelector('dialog.lightbox');
  if (dialog) {
    const mediaBox = dialog.querySelector('.lb-media');
    const metaBox = dialog.querySelector('.lb-meta-content');
    document.querySelectorAll('.g-open').forEach((btn) => btn.addEventListener('click', () => {
      const tpl = btn.parentElement.querySelector('template');
      if (!tpl) return;
      const frag = tpl.content.cloneNode(true);
      mediaBox.replaceChildren(...frag.querySelector('[data-lb-media]').childNodes);
      metaBox.replaceChildren(...frag.querySelector('[data-lb-meta]').childNodes);
      // In der Großansicht sofort laden, nicht erst beim Scrollen
      mediaBox.querySelectorAll('img').forEach((img) => (img.loading = 'eager'));
      initBA(mediaBox);
      watchMedia(mediaBox);
      dialog.showModal();
    }));
    dialog.querySelector('.lb-close')?.addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
    dialog.addEventListener('close', () => mediaBox.replaceChildren());
  }

  /* ---------- Inhaltsverzeichnis: aktiver Abschnitt ---------- */
  const tocLinks = document.querySelectorAll('.toc a');
  if (tocLinks.length && 'IntersectionObserver' in window) {
    const map = new Map([...tocLinks].map((a) => [a.getAttribute('href').slice(1), a]));
    const so = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (e.isIntersecting) {
        tocLinks.forEach((a) => a.classList.remove('active'));
        map.get(e.target.id)?.classList.add('active');
      }
    }), { rootMargin: '-30% 0px -60% 0px' });
    map.forEach((_, id) => { const s = document.getElementById(id); if (s) so.observe(s); });
  }
})();
