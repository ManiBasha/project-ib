// Hiding from the police, and the hidden phone app (Beta v2.02.00).
//  • With stars on you, places to hide show up around you: garbage bins in town, haystacks and bushes outside.
//    Get out of sight first (no police jeep within 25 m), then press E to hide. The police search the area instead of
//    chasing you and your stars fade faster. A jeep that passes right by may find you.
//  • Change your clothes at a clothes shop (lose 2 stars) or get a quick respray and new plates at a mechanic (lose the
//    police), if no police jeep is close enough to see you.
//  • "Bay Underground", a hidden phone app. It appears after you escape the police twice, or when you tap the version
//    number in Settings → About seven times. It has safehouses (lay low there and the police cannot find you), a police
//    scanner, fake number plates, a black-market arms dealer who drops guns at your feet, and a finder for dropped cash.
window.BBFeatures.push(function (bb) {
  const T = bb.THREE, P = () => bb.P, esc = bb.esc, W = bb.WORLD, pl = bb.player;
  const X = () => (P().extra = P().extra || {});
  const unlocked = () => !!X().underground;
  const copsNear = r => { const pp = bb.ppos(); return bb.vehicles.filter(v => v.state === 'police' && !v.dead && Math.hypot(v.pos.x - pp.x, v.pos.z - pp.z) < r); };
  const notice = (t, c) => bb.toast(t, c || '#ffc93c');
  /* ---------- hiding spots ---------- */
  const mBin = bb.LMat('#2f6b33'), mBinLid = bb.LMat('#24502a'), mHay = bb.LMat('#d9b45a'), mBush = bb.LMat('#3f7a34');
  const binG = new T.BoxGeometry(1.8, 1.3, 1.1), lidG = new T.BoxGeometry(1.9, .12, 1.2), hayG = new T.ConeGeometry(1.5, 2.2, 10), bushG = new T.SphereGeometry(1.3, 8, 6);
  let spots = [], spotAt = null;
  function clearSpots() { for (const s of spots) bb.scene.remove(s.g); spots = []; spotAt = null; }
  function makeSpot(x, z, kind) { const g = new T.Group();
    if (kind === 'bin') { const b = new T.Mesh(binG, mBin); b.position.y = .65; g.add(b); const l = new T.Mesh(lidG, mBinLid); l.position.y = 1.36; g.add(l); }
    else if (kind === 'hay') { const h = new T.Mesh(hayG, mHay); h.position.y = 1.1; g.add(h); }
    else { for (let k = 0; k < 3; k++) { const b = new T.Mesh(bushG, mBush); b.position.set((k - 1) * .9, .9, (k % 2) * .5); b.scale.setScalar(.8 + k * .15); g.add(b); } }
    g.position.set(x, 0, z); g.rotation.y = Math.random() * 6.28; bb.scene.add(g); return { g, x, z, kind, name: kind === 'bin' ? 'the garbage bin' : kind === 'hay' ? 'the haystack' : 'the bushes' }; }
  const freeAt = (x, z) => !bb.isWater(x, z) && !bb.roadAt(x, z, .8) && !(bb.isForeign && bb.isForeign(x, z)) && !(bb.collideTest && bb.collideTest(new T.Vector3(x, 0, z)));
  function placeSpots() { const pp = bb.ppos(); clearSpots(); spotAt = { x: pp.x, z: pp.z }; const town = bb.zoneAt(pp.x, pp.z, 20);
    for (let k = 0, made = 0; k < 60 && made < 7; k++) { const a = Math.random() * 6.28, r = 18 + Math.random() * 110; let x = pp.x + Math.cos(a) * r, z = pp.z + Math.sin(a) * r;
      if (town) { const i = Math.floor((x - town.x0) / 80), j = Math.floor((z - town.z0) / 80); if (i < 0 || j < 0 || i >= town.nx || j >= town.nz) continue; const [ex, ez] = bb.edgePos(town.x0 + i * 80 + 40, town.z0 + j * 80 + 40, bb.mpick(['n', 's', 'e', 'w']), bb.MR(-30, 30), 28.8); x = ex; z = ez; if (bb.pois.some(p => Math.abs(p.x - x) < 4 && Math.abs(p.z - z) < 4)) continue; }
      if (!freeAt(x, z) || spots.some(q => Math.hypot(q.x - x, q.z - z) < 20)) continue; spots.push(makeSpot(x, z, town ? 'bin' : Math.random() < .6 ? 'hay' : 'bush')); made++; } }
  /* ---------- safehouses: one in every mid-size and big city, known only to Underground members ---------- */
  const SAFE = []; let safeMade = false; const mDoor = bb.LMat('#2a2320'), mSafe = new T.MeshBasicMaterial({ color: 0x9b6bff, transparent: true, opacity: .45, depthWrite: false });
  function makeSafehouses() { if (safeMade) return; safeMade = true; let n = 0;
    for (const z of W.zones) { if (z.size === 'small' || z.island && z.size !== 'mid') continue; let seed = Math.abs(Math.round(z.x0 * 13 + z.z0 * 7)); const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
      for (let k = 0; k < 20; k++) { const i = Math.floor(rnd() * z.nx), j = Math.floor(rnd() * z.nz), side = ['n', 's', 'e', 'w'][Math.floor(rnd() * 4)]; const [x, zz] = bb.edgePos(z.x0 + i * 80 + 40, z.z0 + j * 80 + 40, side, rnd() * 30 - 15, 31);
        if (!bb.drivable(x, zz) || bb.roadAt(x, zz, 1)) continue; SAFE.push({ x, z: zz, name: `Safehouse · ${z.name}`, zone: z, g: null }); n++; break; } }
    return n; }
  function showSafe(s, on) { if (on && !s.g) { const g = new T.Group(); const d = new T.Mesh(new T.BoxGeometry(1.3, 2.3, .15), mDoor); d.position.y = 1.15; g.add(d); const ring = new T.Mesh(new T.RingGeometry(.9, 1.2, 24), mSafe); ring.rotation.x = -Math.PI / 2; ring.position.y = .05; g.add(ring); g.position.set(s.x, 0, s.z); bb.scene.add(g); s.g = g; } if (s.g) s.g.visible = on; }
  /* ---------- hiding ---------- */
  let hid = null; const pill = document.createElement('div'); pill.className = 'pill'; pill.id = 'hidePill'; pill.hidden = true; pill.style.cssText = 'position:fixed;left:50%;top:118px;transform:translateX(-50%);z-index:30;padding:6px 14px;background:rgba(18,22,30,.88);color:#f4f1ea;border-radius:999px;font:600 13.5px system-ui,sans-serif'; document.body.appendChild(pill);
  function hide(at, safe) { if (pl.mode !== 'foot' || hid) return; const seen = copsNear(safe ? 40 : 25); if (seen.length) return notice(`🚨 The police can see you · get out of sight first (${Math.round(Math.hypot(seen[0].pos.x - bb.ppos().x, seen[0].pos.z - bb.ppos().z))} m)`, '#ff5d73');
    hid = { x: at.x, z: at.z, safe: !!safe, name: at.name, t: 0 }; pl.hidden = hid; bb.avatar.visible = false; pl.v = 0; bb.emit('hide', hid);
    notice(safe ? '🕶 Laying low in the safehouse · the police cannot find you here' : `🫣 Hiding in ${at.name} · keep still, the police will search the area`, '#5fb4ff'); }
  function unhide(why) { if (!hid) return; const h = hid; hid = null; pl.hidden = null; bb.avatar.visible = true; pill.hidden = true; if (why) notice(why, h.found ? '#ff5d73' : '#3ddc97'); }
  bb.on('hideFound', () => { if (!hid || hid.safe) return; hid.found = true; unhide('🚨 Found you! The police pulled you out'); bb.addWanted(1, 'Found hiding'); });
  bb.on('ko', () => unhide()); bb.on('bust', () => unhide());
  bb.addFirstPrompt(() => { if (!hid) return null; return { text: pl.stars ? 'Come out of hiding' : 'Come out · the police have gone', fn: () => unhide(pl.stars ? 'You came out · stay out of sight' : '') }; });
  bb.addPrompt(() => { if (hid || pl.mode !== 'foot' || bb.inside) return null; const pp = bb.ppos();
    if (unlocked()) for (const s of SAFE) if (Math.abs(s.x - pp.x) < 3 && Math.abs(s.z - pp.z) < 3) return { text: pl.stars ? '🕶 Lay low in the safehouse' : '🕶 Safehouse · rest here (no police)', fn: () => pl.stars ? hide(s, true) : notice('Nothing to hide from right now · come back when the police are after you', '#d6c8e4') };
    if (!pl.stars) return null; for (const s of spots) if (Math.hypot(s.x - pp.x, s.z - pp.z) < 2.6) return { text: `🫣 Hide in ${s.name}`, fn: () => hide(s, false) }; return null; });
  /* ---------- disguise and respray ---------- */
  const COLS = ['#2d6cdf', '#3aa66b', '#f4f1ea', '#1b1b1f', '#9b4fb5', '#ff9f1c', '#d9483b', '#5c6b8a'];
  bb.addFirstPrompt(() => { if (!pl.stars || hid || bb.inside) return null; const pp = bb.ppos();
    if (pl.mode === 'foot') { const c = bb.pois.find(p => p.type === 'clothes' && Math.hypot(p.x - pp.x, p.z - pp.z) < 4); if (c) return { text: `👕 Quick change of clothes · lose 2 stars · ${bb.inr(bb.cost('svc.disguise', 800))}`, fn: () => disguise() }; }
    if (pl.mode === 'drive' && pl.veh && Math.abs(pl.veh.v) < 3) { const m = bb.pois.find(p => p.type === 'mechanic' && Math.hypot(p.x - pp.x, p.z - pp.z) < 10); if (m) return { text: `🎨 Quick respray and new plates · lose the police · ${bb.inr(bb.cost('svc.respray', 2500))}`, fn: () => respray() }; }
    return null; });
  function disguise() { const seen = copsNear(40); if (seen.length) return notice('🚨 The police are watching the shop · lose them first', '#ff5d73'); if (!bb.spend(bb.cost('svc.disguise', 800), true)) return;
    const o = P().outfit; o.topCol = bb.mpick(COLS.filter(c => c !== o.topCol)); o.botCol = bb.mpick(['#2d3142', '#3a2a1c', '#5c6b8a', '#1b1b1f']); o.cap = !o.cap; o.glasses = !o.glasses; bb.applyOutfit(); bb.setDirty();
    pl.stars = Math.max(0, pl.stars - 2); pl.coolT = 0; bb.renderStars(); bb.emit('stars', pl.stars); notice(pl.stars ? '👕 New look · they are looking for someone else now (−2 stars)' : '👕 New look · the police lost you', '#3ddc97'); }
  function respray() { const seen = copsNear(60); if (seen.length) return notice('🚨 Too close · the police would see you drive in', '#ff5d73'); if (!bb.spend(bb.cost('svc.respray', 2500), true)) return; const v = pl.veh;
    if (v && v.owned && bb.setPlate) { const pl2 = 'MH' + String(10 + Math.floor(Math.random() * 40)) + ' ' + String.fromCharCode(65 + Math.floor(Math.random() * 26), 65 + Math.floor(Math.random() * 26)) + ' ' + String(1000 + Math.floor(Math.random() * 9000)); bb.setPlate(v, pl2); }
    if (v && v.m) v.m.traverse(q => { if (q.isMesh && q.material && q.material.userData && q.material.userData.body) q.material.color.set(bb.mpick(COLS)); });
    pl.stars = 0; pl.coolT = 0; bb.renderStars(); bb.emit('stars', 0); for (const c of bb.vehicles.slice()) if (c.state === 'police') bb.removeVeh(c); notice('🎨 Fresh paint, new plates · the police lost you', '#3ddc97'); }
  /* ---------- escapes unlock the Underground ---------- */
  let lastStars = 0, caught = false; bb.on('bust', () => caught = true); bb.on('ko', () => caught = true); bb.on('enterHome', () => caught = true);
  bb.on('stars', n => { if (n > 0) caught = false; if (lastStars > 0 && n === 0 && !caught) { X().escapes = (X().escapes || 0) + 1; bb.setDirty(); if (!unlocked() && X().escapes >= 2) unlock('escapes'); } lastStars = n; });
  function unlock(how) { if (unlocked()) return; X().underground = how; bb.setDirty(); makeSafehouses();
    setTimeout(() => { const msg = 'You know how to disappear. Open "Bay Underground" on your phone. Tell no one. — a friend'; if (bb.notify) bb.notify('🕶', 'Unknown number', msg, () => app(), 'underground'); notice('🕶 Unknown number: ' + msg, '#9b6bff'); }, 1500); }
  // the secret tap: the version line in Settings → About (or any element with data-ibver), seven times in a row
  let taps = 0, tapAt = 0; document.addEventListener('click', e => { const t = e.target; if (!t || !t.closest) return; const v = t.closest('[data-ibver], .ver, #ver, .version'); if (!v) { return; } const now = Date.now(); taps = now - tapAt < 1500 ? taps + 1 : 1; tapAt = now;
    if (unlocked()) { if (taps === 7) notice('🕶 You are already in', '#9b6bff'); return; } if (taps >= 3 && taps < 7) notice(`${7 - taps} more…`, '#d6c8e4'); if (taps >= 7) { taps = 0; unlock('secret'); } }, true);
  /* ---------- the app ---------- */
  let scanner = false;
  function nearestSafe(n) { makeSafehouses(); const pp = bb.ppos(); return SAFE.map(s => ({ s, d: Math.hypot(s.x - pp.x, s.z - pp.z) })).sort((a, b) => a.d - b.d).slice(0, n); }
  const km = d => (d * 2.4 / 1000).toFixed(1) + ' km';
  function app(tab) { if (!unlocked()) return; const p = P(); const pp = bb.ppos(); const cops = bb.vehicles.filter(v => v.state === 'police' && !v.dead);
    const drops = bb.LOOT ? bb.LOOT.list.map(o => ({ o, d: Math.hypot(o.x - pp.x, o.z - pp.z) })).sort((a, b) => a.d - b.d).slice(0, 4) : [];
    const hrs = bb.clock != null ? (bb.gameDay * 24 + bb.clock) : 0; const vault = p.robbedAt != null && hrs - p.robbedAt < 6 ? `the vault refills in about ${Math.ceil(6 - (hrs - p.robbedAt))} game hours` : 'bank vaults are full';
    const rows = [
      bb.rowHtml('scan', `📡 Police scanner ${scanner ? '· on' : ''}`, scanner ? `${cops.length} jeep${cops.length === 1 ? '' : 's'} out after you · the nearest is shown at the top of the screen` : 'See where the police jeeps are while you are wanted', scanner ? 'Turn off' : 'Turn on', scanner ? 'ghost' : ''),
      ...nearestSafe(3).map((q, i) => bb.rowHtml('safe' + i, `🏚 ${esc(q.s.name)}`, `${km(q.d)} away · lay low here and the police cannot find you`, 'Go', 'ghost')),
      bb.rowHtml('plates', '🔧 Fake number plates', `Swap plates on the vehicle you are in · lose 2 stars if no police can see you`, bb.inr(bb.cost('svc.fakeplate', 3000))),
      bb.rowHtml('dealer', '🔫 Arms dealer', bb.CFG.weapons ? 'Guns dropped at your feet, anywhere · 40% over the shop price' : 'Weapons are switched off in this world', 'Open', bb.CFG.weapons ? '' : 'ghost'),
      bb.rowHtml('gunshop', '🗺 Nearest weapon shop', 'Directions to the nearest Hathiyar Ghar', 'Go', 'ghost'),
      ...drops.map((q, i) => bb.rowHtml('drop' + i, `💰 Dropped ${q.o.c ? bb.inr(q.o.c) : ''}${q.o.i.length ? (q.o.c ? ' + ' : '') + q.o.i.map(w => w[0]).join(', ') : ''}`, `${km(q.d)} away · first come, first served`, 'Go', 'ghost')),
      bb.rowHtml('tip', '🤫 Tip of the day', `${vault} · a change of clothes or a respray throws the police off · bins and haystacks are good places to hide`, '', 'ghost')].join('');
    bb.openSheet('🕶 Bay Underground', `Escapes: ${X().escapes || 0} · ${p.stars || pl.stars ? 'you are wanted' : 'all quiet'}`, rows, s => s.onclick = e => { const id = e.target.dataset.id; if (!id) return;
      if (id === 'scan') { scanner = !scanner; X().scanner = scanner; bb.setDirty(); return app(); }
      if (id.startsWith('safe')) { const q = nearestSafe(3)[+id.slice(4)]; bb.closeSheet(); return bb.directions && bb.directions(q.s.x, q.s.z, q.s.name); }
      if (id.startsWith('drop')) { const q = drops[+id.slice(4)]; bb.closeSheet(); return bb.directions && bb.directions(q.o.x, q.o.z, 'Dropped cash'); }
      if (id === 'gunshop') { const g = bb.pois.filter(p2 => p2.type === 'guns').sort((a, b) => Math.hypot(a.x - pp.x, a.z - pp.z) - Math.hypot(b.x - pp.x, b.z - pp.z))[0]; bb.closeSheet(); if (g && bb.directions) bb.directions(g.x, g.z, g.name); return; }
      if (id === 'plates') { if (pl.mode !== 'drive') return notice('Get in a vehicle first', '#ff9f1c'); if (!pl.stars) return notice('Nobody is after you right now', '#d6c8e4'); if (copsNear(80).length) return notice('🚨 Too close to the police · lose them first', '#ff5d73'); if (!bb.spend(bb.cost('svc.fakeplate', 3000), true)) return;
        pl.stars = Math.max(0, pl.stars - 2); pl.coolT = 0; bb.renderStars(); bb.emit('stars', pl.stars); bb.closeSheet(); return notice('🔧 New plates on · −2 stars', '#3ddc97'); }
      if (id === 'dealer') return dealer(); }); }
  function dealer() { if (!bb.CFG.weapons) return; const G = (bb.GUNSHOP || []).filter(g => g[0] !== 'bat');
    bb.openSheet('🔫 Arms dealer', 'Dropped at your feet · no questions', G.map(([id, nm, sub, pr]) => bb.rowHtml(id, nm, sub, bb.inr(Math.round(bb.cost('gun.' + id, pr) * 1.4)))).join('') + bb.rowHtml('back', '‹ Back', '', 'Back', 'ghost'),
      s => s.onclick = e => { const id = e.target.dataset.id; if (!id) return; if (id === 'back') return app(); const g = G.find(q => q[0] === id); if (!g) return; if (!bb.spend(Math.round(bb.cost('gun.' + id, g[3]) * 1.4), true)) return;
        const AM = { ammoP: ['pistol', 24], ammoS: ['shotgun', 12], ammoM: ['smg', 60], ammoR: ['rifle', 10] }, ST = { pistol: 24, shotgun: 12, smg: 60, rifle: 10 }; const pp = bb.ppos(); let item;
        if (AM[id]) { P().ammo[AM[id][0]] = (P().ammo[AM[id][0]] || 0) + AM[id][1]; bb.updWeap(); bb.setDirty(); bb.closeSheet(); return notice(`📦 A boy on a cycle hands you a packet · +${AM[id][1]} rounds`, '#3ddc97'); }
        item = id === 'armour' ? ['armour', 100] : [id, ST[id] || 0]; if (bb.LOOT) bb.LOOT.add({ id: 'deal' + Date.now(), x: pp.x + Math.sin(pl.h) * 1.6, z: pp.z + Math.cos(pl.h) * 1.6, c: 0, i: [item] }, true); bb.closeSheet(); notice(`📦 ${g[1]} left at your feet · pick it up`, '#3ddc97'); }); }
  bb.addApp({ id: 'underground', label: 'Underground', icon: '🕶', fn: () => app(), show: () => unlocked() });
  /* ---------- every frame ---------- */
  const sp = document.createElement('div'); sp.id = 'scanPill'; sp.hidden = true; sp.style.cssText = 'position:fixed;left:50%;top:150px;transform:translateX(-50%);z-index:30;padding:4px 12px;background:rgba(31,95,168,.9);color:#fff;border-radius:999px;font:600 12.5px system-ui,sans-serif'; document.body.appendChild(sp);
  const DIRS = ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'];
  let tick = 0;
  let ticks = 0; bb.onUpdate((dt) => { if (!bb.started) return; ticks++; const pp = bb.ppos();
    if (hid) { pl.pos.x = hid.x; pl.pos.z = hid.z; pl.v = 0; bb.avatar.visible = false; hid.t += dt; pill.hidden = false;
      pill.textContent = pl.stars ? `${hid.safe ? '🕶 Laying low' : '🫣 Hiding'} · ${'★'.repeat(pl.stars)} fading · E to come out` : '✅ The police gave up · press E to come out';
      if (!pl.stars && hid.t > 1 && !hid.told) { hid.told = true; notice('✅ The police gave up the search', '#3ddc97'); } }
    const ms = performance.now(); if (ms < tick) return; tick = ms + 500;
    if (pl.stars > 0 && !bb.inside && pl.mode === 'foot') { if (!spotAt || Math.hypot(pp.x - spotAt.x, pp.z - spotAt.z) > 90) placeSpots(); } else if (!pl.stars && !hid && spots.length) clearSpots();
    if (unlocked()) { makeSafehouses(); for (const s of SAFE) showSafe(s, Math.abs(s.x - pp.x) + Math.abs(s.z - pp.z) < 300 && !bb.inside); }
    scanner = unlocked() && !!X().scanner;
    if (scanner && pl.stars > 0) { const c = bb.vehicles.filter(v => v.state === 'police' && !v.dead).map(v => ({ v, d: Math.hypot(v.pos.x - pp.x, v.pos.z - pp.z) })).sort((a, b) => a.d - b.d)[0];
      sp.hidden = !c; if (c) { const a = Math.atan2(c.v.pos.x - pp.x, -(c.v.pos.z - pp.z)); const k = Math.round(((a + 6.283) % 6.283) / (Math.PI / 4)) % 8; sp.textContent = `📡 Nearest police ${Math.round(c.d * 2.4)} m ${DIRS[k]}${hid ? ' · searching' : ''}`; } }
    else sp.hidden = true; });
  bb.HIDE = { get ticks() { return ticks; }, get spotAt() { return spotAt; }, place: () => placeSpots(), hide: s => hide(s || { x: bb.ppos().x, z: bb.ppos().z, name: 'here' }), unhide, get hidden() { return hid; }, get spots() { return spots; }, unlock, get SAFE() { makeSafehouses(); return SAFE; }, app };
});
