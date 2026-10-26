// Badshah story mode (Beta v2.03.00): the mission engine.
// Story mode is chosen on the start screen (👑 Badshah · story mode). It has its own save and is single player.
// Missions are data (js in features/badshah/missions-*.js, window.BADSHAH.missions): a list of steps that this engine
// runs one after another. Step types:
//   talk / call   lines of dialogue in a card at the bottom (Next or E)
//   goto          reach a place (an anchor of the home city, or x/z); optional vehicle, time limit or Bay-clock deadline
//   job           finish N runs of a job from the Jobs app          lic     get a licence (RTO test)
//   cash          have at least a sum (money gate)                  pay     hand over money at a place
//   give          rewards: cash, guns, licences, a vehicle, flags   unlock  the Underground app, fake plates, safehouses
//   buy / repair  buy a vehicle at a showroom / get it fixed        biz     open a business
//   fight         knock down a group of goons                      defend  protect sites from waves of goons
//   bout          a fist fight in rounds                            boss    chase a boss on foot, then fight in phases
//   stars         lose a wanted level (hide, change clothes…)       race    beat a rival driver to the finish
//   chase         stop a fleeing vehicle and take it               deliver drive somewhere while cars try to stop you
//   stealth       sneak past guards and photograph something       follow  an ally walks with you (escort)
//   checkpoint    a failed mission restarts from here
// Pacing: at most 3 story missions per real day (Indian date), and missions marked nextDay open the next day.
// In test play (Profile → Play mode) the day gates are off.
window.BBFeatures.push(function (bb) {
  if (!window.IB_STORY) return;
  const T = bb.THREE, W = bb.WORLD, esc = bb.esc, pl = bb.player, P = () => bb.P;
  const DATA = window.BADSHAH || { missions: [], acts: {} };
  const MIS = DATA.missions, BYID = {}; for (const m of MIS) BYID[m.id] = m;
  const S = () => { const x = P().extra = P().extra || {}; return x.bs = x.bs || { v: 1, home: null, done: {}, cur: null, day: { d: '', n: 0 }, flags: {}, izzat: 0, paid: 0, crew: [] }; };
  const today = () => bb.istISO();
  const gatesOff = () => !!bb.testMode;
  const DEBT = () => bb.cost('story.debt', 200000);
  const mult = () => (bb.CFG.storyCashMult || 1);
  const V3 = new T.Vector3();
  const toastS = (t, c) => bb.toast(t, c || '#ffc93c');
  /* ================= the home city and its story anchors ================= */
  let A = null; // anchors
  function seeded(s) { let h = 0; for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return () => (h = (h * 1103515245 + 12345) >>> 0) / 4294967296; }
  function homeZone() { const s = S(); if (s.home) { const z = W.zones.find(q => q.id === s.home); if (z) return z; } const pp = bb.ppos(); const z = bb.zoneAt(pp.x, pp.z, 300) || W.zones.find(q => q.id === 'mumbai'); s.home = z.id; bb.setDirty(); return z; }
  function anchors() { if (A && A.zone === S().home) return A; const z = homeZone(); const rnd = seeded(z.id); const cx = z.x0 + z.nx * 40, cz = z.z0 + z.nz * 40;
    const inZ = p => p.zone === z || (p.x > z.x0 - 20 && p.x < z.x0 + z.nx * 80 + 20 && p.z > z.z0 - 20 && p.z < z.z0 + z.nz * 80 + 20);
    const near = (type, x, z0, any) => { let b = null, bd = 1e12; for (const p of bb.pois) if (p.type === type && (any || inZ(p))) { const d = Math.hypot(p.x - x, p.z - z0); if (d < bd) { bd = d; b = p; } } return b; };
    const pt = (p, name) => p ? { x: p.x, z: p.z, name: name || p.name } : null;
    const used = []; const block = (fi, fj, name) => { for (let k = 0; k < 40; k++) { const i = Math.max(0, Math.min(z.nx - 1, Math.round(fi * (z.nx - 1) + (k ? (rnd() - .5) * 2 : 0)))), j = Math.max(0, Math.min(z.nz - 1, Math.round(fj * (z.nz - 1) + (k ? (rnd() - .5) * 2 : 0)))); const side = ['n', 's', 'e', 'w'][Math.floor(rnd() * 4)];
        const [x, zz] = bb.edgePos(z.x0 + i * 80 + 40, z.z0 + j * 80 + 40, side, (rnd() - .5) * 40, 29.5); if (bb.isWater(x, zz) || bb.pois.some(p => Math.abs(p.x - x) < 5 && Math.abs(p.z - zz) < 5) || used.some(u => Math.hypot(u.x - x, u.z - zz) < 30)) continue; V3.set(x, 0, zz); if (bb.collideTest(V3)) continue; const o = { x, z: zz, name }; used.push(o); return o; }
      return { x: cx + (rnd() - .5) * 60, z: cz + (rnd() - .5) * 60, name }; };
    const st = near('station', cx, cz) || near('bus', cx, cz) || near('station', cx, cz, true);
    const station = pt(st, st ? st.name : `${z.name} station`) || block(.5, .5, `${z.name} station`);
    const mech = bb.pois.filter(p => p.type === 'mechanic' && inZ(p)).sort((a, b) => Math.hypot(a.x - station.x, a.z - station.z) - Math.hypot(b.x - station.x, b.z - station.z));
    const garage = mech[0] ? { x: mech[0].x + 3, z: mech[0].z, name: "Master-ji's garage" } : block(.3, .3, "Master-ji's garage");
    const mk = near('food', cx, cz) || near('clothes', cx, cz); const market = mk ? { x: mk.x, z: mk.z, name: `${z.name} bazaar` } : block(.5, .5, `${z.name} bazaar`);
    const shops = bb.pois.filter(p => ['food', 'clothes', 'mobile', 'furniture'].includes(p.type) && inZ(p) && p !== mk).sort((a, b) => Math.hypot(a.x - market.x, a.z - market.z) - Math.hypot(b.x - market.x, b.z - market.z)).slice(0, 3).map(p => ({ x: p.x, z: p.z, name: p.name }));
    while (shops.length < 3) shops.push(block(.5 + shops.length * .1, .6, 'Shop'));
    const att = (bb.TOUR ? bb.TOUR.ATT() : []).map(a => ({ a, d: Math.hypot(a.x - cx, a.z - cz) })).sort((p, q) => p.d - q.d).slice(0, 3).map(q => ({ x: q.a.door ? q.a.door.x : q.a.x, z: q.a.door ? q.a.door.z : q.a.z, name: q.a.name }));
    const lm = [0, 1, 2].map(k => att[k] || block(.2 + k * .3, .8 - k * .3, ['Old clock tower', 'Lake garden', 'College gate'][k]));
    A = { zone: z.id, city: z.name, station, garage, market, shops, landmarkA: lm[0], landmarkB: lm[1], landmarkC: lm[2],
      rto: pt(near('rto', cx, cz, true)) || block(.8, .2, 'RTO office'), bank: pt(near('bank', cx, cz, true)) || block(.6, .4, 'Bank'), showroom: pt(near('cars', cx, cz, true)) || block(.7, .7, 'Car showroom'),
      mechanic: mech[1] ? { x: mech[1].x, z: mech[1].z, name: mech[1].name } : pt(near('mechanic', cx + 200, cz, true)) || garage,
      office: block(.85, .2, "Byaaj Bhai's office"), cafe: block(.55, .62, 'Cyber café'), akhada: block(.15, .85, 'Akhada (wrestling ground)'), warehouse: block(1, 1, "The Collector's warehouse"),
      rooftop: block(0, 1, 'Old mill rooftops'), chotu: block(.4, .15, "Chotu's room"), printing: block(.25, .55, 'Printing gali'), bizsite: block(.6, .5, 'Your business'), safehouse: block(.1, .1, 'Safehouse'), highway: (() => { const r = bb.nearestRoadPoint(z.x0 - 120, cz, 400); return r ? { x: r.x, z: r.z, name: 'Highway outside town' } : block(0, .5, 'Highway'); })() };
    return A; }
  const at = a => typeof a === 'string' ? (a.includes('.') ? anchors()[a.split('.')[0]][+a.split('.')[1]] : anchors()[a]) : Array.isArray(a) ? { x: a[0], z: a[1], name: a[2] || '' } : a;
  const fill = t => String(t || '').replace(/\{(\w+)\}/g, (m, k) => k === 'city' ? anchors().city : k === 'debt' ? bb.inr(DEBT()) : k === 'paid' ? bb.inr(S().paid || 0) : k === 'left' ? bb.inr(Math.max(0, DEBT() - (S().paid || 0))) : anchors()[k] ? anchors()[k].name : m);
  /* ================= dialogue card ================= */
  const card = document.createElement('div'); card.id = 'bsCard'; card.hidden = true;
  card.style.cssText = 'position:fixed;left:50%;bottom:118px;transform:translateX(-50%);width:min(520px,calc(100vw - 32px));z-index:61;background:rgba(14,16,22,.95);color:#f4f1ea;border:1px solid rgba(242,193,78,.7);border-radius:14px;padding:12px 14px;font:14.5px/1.45 system-ui,sans-serif;box-shadow:0 8px 30px rgba(0,0,0,.45)';
  document.body.appendChild(card);
  const WHO = { you: ['You', '#9fd0ff'], master: ['Master-ji', '#f2c14e'], byaaj: ['Byaaj Bhai', '#ff9f1c'], rani: ['Rani', '#ff6fa8'], chotu: ['Chotu', '#7fd858'], pehelwan: ['Pehelwan', '#e8573e'], babu: ['Babu', '#c9a0ff'], meera: ['Inspector Meera Joshi', '#5fb4ff'], collector: ['The Collector', '#ff5d73'], vikram: ['Vikram (voice note)', '#d6c8e4'], goon: ['Goon', '#ff8b8b'], narrator: ['', '#d6c8e4'], shop: ['Shopkeeper', '#f4f1ea'] };
  let talk = null;
  function showTalk() { if (!talk) { card.hidden = true; return; } const [w, text] = talk.lines[talk.i]; const [nm, col] = WHO[w] || [w, '#fff'];
    card.innerHTML = `${talk.phone ? '<div style="font-size:12px;opacity:.7">📞 Phone call</div>' : ''}${nm ? `<div style="font-weight:800;color:${col};margin-bottom:2px">${esc(nm)}</div>` : ''}<div${w === 'narrator' ? ' style="font-style:italic;opacity:.9"' : ''}>${esc(fill(text))}</div><div style="display:flex;justify-content:flex-end;gap:8px;margin-top:8px"><button data-k="skip" style="background:transparent;color:#aaa;border:0">Skip</button><button data-k="next" style="background:#f2c14e;color:#1b1b1f;border:0;border-radius:9px;padding:5px 14px;font-weight:800">${talk.i < talk.lines.length - 1 ? 'Next ▸' : 'OK'}</button></div>`; card.hidden = false; }
  function say(lines, phone, done) { talk = { lines, i: 0, phone, done }; showTalk(); }
  function nextLine(all) { if (!talk) return; if (all) talk.i = talk.lines.length; else talk.i++; if (talk.i >= talk.lines.length) { const d = talk.done; talk = null; card.hidden = true; d && d(); } else showTalk(); }
  card.addEventListener('click', e => { const k = e.target.dataset && e.target.dataset.k; if (!k) return; e.stopPropagation(); nextLine(k === 'skip'); });
  addEventListener('keydown', e => { if (talk && (e.code === 'Enter' || e.code === 'KeyE')) { e.stopPropagation(); e.preventDefault(); nextLine(false); } }, true);
  /* ================= people: goons, bosses and allies ================= */
  const NPC = []; const LM = c => bb.LMat(c);
  const GOONC = ['#3a2a1c', '#5c2a2a', '#2d3142', '#4a4a4a', '#6b3a1e', '#1f3a2a'];
  function label(text, col) { const c = document.createElement('canvas'); c.width = 256; c.height = 64; const x = c.getContext('2d'); x.fillStyle = 'rgba(15,18,24,.8)'; x.fillRect(8, 10, 240, 44); x.fillStyle = col || '#fff'; x.font = '800 26px system-ui,sans-serif'; x.textAlign = 'center'; x.fillText(text, 128, 42, 228); const t = new T.CanvasTexture(c); const s = new T.Sprite(new T.SpriteMaterial({ map: t, depthTest: false })); s.scale.set(1.8, .45, 1); s.renderOrder = 6; return s; }
  function hpBar() { const c = document.createElement('canvas'); c.width = 128; c.height = 16; const t = new T.CanvasTexture(c); const s = new T.Sprite(new T.SpriteMaterial({ map: t, depthTest: false })); s.scale.set(1.3, .16, 1); s.renderOrder = 6; s.userData = { c, t }; return s; }
  function drawBar(n) { const b = n.bar; if (!b) return; const x = b.userData.c.getContext('2d'); x.clearRect(0, 0, 128, 16); x.fillStyle = 'rgba(0,0,0,.7)'; x.fillRect(0, 0, 128, 16); x.fillStyle = n.ally ? '#3ddc97' : '#ff5d73'; x.fillRect(2, 2, 124 * Math.max(0, n.hp / n.max), 12); b.userData.t.needsUpdate = true; }
  function spawn(o) { const g = bb.buildPerson(o.col || bb.mpick(GOONC), { female: !!o.female }); g.position.set(o.x, 0, o.z); bb.scene.add(g);
    const w = o.weapon || 'fist'; const U = g.userData; if (U.arms && w !== 'fist') { const m = new T.Mesh(new T.BoxGeometry(w === 'bat' || w === 'lathi' ? .07 : .08, w === 'pistol' ? .14 : .07, w === 'bat' ? .9 : w === 'lathi' ? 1.3 : w === 'knife' ? .3 : .35), LM(w === 'bat' ? '#c99a5b' : w === 'lathi' ? '#7a5232' : w === 'knife' ? '#c9ced6' : '#1b1b1f')); m.position.set(0, -.55, .25); U.arms[1].add(m); }
    const n = Object.assign({ g, x: o.x, z: o.z, h: 0, hp: o.hp || 3, max: o.hp || 3, weapon: w, state: 'go', atkT: 1 + Math.random(), speed: o.speed || 3.1, dmg: o.dmg || 6, site: null }, o); n.g = g;
    if (o.name) { const lb = label(o.name, o.ally ? '#7fd858' : o.boss ? '#ff5d73' : '#fff'); lb.position.y = 2.35; g.add(lb); }
    if (o.boss || o.ally || o.bar) { n.bar = hpBar(); n.bar.position.y = 2.05; g.add(n.bar); drawBar(n); }
    NPC.push(n); return n; }
  function knock(n) { if (n.state === 'down') return; n.state = 'down'; n.hp = 0; n.g.rotation.x = -Math.PI / 2; n.g.position.y = .25; drawBar(n); if (!n.ally && !n.boss && Math.random() < .3 && bb.LOOT) bb.LOOT.drop(n.x, n.z, bb.price(Math.round(100 + Math.random() * 300)), []); }
  function clearNPC() { for (const n of NPC) bb.scene.remove(n.g); NPC.length = 0; }
  const foes = () => NPC.filter(n => !n.ally && n.state !== 'down');
  // player attacks: fists, sticks and guns hit story enemies first (and, for a chase, the fleeing vehicle)
  const HIT = { pistol: 2, shotgun: 3, smg: 1, rifle: 5 };
  const angD = (a, b) => Math.abs(((a - b) % 6.2832 + 9.4248) % 6.2832 - 3.1416);
  bb.onFire(() => { if (!run || pl.mode !== 'foot' || pl.fireCd > 0 || bb.inside) return false; const p = P(); const Wp = bb.WEAP[p.weapon] || bb.WEAP.fist; const ox = pl.pos.x, oz = pl.pos.z;
    const cone = Wp.melee ? 1.1 : .35; let best = null, bd = 1e9;
    for (const n of NPC) { if (n.ally || n.state === 'down') continue; const dx = n.x - ox, dz = n.z - oz, d = Math.hypot(dx, dz); if (d > Wp.range + (Wp.melee ? .4 : 0)) continue; const da = angD(Math.atan2(dx, dz), pl.h); if (da < cone && d < bd) { bd = d; best = n; } }
    let veh = null; if (!best && !Wp.melee && chaseV && !chaseV.dead) { const dx = chaseV.pos.x - ox, dz = chaseV.pos.z - oz, d = Math.hypot(dx, dz); if (d < Wp.range + 4 && angD(Math.atan2(dx, dz), pl.h) < .4) veh = chaseV; }
    if (!best && !veh) return false;
    if (Wp.ammo) { if (!(p.ammo[Wp.ammo] > 0)) return false; p.ammo[Wp.ammo]--; bb.updWeap(); }
    pl.fireCd = Wp.rate; pl.anim = .25; pl.h = Math.atan2((best || veh.pos).x - ox, (best || veh.pos).z - oz);
    if (Wp.melee) { bb.sfxPunch && bb.sfxPunch(); pl.lastPunch = performance.now(); pl.punchSide = 1 - (pl.punchSide | 0); }
    else { bb.sfxShot && bb.sfxShot(1); bb.tracer && bb.tracer(ox + Math.sin(pl.h) * .6, 1.35, oz + Math.cos(pl.h) * .6, (best || veh.pos).x, 1.1, (best || veh.pos).z); }
    if (best) { if (cur && cur.m.meleeOnly && !Wp.melee) { bb.toast('Fists only in this fight', '#ff9f1c'); return true; } best.hp -= Wp.melee ? (Wp.hit || 1) * (S().flags.pehelwan ? 1.1 : 1) : HIT[p.weapon] || 2; best.hitT = .25; const dx = best.x - ox, dz = best.z - oz, d = Math.hypot(dx, dz) || 1; best.x += dx / d * .5; best.z += dz / d * .5; drawBar(best); if (best.hp <= 0) { if (best.onDown) best.onDown(best); else knock(best); } }
    else { veh.hp -= (HIT[p.weapon] || 2) * 6; }
    return true; });
  function updNPC(dt, now) { const pp = bb.ppos(); const driving = pl.mode === 'drive' && pl.veh;
    for (const n of NPC) { if (n.state === 'down' || n.stealthy) continue; const U = n.g.userData;
      if (driving && Math.abs(pl.veh.v) > 5 && !n.ally && Math.hypot(n.x - pl.veh.pos.x, n.z - pl.veh.pos.z) < pl.veh.spec.wid / 2 + .9) { n.hp = 0; if (n.onDown) n.onDown(n); else knock(n); continue; }
      // where to go: the player, an enemy (allies), a site (defend), or away (a fleeing boss)
      let tx = pp.x, tz = pp.z, reach = n.weapon === 'pistol' ? 12 : 1.5, flee = false;
      if (n.ally) { const f = foes().sort((a, b) => Math.hypot(a.x - n.x, a.z - n.z) - Math.hypot(b.x - n.x, b.z - n.z))[0]; if (f && Math.hypot(f.x - n.x, f.z - n.z) < 40) { tx = f.x; tz = f.z; reach = 1.4; n.foe = f; } else { n.foe = null; reach = 3; } }
      else if (n.site && Math.hypot(pp.x - n.x, pp.z - n.z) > 7) { tx = n.site.x; tz = n.site.z; reach = 2.5; }
      else if (n.flee && n.flee.length && Math.hypot(pp.x - n.x, pp.z - n.z) < 3) { n.flee.length = 0; toastS(`${n.name || 'He'} is cornered!`, '#ff5d73'); }
      else if (n.flee && n.flee.length) { const q = n.flee[0]; tx = q.x; tz = q.z; reach = 1.5; flee = true; if (Math.hypot(q.x - n.x, q.z - n.z) < 2.5) n.flee.shift(); }
      if (pl.hidden && !n.ally && !n.site) { tx = n.x; tz = n.z; }
      const dx = tx - n.x, dz = tz - n.z, d = Math.hypot(dx, dz); let moving = false;
      if (d > reach) { const sp = (flee ? n.fleeSpeed || 4.2 : n.speed) * dt; const nx = n.x + dx / d * sp, nz = n.z + dz / d * sp; const ox = n.x, oz = n.z; V3.set(nx, 0, nz); if (!bb.collideTest(V3)) { n.x = nx; n.z = nz; } else { V3.set(nx, 0, n.z); if (!bb.collideTest(V3)) n.x = nx; else { V3.set(n.x, 0, nz); if (!bb.collideTest(V3)) n.z = nz; } }
        // stuck against a wall for a moment: slip past it (people squeeze round corners)
        if (Math.hypot(n.x - ox, n.z - oz) < sp * .3) { n.stuckT = (n.stuckT || 0) + dt; if (n.stuckT > .8) { n.x = nx; n.z = nz; } } else n.stuckT = 0; n.h = Math.atan2(dx, dz); moving = true; }
      else if (!flee) { n.h = Math.atan2(dx, dz); n.atkT -= dt; if (n.atkT <= 0) { n.atkT = n.weapon === 'pistol' ? 1.6 : n.weapon === 'smg' ? .6 : 1.1;
          if (n.ally) { if (n.foe) { n.foe.hp -= 1; drawBar(n.foe); if (n.foe.hp <= 0) { if (n.foe.onDown) n.foe.onDown(n.foe); else knock(n.foe); } } }
          else if (n.site && Math.hypot(pp.x - n.x, pp.z - n.z) > 7) { n.site.hp = Math.max(0, n.site.hp - n.siteDmg); }
          else if (!driving && !pl.hidden) { if (n.weapon === 'pistol' || n.weapon === 'smg') { bb.tracer && bb.tracer(n.x, 1.4, n.z, pp.x + (Math.random() - .5), 1.2, pp.z + (Math.random() - .5), 0xffb0a0); bb.sfxShot && bb.sfxShot(.4); if (Math.random() < .55) bb.damage(n.dmg * .6, 'Shot by a goon'); } else { bb.sfxPunch && bb.sfxPunch(); bb.damage(n.dmg * (n.weapon === 'fist' ? 1 : 1.5), 'Beaten up'); } } } }
      n.g.position.set(n.x, 0, n.z); n.g.rotation.y = n.h; if (U.legs) { const s = moving ? Math.sin(now * (flee ? 11 : 8) + n.x) * .55 : 0; U.legs[0].rotation.x = s; U.legs[1].rotation.x = -s; }
      if (U.arms && !moving && n.atkT < .3) U.arms[1].rotation.x = -1.4; else if (U.arms) U.arms[1].rotation.x = 0; } }
  /* ================= vehicles: rivals, pursuers, a vehicle to stop ================= */
  let chaseV = null; const NV = [];
  function route(a, b) { const R = bb.findRoute(a.x, a.z, b.x, b.z); const pts = R ? [[a.x, a.z]].concat(R, [[b.x, b.z]]) : [[a.x, a.z], [b.x, b.z]]; let L = 0; const cum = [0]; for (let i = 1; i < pts.length; i++) { L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); cum.push(L); } return { pts, cum, L }; }
  function along(r, s) { s = Math.max(0, Math.min(r.L, s)); let i = 1; while (i < r.cum.length - 1 && r.cum[i] < s) i++; const a = r.pts[i - 1], b = r.pts[i], u = (s - r.cum[i - 1]) / ((r.cum[i] - r.cum[i - 1]) || 1); return { x: a[0] + (b[0] - a[0]) * u, z: a[1] + (b[1] - a[1]) * u, h: Math.atan2(b[0] - a[0], b[1] - a[1]) }; }
  function npcVeh(type, x, z, h) { const v = bb.makeVeh(type, x, z, h, 'svc', { fuel: 100 }); v.noEnter = true; NV.push(v); return v; }
  function clearNV() { for (const v of NV) if (bb.player.veh !== v) bb.removeVeh(v); NV.length = 0; chaseV = null; }
  function driveAlong(v, r, dt) { v.s = Math.min(r.L, (v.s || 0) + v.v * dt); const p = along(r, v.s); const ahead = along(r, v.s + 4); v.pos.x = p.x + Math.cos(p.h) * (v.lane || 0); v.pos.z = p.z - Math.sin(p.h) * (v.lane || 0); v.h = Math.atan2(ahead.x - p.x, ahead.z - p.z) || v.h; v.m.rotation.y = v.h; for (const w of v.m.userData.wheels || []) w.rotation.x += v.v * dt / .4; }
  /* ================= the mission runner ================= */
  let run = null, cur = null; // cur = { m, i, st (step state) }
  const stepOf = () => cur && cur.m.steps[cur.i];
  function begin(m) { if (cur) { const st0 = stepOf(); if (st0 && STEP[st0.type] && STEP[st0.type].end) STEP[st0.type].end(st0, cur.st); } clearNPC(); clearNV(); talk = null; card.hidden = true; const s = S(); s.cur = { id: m.id, i: 0, ck: 0 }; bb.setDirty(); cur = { m, i: 0, st: {} }; run = true; bb.big && bb.big(m.title.toUpperCase(), '#f2c14e'); toastS(`👑 ${m.id} · ${m.title}`, '#f2c14e'); bb.emit('storyStart', m.id); enter(); }
  function enter() { const st = stepOf(); if (!st) return complete(); cur.st = { t0: performance.now(), n: 0 }; const fn = STEP[st.type]; if (!fn) { console.warn('story: unknown step', st.type); return next(); } (fn.start || (() => {}))(st, cur.st); }
  function next() { if (!cur) return; const st = stepOf(); if (st && STEP[st.type] && STEP[st.type].end) STEP[st.type].end(st, cur.st); cur.i++; S().cur.i = cur.i; bb.setDirty(); enter(); }
  function checkpoint() { S().cur.ck = cur.i + 1; bb.save(); }
  function fail(why) { if (!cur) return; const m = cur.m; const st = stepOf(); if (st && STEP[st.type] && STEP[st.type].end) STEP[st.type].end(st, cur.st); talk = null; card.hidden = true; clearNPC(); clearNV(); run = false; const ck = S().cur.ck || 0; cur = null;
    bb.big && bb.big('MISSION FAILED', '#ff5d73'); setTimeout(() => bb.openSheet('👑 Mission failed', esc(why || ''), bb.rowHtml('retry', `Try again from the ${ck ? 'checkpoint' : 'start'}`, 'Free · nothing is lost', 'Retry') + bb.rowHtml('later', 'Later', 'Do some jobs or explore first', 'Later', 'ghost'),
      s => s.onclick = e => { const id = e.target.dataset.id; if (id === 'retry') { bb.closeSheet(); cur = { m, i: ck, st: {} }; S().cur = { id: m.id, i: ck, ck }; run = true; enter(); } else if (id === 'later') { S().cur = null; bb.setDirty(); bb.closeSheet(); } }), 1800); }
  function complete() { const m = cur.m, s = S(); clearNPC(); clearNV(); run = false; cur = null; s.done[m.id] = today(); s.cur = null; s.day = s.day.d === today() ? { d: today(), n: s.day.n + 1 } : { d: today(), n: 1 };
    const r = m.reward || {}; if (r.izzat) s.izzat = (s.izzat || 0) + r.izzat; let cash = 0; if (r.cash) { cash = Math.round(bb.price(r.cash) * mult()); P().cash += cash; }
    bb.save(); bb.big && bb.big('MISSION PASSED', '#3ddc97'); bb.emit('storyDone', m.id);
    setTimeout(() => { const nx = nextMission(); bb.openSheet(`👑 ${esc(m.title)} · passed`, `${m.id}${cash ? ' · +' + bb.inr(cash) : ''}${r.izzat ? ' · Izzat +' + r.izzat : ''}`, (r.note ? `<p class="note">${esc(fill(r.note))}</p>` : '') + (nx ? bb.rowHtml('x', `Next: ${esc(nx.m.title)}`, nx.ok ? 'Ready now · go to the 👑 marker' : esc(nx.why), '', 'ghost') : bb.rowHtml('x', 'That is all for now', 'More of the story is coming in the next update', '', 'ghost')), () => {}); }, 2200); }
  bb.on('ko', () => { if (run && !(cur && cur.m.koOk)) setTimeout(() => fail('You were knocked out'), 400); });
  bb.on('bust', () => { if (run) setTimeout(() => fail('You were busted'), 400); });
  /* ================= which mission is next, and can it be played now ================= */
  function nextMission() { const s = S(); for (const m of MIS) { if (s.done[m.id]) continue; if (m.after && !m.after.every(a => s.done[a])) continue; return { m, ...canPlay(m) }; } return null; }
  function canPlay(m) { const s = S(); if (gatesOff()) return { ok: true };
    const n = s.day.d === today() ? s.day.n : 0; if (n >= 3) return { ok: false, why: 'Daily limit reached (3 story missions a day) · back tomorrow, or do jobs and explore' };
    if (m.nextDay) { const prev = MIS[MIS.indexOf(m) - 1]; if (prev && s.done[prev.id] && s.done[prev.id] >= today()) return { ok: false, why: m.gateText || 'Opens tomorrow · your informant calls in the morning' }; }
    return { ok: true }; }
  /* ================= HUD: objective and marker ================= */
  bb.addMission(() => { if (talk) return null; const pp = bb.ppos();
    if (cur) { const st = stepOf(); if (!st) return null; const fn = STEP[st.type]; const h = fn && fn.hud ? fn.hud(st, cur.st) : null; if (!h) return null; const tg = h.target;
      return { pri: st.type === 'job' ? 40 : 95, cls: 'story', k: `👑 ${cur.m.title}${h.k ? ' · ' + h.k : ''}`, t: fill(h.t), m: (tg ? `${Math.round(Math.hypot(pp.x - tg.x, pp.z - tg.z) * 2.4 / 10) * 10} m · ` : '') + fill(h.m || ''), target: tg ? { x: tg.x, z: tg.z, col: tg.col || 0xf2c14e } : null }; }
    const nx = nextMission(); if (!nx) return null; const at0 = at(nx.m.start || 'garage'); if (!nx.ok) return { pri: 15, k: `👑 Badshah · ${nx.m.id}`, t: nx.m.title, m: nx.why };
    return { pri: 30, k: `👑 Badshah · ${nx.m.id}`, t: nx.m.title, m: `Go to the 👑 marker · ${at0.name}`, target: { x: at0.x, z: at0.z, col: 0xf2c14e } }; });
  // the start marker: walk or drive into it
  bb.onUpdate((dt, now) => { if (!bb.started) return; if (!run) { const nx = nextMission(); if (nx && nx.ok && !(bb.CINE && bb.CINE.on) && !bb.inside) { const a0 = at(nx.m.start || 'garage'); const pp = bb.ppos(); if (Math.hypot(pp.x - a0.x, pp.z - a0.z) < 6) begin(nx.m); } } else { updNPC(dt, now); const st = stepOf(); if (st && STEP[st.type] && STEP[st.type].update) STEP[st.type].update(st, cur.st, dt, now); } });
  /* ================= step types ================= */
  const reach = (p, r) => { const pp = bb.ppos(); return Math.hypot(pp.x - p.x, pp.z - p.z) < (r || 7); };
  const inVeh = types => pl.mode === 'drive' && pl.veh && (!types || types.includes(pl.veh.type));
  const fmt = s => { s = Math.max(0, Math.ceil(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
  // a Bay-clock deadline: it passes when the clock goes from before the hour to after it (started late = the next day's hour)
  const pastHour = (st, s) => { if (bb.clock < st.byHour) { s.before = true; return false; } return !!s.before; };
  const camt = st => st.amt === 'debtLeft' ? Math.max(0, DEBT() - (S().paid || 0)) : st.amt;
  const STEP = {
    talk: { start: (st) => say(st.lines, false, () => next()), hud: () => null },
    call: { start: (st) => { bb.hornSfx && 0; say(st.lines, true, () => next()); }, hud: () => null },
    checkpoint: { start: () => { checkpoint(); next(); } },
    give: { start: (st) => { const p = P(); const g = st; const out = [];
        if (g.cash) { const c = Math.round(bb.price(g.cash) * mult()); p.cash += c; out.push(bb.inr(c)); }
        for (const w of g.weapons || []) { if (!p.weapons.includes(w)) p.weapons.push(w); const Wp = bb.WEAP[w]; if (Wp && Wp.ammo) p.ammo[Wp.ammo] = (p.ammo[Wp.ammo] || 0) + 24; out.push(Wp ? Wp.name : w); }
        for (const l of g.lic || []) { p.lic[l] = true; out.push({ two: 'Two-wheeler licence', three: 'Auto licence', lmv: 'Car licence', heavy: 'Heavy licence' }[l]); }
        if (g.veh) { p.cars.push({ type: g.veh, fuel: 100, hp: 100, puc: 0, ins: 0 }); const i = p.cars.length - 1; const [x, z, h] = (bb.freeRoadSpot || bb.roadSpotNear)(bb.ppos()); bb.spawnOwned(i, x, z, h); out.push('a ' + bb.SPEC[g.veh].label.toLowerCase()); }
        for (const f of g.flags || []) S().flags[f] = true; for (const c of g.crew || []) { if (!S().crew.includes(c)) S().crew.push(c); out.push((WHO[c] || [c])[0] + ' joins your crew'); }
        if (g.izzat) S().izzat = (S().izzat || 0) + g.izzat;
        if (out.length) toastS('🎁 ' + out.join(' · '), '#3ddc97'); bb.updWeap && bb.updWeap(); bb.setDirty(); bb.save(); next(); } },
    unlock: { start: (st) => { if (st.what === 'underground' && bb.HIDE) bb.HIDE.unlock('story'); S().flags[st.what] = true; bb.setDirty(); next(); } },
    goto: { start: (st, s) => { s.p = at(st.at); if (st.time) s.left = st.time * (cur.m.slack || 1.5); },
      update: (st, s, dt) => { if (s.left != null) { s.left -= dt; if (s.left <= 0) return st.late ? (cur.i = cur.m.steps.findIndex(q => q.label === st.late), enter()) : fail('Too late'); }
        if (st.byHour != null && pastHour(st, s) && !s.lateDone) { s.lateDone = true; if (st.late) { cur.i = cur.m.steps.findIndex(q => q.label === st.late); return enter(); } }
        if (st.veh && !inVeh(st.veh)) return; if (reach(s.p, st.r || 7) && (!st.slow || !pl.veh || Math.abs(pl.veh.v) < 4)) next(); },
      hud: (st, s) => ({ t: st.text || `Go to ${s.p.name}`, m: (s.left != null ? fmt(s.left) + ' left · ' : '') + (st.byHour != null ? `by ${st.byHour}:00 Bay time · ` : '') + (st.veh && !inVeh(st.veh) ? 'needs ' + st.veh.map(v => bb.SPEC[v] ? bb.SPEC[v].label : v).join(' or ') + ' · ' : '') + (st.sub || ''), target: s.p }) },
    job: { start: (st, s) => { s.n = 0; s.off = bb.on('job', j => { if (cur && cur.st === s && (st.jobs || [st.job]).includes(j.type)) { s.n++; toastS(`👑 ${s.n} of ${st.n} done`, '#3ddc97'); if (s.n >= st.n) next(); } }); },
      hud: (st, s) => ({ k: `${s.n}/${st.n}`, t: st.text, m: st.sub || 'Phone → Jobs' }) },
    lic: { update: (st) => { if (P().lic[st.k]) next(); }, hud: (st) => ({ t: st.text, m: 'Pass the test at the RTO office', target: at('rto') }) },
    cash: { update: (st) => { const p = P(); if (p.cash + p.bank >= camt(st)) next(); }, hud: (st) => ({ t: st.text, m: `${bb.inr(P().cash + P().bank)} of ${bb.inr(camt(st))} · do jobs to earn it`, k: 'money' }) },
    end: { start: () => complete() },
    pay: { start: (st, s) => { s.p = at(st.at); s.amt = st.amt === 'debt' ? Math.max(0, DEBT() - (S().paid || 0)) : st.amt; },
      update: (st, s) => { if (st.byHour != null && pastHour(st, s) && st.late && !s.lt) { s.lt = 1; cur.i = cur.m.steps.findIndex(q => q.label === st.late); return enter(); }
        if (!reach(s.p, 6)) return; if (P().cash < s.amt) { if (!s.told) { s.told = 1; toastS(`You need ${bb.inr(s.amt)} in cash · withdraw it at a bank or ATM`, '#ff9f1c'); } return; }
        P().cash -= s.amt; if (st.debt) S().paid = (S().paid || 0) + s.amt; bb.setDirty(); toastS(`Paid ${bb.inr(s.amt)}`, '#ffc93c'); next(); },
      hud: (st, s) => ({ t: st.text || `Hand over ${bb.inr(s.amt)} at ${s.p.name}`, m: `${st.byHour != null ? `by ${st.byHour}:00 Bay time · ` : ''}cash in hand ${bb.inr(P().cash)}`, target: s.p }) },
    buy: { start: (st, s) => { s.off = bb.on('buy', b => { if (cur && cur.st === s && b.kind === 'vehicle' && (!st.types || st.types.includes(b.type))) { s.ok = true; } }); }, update: (st, s) => { if (s.ok) { const v = bb.ownedVeh.filter(Boolean).pop(); if (v && st.dent) { v.hp = st.dent; const c = P().cars[v.ownedIdx]; if (c) c.hp = st.dent; } next(); } },
      hud: (st) => ({ t: st.text, m: 'Car showroom', target: at('showroom') }) },
    repair: { update: (st) => { if (P().cars.some(c => ['car', 'sedan', 'suv', 'mpv', 'taxi'].includes(c.type) && c.hp >= 99)) next(); }, hud: (st) => ({ t: st.text, m: 'Drive it to the mechanic and ask for a repair', target: at('mechanic') }) },
    biz: { start: (st, s) => { s.n0 = (P().biz || []).length; }, update: (st, s) => { if ((P().biz || []).length > s.n0) next(); }, hud: (st) => ({ t: st.text, m: 'Phone → Business · stand where you want it and open it', target: at('bizsite') }) },
    cashpay: { start: (st, s) => { s.amt = st.amt; }, update: (st, s) => { if (P().cash + P().bank >= s.amt && bb.spend(s.amt, true)) { toastS(`Paid ${bb.inr(s.amt)} · ${st.what || ''}`, '#ffc93c'); next(); } }, hud: (st, s) => ({ t: st.text, m: `${bb.inr(P().cash + P().bank)} of ${bb.inr(s.amt)}` }) },
    fight: { start: (st, s) => { const c = at(st.at); s.c = c; s.n = 0; const n = st.n; for (let k = 0; k < n; k++) { const a = k / n * 6.28, r = (st.r || 9) + Math.random() * 4; spawn({ x: c.x + Math.cos(a) * r, z: c.z + Math.sin(a) * r, weapon: Array.isArray(st.weapon) ? st.weapon[k % st.weapon.length] : st.weapon || 'fist', hp: st.hp || 3, dmg: st.dmg || 5 }); }
        for (const al of st.allies || []) spawn({ x: c.x + 3, z: c.z + 3, ally: true, name: (WHO[al] || [al])[0], col: al === 'pehelwan' ? '#e8573e' : '#ff6fa8', hp: 99, speed: 3.6 }); },
      update: (st, s) => { if (!foes().length) { for (const n of NPC.filter(q => q.ally)) bb.scene.remove(n.g); NPC.splice(0, NPC.length, ...NPC.filter(q => !q.ally)); next(); } },
      hud: (st, s) => ({ k: `${foes().length} left`, t: st.text || 'Beat them', m: st.sub || 'Fists: click / F · guns: aim and shoot', target: foes()[0] ? { x: foes()[0].x, z: foes()[0].z, col: 0xff5d73 } : s.c }) },
    defend: { start: (st, s) => { s.sites = (st.sites || [st.at]).map(k => Object.assign({}, at(k), { hp: 100 })); s.wave = 0; s.cd = 2; s.cur = 0; s.allyHeld = st.allyHeld;
        for (const al of st.allies || []) { const c = s.sites[0]; spawn({ x: c.x + 2, z: c.z + 2, ally: true, name: (WHO[al] || [al])[0], col: '#e8573e', hp: 99, speed: 3.6 }); } },
      update: (st, s, dt) => { const site = s.sites[st.sequential ? s.cur : 0]; if (s.sites.some(q => q.hp <= 0)) return fail(`${s.sites.find(q => q.hp <= 0).name} was wrecked`);
        if (s.allyHeld) for (let k = 1; k < s.sites.length; k++) s.sites[k].hp = Math.max(25, s.sites[k].hp - dt * .6);
        if (!foes().length) { s.cd -= dt; if (s.cd > 0) return; if (s.wave >= st.waves) { if (st.sequential && s.cur < s.sites.length - 1) { s.cur++; s.wave = 0; s.cd = 3; toastS(`Next: ${s.sites[s.cur].name}`, '#ffc93c'); return; } return next(); }
          s.wave++; s.cd = 3; toastS(`Wave ${s.wave} of ${st.waves}`, '#ff9f1c'); const c = st.sequential ? s.sites[s.cur] : site; for (let k = 0; k < st.n; k++) { const a = Math.random() * 6.28, r = 26 + Math.random() * 10; const n = spawn({ x: c.x + Math.cos(a) * r, z: c.z + Math.sin(a) * r, weapon: Array.isArray(st.weapon) ? bb.mpick(st.weapon) : st.weapon || 'bat', hp: st.hp || 3, dmg: st.dmg || 5 }); n.site = c; n.siteDmg = st.siteDmg || 3; } } },
      hud: (st, s) => { const c = s.sites[st.sequential ? s.cur : 0]; return { k: `wave ${s.wave}/${st.waves}`, t: st.text || `Defend ${c.name}`, m: s.sites.map(q => `${q.name.split(',')[0]} ${Math.round(q.hp)}%`).join(' · '), target: foes()[0] ? { x: foes()[0].x, z: foes()[0].z, col: 0xff5d73 } : c }; } },
    bout: { start: (st, s) => { s.round = 0; s.won = 0; s.lost = 0; P().weapon = 'fist'; bb.updWeap(); roundStart(st, s); },
      update: (st, s) => { if (!s.boss) return; if (P().health < s.h0 - 40 || P().health < 15) { s.lost++; toastS(`${st.name} wins round ${s.round}`, '#ff5d73'); P().health = Math.max(P().health, 60); endRound(st, s); } else if (s.boss.state === 'down') { s.won++; toastS(`You win round ${s.round}!`, '#3ddc97'); endRound(st, s); } },
      hud: (st, s) => ({ k: `round ${s.round}/3 · ${s.won}–${s.lost}`, t: `Beat ${st.name} (fists only)`, m: 'Win 2 of 3 rounds', target: s.boss ? { x: s.boss.x, z: s.boss.z, col: 0xff5d73 } : null }) },
    boss: { start: (st, s) => { const c = at(st.at); s.phase = 0; let flee = []; { let from = c; for (const f of (st.flee || []).map(at)) { const r = route(from, f); for (let q = 20; q < r.L; q += 20) { const a2 = along(r, q); flee.push({ x: a2.x, z: a2.z }); } flee.push(f); from = f; } } s.b = spawn({ x: c.x, z: c.z, name: st.name, boss: true, hp: st.hp || 12, weapon: st.weapon || 'fist', speed: 3.4, dmg: st.dmg || 7, col: '#f4f1ea' }); s.b.flee = flee.slice(); s.b.fleeSpeed = 4.6;
        s.b.onDown = n => { if (s.phase < (st.phases || 1) - 1) { s.phase++; n.hp = n.max; drawBar(n); n.weapon = st.phase2Weapon || n.weapon; toastS(st.phaseText || `${st.name} gets back up!`, '#ff5d73'); const k = st.goons || 0; for (let q = 0; q < k; q++) { const a = Math.random() * 6.28; spawn({ x: n.x + Math.cos(a) * 12, z: n.z + Math.sin(a) * 12, weapon: bb.mpick(st.goonWeapons || ['bat', 'knife']), hp: 3, dmg: 5 }); } } else knock(n); }; },
      update: (st, s) => { if (s.b.state === 'down' && !foes().length) next(); },
      hud: (st, s) => ({ k: s.b.flee.length ? 'chase' : `phase ${s.phase + 1}/${st.phases || 1}`, t: s.b.flee.length ? `Catch ${st.name}` : `Beat ${st.name}`, m: s.b.flee.length ? 'Run after him · he stops when you corner him' : 'Knock him down', target: { x: s.b.x, z: s.b.z, col: 0xff5d73 } }) },
    stars: { start: (st, s) => { if (st.add) { pl.stars = 0; bb.addWanted(st.add, st.why || 'Police'); } s.t = 0; }, update: (st, s, dt) => { s.t += dt; if (pl.stars === 0 && s.t > 1) next(); },
      hud: (st) => ({ t: st.text || 'Lose the police', m: st.sub || 'Hide in a bin or a haystack, change clothes, or get a respray', k: `★${pl.stars}` }) },
    race: { start: (st, s) => { const a = at(st.from), b = at(st.to); s.r = route(a, b); s.fin = b; s.go = 3; const vt = st.rivalVeh || 'sportsbike'; const v = npcVeh(vt, a.x, a.z, along(s.r, 0).h); v.lane = 2.2; v.v = 0; s.v = v; s.vmax = bb.SPEC[vt].max * (st.rivalPace || .8); toastS(`🏁 Race to ${b.name} · 3…2…1…`, '#ffc93c'); },
      update: (st, s, dt) => { if (s.go > 0) { s.go -= dt; return; } const v = s.v; const pp = bb.ppos(); const lead = (v.s || 0) - nearestS(s.r, pp); const tgt = s.vmax * (lead > 60 ? .8 : lead < -40 ? 1.08 : 1); v.v += Math.sign(tgt - v.v) * Math.min(Math.abs(tgt - v.v), 9 * dt); driveAlong(v, s.r, dt);
        if (reach(s.fin, 12)) { s.v.v = 0; if ((v.s || 0) < s.r.L - 12) { s.won = true; return next(); } } if ((v.s || 0) >= s.r.L - 2) { if (st.mustWin === false) return next(); return fail(`${(WHO[st.rival] || [st.rival || 'The rival'])[0]} got there first`); } },
      end: (st, s) => { if (s.v) { bb.removeVeh(s.v); NV.splice(NV.indexOf(s.v), 1); } },
      hud: (st, s) => ({ k: s.go > 0 ? 'get ready' : 'race', t: st.text || `Race to ${s.fin.name}`, m: `${(WHO[st.rival] || [st.rival || 'Rival'])[0]} is ${Math.round(Math.max(0, s.r.L - (s.v.s || 0)) * 2.4)} m from the finish`, target: s.fin }) },
    chase: { start: (st, s) => { const a = at(st.at), b = at(st.to); s.r = route(a, b); const v = npcVeh(st.veh || 'truck', a.x, a.z, along(s.r, 0).h); v.v = 0; v.hp = 100; v.s = 0; s.v = v; chaseV = v; s.rt = 0; },
      update: (st, s, dt) => { const v = s.v, pp = bb.ppos(); const d = Math.hypot(pp.x - v.pos.x, pp.z - v.pos.z);
        if (v.hp > 0) { const tgt = (st.speed || 14) * (d > 120 ? .7 : 1); v.v += Math.sign(tgt - v.v) * Math.min(Math.abs(tgt - v.v), 6 * dt); driveAlong(v, s.r, dt); s.rt -= dt;
          if (pl.mode === 'drive' && pl.veh && d < v.spec.len / 2 + pl.veh.spec.len / 2 + 1 && s.rt <= 0 && Math.abs(pl.veh.v) > 6) { s.rt = 1; v.hp -= 20; pl.veh.v *= .6; bb.hornSfx && bb.hornSfx(); toastS(`💥 Rammed · ${Math.max(0, v.hp)}%`, '#ff9f1c'); }
          if (v.hp <= 0) { v.v = 0; v.dead = false; v.state = 'parked'; v.noEnter = false; if (v.m.userData.driver) v.m.userData.driver.visible = false; chaseV = null; toastS(st.stopText || 'Stopped! The driver ran off', '#3ddc97'); return next(); }
          if (d < 250) s.seen = true; if ((v.s || 0) >= s.r.L - 3 || (s.seen && d > 700)) return fail(st.escText || 'It got away'); } },
      hud: (st, s) => ({ k: `${Math.max(0, s.v.hp)}%`, t: st.text || 'Stop the vehicle', m: 'Ram it with your vehicle or shoot at it', target: { x: s.v.pos.x, z: s.v.pos.z, col: 0xff5d73 } }) },
    deliver: { start: (st, s) => { s.p = at(st.at); s.left = (st.time || 240) * (cur.m.slack || 1.5); s.grab = 0; const pp = bb.ppos(); s.pv = []; for (let k = 0; k < (st.pursuers || 0); k++) { const r = bb.nearestRoadPoint(pp.x - 60 + k * 30, pp.z - 60, 200); if (!r) continue; const v = npcVeh(st.pursuerVeh || 'suv', r.x, r.z, 0); v.v = 0; v.rt = 0; s.pv.push(v); } },
      update: (st, s, dt) => { s.left -= dt; if (s.left <= 0) return fail('Too late'); const pp = bb.ppos(); const pv = pl.veh;
        for (const v of s.pv) { const dx = pp.x - v.pos.x, dz = pp.z - v.pos.z, d = Math.hypot(dx, dz); const tgt = pv ? Math.min(v.spec.max * .9, Math.abs(pv.v) + 6) : 6; v.v += Math.sign(tgt - v.v) * Math.min(Math.abs(tgt - v.v), 10 * dt);
          const want = Math.atan2(dx, dz); let dh = want - v.h; while (dh > Math.PI) dh -= 6.283; while (dh < -Math.PI) dh += 6.283; v.h += Math.max(-2 * dt, Math.min(2 * dt, dh)); const nx = v.pos.x + Math.sin(v.h) * v.v * dt, nz = v.pos.z + Math.cos(v.h) * v.v * dt; if (bb.drivable(nx, nz)) { v.pos.x = nx; v.pos.z = nz; } else v.v *= .5; v.m.rotation.y = v.h; for (const w of v.m.userData.wheels || []) w.rotation.x += v.v * dt / .4;
          v.rt -= dt; if (d < 4.5 && v.rt <= 0) { v.rt = 1.2; if (pv) { pv.hp = Math.max(5, pv.hp - 6); pv.v *= .7; } else bb.damage(8, 'Run over'); toastS('💥 They rammed you!', '#ff5d73'); }
          if (d < 6 && (!pv || Math.abs(pv.v) < 2)) s.grab += dt; }
        s.grab = Math.max(0, s.grab - dt * .3); if (s.grab > 3.5) return fail(st.grabText || 'They grabbed the bag');
        if (reach(s.p, 8)) next(); },
      end: (st, s) => { for (const v of s.pv || []) { bb.removeVeh(v); const i = NV.indexOf(v); if (i >= 0) NV.splice(i, 1); } },
      hud: (st, s) => ({ k: fmt(s.left), t: st.text || `Get to ${s.p.name}`, m: (s.pv.length ? "Don't stop: if they block you for long they take it · " : '') + (st.sub || ''), target: s.p }) },
    stealth: { start: (st, s) => { const c = at(st.at); s.c = c; s.photo = { x: c.x + 2, z: c.z + 2 }; s.seen = false; s.g = [];
        for (let k = 0; k < (st.guards || 3); k++) { const n = spawn({ x: c.x + Math.cos(k * 2.1) * 12, z: c.z + Math.sin(k * 2.1) * 12, weapon: 'lathi', hp: 4, dmg: 5, name: '' }); n.patrol = { a: k * 2.1, r: 10 + k * 3, sp: (k % 2 ? 1 : -1) * .25 }; n.stealthy = true;
          const cone = new T.Mesh(new T.CircleGeometry(12, 16, -.6, 1.2), new T.MeshBasicMaterial({ color: 0xffe08a, transparent: true, opacity: .22, depthWrite: false })); cone.rotation.x = -Math.PI / 2; cone.rotation.z = -Math.PI / 2; cone.position.y = .06; n.g.add(cone); n.cone = cone; s.g.push(n); } },
      update: (st, s, dt) => { const pp = bb.ppos();
        for (const n of s.g) { if (n.state === 'down') continue; if (!s.seen) { n.patrol.a += n.patrol.sp * dt; n.x = s.c.x + Math.cos(n.patrol.a) * n.patrol.r; n.z = s.c.z + Math.sin(n.patrol.a) * n.patrol.r; n.h = n.patrol.a + (n.patrol.sp > 0 ? Math.PI / 2 : -Math.PI / 2); n.h = Math.atan2(Math.sin(n.h), Math.cos(n.h)); n.g.position.set(n.x, 0, n.z); n.g.rotation.y = n.h;
            const dx = pp.x - n.x, dz = pp.z - n.z, d = Math.hypot(dx, dz); const da = angD(Math.atan2(dx, dz), n.h); if (!pl.hidden && d < 12 && da < .6) { s.seen = true; toastS('🚨 Spotted! The alarm is going', '#ff5d73'); if (st.alarmStars) bb.addWanted(st.alarmStars, 'Seen at the warehouse'); for (const q of s.g) { q.stealthy = false; if (q.cone) q.cone.visible = false; } } } }
        if (reach(s.photo, 2.6) && !s.shot) { s.shot = true; toastS('📸 Got the photos · now get out', '#3ddc97'); bb.hornSfx && 0; return next(); } },
      hud: (st, s) => ({ t: st.text || 'Sneak in and take the photos', m: s.seen ? 'They saw you · grab it and run' : 'Stay out of the yellow torch beams · E to hide in bins nearby', target: s.photo }) },
    follow: { start: (st, s) => { const c = bb.ppos(); s.n = spawn({ x: c.x + 2, z: c.z + 2, ally: true, name: (WHO[st.who] || [st.who])[0], col: st.col || '#7fd858', hp: 99, speed: 4.2 }); s.n.follow = true; s.p = at(st.at); },
      update: (st, s) => { const n = s.n; n.foe = null; const pp = bb.ppos(); if (pl.mode === 'drive') { n.g.visible = false; n.x = pp.x; n.z = pp.z; } else n.g.visible = true; if (reach(s.p, 8)) { bb.scene.remove(n.g); NPC.splice(NPC.indexOf(n), 1); next(); } },
      hud: (st, s) => ({ t: st.text || `Take ${(WHO[st.who] || [st.who])[0]} to ${s.p.name}`, m: 'They follow you, on foot or in your vehicle', target: s.p }) },
    wait: { update: (st, s) => { if (performance.now() - s.t0 > (st.sec || 2) * 1000) next(); } },
    choice: { start: (st) => next() },
  };
  function nearestS(r, p) { let best = 0, bd = 1e12; for (let s = 0; s <= r.L; s += 10) { const q = along(r, s); const d = Math.hypot(q.x - p.x, q.z - p.z); if (d < bd) { bd = d; best = s; } } return best; }
  function roundStart(st, s) { s.round++; const c = at(st.at); if (s.boss) { bb.scene.remove(s.boss.g); NPC.splice(NPC.indexOf(s.boss), 1); } s.boss = spawn({ x: c.x + 3, z: c.z, name: st.name, boss: true, hp: st.hp || 6, weapon: 'fist', dmg: st.dmg || 6, speed: 3.2, col: '#e8573e' }); s.h0 = P().health; toastS(`🔔 Round ${s.round}`, '#ffc93c'); }
  function endRound(st, s) { if (s.won >= 2) { if (s.boss) { bb.scene.remove(s.boss.g); NPC.splice(NPC.indexOf(s.boss), 1); s.boss = null; } return next(); } if (s.lost >= 2) return fail(`${st.name} won the bout`); roundStart(st, s); }
  /* ================= the Badshah phone app ================= */
  function app() { const s = S(); const nx = nextMission(); const act = id => id.startsWith('A1') ? 'Act 1 · Kamaai (The Hustle)' : id.startsWith('A2') ? 'Act 2 · Ilaaka (The Turf)' : 'Act 3';
    const doneN = Object.keys(s.done).length; const debtLeft = Math.max(0, DEBT() - (s.paid || 0)); const inAct1 = !s.done['A1-09'];
    const rows = (cur ? bb.rowHtml('quit', `▶ ${esc(cur.m.title)} (playing)`, 'Give up this mission and try later', 'Give up', 'danger') : nx ? bb.rowHtml('go', `${esc(nx.m.id)} · ${esc(nx.m.title)}`, nx.ok ? esc(nx.m.blurb || '') + ' · go to the 👑 marker' : esc(nx.why), nx.ok ? 'Show me' : '', nx.ok ? '' : 'ghost') : bb.rowHtml('x', 'You have played every mission in this update', 'The eight kings arrive in the next updates', '', 'ghost')) +
      (inAct1 ? bb.rowHtml('debt', `💸 Vikram's debt · ${bb.inr(debtLeft)} left`, `Paid ${bb.inr(s.paid || 0)} of ${bb.inr(DEBT())} to Byaaj Bhai · pay whenever you have cash`, debtLeft ? 'Pay' : 'Cleared', debtLeft ? '' : 'ghost') : '') +
      bb.rowHtml('x', `Izzat ${s.izzat || 0} · ${doneN} missions done`, `Crew: ${(s.crew || []).map(c => (WHO[c] || [c])[0]).join(', ') || 'none yet'} · home city ${esc(anchors().city)}`, '', 'ghost') +
      MIS.map(m => bb.rowHtml('m_' + m.id, `${s.done[m.id] ? '✅' : nx && nx.m === m ? '👑' : '🔒'} ${m.id} · ${esc(m.title)}`, act(m.id) + (s.done[m.id] ? ' · done ' + s.done[m.id] : ''), '', 'ghost')).join('');
    bb.openSheet('👑 Badshah', 'Story mode · up to 3 missions a day', rows, el => el.onclick = e => { const id = e.target.dataset.id; if (!id) return;
      if (id === 'go' && nx && nx.ok) { const a0 = at(nx.m.start || 'garage'); bb.closeSheet(); bb.directions && bb.directions(a0.x, a0.z, `👑 ${nx.m.title}`); }
      if (id === 'quit' && cur) { const st = stepOf(); if (st && STEP[st.type] && STEP[st.type].end) STEP[st.type].end(st, cur.st); clearNPC(); clearNV(); run = false; cur = null; S().cur = null; talk = null; card.hidden = true; bb.setDirty(); bb.closeSheet(); toastS('Mission stopped · start it again from the 👑 marker', '#d6c8e4'); }
      if (id === 'debt') payDebt(); }); }
  function payDebt() { const s = S(); const left = Math.max(0, DEBT() - (s.paid || 0)); if (!left) return; const p = P(); const opts = [5000, 20000, 50000].filter(a => a < left).concat([left]);
    bb.openSheet("💸 Pay Byaaj Bhai", `${bb.inr(left)} left · you have ${bb.inr(p.cash)} cash and ${bb.inr(p.bank)} in the bank`, opts.map(a => bb.rowHtml('p' + a, bb.inr(a), a === left ? 'Everything left' : 'Pay part of it', 'Pay')).join('') + bb.rowHtml('back', '‹ Back', '', 'Back', 'ghost'),
      el => el.onclick = e => { const id = e.target.dataset.id; if (!id) return; if (id === 'back') return app(); const a = +id.slice(1); if (!bb.spend(a, true)) return; s.paid = (s.paid || 0) + a; bb.setDirty(); bb.save(); toastS(`💸 Paid ${bb.inr(a)} · ${bb.inr(Math.max(0, DEBT() - s.paid))} left`, '#ffc93c'); payDebt(); }); }
  bb.addApp({ id: 'badshah', label: 'Badshah', icon: '👑', fn: app });
  bb.onStart(() => { const lc = document.querySelector('#top .lcol'); if (!lc || document.querySelector('#bsPill')) return; const d = document.createElement('button'); d.id = 'bsPill'; d.type = 'button'; d.className = 'pill'; d.style.cssText = 'pointer-events:auto;font:700 12px var(--f-display);color:#f2c14e;cursor:pointer;text-align:left'; d.textContent = '👑 Badshah · story mode'; d.onclick = () => app(); lc.appendChild(d); });
  /* ================= resume after a reload, and the first-time welcome ================= */
  bb.onStart(() => setTimeout(() => { const s = S(); anchors(); if (s.cur && BYID[s.cur.id]) { const m = BYID[s.cur.id]; const ck = s.cur.ck || 0; cur = { m, i: ck, st: {} }; s.cur.i = ck; run = true; toastS(`👑 Back to ${m.title}${ck ? ' (from the checkpoint)' : ''}`, '#f2c14e'); enter(); }
    else if (!Object.keys(s.done).length && !s.welcomed) { s.welcomed = true; bb.setDirty(); bb.openSheet('👑 Badshah', 'Story mode', `<p class="note" style="color:var(--ink);font-size:14.5px">You step off a night train in ${esc(anchors().city)} with ₹500, your brother Vikram's old phone, and his debt. Vikram drove trucks across India. A year ago he found something on the highway, and he never came home.</p><p class="note">Follow the 👑 marker. Missions open day by day (up to 3 a day). Between missions, take jobs, explore and earn: you will need the money.</p>` + bb.rowHtml('ok', 'Start the story', '', 'Go'), el => el.onclick = e => { if (e.target.dataset.id === 'ok') bb.closeSheet(); }); }
  }, 1500));
  bb.BADSHAH = { tick: (dt) => { if (!run) return; const now = performance.now() / 1000; updNPC(dt, now); const st = stepOf(); if (st && STEP[st.type] && STEP[st.type].update) STEP[st.type].update(st, cur.st, dt, now); }, anchors, begin: id => begin(BYID[id]), get cur() { return cur; }, get npc() { return NPC; }, S, next: () => next(), fail, nextMission, app, complete: () => complete(), get talk() { return talk; }, nextLine };
});
