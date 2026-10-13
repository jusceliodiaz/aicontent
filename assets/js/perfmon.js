/* Vereinfachter Performance-Report im Modal (Daten: assets/data/perfmon-data.js) */
(() => {
  const D = window.PERFMON;
  const dlg = document.getElementById('perfmon');
  if (!D || !dlg) return;

  const de = document.documentElement.lang === 'de';
  const nf = (v, d = 1) => v.toLocaleString(de ? 'de-DE' : 'en-GB', { minimumFractionDigits: d, maximumFractionDigits: d });
  const gb = (mb) => nf(mb / 1024, 1);
  const T = de ? {
    median: 'Median pro Durchlauf', p95: 'p95', vram: 'VRAM-Spitze', util: 'GPU-Auslastung',
    of: 'von', runs: 'Messläufe', range: 'min {min} s · max {max} s', varia: 'Streuung {cv} %', during: 'im Mittel',
    faster: 'schneller', slower: 'langsamer', less: 'weniger', more: 'mehr',
    top: '{name} braucht {share} % jedes Durchlaufs ({mean} s) – dort beginnt jede Optimierung.',
    warm: 'Der erste Durchlauf ist {d} s langsamer (Modelle laden) – Worker zwischen Jobs aktiv halten.',
    cmp: '{b} gegenüber {a}: {t} % {tw}, {m} GB {mw} VRAM-Spitze.',
    cats: { load: 'Laden', encode: 'Encode', sample: 'Sampling', decode: 'Decode', io: 'Ein-/Ausgabe', other: 'Sonstiges' },
    label: (l) => l.replace('steps', 'Schritte').replace('full decode', 'volles Decode').replace('tiled decode', 'Tiled Decode'),
  } : {
    median: 'Median per run', p95: 'p95', vram: 'Peak VRAM', util: 'GPU utilisation',
    of: 'of', runs: 'measured runs', range: 'min {min} s · max {max} s', varia: 'variation {cv} %', during: 'average',
    faster: 'faster', slower: 'slower', less: 'less', more: 'more',
    top: '{name} takes {share} % of each run ({mean} s) – any optimisation starts there.',
    warm: 'The first run is {d} s slower (model loading) – keep the worker alive between jobs.',
    cmp: '{b} vs {a}: {t} % {tw}, {m} GB {mw} peak VRAM.',
    cats: { load: 'Load', encode: 'Encode', sample: 'Sampling', decode: 'Decode', io: 'I/O', other: 'Other' },
    label: (l) => l,
  };
  const fill = (s, o) => s.replace(/\{(\w+)\}/g, (_, k) => o[k]);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const $ = (sel) => dlg.querySelector(sel);
  let cur = 0;

  // Umschalter A / B
  const seg = $('.pm-seg');
  D.configs.forEach((c, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = T.label(c.label);
    b.setAttribute('aria-pressed', String(i === 0));
    b.addEventListener('click', () => { cur = i; render(); });
    seg.appendChild(b);
  });

  function render() {
    const s = D.configs[cur];
    seg.querySelectorAll('button').forEach((b, i) => b.setAttribute('aria-pressed', String(i === cur)));
    $('.pm-sub').textContent = `${s.gpu} · ${s.runs} ${T.runs}`;

    const kpi = (k, v, u, d) => `<div><dt>${k}</dt><dd><b>${v}</b><small>${u}</small><span>${d}</span></dd></div>`;
    $('.pm-kpis').innerHTML =
      kpi(T.median, nf(s.p50), 's', fill(T.range, { min: nf(s.min), max: nf(s.max) })) +
      kpi(T.p95, nf(s.p95), 's', fill(T.varia, { cv: nf(s.cv * 100) })) +
      kpi(T.vram, gb(s.peak_mem_mb), 'GB', `${T.of} ${gb(s.vram_total_mb)} GB`) +
      kpi(T.util, nf(s.avg_util, 0), '%', T.during);

    const max = Math.max(...s.nodes.map((n) => n.mean));
    $('.pm-bars').innerHTML = s.nodes.map((n) => `
      <li>
        <span class="pm-name">${esc(n.name)}<em>${T.cats[n.category] || n.category}</em></span>
        <span class="pm-track"><i class="pm-c-${n.category}" style="width:${(n.mean / max) * 100}%"></i></span>
        <span class="pm-val">${nf(n.mean)} s · ${nf(n.share * 100, 0)} %</span>
      </li>`).join('');

    const top = s.nodes[0];
    const notes = [
      fill(T.top, { name: esc(top.name), share: nf(top.share * 100, 0), mean: nf(top.mean) }),
      fill(T.warm, { d: nf(s.warmup_s - s.p50) }),
    ];
    if (D.configs.length > 1) {
      const a = D.configs[0], b = D.configs[1];
      const dt = ((a.p50 - b.p50) / a.p50) * 100, dm = (a.peak_mem_mb - b.peak_mem_mb) / 1024;
      notes.unshift(fill(T.cmp, {
        b: `<b>${esc(T.label(b.label))}</b>`, a: `<b>${esc(T.label(a.label))}</b>`,
        t: nf(Math.abs(dt), 0), tw: dt >= 0 ? T.faster : T.slower,
        m: nf(Math.abs(dm)), mw: dm >= 0 ? T.less : T.more,
      }));
    }
    $('.pm-notes').innerHTML = notes.map((n) => `<li>${n}</li>`).join('');
  }

  // Vorschau auf der Seite: Anteil der Zeit pro Kategorie (Konfiguration A)
  const teaser = document.getElementById('pm-teaser');
  if (teaser) {
    const s = D.configs[0];
    const rest = Math.max(0, 1 - s.nodes.reduce((a, n) => a + n.share, 0));
    const parts = [...s.nodes.map((n) => [n.category, n.share, n.name]), ['other', rest, T.cats.other]].filter(([, v]) => v > 0.005);
    teaser.innerHTML = `<div class="pm-stack">${parts.map(([c, v, n]) => `<i class="pm-c-${c}" style="flex:${v}" title="${esc(n)} · ${nf(v * 100, 0)} %"></i>`).join('')}</div>
      <p class="pm-stack-l"><b>${nf(s.nodes[0].share * 100, 0)} %</b> ${esc(s.nodes[0].name)} · <b>${nf(s.p50)} s</b> ${T.median}</p>`;
  }

  document.querySelectorAll('[data-open-perfmon]').forEach((b) => b.addEventListener('click', () => { render(); dlg.showModal(); }));
  dlg.querySelector('.pm-close')?.addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
})();
