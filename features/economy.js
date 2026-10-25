// Player businesses and renting out homes (passive income).
// Beta v1.01.24: you open a real business where you stand: a tea stall, a café, a hotel (restaurant) or a lodge.
// It is built there, shows on the map with its name, and other players see it and can stop for chai or a meal
// (every visitor adds a little to your earnings). Upgrade it, rename it or close it from the Business app.
// Income builds up with Bay time (capped at one game day). Collect all into the bank in one tap, or turn on
// Auto collect. Shared businesses need supabase-update-10.sql; offline they still work on your own device.
window.BBFeatures.push(function (bb) {
  const T = bb.THREE, P = () => bb.P, esc = bb.esc, O = () => bb.ONLINE;
  const TYPES = {
    tea: { icon: '☕', name: 'Tea stall', lv: [['Tea stall', 50000, 120], ['Tea corner', 80000, 260], ['Tea shop', 200000, 520]], buy: ['Cutting chai and a samosa', 20, 12] },
    cafe: { icon: '🍰', name: 'Café', lv: [['Café', 200000, 450], ['Busy café', 250000, 650], ['Café chain', 600000, 1100]], buy: ['Filter coffee and a sandwich', 80, 25] },
    hotel: { icon: '🍛', name: 'Hotel (restaurant)', lv: [['Hotel', 600000, 1200], ['Family hotel', 1000000, 2000], ['Grand hotel', 3000000, 4500]], buy: ['A full thali', 180, 60] },
    lodge: { icon: '🏨', name: 'Lodge', lv: [['Lodge', 1500000, 2600], ['Guest house', 2500000, 4200], ['Resort', 5000000, 8000]], buy: ['A room for the night', 250, 0] } };
  const LEGACY = [['Chai stall', 50000, 120], ['Chai cafe', 150000, 400], ['Chai chain', 500000, 1200], ['Chai franchise', 2000000, 4000]];
  const now = () => bb.gameMin() / 60;
  const lvOf = b => b.t && TYPES[b.t] ? TYPES[b.t].lv : LEGACY;
  const rate = b => lvOf(b)[Math.min(b.lvl, lvOf(b).length - 1)][2] * bb.CFG.priceMul;
  function accrued(b) { return Math.round(Math.min(24, Math.max(0, now() - b.since)) * rate(b)); }
  function rentRate(id) { const h = bb.homeById(id); return Math.round(h.price * .012 * bb.CFG.priceMul); }
  function rentAccrued(id) { const r = P().rent[id]; return Math.round(Math.min(7, Math.max(0, (now() - r.since) / 24)) * rentRate(id)); }
  const live = () => { const o = O(); return o && o.signedIn && !o.guest && o.client; };
  const sqlNote = e => /does not exist|schema cache|function/i.test(e && e.message || '') ? 'Shared businesses need the server update (update 10)' : (e && e.message || String(e));
  /* ---------- collecting ---------- */
  function toBank(a, why) { const p = P(); p.bank += a; p.stats.earned += a; bb.emit('earn', { n: a, why, bank: true }); }
  async function visitBonus(b) { if (!b.sid || !live()) return 0; try { const r = await O().rpc('collect_visits', { p_id: b.sid }); const n = r && !r.error ? +r.data || 0 : 0; return Math.round(n * TYPES[b.t].buy[1] * .6); } catch (e) { return 0; } }
  async function collectAll(quiet) { const p = P(); let tot = 0;
    for (const b of p.biz) { const a = accrued(b); if (a > 0) { tot += a; b.since = now(); } if (b.t) tot += await visitBonus(b); }
    for (const h of p.homes) if (p.rent[h]) { const a = rentAccrued(h); if (a > 0) { tot += a; p.rent[h].since = now(); } }
    if (tot > 0) { toBank(tot, 'business'); bb.save(); bb.toast(quiet ? `🏦 Business income ${bb.inr(tot)} went to your bank` : `🏦 Collected ${bb.inr(tot)} into your bank`, '#3ddc97'); } else if (!quiet) bb.toast('Nothing to collect yet', '#d6c8e4'); return tot; }
  const auto = () => !!(P().extra && P().extra.autoCollect);
  setInterval(() => { if (!bb.started || !auto()) return; const p = P(); let w = 0; for (const b of p.biz) w += accrued(b); for (const h of p.homes) if (p.rent[h]) w += rentAccrued(h);
    const hourly = p.biz.reduce((s, b) => s + rate(b), 0) || 1; if (w >= hourly * 3 || (w > 0 && p.homes.some(h => p.rent[h] && rentAccrued(h) >= rentRate(h)))) collectAll(true); }, 30000);
  /* ---------- the buildings ---------- */
  const mats = {}; const M = c => mats[c] || (mats[c] = bb.LMat(c));
  const signTex = (text, bg, fg) => { const c = document.createElement('canvas'); c.width = 512; c.height = 128; const x = c.getContext('2d'); x.fillStyle = bg; x.fillRect(0, 0, 512, 128); x.strokeStyle = fg; x.lineWidth = 6; x.strokeRect(6, 6, 500, 116); x.fillStyle = fg; let f = 56; x.font = `800 ${f}px "Baloo 2",sans-serif`; while (x.measureText(text).width > 470 && f > 18) { f -= 2; x.font = `800 ${f}px "Baloo 2",sans-serif`; } x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, 256, 68, 480); return new T.CanvasTexture(c); };
  const SIZE = { tea: [3.2, 2.4], cafe: [7, 6], hotel: [10, 8], lodge: [11, 9] };
  function model(b) { const g = new T.Group(); const box = (w, h, d, x, y, z, m) => { const o = new T.Mesh(new T.BoxGeometry(w, h, d), typeof m === 'string' ? M(m) : m); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; g.add(o); return o; };
    const sign = (w, h, x, y, z, bg, fg) => { const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: signTex(b.name, bg, fg) })); m.position.set(x, y, z); g.add(m); };
    const seats = []; const lv = b.lvl || 0;
    if (b.t === 'tea') { box(2.6, 1.0, 1.2, 0, .5, 0, '#8a5a3a'); box(2.8, .08, 1.4, 0, 1.04, 0, '#d9c9a2'); for (const s of [-1, 1]) box(.08, 1.4, .08, s * 1.3, 1.75, .55, '#5a3b22'); const roof = box(3.2, .12, 2.2, 0, 2.5, .2, lv ? '#c0392b' : '#2f7fc1'); roof.rotation.x = -.12;
      const urn = new T.Mesh(new T.CylinderGeometry(.18, .2, .45, 12), M('#c9a227')); urn.position.set(-.7, 1.3, 0); g.add(urn); sign(2.6, .55, 0, 2.15, .66, '#f2c230', '#5a2a12');
      const k = bb.buildPerson(M('#f4f1ea'), { female: false }); k.position.set(.4, 0, -.9); k.rotation.y = 0; g.add(k); if (lv >= 1) { box(1.2, .9, .9, 1.9, .45, 0, '#e8e2d6'); } seats.push([0, 2.6, Math.PI]); }
    else { const [w, d] = SIZE[b.t]; const H = b.t === 'lodge' ? 6.5 + lv * 2 : b.t === 'hotel' ? 4.2 + lv * 1.2 : 3.6; const wall = b.t === 'cafe' ? '#f3e6d2' : b.t === 'hotel' ? '#f2d7a8' : '#e9e4d6';
      box(w, H, d, 0, H / 2, 0, wall); box(w + .3, .3, d + .3, 0, H + .15, 0, b.t === 'cafe' ? '#5a3b22' : '#a8452c'); const gl = new T.Mesh(new T.PlaneGeometry(w * .7, Math.min(2.4, H * .5)), new T.MeshPhongMaterial({ color: 0x6f9cbf, shininess: 90 })); gl.position.set(0, 1.3, d / 2 + .02); g.add(gl);
      if (b.t === 'lodge') for (let f = 1; f < Math.floor(H / 3); f++) for (let i = -2; i <= 2; i++) { const wn = new T.Mesh(new T.PlaneGeometry(.9, 1.1), M('#2a3946')); wn.position.set(i * (w / 5.5), f * 3 + 1.2, d / 2 + .02); g.add(wn); }
      const aw = box(w * .8, .1, 1.6, 0, 2.6, d / 2 + .8, b.t === 'cafe' ? '#2f6f3a' : '#c0392b'); aw.rotation.x = .2; sign(w * .75, Math.max(.7, w * .12), 0, Math.min(H - .6, 3.4), d / 2 + .03, b.t === 'cafe' ? '#2f2a26' : '#7a1f12', '#ffe9b8');
      if (b.t !== 'lodge') for (const s of [-1, 1]) { const tx = s * w * .3, tz = d / 2 + 2.6; box(.9, .05, .9, tx, .75, tz, '#f4f1ea'); box(.08, .75, .08, tx, .37, tz, '#3a3b40'); for (const o of [-1, 1]) { box(.42, .06, .42, tx + o * .75, .45, tz, '#8a5a3a'); box(.42, .5, .05, tx + o * .95, .7, tz, '#8a5a3a'); seats.push([tx + o * .75, tz, o > 0 ? -Math.PI / 2 : Math.PI / 2]); } } }
    return { g, seats }; }
  const built = new Map();   // key -> { g, b }
  const keyOf = b => b.sid ? 's' + b.sid : 'l' + b.lid;
  function ensure(b, own) { const k = keyOf(b); if (built.has(k)) return; const { g, seats } = model(b); g.position.set(b.x, 0, b.z); g.rotation.y = b.h || 0; bb.scene.add(g);
    const [w, d] = SIZE[b.t] || [3, 3]; bb.addCol(b.x, b.z, Math.min(w, d) * .45, Math.min(w, d) * .45, true, true);
    const ch = Math.cos(b.h || 0), sh = Math.sin(b.h || 0); const off = (lx, lz) => ({ x: b.x + lx * ch + lz * sh, z: b.z - lx * sh + lz * ch });
    const door = off(0, d / 2 + 1.2); const poi = bb.addPoi({ type: 'pbiz', name: b.name, x: door.x, z: door.z, rot: b.h || 0, extra: k, color: own ? '#ffc93c' : '#7fd8c9' });
    if (bb.SEATS) for (const [lx, lz, hh] of seats) { const q = off(lx, lz); bb.SEATS.add({ x: q.x, z: q.z, y: .5, h: (b.h || 0) + hh, name: `Sit at ${b.name}` }); }
    built.set(k, { g, b, own, poi }); }
  function unbuild(k) { const r = built.get(k); if (!r) return; bb.scene.remove(r.g); built.delete(k); const i = bb.pois.indexOf(r.poi); if (i >= 0) { if (r.poi.ring) bb.scene.remove(r.poi.ring); bb.pois.splice(i, 1); } }
  let others = [];   // businesses of other players (from the server)
  async function fetchOthers() { if (!live()) return; try { const r = await O().client.from('player_businesses').select('id,owner,username,type,name,x,z,h,lvl').limit(500); if (r.error) return; const me = O().uid;
      others = (r.data || []).filter(q => q.owner !== me && TYPES[q.type]).map(q => ({ sid: q.id, t: q.type, name: titleName(q.name), x: q.x, z: q.z, h: q.h, lvl: q.lvl, owner: q.username })); } catch (e) {} }
  bb.onStart(() => setTimeout(fetchOthers, 9000)); setInterval(fetchOthers, 5 * 60 * 1000);
  // build what is near you
  setInterval(() => { if (!bb.started) return; const pp = bb.ppos(); const all = P().biz.filter(b => b.t).map(b => [b, true]).concat(others.map(b => [b, false]));
    for (const [b, own] of all) { const d = Math.abs(b.x - pp.x) + Math.abs(b.z - pp.z); if (d < 600) ensure(b, own); } }, 2000);
  bb.addMapMarks(() => P().biz.filter(b => b.t).map(b => ({ x: b.x, z: b.z, col: '#ffc93c', txt: TYPES[b.t].icon, name: b.name, sub: 'Your business' })).concat(others.map(b => ({ x: b.x, z: b.z, col: '#7fd8c9', txt: TYPES[b.t].icon, name: b.name, sub: '@' + b.owner }))));
  /* ---------- opening one where you stand ---------- */
  const V = new T.Vector3();
  function spot(t) { const pl = bb.player; if (pl.mode !== 'foot' || bb.inside) return { err: 'Get out and stand where you want it' }; const h = pl.h + Math.PI, [w, d] = SIZE[t]; const fx = Math.sin(pl.h), fz = Math.cos(pl.h);
    const cx = pl.pos.x + fx * (d / 2 + 3), cz = pl.pos.z + fz * (d / 2 + 3);
    for (const [a, b] of [[0, 0], [w / 2, d / 2], [-w / 2, d / 2], [w / 2, -d / 2], [-w / 2, -d / 2], [0, d / 2 + 2]]) { const x = cx + a * Math.cos(h) + b * Math.sin(h), z = cz - a * Math.sin(h) + b * Math.cos(h);
      if (bb.isWater(x, z)) return { err: 'Too close to the water' }; if (bb.roadAt(x, z, .8) && b < d / 2 + 1) return { err: 'Not on the road · step back onto open ground' }; V.set(x, 0, z); if (bb.collideTest(V)) return { err: 'Something is in the way · find an open spot' }; }
    const all = P().biz.filter(b => b.t).concat(others); if (all.some(b => Math.hypot(b.x - cx, b.z - cz) < 22)) return { err: 'Another business is right here · move a little' };
    if (bb.pois.some(p => Math.hypot(p.x - cx, p.z - cz) < Math.max(w, d) / 2 + 3)) return { err: 'Too close to another shop · move a little' }; return { x: cx, z: cz, h }; }
  async function open(t, name) { name = titleName(name); const s = spot(t); if (s.err) return bb.toast(s.err, '#ff9f1c'); const L = TYPES[t].lv[0]; if (!bb.spend(bb.cost('biz.' + t, L[1]), true)) return;
    const pp = bb.ppos(); const z = bb.zoneAt(pp.x, pp.z, 300); const b = { t, lvl: 0, since: now(), x: Math.round(s.x * 10) / 10, z: Math.round(s.z * 10) / 10, h: +s.h.toFixed(3), name, city: z ? z.name : '', lid: Date.now().toString(36) };
    if (live()) { try { const r = await O().rpc('open_business', { p_type: t, p_name: name, p_x: b.x, p_z: b.z, p_h: b.h }); if (r.error) bb.toast(sqlNote(r.error), '#ff9f1c'); else if (typeof r.data === 'number' || /^\d+$/.test(String(r.data))) b.sid = +r.data; else if (r.data) bb.toast(esc(r.data), '#ff9f1c'); } catch (e) {} }
    P().biz.push(b); bb.save(); ensure(b, true); bb.toast(`${TYPES[t].icon} ${esc(name)} is open · it shows on the map`, '#3ddc97'); bb.emit('biz'); sheet(); }
  function openSheet() { const o = O(); const me = (o && o.username) || P().name || 'My'; const pp = bb.ppos();
    bb.openSheet('Open a business here', 'It is built right in front of you', Object.entries(TYPES).map(([t, q]) => bb.rowHtml('o:' + t, `${q.icon} ${q.name}`, `Earns ${bb.inr(q.lv[0][2] * bb.CFG.priceMul)} per game hour · visitors add more`, bb.inr(bb.cost('biz.' + t, q.lv[0][1])))).join('') + `<label class="fld">Name<input id="bz_n" maxlength="28" placeholder="${esc(me)}'s place"></label><p class="note">Stand on open ground facing where you want it, away from the road, the water and other shops.</p>`,
      s => s.onclick = e => { const id = e.target.dataset.id; if (!id || !id.startsWith('o:')) return; const t = id.slice(2); const n = titleName((s.querySelector('#bz_n').value || '').replace(/[<>]/g, '').trim().slice(0, 28) || `${me}'s ${TYPES[t].name.replace(' (restaurant)', '')}`); bb.closeSheet(); open(t, n); }); }
  // names are shown in title case: "hafiz's tea stall" -> "Hafiz's Tea Stall" (Beta v1.01.26)
  function titleName(n) { return String(n || '').replace(/\s+/g, ' ').trim().split(' ').map(w => w ? w[0].toUpperCase() + w.slice(1) : w).join(' ').slice(0, 28); }
  function renameSheet(i) { const b = P().biz[i]; if (!b) return; bb.openSheet('✏ Rename your business', `${TYPES[b.t] ? TYPES[b.t].icon : ''} ${esc(b.name)}`, `<label class="fl">New name<input id="bz_rn" maxlength="28" value="${esc(b.name)}"></label>` + bb.rowHtml('ok', 'Save the new name', 'The sign and the map change for everyone', 'Save'),
      s => { const inp = s.querySelector('#bz_rn'); if (inp) { inp.focus(); inp.addEventListener('keydown', e => e.stopPropagation()); } s.onclick = async e => { if (e.target.dataset.id !== 'ok') return; const n = titleName((inp.value || '').replace(/[<>]/g, '')); if (!n) return bb.toast('Type a name', '#ff9f1c');
        if (b.sid && live()) { try { const r = await O().rpc('rename_business', { p_id: b.sid, p_name: n }); if (r.error) bb.toast(sqlNote(r.error), '#ff9f1c'); } catch (er) {} }
        b.name = n; bb.save(); unbuild(keyOf(b)); ensure(b, true); bb.toast(`✏ Renamed to ${esc(n)}`, '#3ddc97'); sheet(); }; }); }
  /* ---------- the Business app ---------- */
  function sheet() { const p = P();
    const biz = p.biz.map((b, i) => { const L = lvOf(b), cur = L[Math.min(b.lvl, L.length - 1)], nx = L[b.lvl + 1]; const ic = b.t ? TYPES[b.t].icon : '☕'; const where = b.t ? `${esc(b.name)}${b.city ? ' · ' + esc(b.city) : ''}` : `${cur[0]} · ${esc(b.city)}`;
      return bb.rowHtml('c' + i, `${ic} ${where}`, `${b.t ? cur[0] + ' · ' : ''}${bb.inr(cur[2] * bb.CFG.priceMul)} per game hour · ${bb.inr(accrued(b))} waiting`, 'Collect') + (nx ? bb.rowHtml('u' + i, `Upgrade to ${nx[0]}`, `${bb.inr(nx[2] * bb.CFG.priceMul)} per game hour`, bb.inr(bb.cost((b.t ? 'biz.' + b.t + '.' : 'biz.') + (b.lvl + 1), nx[1])), 'ghost') : '') + (b.t ? bb.rowHtml('g' + i, '🧭 Go there', 'Directions on the map', 'Go', 'ghost') + bb.rowHtml('n' + i, '✏ Rename', 'Change the name on the sign and the map', 'Rename', 'ghost') + bb.rowHtml('x' + i, 'Close this business', 'You get half of what you paid back', 'Close', 'danger') : ''); }).join('');
    const rent = p.homes.map(h => { const r = p.rent[h]; const H = bb.homeById(h); return r ? bb.rowHtml('r' + h, `${esc(H.name)} · rented`, `${bb.inr(rentRate(h))} per game day · ${bb.inr(rentAccrued(h))} waiting`, 'Collect') + bb.rowHtml('e' + h, 'End the rental', 'You can live there again', 'End', 'ghost') : bb.rowHtml('t' + h, `Rent out ${esc(H.name)}`, `Tenants pay ${bb.inr(rentRate(h))} per game day · you cannot stay there while rented`, 'Rent out', 'ghost'); }).join('');
    bb.openSheet('Business', 'Passive income builds up with Bay time', (p.biz.length || Object.keys(p.rent).length ? bb.rowHtml('all', '🏦 Collect all into the bank', `${bb.inr(p.biz.reduce((t, b) => t + accrued(b), 0) + p.homes.reduce((t, h) => t + (p.rent[h] ? rentAccrued(h) : 0), 0))} waiting · visitors to your shops add more`, 'Collect all') + `<div class="row"><div class="nm">🔁 Auto collect<small>${auto() ? 'On · income goes straight to your bank' : 'Off · collect by hand'}</small></div><button class="buy ${auto() ? '' : 'ghost'}" data-id="auto">${auto() ? 'On' : 'Off'}</button></div>` : '') +
      bb.rowHtml('new', '🏗 Open a business where you are standing', 'Tea stall, café, hotel or lodge · built here and shown on the map', 'Open') + `<h3 style="font-family:var(--f-display);margin:8px 0 4px">Your businesses</h3>${biz || '<p class="note">No business yet.</p>'}
      <h3 style="font-family:var(--f-display);margin:14px 0 4px">Rent your homes</h3>${rent || '<p class="note">Buy a home at Sapna Homes first.</p>'}`,
      s => s.onclick = async e => { const id = e.target.dataset.id; if (!id) return; const k = id[0], r = id.slice(1);
        if (id === 'all') { await collectAll(false); return sheet(); }
        if (id === 'new') return openSheet();
        if (id === 'auto') { p.extra = p.extra || {}; p.extra.autoCollect = !p.extra.autoCollect; bb.toast(p.extra.autoCollect ? '🔁 Auto collect on · income goes to your bank' : 'Auto collect off', '#3ddc97'); if (p.extra.autoCollect) collectAll(true); bb.save(); return sheet(); }
        if (k === 'c') { const b = p.biz[+r]; let a = accrued(b); if (b.t) a += await visitBonus(b); if (a <= 0) { bb.toast('Nothing to collect yet', '#d6c8e4'); return; } bb.earn(a, 'business'); b.since = now(); bb.toast(`Collected ${bb.inr(a)}`, '#3ddc97'); }
        else if (k === 'u') { const b = p.biz[+r]; const nx = lvOf(b)[b.lvl + 1]; if (!bb.spend(bb.cost((b.t ? 'biz.' + b.t + '.' : 'biz.') + (b.lvl + 1), nx[1]), true)) return; const a = accrued(b); if (a) bb.earn(a, 'business'); b.lvl++; b.since = now(); if (b.t) { unbuild(keyOf(b)); ensure(b, true); if (b.sid && live()) O().rpc('upgrade_business', { p_id: b.sid, p_lvl: b.lvl }); } bb.toast(`Upgraded to ${nx[0]}`, '#3ddc97'); }
        else if (k === 'g') { const b = p.biz[+r]; bb.closeSheet(); return bb.directions && bb.directions(b.x, b.z, b.name); }
        else if (k === 'n') return renameSheet(+r);
        else if (k === 'x') { const b = p.biz[+r]; const paid = lvOf(b).slice(0, b.lvl + 1).reduce((s2, q) => s2 + q[1], 0); toBank(Math.round(paid / 2), 'business'); unbuild(keyOf(b)); if (b.sid && live()) O().rpc('close_business', { p_id: b.sid }); p.biz.splice(+r, 1); bb.toast(`${esc(b.name)} is closed · ${bb.inr(Math.round(paid / 2))} back to your bank`, '#d6c8e4'); }
        else if (k === 't') { p.rent[r] = { since: now() }; bb.toast('Tenants moved in', '#3ddc97'); }
        else if (k === 'r') { const a = rentAccrued(r); if (a <= 0) { bb.toast('Rent not due yet', '#d6c8e4'); return; } bb.earn(a, 'rent'); p.rent[r].since = now(); bb.toast(`Rent collected · ${bb.inr(a)}`, '#3ddc97'); }
        else if (k === 'e') { const a = rentAccrued(r); if (a) bb.earn(a, 'rent'); delete p.rent[r]; bb.toast('Rental ended', '#3ddc97'); }
        bb.save(); sheet(); }); }
  // walking up to a business (yours or another player's)
  bb.poiHandlers.pbiz = poi => { const r = built.get(poi.extra); if (!r) return; const b = r.b, q = TYPES[b.t]; const lvName = q.lv[Math.min(b.lvl || 0, 2)][0];
    if (r.own) { const i = P().biz.indexOf(b); return bb.openSheet(`${q.icon} ${esc(b.name)}`, `Your ${lvName.toLowerCase()} · ${bb.inr(accrued(b))} waiting`, bb.rowHtml('c', 'Collect the takings', 'Into your cash', 'Collect') + bb.rowHtml('m', 'Manage', 'Upgrade, rename or close · Business app', 'Open', 'ghost') + bb.rowHtml('b', q.buy[0], 'On the house', 'Free', 'ghost'),
      s => s.onclick = async e => { const id = e.target.dataset.id; if (!id) return; if (id === 'm') return sheet(); if (id === 'b') { bb.closeSheet(); if (b.t === 'lodge') return bb.startSleep ? bb.startSleep(`Sleeping at ${b.name}`, 'Your own lodge') : null; P().hunger = Math.min(100, P().hunger + q.buy[2]); bb.emit('eat'); return bb.toast('Tasty · hunger up', '#3ddc97'); }
        let a = accrued(b) + await visitBonus(b); if (a <= 0) return bb.toast('Nothing to collect yet', '#d6c8e4'); bb.earn(a, 'business'); b.since = now(); bb.save(); bb.toast(`Collected ${bb.inr(a)}`, '#3ddc97'); bb.closeSheet(); }); }
    bb.openSheet(`${q.icon} ${esc(b.name)}`, `${lvName} run by @${esc(b.owner || 'player')}`, bb.rowHtml('b', q.buy[0], b.t === 'lodge' ? 'Sleep here' : 'Eat here', bb.inr(q.buy[1])) + '<p class="note">Your visit adds to the owner\'s earnings.</p>',
      s => s.onclick = async e => { if (e.target.dataset.id !== 'b') return; if (!bb.spend(q.buy[1], true)) return; bb.closeSheet(); if (b.sid && live()) O().rpc('visit_business', { p_id: b.sid });
        if (b.t === 'lodge') return bb.startSleep ? bb.startSleep(`Sleeping at ${b.name}`, `A room at @${b.owner}'s lodge`) : null; P().hunger = Math.min(100, P().hunger + q.buy[2]); bb.emit('eat'); bb.toast(`${q.icon} ${esc(q.buy[0])} · hunger +${q.buy[2]}`, '#3ddc97'); }); };
  // your saved businesses are rebuilt (and sent to the server once, if they were opened offline)
  bb.onStart(() => { for (const b of P().biz) if (b.t && b.name) b.name = titleName(b.name); });
  bb.onStart(() => setTimeout(async () => { if (!live()) return; for (const b of P().biz) if (b.t && !b.sid) { try { const r = await O().rpc('open_business', { p_type: b.t, p_name: b.name, p_x: b.x, p_z: b.z, p_h: b.h }); if (!r.error && /^\d+$/.test(String(r.data))) b.sid = +r.data; } catch (e) {} } bb.save(); }, 12000));
  bb.BUSINESS = { collectAll, sheet, open, openSheet, TYPES, get others() { return others; } };
  bb.addApp({ id: 'business', label: 'Business', icon: '☕', group: 'menu', fn: sheet });
  bb.addApp({ id: 'baypay', label: 'BayPay', icon: '💸', smart: true, fn: () => bb.openSheet('BayPay', 'Pay friends in the game', '<p class="note" style="font-size:14px">BayPay sends in-game rupees to friends once online play and friends lists arrive. In-game money is never sold for real money.</p>') });
});
