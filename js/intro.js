// The start screen (Beta v1.01.05): a game title screen over a live tour of the map.
// Shows a loading bar while the world builds, then a menu (Start, Choose your city, Sign in with Google,
// How to play, What's new), a player card, and a BAY NEWS ticker with festivals, events and tips.
(function () {
  const $ = s => document.querySelector(s);
  const TIPS = ['Tip: press N for the map and tap a place for directions', 'Tip: E gets in and out of vehicles, and opens shops and doors', 'Tip: Menu → Local work has 74 regional jobs',
    'Tip: ride the Mumbai–Ahmedabad bullet train from any of its 12 stations', 'Tip: your free starter home and garage are in your home city · Menu → Property', 'Tip: Phone → Roadside help sends a mechanic to your vehicle',
    'Tip: Settings → Steering has a steering wheel, a slider and tilt', 'Tip: press P for photo mode and post your best shots on BayGram', 'Tip: fairs and festivals change with the real calendar',
    'Follow @indiabaygame on Instagram for news and updates'];
  const T0 = performance.now(); let ready = false;
  function tick() { const bar = $('#iloadBar'), txt = $('#iloadTxt'); if (!bar) return;
    if (window.BB && !ready) { ready = true; bar.style.width = '100%'; txt.textContent = 'Ready'; setTimeout(() => document.body.classList.add('iready'), 350); const go = $('#go'); if (go) { go.disabled = false; try { go.focus({ preventScroll: true }); } catch (e) {} } return; }
    if (ready) return; const t = (performance.now() - T0) / 1000; const f = 1 - Math.exp(-t / 6); bar.style.width = Math.round(f * 92) + '%';
    const steps = ['Building West India…', 'Laying highways and flyovers…', 'Lighting the streets…', 'Waking up the cities…', 'Parking the autos…', 'Almost there…']; txt.textContent = steps[Math.min(steps.length - 1, Math.floor(t / 3))];
    requestAnimationFrame(tick); }
  // the news ticker: the admin's announcement, festivals and events from #ann, what's new and tips
  function news() { const el = $('#tick'); if (!el) return; const ann = $('#ann'); const items = [];
    if (ann && ann.innerHTML.trim()) ann.innerHTML.split(/<br\s*\/?>/i).forEach(l => { const t = l.replace(/<[^>]+>/g, '').trim(); if (t) items.push('🎉 ' + t); });
    items.push('🎤 New: host events on a stage · BayEvents in your phone', '👥 New: BayGram groups with group chat and group calls', '🎙 New: live voice chat · hold to talk and players near you hear you', '🎟 New: Bay Transport · book buses, trains, metro and flights in the phone', '🐪 New: camel, horse and elephant rides', '📍 New: share your location with friends', '🎵 New: background music · 🔊 to choose your sounds');
    for (let i = 0; i < 4; i++) items.push('💡 ' + TIPS[(Math.floor(Date.now() / 86400000) + i * 3) % TIPS.length]);
    const html = items.map(t => `<span>${t.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c])}</span>`).join('');
    if (el.dataset.h !== html) { el.dataset.h = html; el.innerHTML = html + html; el.style.animationDuration = Math.max(30, items.length * 7) + 's'; } }
  function wire() {
    const panel = $('#iMapPanel'); const open = v => { if (panel) panel.classList.toggle('open', v); document.body.classList.toggle('imap', v); };
    const c = $('#iCity'); if (c) c.onclick = () => open(!panel.classList.contains('open')); const x = $('#iMapClose'); if (x) x.onclick = () => open(false);
    const h = $('#iHow'); if (h) h.onclick = () => window.BB && window.BB.howTo && window.BB.howTo(0);
    const n = $('#iNew'); if (n) n.onclick = () => window.BB && (window.BB.whatsNew ? window.BB.whatsNew(false) : null);
    addEventListener('keydown', e => { if (e.code !== 'Enter' || !$('#intro') || $('#intro').hidden) return; if (document.querySelector('#sheetWrap:not([hidden])')) return; const go = $('#go'); if (go && !go.disabled) { e.preventDefault(); go.click(); } });
    // Beta v1.01.10: a new player chooses a city first (no default city). Runs before the online sign-in step.
    addEventListener('click', e => { const g = e.target.closest && e.target.closest('#go'); if (!g || !window.BB || !window.BB.needCity || !window.BB.needCity() || window.BB.cloudHas) return;
      e.preventDefault(); e.stopImmediatePropagation(); open(true); if (window.BB.openCityPick) window.BB.openCityPick(); if (window.BB.toast) window.BB.toast('Choose a city to start in · tap a bright state', '#ffc93c'); }, true);
    news(); setInterval(news, 5000); tick();
    // on a wide screen the city map stays open on the right
    if (matchMedia('(min-width: 980px)').matches) open(true);
  }
  // problem finder (Beta v1.01.09): if the online box never appears, show why, without needing the browser console
  const ERR = window.__ibErrors = []; addEventListener('error', e => { ERR.push(((e.filename || '').split('/').pop() || 'page') + ': ' + (e.message || 'error')); }, true);
  addEventListener('unhandledrejection', e => { ERR.push('promise: ' + ((e.reason && e.reason.message) || e.reason)); });
  setInterval(() => { const B = window.BB; if (!B || !B.started || window.IB_STORY || document.querySelector('#chat') || document.querySelector('#ibDiag')) return; if (!window.__ibDiagT) { window.__ibDiagT = Date.now(); return; } if (Date.now() - window.__ibDiagT < 6000) return;
    const lc = document.querySelector('#top .lcol'); if (!lc) return; const d = document.createElement('button'); d.id = 'ibDiag'; d.type = 'button'; d.className = 'pill'; d.style.cssText = 'pointer-events:auto;font:700 12px var(--f-display);color:#ffc93c;cursor:pointer;text-align:left;max-width:230px'; d.textContent = '⚠ Online did not load · tap';
    d.onclick = () => { const lines = ['Online settings file: ' + (window.ONLINE && window.ONLINE.supabaseUrl ? 'found' : 'MISSING (js/online-config.js)'), 'Online code version: ' + (window.__ibOnlineV || 'old or not loaded'), 'Online step: ' + (window.__ibOnlineStage || 'never started'), 'Sign-in library: ' + (window.supabase ? 'loaded' : 'not loaded'), 'Game version: ' + ((document.querySelector('#ver') || {}).textContent || '?'), 'Browser: ' + navigator.userAgent.replace(/^Mozilla\/5\.0 /, '').slice(0, 110)].concat(ERR.slice(-4).map(e => 'Error: ' + e));
      if (B.openSheet) B.openSheet('⚠ Online problem', 'Send a screenshot of this to the developer', lines.map(l => '<p class="note">' + l.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]) + '</p>').join('') + '<div class="btnrow"><button class="go" data-id="rl">Try again</button></div>', s => s.onclick = e => { if (e.target.dataset.id === 'rl') { try { B.save && B.save(); } catch (er) {} location.reload(); } }); else alert(lines.join('\n')); };
    lc.appendChild(d); }, 1500);
  // Always the newest version (Beta v1.01.14): the browser or GitHub Pages can keep an old index.html for a while,
  // which then loads the old game files. version.json is fetched fresh; if it names a newer version, reload once
  // with a fresh address (on the start screen), or offer it during play.
  function curV() { return ((document.querySelector('#ver') || {}).textContent || '').trim(); }
  async function checkV(playing) { try { const r = await fetch('version.json?t=' + Date.now(), { cache: 'no-store' }); if (!r.ok) return; const j = await r.json(); const v = String(j.v || '').trim(); if (!v || v === curV()) return;
      if (!playing) { if (sessionStorage.getItem('ib.upd') === v) return; sessionStorage.setItem('ib.upd', v); location.replace(location.pathname + '?u=' + Date.now() + location.hash); return; }
      const B = window.BB; if (B && B.toast) B.toast(`✨ ${v} is ready · it loads when you go to the main menu`, '#ffc93c'); window.__ibNewV = v; } catch (e) {} }
  checkV(false); setInterval(() => { const B = window.BB; if (!window.__ibNewV) checkV(!!(B && B.started)); }, 10 * 60 * 1000);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire); else wire();
})();
