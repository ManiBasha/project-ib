// The loading screen (Beta v2.05.00): your auto rattles down a road while the world loads. The auto stays in the middle
// and the world rolls past: hills, a city skyline, roadside trees, lamp posts and signboards, a bumpy road with potholes.
// Everything moves with CSS transforms, so it keeps running smoothly even while the game is busy building the map.
// It covers the menu while loading; when the game is ready it fades out and the menu shows.
(function () {
  const intro = document.getElementById('intro'); if (!intro) return;
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const enc = s => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
  // ---------- the tiles (each one loops seamlessly) ----------
  function hills() { const W = 1600, H = 300; let d = `M0 ${H}`; for (let x = 0; x <= W; x += 20) { const y = 150 - 55 * Math.sin(x / W * Math.PI * 2 * 2) - 30 * Math.sin(x / W * Math.PI * 2 * 5 + 1) ; d += ` L${x} ${y.toFixed(1)}`; } d += ` L${W} ${H} Z`;
    return { W, H, svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><path d="${d}" fill="#6b3f6e"/></svg>` }; }
  function skyline() { const W = 1400, H = 300; let s = ''; let x = 0; seed = 11; while (x < W) { const w = 40 + Math.floor(rnd() * 70), h = 70 + Math.floor(rnd() * 170); const ww = Math.min(w, W - x); s += `<rect x="${x}" y="${H - h}" width="${ww}" height="${h}" fill="${rnd() < .5 ? '#3a2856' : '#33224d'}"/>`;
      for (let wy = H - h + 12; wy < H - 14; wy += 16) for (let wx = x + 7; wx < x + ww - 8; wx += 13) if (rnd() < .38) s += `<rect x="${wx}" y="${wy}" width="6" height="8" fill="#ffd27a" opacity="${(.5 + rnd() * .5).toFixed(2)}"/>`;
      if (rnd() < .2) s += `<rect x="${x + ww / 2 - 1}" y="${H - h - 18}" width="2" height="18" fill="#3a2856"/>`; x += ww + Math.floor(rnd() * 8); }
    return { W, H, svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${s}</svg>` }; }
  function roadside() { const W = 1800, H = 260; let s = ''; seed = 23; let x = 30;
    while (x < W - 60) { const k = rnd(); if (k < .38) { const h = 120 + rnd() * 70; s += `<rect x="${x - 4}" y="${H - h * .55}" width="8" height="${h * .55}" fill="#2a1d2e"/><circle cx="${x}" cy="${H - h * .62}" r="${28 + rnd() * 16}" fill="#24402c"/><circle cx="${x - 18}" cy="${H - h * .5}" r="${20 + rnd() * 10}" fill="#2c4c33"/><circle cx="${x + 18}" cy="${H - h * .52}" r="${20 + rnd() * 10}" fill="#2a4630"/>`; }
      else if (k < .58) { s += `<rect x="${x}" y="${H - 170}" width="5" height="170" fill="#2e2a33"/><rect x="${x}" y="${H - 170}" width="34" height="4" fill="#2e2a33"/><circle cx="${x + 32}" cy="${H - 163}" r="5" fill="#ffe7a8"/>`; }
      else if (k < .76) { const c = ['#c1272d', '#1f6fb5', '#2f7d4a', '#e36a1f'][Math.floor(rnd() * 4)]; s += `<rect x="${x}" y="${H - 110}" width="4" height="110" fill="#2a2630"/><rect x="${x + 56}" y="${H - 110}" width="4" height="110" fill="#2a2630"/><rect x="${x - 6}" y="${H - 150}" width="72" height="44" rx="4" fill="${c}"/><rect x="${x + 4}" y="${H - 138}" width="52" height="6" rx="3" fill="#ffffff" opacity=".85"/><rect x="${x + 4}" y="${H - 126}" width="36" height="5" rx="2.5" fill="#ffffff" opacity=".6"/>`; }
      else { s += `<rect x="${x}" y="${H - 70}" width="70" height="70" fill="#4a2f2a"/><rect x="${x - 6}" y="${H - 84}" width="82" height="16" fill="${rnd() < .5 ? '#e8573e' : '#f2c14e'}"/><rect x="${x + 10}" y="${H - 52}" width="22" height="18" fill="#ffd27a" opacity=".8"/>`; }
      x += 110 + rnd() * 140; }
    return { W, H, svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${s}</svg>` }; }
  function road() { const W = 1200, H = 160; seed = 41; let s = `<rect width="${W}" height="${H}" fill="#3b3a40"/><rect width="${W}" height="10" fill="#9a8f7c"/><rect y="10" width="${W}" height="3" fill="#d8d0c0"/>`;
    for (let x = 0; x < W; x += 80) s += `<rect x="${x}" y="70" width="44" height="6" rx="2" fill="#f2efe4" opacity=".85"/>`;
    for (let k = 0; k < 9; k++) { const x = rnd() * W, y = 20 + rnd() * 120, w = 14 + rnd() * 36; s += `<ellipse cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" rx="${w.toFixed(0)}" ry="${(w * .28).toFixed(0)}" fill="#2a292e"/>`; }
    for (let k = 0; k < 70; k++) s += `<circle cx="${(rnd() * W).toFixed(0)}" cy="${(16 + rnd() * 140).toFixed(0)}" r="${(1 + rnd() * 2).toFixed(1)}" fill="${rnd() < .5 ? '#55545b' : '#2c2b31'}"/>`;
    return { W, H, svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${s}</svg>` }; }
  function verge() { const W = 900, H = 80; seed = 57; let s = `<rect width="${W}" height="${H}" fill="#6a5a3a"/>`; for (let k = 0; k < 60; k++) { const x = rnd() * W, y = 10 + rnd() * 60; s += `<path d="M${x.toFixed(0)} ${y.toFixed(0)} l4 -14 l3 14 l4 -10 l2 10 Z" fill="${rnd() < .5 ? '#5f7d3a' : '#4d6a30'}"/>`; } for (let k = 0; k < 30; k++) s += `<circle cx="${(rnd() * W).toFixed(0)}" cy="${(rnd() * H).toFixed(0)}" r="${(1.5 + rnd() * 3).toFixed(1)}" fill="#8a7a5a"/>`;
    return { W, H, svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${s}</svg>` }; }
  // ---------- the auto (an original three-wheeler, side view, facing right) ----------
  const wheel = (cx, cy) => `<g class="la-wheel" style="transform-origin:${cx}px ${cy}px"><circle cx="${cx}" cy="${cy}" r="22" fill="#141418"/><circle cx="${cx}" cy="${cy}" r="12" fill="#b9bcc4"/><circle cx="${cx}" cy="${cy}" r="4" fill="#444"/>${[0, 60, 120].map(a => `<rect x="${cx - 1.5}" y="${cy - 12}" width="3" height="24" fill="#6d7079" transform="rotate(${a} ${cx} ${cy})"/>`).join('')}</g>`;
  const AUTO = `<svg class="la-auto" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 200" width="260" height="200">
    <ellipse cx="128" cy="186" rx="104" ry="9" fill="rgba(0,0,0,.35)"/>
    <g class="la-body">
      <path d="M30 150 L30 92 Q30 70 52 66 L178 60 Q206 60 214 78 L232 128 Q238 150 214 152 Z" fill="#f2c230"/>
      <path d="M30 130 L232 128 L234 140 L30 142 Z" fill="#2f7d4a"/>
      <path d="M24 98 Q24 34 70 28 L170 22 Q206 22 214 46 L216 70 L176 64 L40 74 Z" fill="#1b1b1f"/>
      <path d="M182 62 L212 70 L220 104 L188 104 Z" fill="#9fd3e8" opacity=".85"/>
      <rect x="58" y="78" width="70" height="44" rx="6" fill="#23232a"/>
      <circle cx="150" cy="86" r="11" fill="#6b4a2e"/><path d="M138 96 Q150 92 162 98 L166 124 L136 124 Z" fill="#e8573e"/>
      <path d="M90 86 Q102 80 112 88 L112 118 L88 118 Z" fill="#2d6cdf" opacity=".9"/><circle cx="100" cy="76" r="9" fill="#5a3c26"/>
      <rect x="160" y="100" width="34" height="5" rx="2" fill="#222" transform="rotate(-18 160 100)"/>
      <circle cx="226" cy="118" r="7" fill="#fff6c8"/><circle cx="226" cy="118" r="3.5" fill="#ffe27a"/>
      <rect x="22" y="138" width="14" height="10" rx="3" fill="#2a2a2e"/>
      <rect x="40" y="104" width="12" height="7" rx="2" fill="#c1272d"/>
    </g>
    ${wheel(66, 158)}${wheel(204, 158)}
  </svg>`;
  // ---------- build the scene ----------
  const root = document.createElement('div'); root.id = 'loadAuto';
  const layers = [['la-sky', null], ['la-hills', hills(), 70, .30, .66], ['la-city', skyline(), 34, .40, .70], ['la-side', roadside(), 5, .34, .76], ['la-road', road(), 3.2, .17, .93], ['la-verge', verge(), 2.2, .08, 1]];
  root.innerHTML = '<div class="la-sky"><i class="la-sun"></i></div>' + layers.slice(1).map(([cls, t, dur]) => `<div class="la-layer ${cls}" data-dur="${dur}"></div>`).join('') +
    `<div class="la-autobox"><div class="la-bounce">${AUTO}</div><i class="la-dust d1"></i><i class="la-dust d2"></i><i class="la-dust d3"></i><i class="la-smoke"></i></div>` +
    `<div class="la-cap"><img src="assets/logo-192.png" alt="" onerror="this.remove()"><b>Loading India…</b><span class="la-bar"><i></i></span><small>Hold on, your auto is on the way</small></div>`;
  intro.insertBefore(root, intro.firstChild);
  const css = document.createElement('style'); css.textContent = `
    #loadAuto{position:absolute;inset:0;overflow:hidden;z-index:60;pointer-events:auto;transition:opacity 1.2s ease}
    #loadAuto.gone{pointer-events:none}
    #loadAuto .la-cap{position:absolute;left:50%;top:9vh;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:10px;color:#fff;text-align:center;font-family:"Baloo 2",system-ui,sans-serif;text-shadow:0 2px 10px rgba(0,0,0,.45);width:min(90vw,420px)}
    #loadAuto .la-cap img{width:min(26vmin,150px);height:auto;border-radius:22px;box-shadow:0 10px 30px rgba(0,0,0,.35)}
    #loadAuto .la-cap b{font-size:clamp(20px,3.4vmin,30px);letter-spacing:.02em}
    #loadAuto .la-cap small{font-size:14px;opacity:.85}
    #loadAuto .la-bar{display:block;width:100%;height:8px;border-radius:99px;background:rgba(255,255,255,.18);overflow:hidden}
    #loadAuto .la-bar i{display:block;height:100%;width:4%;border-radius:99px;background:linear-gradient(90deg,#ffc93c,#ff8a3c);transition:width .6s ease}
    #loadAuto.gone{opacity:0}
    #loadAuto .la-sky{position:absolute;inset:0;background:linear-gradient(180deg,#24154a 0%,#5a2a6a 38%,#e0705a 66%,#f6b26b 74%)}
    #loadAuto .la-sun{position:absolute;left:68%;top:46%;width:14vmin;height:14vmin;margin:-7vmin;border-radius:50%;background:radial-gradient(circle,#ffe7a0 0%,#ffb35a 55%,rgba(255,150,80,0) 72%)}
    #loadAuto .la-layer{position:absolute;left:0;display:flex;will-change:transform;animation:laScroll linear infinite}
    #loadAuto .la-layer img{height:100%;width:auto;flex:none;display:block}
    @keyframes laScroll{to{transform:translate3d(calc(-1 * var(--tw)),0,0)}}
    #loadAuto .la-autobox{position:absolute;left:50%;top:var(--ay);width:var(--aw);margin-left:calc(var(--aw) / -2);transform:translateY(-82%)}
    #loadAuto .la-auto{display:block;width:100%;height:auto;overflow:visible}
    #loadAuto .la-bounce{animation:laBounce .9s ease-in-out infinite;transform-origin:50% 90%}
    @keyframes laBounce{0%{transform:translateY(0) rotate(0)}12%{transform:translateY(-2px) rotate(-.4deg)}20%{transform:translateY(1px) rotate(.2deg)}38%{transform:translateY(-1px) rotate(0)}55%{transform:translateY(-7px) rotate(-1.6deg)}62%{transform:translateY(2px) rotate(1deg)}70%{transform:translateY(-2px) rotate(-.3deg)}84%{transform:translateY(1px) rotate(.4deg)}100%{transform:translateY(0) rotate(0)}}
    #loadAuto .la-body{animation:laShake .12s linear infinite}
    @keyframes laShake{0%,100%{transform:translateY(0)}50%{transform:translateY(-1.2px)}}
    #loadAuto .la-wheel{animation:laSpin .32s linear infinite}
    @keyframes laSpin{to{transform:rotate(360deg)}}
    #loadAuto .la-dust{position:absolute;left:14%;bottom:4%;width:3vmin;height:3vmin;border-radius:50%;background:rgba(214,190,150,.55);animation:laDust 1.1s ease-out infinite}
    #loadAuto .la-dust.d2{animation-delay:.37s}#loadAuto .la-dust.d3{animation-delay:.74s}
    @keyframes laDust{0%{transform:translate(0,0) scale(.4);opacity:.8}100%{transform:translate(-14vmin,-5vmin) scale(2.2);opacity:0}}
    #loadAuto .la-smoke{position:absolute;left:4%;bottom:16%;width:2.2vmin;height:2.2vmin;border-radius:50%;background:rgba(120,120,130,.5);animation:laDust 1.4s ease-out infinite .2s}
    @media (prefers-reduced-motion:reduce){#loadAuto .la-layer,#loadAuto .la-bounce,#loadAuto .la-wheel,#loadAuto .la-body,#loadAuto .la-dust,#loadAuto .la-smoke{animation:none}}`;
  document.head.appendChild(css);
  function layout() { const vw = innerWidth, vh = innerHeight; const ground = vh * .80;
    for (const [cls, t, dur, hFrac, bottomFrac] of layers.slice(1)) { const el = root.querySelector('.' + cls); const h = vh * hFrac; const top = vh * bottomFrac - h; const tw = t.W / t.H * h; const n = Math.ceil(vw / tw) + 1;
      el.style.top = top + 'px'; el.style.height = h + 'px'; el.style.setProperty('--tw', tw + 'px'); el.style.animationDuration = (dur * tw / 900).toFixed(2) + 's';
      if (el.childElementCount !== n || el.dataset.tw !== String(Math.round(tw))) { el.dataset.tw = Math.round(tw); el.innerHTML = Array.from({ length: n }, () => `<img alt="" src="${enc(t.svg)}">`).join(''); } }
    const aw = Math.min(vw * .5, vh * .62, 560); root.style.setProperty('--aw', aw + 'px'); root.style.setProperty('--ay', (vh * .865) + 'px'); }
  layout(); addEventListener('resize', layout);
  // fade out once the game is ready (the live map tour takes over behind the menu)
  const T0 = performance.now(), barEl = root.querySelector('.la-bar i'), capB = root.querySelector('.la-cap b');
  const iv = setInterval(() => { if (!window.BB) { const t = (performance.now() - T0) / 1000; barEl.style.width = Math.round((1 - Math.exp(-t / 6)) * 92) + '%'; return; } barEl.style.width = '100%'; capB.textContent = 'Ready'; clearInterval(iv); setTimeout(() => { root.classList.add('gone'); setTimeout(() => { root.remove(); css.remove(); removeEventListener('resize', layout); }, 1300); }, 900); }, 200);
})();
