// India Bay heroes (Beta v1.01.12, v1.01.28 suits and free movement): six original superheroes with regional flavour. Each one is in one place at a
// time and moves every 20 minutes, worked out from the shared clock so every player sees the hero in the same city.
// Sightings show on billboards, in Phone → BayRadio and as a radio flash. Each hero has an admin switch
// (Admin → Game settings → Heroes). Meet a hero for an autograph (a small reward once a day) and an achievement.
window.BBFeatures.push(function (bb) {
  if (window.IB_STORY) return; // Beta v2.03.00: no gimmicks in Badshah story mode
  const T = bb.THREE, W = bb.WORLD, P = () => bb.P, esc = bb.esc;
  const HEROES = [
    { id: 'vidyut', name: 'Vidyut', title: 'the Lightning Guardian', st: 'KL', icon: '⚡', suit: '#1f4fd8', acc: '#ffd23f', fx: 'bolt', line: 'Fast as monsoon lightning over the backwaters. Vidyut guards every boat and bus in Kerala.' },
    { id: 'varsha', name: 'Varsha', title: 'the Monsoon Guardian', st: 'MH', icon: '🌧', suit: '#0f766e', acc: '#cfe8ff', fx: 'rain', line: 'She rides the first rain clouds into the city and clears the flooded roads for everyone.' },
    { id: 'marudhar', name: 'Marudhar', title: 'the Desert Falcon', st: 'RJ', icon: '🦅', suit: '#c2410c', acc: '#f6d58a', fx: 'wings', line: 'He soars over the forts of the Thar and finds every lost traveller before sunset.' },
    { id: 'patang', name: 'Patang', title: 'the Kite Ace', st: 'GJ', icon: '🪁', suit: '#7b2a5e', acc: '#ffc93c', fx: 'kite', line: 'She flies on a giant kite above the pols, and never lets a single kite string hurt a bird.' },
    { id: 'sagar', name: 'Sagar', title: 'the Tide Rider', st: 'GA', icon: '🌊', suit: '#0e7490', acc: '#ff8a3d', fx: 'wave', line: 'He surfs the Arabian Sea and keeps the beaches of Goa safe for swimmers.' },
    { id: 'chandan', name: 'Chandan', title: 'the Forest Spirit', st: 'KA', icon: '🌿', suit: '#3f6212', acc: '#d9b26f', fx: 'leaves', line: 'Born in the sandalwood forests, Chandan protects the elephants and the coffee hills.' }];
  const SLOT = 20 * 60 * 1000;
  for (const h of HEROES) bb.achAdd && bb.achAdd(['hero_' + h.id, h.icon, `Met ${h.name}`, `Get an autograph from ${h.name}, ${h.title}`]);
  bb.achAdd && bb.achAdd(['heroes_all', '🦸', 'Hero hunter', 'Meet all six India Bay heroes']);
  const on = h => !bb.CFG.heroes || bb.CFG.heroes[h.id] !== false;
  function hash(s) { let x = 2166136261; for (let i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = Math.imul(x, 16777619); } return (x >>> 0) / 4294967296; }
  // where each hero is right now: a famous place (or the centre) of one of the bigger towns in its state
  function whereNow(h, slot) { const zs = W.zones.filter(z => z.st === h.st && z.size !== 'small'); const L = zs.length ? zs : W.zones.filter(z => z.st === h.st); if (!L.length) return null;
    const z = L[Math.floor(hash(h.id + ':' + slot) * L.length)]; const pl = (W.places || []).filter(p => p[1] > z.x0 - 60 && p[1] < z.x0 + z.nx * 80 + 60 && p[2] > z.z0 - 60 && p[2] < z.z0 + z.nz * 80 + 60);
    const p = pl.length ? pl[Math.floor(hash(h.id + '#' + slot) * pl.length)] : [z.name, z.x0 + z.nx * 40, z.z0 + z.nz * 40]; return { zone: z, place: p[0], x: p[1], z: p[2] }; }
  /* ---------- the hero figure (Beta v1.01.28: a proper suit) ----------
     A two-tone suit, boots and gloves in the accent colour, a belt with a buckle, a painted chest emblem, a mask band
     with flying tails, shoulder guards and a cape that hangs, swings as they walk and streams out behind in flight. */
  const LM = c => bb.LMat(c), G = c => new T.MeshBasicMaterial({ color: c });
  const LOOK = { vidyut: { suit2: '#16307e', skin: '#8d5a3b' }, varsha: { suit2: '#0b4f4a', skin: '#a8714a' }, marudhar: { suit2: '#7c2a08', skin: '#9a6340' }, patang: { suit2: '#4a1838', skin: '#b07a52' }, sagar: { suit2: '#0a4d61', skin: '#7a4c30' }, chandan: { suit2: '#283f0c', skin: '#8a5634' } };
  function emblem(h) { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); x.fillStyle = h.acc; x.beginPath(); x.arc(64, 64, 60, 0, 6.283); x.fill(); x.fillStyle = h.suit; x.beginPath(); x.arc(64, 64, 50, 0, 6.283); x.fill(); x.fillStyle = h.acc; x.strokeStyle = h.acc; x.lineWidth = 8; x.lineJoin = 'round'; x.beginPath();
    if (h.fx === 'bolt') { x.moveTo(74, 18); x.lineTo(40, 70); x.lineTo(62, 70); x.lineTo(50, 110); x.lineTo(88, 54); x.lineTo(66, 54); x.closePath(); x.fill(); }
    else if (h.fx === 'rain') { x.moveTo(64, 20); x.bezierCurveTo(86, 54, 96, 70, 96, 82); x.arc(64, 82, 32, 0, Math.PI); x.bezierCurveTo(32, 70, 42, 54, 64, 20); x.fill(); }
    else if (h.fx === 'wings') { for (const s of [-1, 1]) { x.moveTo(64, 74); x.lineTo(64 + s * 46, 38); x.lineTo(64 + s * 38, 58); x.lineTo(64 + s * 44, 60); x.lineTo(64 + s * 30, 76); x.lineTo(64, 92); } x.fill(); }
    else if (h.fx === 'kite') { x.moveTo(64, 18); x.lineTo(98, 58); x.lineTo(64, 98); x.lineTo(30, 58); x.closePath(); x.fill(); x.fillStyle = h.suit; x.fillRect(61, 22, 6, 72); x.fillRect(34, 55, 60, 6); }
    else if (h.fx === 'wave') { x.lineWidth = 11; x.moveTo(20, 84); x.bezierCurveTo(40, 40, 70, 30, 92, 50); x.bezierCurveTo(78, 46, 66, 58, 76, 70); x.stroke(); x.beginPath(); x.moveTo(24, 102); x.quadraticCurveTo(64, 86, 104, 102); x.stroke(); }
    else { x.moveTo(64, 16); x.bezierCurveTo(104, 40, 100, 90, 64, 112); x.bezierCurveTo(28, 90, 24, 40, 64, 16); x.fill(); x.strokeStyle = h.suit; x.lineWidth = 5; x.beginPath(); x.moveTo(64, 30); x.lineTo(64, 104); x.stroke(); }
    const t = new T.CanvasTexture(c); return new T.MeshLambertMaterial({ map: t, transparent: true }); }
  function build(h) { const g = new T.Group(); const L = LOOK[h.id] || {}; const female = ['varsha', 'patang'].includes(h.id);
    const body = bb.buildPerson(LM(h.suit), { mats: true, female, skin: L.skin, clothes: { dress: 'shirt', shirt: h.suit, pants: L.suit2 || h.suit } }); body.scale.setScalar(1.1); g.add(body); const U = body.userData; g.userData.body = body;
    const acc = LM(h.acc), dark = LM('#15151c'); const add = (parent, geo, m, x, y, z) => { const o = new T.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; parent.add(o); return o; };
    for (const k of U.knees) { add(k, new T.BoxGeometry(.13, .24, .16), acc, 0, -.26, .01); add(k, new T.BoxGeometry(.135, .06, .25), acc, 0, -.41, .045); }
    for (const f of U.fores) add(f, new T.BoxGeometry(.085, .15, .085), acc, 0, -.29, 0);
    add(body, new T.BoxGeometry(.4, .07, .25), acc, 0, .99, 0); add(body, new T.BoxGeometry(.09, .07, .02), LM('#f4f1ea'), 0, .99, .13);
    for (const s of [-1, 1]) { const sh = add(body, new T.SphereGeometry(.1, 8, 6), acc, s * .25, 1.47, 0); sh.scale.set(1, .55, 1.05); }
    const em = new T.Mesh(new T.PlaneGeometry(.2, .2), emblem(h)); em.position.set(0, 1.3, .148); body.add(em);
    const mask = add(body, new T.CylinderGeometry(.128, .128, .055, 18, 1, true), dark, 0, 1.738, 0); mask.material = new T.MeshLambertMaterial({ color: '#15151c', side: T.DoubleSide });
    const tails = []; for (const s of [-1, 1]) { const tl = new T.Mesh(new T.PlaneGeometry(.05, .32), new T.MeshLambertMaterial({ color: h.acc, side: T.DoubleSide })); tl.geometry.translate(0, -.16, 0); tl.position.set(s * .03, 1.74, -.125); tl.rotation.x = -1.2; body.add(tl); tails.push(tl); } g.userData.tails = tails;
    // the cape: hangs from the shoulders, 9 rows of vertices bent every frame
    const cg = new T.PlaneGeometry(.62, 1.15, 3, 8); cg.translate(0, -.575, 0); const base = cg.attributes.position.array.slice(); const cape = new T.Mesh(cg, new T.MeshLambertMaterial({ color: h.acc, side: T.DoubleSide })); cape.position.set(0, 1.5, -.15); cape.castShadow = true; body.add(cape); g.userData.cape = { m: cape, base };
    const fx = new T.Group(); g.add(fx); g.userData.fx = fx;
    if (h.fx === 'bolt') { for (let i = 0; i < 6; i++) { const b = new T.Mesh(new T.BoxGeometry(.04, .45, .04), G(0xfff27a)); b.position.set(Math.cos(i) * .55, .5 + i * .26, Math.sin(i) * .55); b.rotation.z = i % 2 ? .6 : -.6; fx.add(b); } fx.userData.flyOnly = true; }
    if (h.fx === 'rain') { for (let i = 0; i < 12; i++) { const d = new T.Mesh(new T.BoxGeometry(.025, .3, .025), G(0x9fd4ff)); d.position.set((Math.random() - .5) * 1.6, 2.4 - Math.random() * 2, (Math.random() - .5) * 1.2); d.userData.drop = true; fx.add(d); } fx.userData.flyOnly = true; }
    if (h.fx === 'wings') for (const s of [-1, 1]) { const w = new T.Mesh(new T.ConeGeometry(.42, 2.0, 3), LM(h.acc)); w.rotation.z = s * 1.25; w.position.set(s * 1.05, 1.42, -.22); w.userData.wing = s; fx.add(w); }
    if (h.fx === 'kite') { const k = new T.Mesh(new T.BoxGeometry(1.5, 1.5, .04), new T.MeshLambertMaterial({ color: h.acc, side: T.DoubleSide })); k.rotation.z = Math.PI / 4; k.position.set(0, 3.5, -.7); fx.add(k); const s = new T.Mesh(new T.BoxGeometry(.015, 1.9, .015), LM('#eee')); s.position.set(0, 2.4, -.35); fx.add(s); fx.userData.flyOnly = true; }
    if (h.fx === 'wave') { const b = new T.Mesh(new T.BoxGeometry(.55, .07, 2.0), LM(h.acc)); b.position.y = .02; fx.add(b); fx.userData.flyOnly = true; }
    if (h.fx === 'leaves') for (let i = 0; i < 10; i++) { const l = new T.Mesh(new T.PlaneGeometry(.2, .11), new T.MeshLambertMaterial({ color: i % 2 ? '#65a30d' : '#a3e635', side: T.DoubleSide })); l.userData.leaf = i; fx.add(l); }
    g.traverse(o => { if (o.isMesh) o.frustumCulled = false; });
    return g; }
  // flow 0: hangs down the back · flow 1: in flight the air pushes it along the body towards the feet, rippling
  function capeBend(C, flow, t, swing) { const p = C.m.geometry.attributes.position, a = p.array, b = C.base; for (let i = 0; i < a.length; i += 3) { const v = -b[i + 1] / 1.15; const w = Math.sin(t * (flow > .5 ? 12 : 3) + v * 4 + b[i] * 2) * (.025 + flow * .06) * v;
      a[i] = b[i] * (1 + v * .3 * (1 - flow)); a[i + 1] = b[i + 1]; a[i + 2] = -v * v * (.1 + swing) * (1 - flow) - (.05 + v * .22) * flow + w; } p.needsUpdate = true; C.m.geometry.computeVertexNormals(); }
  /* ---------- state: who is where, news and billboards ---------- */
  const live = {}; let lastSlot = -1;
  function tickSlot() { const slot = Math.floor(bb.now() / SLOT); if (slot === lastSlot) return; const first = lastSlot < 0; lastSlot = slot;
    for (const h of HEROES) { if (!on(h)) { if (live[h.id]) drop(h); continue; } const w = whereNow(h, slot); if (!w) continue; const L = live[h.id] = live[h.id] || {}; L.w = w; L.slot = slot; if (L.g) { bb.scene.remove(L.g); L.g = null; }
      bb.NEWS && bb.NEWS.push({ icon: h.icon, title: `${h.name} spotted in ${w.zone.name}`, text: `${h.name}, ${h.title}, is near ${w.place}. ${h.line}` });
      if (!first) { const pp = bb.ppos(); const here = bb.zoneAt(pp.x, pp.z, 300); if (here && here.st === h.st && bb.started) bb.toast(`📻 BayRadio flash · ${h.icon} ${esc(h.name)} is now seen in ${esc(w.zone.name)}`, h.acc); } }
    if (bb.refreshBillboards) bb.refreshBillboards(); }
  function drop(h) { const L = live[h.id]; if (L && L.g) bb.scene.remove(L.g); delete live[h.id]; }
  bb.addHouseAd && bb.addHouseAd(slot => { if (!slot.zone) return null; const h = HEROES.find(q => on(q) && live[q.id] && q.st === slot.zone.st); if (!h) return null; const w = live[h.id].w;
    return { title: `${h.icon} ${h.name.toUpperCase()} SPOTTED`, line2: `${w.zone.name} · near ${w.place}`, desc: `${h.name}, ${h.title}, was seen near ${w.place} in ${w.zone.name}. Tap for directions and go meet the hero.`, cat: 'News', fg: '#1d1433', bg: h.acc, target: { x: w.x, z: w.z, name: `${h.name} · ${w.place}` } }; });
  setInterval(tickSlot, 5000); bb.onStart(tickSlot);
  /* ---------- in the world (Beta v1.01.28) ----------
     A hero no longer comes to you. Each one goes about their own business round the place they were seen: flies across
     the town over the rooftops, lands on a pavement, walks along it for a while, then takes off again. Walk up to a hero
     on the ground to meet them; they stop for you while you talk. */
  function groundSpot(cx, cz, rmin, rmax) { for (let k = 0; k < 12; k++) { const a = Math.random() * 6.283, r = rmin + Math.random() * (rmax - rmin); const p = bb.nearestRoadPoint(cx + Math.cos(a) * r, cz + Math.sin(a) * r, 80); if (!p || !p.e || p.e.fly) continue;
      const e = p.e, side = (Math.random() < .5 ? -1 : 1) * ((e.w || 8) / 2 + 1.3); const x = p.x + e.dz * side, z = p.z - e.dx * side; if (bb.isWater && bb.isWater(x, z)) continue; if (bb.obstTop && bb.obstTop(x, z) > .5) continue; const dir = Math.random() < .5 ? 1 : -1; return { x, z, dx: e.dx * dir, dz: e.dz * dir }; } return null; }
  function cruiseY(x0, z0, x1, z1) { let top = 0; if (bb.obstTop) for (let i = 0; i <= 12; i++) { const u = i / 12; top = Math.max(top, bb.obstTop(x0 + (x1 - x0) * u, z0 + (z1 - z0) * u)); } return Math.max(28, top + 16); }
  function plan(L) { const w = L.w; const s = groundSpot(w.x, w.z, 30, 230) || { x: w.x + 20, z: w.z, dx: 1, dz: 0 }; L.dest = s; L.st = 'fly'; L.cy = cruiseY(L.g.position.x, L.g.position.z, s.x, s.z); }
  const turnTo = (a, b, k) => { let d = b - a; d = Math.atan2(Math.sin(d), Math.cos(d)); return a + d * k; };
  bb.onUpdate(dt0 => { if (!bb.started) return; const pp = bb.ppos(); const now = performance.now(); const t = now / 1000;
    for (const h of HEROES) { const L = live[h.id]; if (!L || !L.w) continue; const dt = Math.min(.1, L.lt ? (now - L.lt) / 1000 : .016); L.lt = now; const d = Math.hypot(L.w.x - pp.x, L.w.z - pp.z);
      if (d > 700 || bb.inside) { if (L.g) L.g.visible = false; continue; }
      if (!L.g) { L.g = build(h); bb.scene.add(L.g); const s = groundSpot(L.w.x, L.w.z, 0, 120); if (s) { L.g.position.set(s.x, 0, s.z); L.st = 'walk'; L.walk = s; L.left = 25 + Math.random() * 30; L.hd = Math.atan2(s.dx, s.dz); } else { L.g.position.set(L.w.x, 40, L.w.z); L.hd = 0; plan(L); } }
      const g = L.g; g.visible = true; const U = g.userData.body.userData; const P0 = g.position; let flow = 0, swing = 0, pitch = 0;
      const meeting = L.pause && now < L.pause; const close = Math.hypot(P0.x - pp.x, P0.z - pp.z);
      if (L.st === 'walk') { const s = L.walk; const ahead = (pp.x - P0.x) * s.dx + (pp.z - P0.z) * s.dz, lat = Math.abs(-(pp.x - P0.x) * s.dz + (pp.z - P0.z) * s.dx); const blocked = bb.player.mode === 'foot' && ahead > 0 && ahead < 2 && lat < .9;
        const sp = meeting || blocked ? 0 : 1.45; L.v = (L.v || 0) + (sp - (L.v || 0)) * Math.min(1, dt * 4); const nx = P0.x + s.dx * L.v * dt, nz = P0.z + s.dz * L.v * dt;
        if (bb.obstTop && bb.obstTop(nx + s.dx * .6, nz + s.dz * .6) > .5) { L.left = 0; } else { P0.x = nx; P0.z = nz; } P0.y = 0; L.left -= L.v * dt;
        L.hd = turnTo(L.hd, meeting && close < 6 ? Math.atan2(pp.x - P0.x, pp.z - P0.z) : Math.atan2(s.dx, s.dz), Math.min(1, dt * 5)); L.ph = (L.ph || 0) + L.v * dt * 4.2; const a = Math.sin(L.ph) * Math.min(1, L.v / 1.2);
        U.legs[0].rotation.x = a * .5; U.legs[1].rotation.x = -a * .5; U.arms[0].rotation.x = -a * .38; U.arms[1].rotation.x = a * .38; swing = Math.abs(a) * .05; flow = Math.min(.25, L.v * .1);
        if (L.left <= 0 && !meeting) { L.st = 'take'; L.tt = 0; } }
      else if (L.st === 'take') { L.tt += dt; const c = Math.min(1, L.tt / .45); if (L.tt < .45) { U.legs[0].rotation.x = U.legs[1].rotation.x = -.5 * c; U.arms[0].rotation.x = U.arms[1].rotation.x = .3 * c; P0.y = 0; }
        else { P0.y += dt * (6 + (L.tt - .45) * 10); U.legs[0].rotation.x = U.legs[1].rotation.x = .05; U.arms[1].rotation.x = -2.9; U.arms[0].rotation.x = .2; flow = .6; if (P0.y > 8) { plan(L); } } }
      else if (L.st === 'fly') { const s = L.dest; const dx = s.x - P0.x, dz = s.z - P0.z, dd = Math.hypot(dx, dz); const want = Math.atan2(dx, dz); L.hd = turnTo(L.hd, want, Math.min(1, dt * 1.6)); const sp = Math.min(24, 6 + dd * .4);
        P0.x += Math.sin(L.hd) * sp * dt; P0.z += Math.cos(L.hd) * sp * dt; const ty = dd > 40 ? L.cy : Math.max(6, L.cy * dd / 40); P0.y += (ty - P0.y) * Math.min(1, dt * 1.2);
        if (h.fx === 'wave') { pitch = .12; U.arms[0].rotation.x = U.arms[1].rotation.x = -.2; U.arms[0].rotation.z = -1.1; U.arms[1].rotation.z = 1.1; U.legs[0].rotation.x = .25; U.legs[1].rotation.x = -.25; flow = .5; } // Sagar surfs the air standing on his board
        else { pitch = Math.min(1.35, .3 + sp * .045); U.arms[1].rotation.x = -2.95; U.arms[0].rotation.x = .15; U.legs[0].rotation.x = .08 + Math.sin(t * 2) * .04; U.legs[1].rotation.x = .02 - Math.sin(t * 2) * .04; flow = 1; } L.bank = turnTo(L.bank || 0, (want - L.hd) * .8, Math.min(1, dt * 3));
        if (dd < 3) { L.st = 'land'; L.lt0 = P0.y; } }
      else if (L.st === 'land') { P0.y = Math.max(0, P0.y - dt * Math.max(2.5, P0.y * 1.3)); pitch = 0; U.arms[1].rotation.x = U.arms[0].rotation.x = -.35; flow = Math.min(1, P0.y / 6); const c = P0.y < .6 ? 1 - P0.y / .6 : 0; U.legs[0].rotation.x = U.legs[1].rotation.x = -.45 * c;
        if (P0.y <= 0) { const s = L.dest; L.walk = s; L.left = 30 + Math.random() * 35; L.st = 'walk'; L.v = 0; L.hd = Math.atan2(s.dx, s.dz); } }
      if (L.st !== 'fly') { L.bank = (L.bank || 0) * Math.max(0, 1 - dt * 3); U.arms[0].rotation.z = -.05; U.arms[1].rotation.z = .05; }
      L.pitch = (L.pitch || 0) + (pitch - (L.pitch || 0)) * Math.min(1, dt * 3); g.rotation.set(L.pitch, L.hd, -(L.bank || 0), 'YXZ'); g.userData.body.position.y = L.pitch > .5 ? -.9 * L.pitch : 0;
      if (close < 120) { capeBend(g.userData.cape, flow, t, swing); for (const tl of g.userData.tails) tl.rotation.x = -1.1 - flow * .3 + Math.sin(t * 9 + tl.position.x * 40) * .15 * (.3 + flow); }
      const fx = g.userData.fx; fx.visible = !fx.userData.flyOnly || P0.y > 1.5; for (const o of fx.children) { if (o.userData.drop) { o.position.y -= dt * 3; if (o.position.y < .2) o.position.y = 2.6; } if (o.userData.wing) { const up = P0.y > 1.5; o.rotation.x = Math.sin(t * (up ? 8 : 1.5)) * (up ? .3 : .05); const k = up ? 1 : .42; o.scale.setScalar(o.scale.x + (k - o.scale.x) * Math.min(1, dt * 3)); o.position.x = o.userData.wing * (.25 + .8 * o.scale.x); o.position.y = 1.42 - (1 - o.scale.x) * .1; o.rotation.z = o.userData.wing * (up ? 1.25 : .35); } if (o.userData.leaf != null) { const a = t * 1.5 + o.userData.leaf * .63; o.position.set(Math.cos(a) * .9, .4 + (o.userData.leaf % 5) * .35, Math.sin(a) * .9); o.rotation.y = a; } }
      if (h.fx === 'bolt' && fx.visible) fx.visible = Math.sin(t * 17) > -.3; } });
  /* ---------- meeting a hero ---------- */
  (bb.addFirstPrompt || bb.addPrompt)(() => { if (bb.inside || bb.player.mode !== 'foot') return null; const pp = bb.ppos();
    for (const h of HEROES) { const L = live[h.id]; if (!L || !L.g || !L.g.visible || L.g.position.y > .3 || L.st !== 'walk') continue; if (Math.hypot(L.g.position.x - pp.x, L.g.position.z - pp.z) < 4) return { text: `Meet ${h.name} ${h.icon}`, fn: () => { L.pause = performance.now() + 25000; meet(h); } }; } return null; });
  function meet(h) { const x = P().extra; x.heroes = x.heroes || {}; const day = bb.istISO(); const got = x.heroes[h.id] === day;
    bb.openSheet(`${h.icon} ${h.name}`, h.title, `<p class="note" style="font-size:14px">"${esc(h.line)}"</p>` + bb.rowHtml('auto', '✍ Ask for an autograph', got ? 'You already have one from today' : `A gift for fans · ${bb.inr(bb.price(500))} once a day`, got ? 'Done' : 'Ask', got ? 'ghost' : '') + bb.rowHtml('pic', '📸 Take a selfie', 'Opens photo mode · post it on BayGram', 'Photo', 'ghost'),
      s => s.onclick = e => { const id = e.target.dataset.id; if (id === 'auto' && !got) { x.heroes[h.id] = day; bb.earn(bb.price(500), 'hero'); bb.grant && bb.grant('hero_' + h.id); const met = HEROES.filter(q => P().ach && P().ach['hero_' + q.id]).length; if (met >= HEROES.length) bb.grant && bb.grant('heroes_all'); bb.setDirty(); bb.toast(`${h.icon} ${esc(h.name)} signs your phone case · +${bb.inr(bb.price(500))}`, h.acc); meet(h); }
        if (id === 'pic') { bb.closeSheet(); document.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyP', key: 'p' })); } }); }
  bb.HEROES = { list: HEROES, where: id => live[id] && live[id].w, whereNow, debug: id => { const L = live[id]; return L ? { has: !!L.g, vis: L.g && L.g.visible, st: L.st, pos: L.g && [L.g.position.x, L.g.position.y, L.g.position.z], w: [L.w.x, L.w.z] } : null; }, live };
});
