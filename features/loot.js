// Dropped money and weapons (Beta v2.02.00), GTA style. When someone goes down, what they carried stays on the ground:
//   • a person you knock down in the street may drop a bundle of cash (and now and then a pistol)
//   • a wrecked police jeep leaves its pistol, rounds and some cash
//   • when you are knocked out yourself, half the cash in your pocket and all your guns fall where you went down
//     (money in the bank is safe). Run back and pick them up before someone else does.
// Walk over a drop (or drive slowly over it) to pick it up. Online, every player nearby sees the same drops and the
// first one to reach it gets it (the server decides). Offline, the drops are only in your game. Drops last 10 minutes.
window.BBFeatures.push(function (bb) {
  const T = bb.THREE, P = () => bb.P, esc = bb.esc, O = () => bb.ONLINE;
  const TTL = 10 * 60 * 1000, ITEM = { pistol: 'Pistol', shotgun: 'Shotgun', smg: 'SMG', rifle: 'Rifle', bat: 'Cricket bat', lathi: 'Lathi', knife: 'Knife', armour: 'Body armour' };
  const online = () => O() && O().status === 'on';
  const drops = new Map(); // id -> { id, x, z, c, i, until, g, local }
  /* ---------- the look: a bundle of notes with a paper band, or a gun on the ground, with a soft glow ---------- */
  const tex = (w, h, f) => { const c = document.createElement('canvas'); c.width = w; c.height = h; f(c.getContext('2d'), w, h); const t = new T.CanvasTexture(c); t.anisotropy = 4; return t; };
  const noteTop = tex(256, 128, (x, w, h) => { x.fillStyle = '#d9dccf'; x.fillRect(0, 0, w, h); x.strokeStyle = '#7d8f78'; x.lineWidth = 6; x.strokeRect(6, 6, w - 12, h - 12);
    x.fillStyle = '#9fae98'; x.beginPath(); x.arc(w * .3, h / 2, 26, 0, 7); x.fill(); x.fillStyle = '#5d6b58'; x.font = '800 34px system-ui,sans-serif'; x.textAlign = 'center'; x.fillText('₹500', w * .72, h / 2 + 12);
    x.fillStyle = '#e9d7a8'; x.fillRect(w * .44, 0, w * .12, h); x.fillStyle = 'rgba(0,0,0,.15)'; x.fillRect(w * .44, 0, 2, h); x.fillRect(w * .56 - 2, 0, 2, h); });
  const noteSide = tex(256, 32, (x, w, h) => { for (let i = 0; i < h; i += 2) { x.fillStyle = i % 4 ? '#c8cdbd' : '#a9b3a1'; x.fillRect(0, i, w, 2); } x.fillStyle = '#e9d7a8'; x.fillRect(w * .44, 0, w * .12, h); });
  const mTop = new T.MeshLambertMaterial({ map: noteTop }), mSide = new T.MeshLambertMaterial({ map: noteSide }), mGun = new T.MeshLambertMaterial({ color: '#1f2024' }), mWood = new T.MeshLambertMaterial({ color: '#6b4a2e' }), mVest = new T.MeshLambertMaterial({ color: '#3d4a2f' });
  const glowG = new T.CircleGeometry(.9, 20); glowG.rotateX(-Math.PI / 2);
  const mGlowC = new T.MeshBasicMaterial({ color: 0x3ddc97, transparent: true, opacity: .35, depthWrite: false }), mGlowW = new T.MeshBasicMaterial({ color: 0xff5d73, transparent: true, opacity: .35, depthWrite: false });
  function bundle() { const g = new T.Mesh(new T.BoxGeometry(.62, .16, .3), [mSide, mSide, mTop, mSide, mSide, mSide]); g.castShadow = true; return g; }
  function gunModel(w) { const g = new T.Group();
    if (w === 'armour') { const v = new T.Mesh(new T.BoxGeometry(.55, .12, .45), mVest); g.add(v); return g; }
    if (w === 'bat' || w === 'lathi') { const b = new T.Mesh(new T.BoxGeometry(.08, .08, w === 'lathi' ? 1.5 : 1), w === 'lathi' ? mWood : new T.MeshLambertMaterial({ color: '#c99a5b' })); g.add(b); return g; }
    if (w === 'knife') { const b = new T.Mesh(new T.BoxGeometry(.05, .03, .32), new T.MeshLambertMaterial({ color: '#c9ced6' })); g.add(b); return g; }
    const long = w === 'shotgun' || w === 'rifle', L = long ? 1.1 : w === 'smg' ? .6 : .32; const b = new T.Mesh(new T.BoxGeometry(.09, .12, L), mGun); g.add(b);
    const grip = new T.Mesh(new T.BoxGeometry(.07, .18, .1), w === 'rifle' ? mWood : mGun); grip.position.set(0, -.08, -L * .25); grip.rotation.x = .4; g.add(grip); return g; }
  function label(text) { const t = tex(256, 64, (x, w, h) => { x.fillStyle = 'rgba(15,18,24,.78)'; x.beginPath(); x.roundRect ? x.roundRect(4, 8, w - 8, h - 16, 14) : x.rect(4, 8, w - 8, h - 16); x.fill(); x.fillStyle = '#fff'; x.font = '700 26px system-ui,sans-serif'; x.textAlign = 'center'; x.fillText(text, w / 2, 42, w - 24); });
    const s = new T.Sprite(new T.SpriteMaterial({ map: t, depthTest: false, transparent: true })); s.scale.set(1.6, .4, 1); s.renderOrder = 5; return s; }
  function build(d) { const g = new T.Group(); const hasW = d.i && d.i.length;
    const glow = new T.Mesh(glowG, hasW ? mGlowW : mGlowC); glow.position.y = .03; g.add(glow);
    const spin = new T.Group(); spin.position.y = .35; g.add(spin);
    if (d.c > 0) { const n = Math.min(4, 1 + Math.floor(Math.log10(Math.max(10, d.c)) - 1)); for (let k = 0; k < n; k++) { const b = bundle(); b.position.set((k % 2) * .12 - .06, k * .16, (k > 1 ? .08 : 0)); b.rotation.y = k * .5; spin.add(b); } }
    (d.i || []).forEach(([w], k) => { const m = gunModel(w); m.position.set(d.c > 0 ? .5 : 0, .05 + k * .15, k * .1); m.rotation.y = k; spin.add(m); });
    const what = [d.c > 0 ? bb.inr(d.c) : '', ...(d.i || []).map(([w, a]) => (ITEM[w] || w) + (a ? ' ·' + a : ''))].filter(Boolean).join(' + ');
    const lb = label(what); lb.position.y = 1.25; g.add(lb); g.userData.spin = spin; g.position.set(d.x, 0, d.z); bb.scene.add(g); return g; }
  function add(d, local) { if (drops.has(d.id)) return; const o = { id: d.id, x: d.x, z: d.z, c: d.c | 0, i: d.i || [], until: Date.now() + TTL - (d.a || 0), local }; o.g = build(o); drops.set(o.id, o); }
  function remove(id) { const o = drops.get(id); if (!o) return; bb.scene.remove(o.g); o.g.traverse(q => { if (q.geometry && q.geometry !== glowG) q.geometry.dispose(); if (q.material && q.material.map && q.isSprite) { q.material.map.dispose(); q.material.dispose(); } }); drops.delete(id); }
  /* ---------- dropping ---------- */
  let seq = 0;
  function drop(x, z, c, items) { c = Math.max(0, Math.round(c || 0)); items = (items || []).filter(q => q && ITEM[q[0]]); if (!c && !items.length) return;
    // a little spread so two drops do not sit on top of each other
    const a = Math.random() * 6.28, r = Math.random() * .8; x += Math.cos(a) * r; z += Math.sin(a) * r;
    if (online() && O().send({ t: 'loot', k: 'drop', x: +x.toFixed(2), z: +z.toFixed(2), c, i: items })) return;
    add({ id: 'L' + (++seq) + Date.now().toString(36), x, z, c, i: items }, true); }
  /* ---------- picking up ---------- */
  const asked = new Map();
  function give(c, items) { const p = P(); const got = []; if (c > 0) { p.cash += c; got.push(bb.inr(c)); }
    for (const [w, a] of items || []) { if (w === 'armour') { p.armour = Math.min(100, (p.armour || 0) + (a || 50)); got.push('body armour'); continue; }
      const Wp = bb.WEAP && bb.WEAP[w]; if (!Wp) continue; if (Wp.ammo && !bb.CFG.weapons) continue;
      if (!p.weapons.includes(w)) p.weapons.push(w); if (Wp.ammo) p.ammo[Wp.ammo] = (p.ammo[Wp.ammo] || 0) + (a || 0); got.push(ITEM[w] + (a ? ` and ${a} rounds` : '')); }
    if (!got.length) return; if (bb.updWeap) bb.updWeap(); bb.setDirty(); bb.toast(`💰 Picked up ${got.join(', ')}`, '#3ddc97'); if (bb.sfx && bb.sfx.coin) bb.sfx.coin(); bb.emit('lootPicked', { c, items }); }
  function take(o) { if (o.local) { remove(o.id); give(o.c, o.i); return; } const t = asked.get(o.id); if (t && Date.now() - t < 2500) return; asked.set(o.id, Date.now()); O().send({ t: 'loot', k: 'take', id: o.id }); }
  bb.on('loot', d => { if (!d) return;
    if (d.k === 'add') { if (d.all) for (const [id, o] of drops) if (!o.local && !d.L.some(q => q.id === id)) remove(id); for (const q of d.L || []) add(q, false); }
    else if (d.k === 'gone') remove(d.id);
    else if (d.k === 'got') { remove(d.id); give(d.c, d.i); } });
  /* ---------- what drops ---------- */
  const lootedAt = new WeakMap();
  bb.on('pedDown', p => { if (!p || bb.inside) return; const now = Date.now(); if (now - (lootedAt.get(p) || 0) < 5 * 60 * 1000) return; lootedAt.set(p, now);
    const pp = bb.ppos(); if (Math.hypot(p.x - pp.x, p.z - pp.z) > 120) return;
    const r = Math.random(); if (r < .3) return; // not everyone carries cash
    const cash = Math.round(bb.price(r > .95 ? bb.MR(1500, 5000) : bb.MR(40, 700)) / 10) * 10; const items = [];
    if (bb.CFG.weapons && Math.random() < .06) items.push(['pistol', 6 + Math.floor(Math.random() * 10)]); else if (Math.random() < .05) items.push([bb.mpick(['knife', 'lathi', 'bat']), 0]);
    setTimeout(() => drop(p.x + (p.ox || 0), p.z + (p.oz || 0), cash, items), 600); });
  // wrecked police jeeps
  setInterval(() => { if (!bb.started) return; for (const v of bb.vehicles) if (v.state === 'police' && v.dead && !v.looted) { v.looted = true; drop(v.pos.x + Math.sin(v.h + 1.6) * 2.4, v.pos.z + Math.cos(v.h + 1.6) * 2.4, bb.price(bb.MR(200, 900)), bb.CFG.weapons ? [['pistol', 12]] : []); } }, 700);
  // you go down: half your pocket cash and all your guns stay on the ground
  bb.on('ko', () => { const p = P(), pp = bb.ppos(); const pct = (bb.CFG.dropCashPct != null ? bb.CFG.dropCashPct : 50) / 100; const c = Math.floor(p.cash * pct);
    const items = []; for (const w of p.weapons.slice()) { const Wp = bb.WEAP && bb.WEAP[w]; if (!Wp || !Wp.ammo) continue; items.push([w, p.ammo[Wp.ammo] || 0]); p.ammo[Wp.ammo] = 0; p.weapons.splice(p.weapons.indexOf(w), 1); }
    if (bb.WEAP && !p.weapons.includes(p.weapon)) p.weapon = 'fist'; p.cash -= c; if (bb.updWeap) bb.updWeap(); bb.setDirty(); drop(pp.x, pp.z, c, items);
    if (c || items.length) setTimeout(() => bb.toast(`You dropped ${[c ? bb.inr(c) : '', items.length ? items.map(q => ITEM[q[0]]).join(', ') : ''].filter(Boolean).join(' and ')} where you went down · go back for it before someone else does`, '#ff9f1c'), 3200); });
  /* ---------- every frame: spin, expire, pick up; online, ask for the drops around you now and then ---------- */
  let listT = 0, wasOn = false;
  bb.onUpdate((dt, now) => { if (!bb.started) return; const t = Date.now(); const pp = bb.ppos(); const pl = bb.player;
    const on = online(); if (on && !wasOn) listT = 0; wasOn = on; if (on) { listT -= dt; if (listT <= 0) { listT = 8; O().send({ t: 'loot', k: 'list' }); } }
    for (const o of drops.values()) { if (t > o.until) { remove(o.id); continue; } const d = Math.hypot(pp.x - o.x, pp.z - o.z); o.g.visible = d < 400 && !bb.inside; if (!o.g.visible) continue;
      o.g.userData.spin.rotation.y += dt * 1.6;
      if (bb.inside || (bb.CINE && bb.CINE.on)) continue;
      const reach = pl.mode === 'drive' ? (pl.veh && pl.veh.spec.two ? 2 : 2.8) : 1.5; const slow = pl.mode !== 'drive' || (pl.veh && Math.abs(pl.veh.v) < 14);
      if (!o.armed) { if (d > 3) o.armed = true; continue; } // a drop at your own feet waits until you step away (so your own drop is not picked straight back up)
      if (d < reach && slow) take(o); } });
  bb.LOOT = { drop, get list() { return [...drops.values()]; }, add, remove, give };
});
