/* v2 · Lichtpult – Raster, Filter, Großansicht, Info, Sprache, Cursor */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const tiles = $$('.grid .t:not(.t-cta)');
  tiles.forEach((t, i) => t.style.setProperty('--i', i));
  requestAnimationFrame(() => document.body.classList.remove('is-loading'));

  /* Sprache */
  const setLang = (l) => {
    document.documentElement.lang = l;
    $$('[data-de]').forEach((el) => { el.textContent = el.dataset[l]; });
    $$('.bar-lang button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === l)));
    try { localStorage.setItem('v2-lang', l); } catch (e) {}
  };
  $$('.bar-lang button').forEach((b) => b.addEventListener('click', () => setLang(b.dataset.lang)));
  try { const l = localStorage.getItem('v2-lang'); if (l && l !== 'de') setLang(l); } catch (e) {}
  const de = () => document.documentElement.lang === 'de';

  /* Videos im Raster: stumm, nur sichtbar */
  const vids = $$('.grid video[data-autoplay]');
  if (!reduce && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => es.forEach((e) => { e.isIntersecting ? e.target.play().catch(() => {}) : e.target.pause(); }), { threshold: 0.2 });
    vids.forEach((v) => io.observe(v));
  }

  /* Lückenloses Raster: erst dicht platzieren, dann Lücken durch Strecken der Nachbarn schließen */
  const grid = $('.grid');
  const cta = $('.grid .t-cta');
  const span = (t, cols) => {
    if (grid.dataset.f === 'figur') return [Math.min(3, cols), Math.min(3, cols)];
    if (grid.dataset.f === 'video') return [Math.min(3, cols), Math.min(3, cols)];
    if (grid.dataset.f === 'sheet') return cols >= 12 ? [4, 4] : cols >= 6 ? [2, 2] : [3, 3];
    const cs = getComputedStyle(t);
    const k = cols >= 12 ? ['--w', '--h'] : cols >= 6 ? ['--tw', '--th'] : ['--mw', '--mh'];
    return [Math.min(cols, parseInt(cs.getPropertyValue(k[0])) || 1), parseInt(cs.getPropertyValue(k[1])) || 1];
  };
  function pack(items, cols) {
    const occ = []; // occ[row][col] = Index des Elements
    const free = (r, c, w, h) => {
      if (c < 0 || c + w > cols || r < 0) return false;
      for (let y = r; y < r + h; y++) for (let x = c; x < c + w; x++) if (occ[y]?.[x] !== undefined) return false;
      return true;
    };
    const mark = (r, c, w, h, i) => { for (let y = r; y < r + h; y++) { occ[y] ||= []; for (let x = c; x < c + w; x++) occ[y][x] = i; } };
    const pos = items.map((t, i) => {
      const [w, h] = span(t, cols);
      for (let r = 0; ; r++) for (let c = 0; c < cols; c++) if (free(r, c, w, h)) { mark(r, c, w, h, i); return { r, c, w, h }; }
    });
    const rows = Math.max(...pos.map((p) => p.r + p.h));
    // Lücken schließen: Nachbarn links, oben, rechts oder unten strecken
    let changed = true;
    while (changed) {
      changed = false;
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        if (occ[r]?.[c] !== undefined) continue;
        const tries = [
          [occ[r]?.[c - 1], (p) => p.c + p.w === c && free(p.r, c, 1, p.h), (p, i) => { mark(p.r, c, 1, p.h, i); p.w++; }],
          [occ[r - 1]?.[c], (p) => p.r + p.h === r && free(r, p.c, p.w, 1), (p, i) => { mark(r, p.c, p.w, 1, i); p.h++; }],
          [occ[r]?.[c + 1], (p) => p.c - 1 === c && free(p.r, c, 1, p.h), (p, i) => { mark(p.r, c, 1, p.h, i); p.c--; p.w++; }],
          [occ[r + 1]?.[c], (p) => p.r - 1 === r && free(r, p.c, p.w, 1), (p, i) => { mark(r, p.c, p.w, 1, i); p.r--; p.h++; }],
        ];
        for (const [i, ok, grow] of tries) {
          if (i === undefined) continue;
          if (ok(pos[i])) { grow(pos[i], i); changed = true; break; }
        }
      }
    }
    let holes = 0;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (occ[r]?.[c] === undefined) holes++;
    return { pos, holes };
  }
  function layout() {
    const cols = getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length || 12;
    let items = [...tiles.filter((t) => !t.hidden), ...(cta.hidden ? [] : [cta])];
    let best = pack(items, cols), bestItems = items;
    // Falls Lücken bleiben: benachbarte Kacheln probeweise tauschen
    // Lücken: Reihenfolge ab Kachel 6 variieren (fester Zufall), vorne bleibt alles wie definiert
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const fixed = Math.min(6, items.length);
    for (let k = 0; best.holes && k < 600; k++) {
      const tail = items.slice(fixed);
      for (let i = tail.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [tail[i], tail[j]] = [tail[j], tail[i]]; }
      const alt = [...items.slice(0, fixed), ...tail];
      const res = pack(alt, cols);
      if (res.holes < best.holes) { best = res; bestItems = alt; }
    }
    bestItems.forEach((t, i) => {
      const p = best.pos[i];
      t.style.gridColumn = `${p.c + 1} / span ${p.w}`;
      t.style.gridRow = `${p.r + 1} / span ${p.h}`;
    });
  }
  layout();
  let lastCols = 0;
  if ('ResizeObserver' in window) new ResizeObserver(() => {
    const c = getComputedStyle(grid).gridTemplateColumns.split(' ').length;
    if (c !== lastCols) { lastCols = c; if (!grid.hidden) layout(); }
  }).observe(grid);
  let rz;
  addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(layout, 120); });

  /* Filter */
  $$('.bar-filter button').forEach((b) => b.addEventListener('click', () => {
    const f = b.dataset.filter;
    $$('.bar-filter button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    const pipe = $('#pipe');
    const isPipe = f === 'pipeline';
    grid.dataset.f = f || '';
    grid.hidden = isPipe;
    if (pipe) pipe.hidden = !isPipe;
    tiles.forEach((t) => { t.hidden = f ? t.dataset.cat !== f : t.dataset.only === '1'; });
    cta.hidden = f === 'video' || f === 'sheet';
    if (!isPipe) layout();
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  }));

  /* Großansicht mit Vor/Zurück */
  const lb = $('dialog.lb');
  let cur = 0;
  const mediaTiles = tiles.filter((t) => t.querySelector('template'));
  const visible = () => mediaTiles.filter((t) => !t.hidden);
  const show = (idx) => {
    const list = visible();
    cur = (idx + list.length) % list.length;
    const frag = $('template', list[cur]).content.cloneNode(true);
    const lang = document.documentElement.lang;
    $$('[data-de]', frag).forEach((el) => { el.textContent = el.dataset[lang]; });
    $('.lb-body', lb).replaceChildren(frag.querySelector('.lb-row'));
    $('.lb-meta', lb).replaceChildren(...frag.querySelector('.lb-info').childNodes);
    $('.lb-count', lb).textContent = `${String(cur + 1).padStart(2, '0')} / ${String(list.length).padStart(2, '0')}`;
  };
  mediaTiles.forEach((t) => $('.t-open', t).addEventListener('click', () => { show(visible().indexOf(t)); lb.showModal(); }));
  $('.lb-prev', lb).addEventListener('click', () => show(cur - 1));
  $('.lb-next', lb).addEventListener('click', () => show(cur + 1));
  $('.lb-close', lb).addEventListener('click', () => lb.close());
  lb.addEventListener('close', () => $('.lb-body', lb).replaceChildren());
  document.addEventListener('keydown', (e) => {
    if (!lb.open) return;
    if (e.key === 'ArrowRight') show(cur + 1);
    if (e.key === 'ArrowLeft') show(cur - 1);
  });
  let sx = null;
  lb.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', (e) => { if (sx == null) return; const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) show(cur + (dx < 0 ? 1 : -1)); sx = null; });

  /* Direktlinks auf einen Filter (z. B. #pipeline) */
  const goFilter = (f) => { const b = $(`.bar-filter [data-filter="${f}"]`); if (b) b.click(); };
  $$('[data-go-filter]').forEach((a) => a.addEventListener('click', (e) => {
    e.preventDefault();
    $('dialog.info')?.close();
    goFilter(a.dataset.goFilter);
    history.replaceState(null, '', '#' + a.dataset.goFilter);
  }));
  const hashF = location.hash.slice(1);
  if (['figur', 'video', 'sheet', 'pipeline'].includes(hashF)) goFilter(hashF);

  /* Info-Panel */
  const info = $('dialog.info');
  $$('[data-open-info]').forEach((b) => b.addEventListener('click', () => info.showModal()));
  $('.info-close', info).addEventListener('click', () => info.close());
  info.addEventListener('click', (e) => { if (e.target === info) info.close(); });

  /* Cursor-Etikett */
  const cur$ = $('.cursor');
  if (matchMedia('(hover: hover)').matches) {
    document.addEventListener('pointermove', (e) => { cur$.style.left = e.clientX + 'px'; cur$.style.top = e.clientY + 'px'; });
    $$('.grid .t-open:not(.t-cta-btn)').forEach((b) => {
      b.addEventListener('pointerenter', () => {
        const play = b.dataset.cursor === 'play';
        cur$.firstElementChild.textContent = play ? (de() ? 'Abspielen' : 'Play') : (de() ? 'Öffnen' : 'Open');
        cur$.classList.add('on');
      });
      b.addEventListener('pointerleave', () => cur$.classList.remove('on'));
    });
  }
})();
